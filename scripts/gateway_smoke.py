"""Bounded, explicitly invoked gateway capability probes; never persists API keys."""
import argparse
import base64
import concurrent.futures
import getpass
import io
import json
import re
import secrets
import threading
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parents[1]
LOCK = threading.Lock()
KEY = None
COUNT = 0
RECORDS = []
RUN = None
BASE = None


def safe(value):
    if isinstance(value, dict):
        return {k: ("[image bytes omitted]" if k in {"b64_json", "encrypted_content"} else safe(v)) for k, v in value.items()}
    if isinstance(value, list):
        return [safe(v) for v in value]
    if isinstance(value, str):
        value = value.replace(KEY, "[REDACTED]") if KEY else value
        value = re.sub(r"sk-[A-Za-z0-9_-]{20,}", "[REDACTED]", value)
        return re.sub(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+", "[fixture image data]", value)
    return value


def save_json(path, value):
    path.write_text(json.dumps(safe(value), ensure_ascii=False, indent=2) + "\n")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def post(label, endpoint, payload=None, multipart=None, timeout=90):
    global COUNT
    with LOCK:
        if COUNT >= 18:
            raise RuntimeError("Per-run request limit reached")
        COUNT += 1
        number = COUNT
    if multipart:
        body, content_type = multipart
    else:
        body = json.dumps(payload).encode()
        content_type = "application/json"
    request = urllib.request.Request(BASE + endpoint, data=body, headers={
        "Authorization": "Bearer " + KEY,
        "Content-Type": content_type,
        "Accept": "application/json",
    }, method="POST")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    start = time.monotonic()
    record = {"number": number, "label": label, "endpoint": endpoint, "request": payload or {"multipart": "self-authored fixture and mask"}}
    data = None
    try:
        with opener.open(request, timeout=timeout) as response:
            record["http_status"] = response.status
            record["request_id"] = response.headers.get("x-request-id")
            raw = response.read(32 * 1024 * 1024 + 1)
            if len(raw) > 32 * 1024 * 1024:
                raise ValueError("Response exceeds 32 MiB cap")
            data = json.loads(raw)
            record["response"] = data
    except urllib.error.HTTPError as error:
        record["http_status"] = error.code
        record["request_id"] = error.headers.get("x-request-id")
        raw = error.read(4096).decode(errors="replace")
        try:
            record["error"] = json.loads(raw)
        except ValueError:
            record["error"] = raw[:1000]
    except Exception as error:
        record["error"] = {"type": type(error).__name__, "message": str(error), "submission_outcome": "unknown_no_automatic_retry"}
    record["elapsed_seconds"] = round(time.monotonic() - start, 3)
    with LOCK:
        RECORDS.append(record)
        save_json(RUN / "requests.json", sorted(RECORDS, key=lambda x: x["number"]))
        print(json.dumps(safe({k: record.get(k) for k in ["number", "label", "http_status", "elapsed_seconds", "error"]}), ensure_ascii=False), flush=True)
    return data, record


def fixtures():
    folder = RUN / "fixtures"
    folder.mkdir()
    for name, color, triangle in [("a", "#1956da", False), ("b", "#20a04b", True)]:
        im = Image.new("RGB", (768, 512), "white")
        d = ImageDraw.Draw(im)
        d.rectangle((90, 140, 290, 340), fill="#d82c32")
        d.ellipse((470, 140, 670, 340), fill=color)
        if triangle:
            d.polygon([(530, 440), (590, 440), (560, 390)], fill="#f4c824")
        d.text((90, 400), "L7", fill="black", font_size=42)
        im.save(folder / f"vision_{name}.png")
    im = Image.new("RGB", (1024, 1024), "#cccccc")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((350, 230, 670, 790), radius=35, fill="#d82c32", outline="#171717", width=8)
    d.rectangle((420, 180, 600, 250), fill="#202020")
    d.rectangle((390, 410, 630, 590), fill="white")
    d.text((425, 455), "L7", fill="black", font_size=72)
    d.ellipse((485, 680, 535, 730), fill="#1956da")
    im.save(folder / "edit_original.png")
    mask = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(mask).rectangle((330, 160, 690, 810), fill=(0, 0, 0, 255))
    mask.save(folder / "edit_mask.png")
    return folder


def as_url(path):
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def text_output(data, protocol):
    if protocol == "responses":
        return "".join(c.get("text", "") for item in data.get("output", []) if item.get("type") == "message" for c in item.get("content", []) if c.get("type") == "output_text")
    return data.get("choices", [{}])[0].get("message", {}).get("content") or ""


def parse_object(text):
    try:
        return json.loads(text)
    except (ValueError, TypeError):
        match = re.search(r"\{.*\}", text or "", re.S)
        try:
            return json.loads(match.group()) if match else None
        except ValueError:
            return None


def core(model, protocol, folder):
    endpoint = "/v1/responses" if protocol == "responses" else "/v1/chat/completions"
    result = {"model": model, "protocol": protocol, "tool_call": "not_tested", "tool_roundtrip": "not_tested", "multi_image": "not_tested"}
    schema = {"type": "object", "properties": {"profile_id": {"type": "string", "enum": ["sku_square"]}}, "required": ["profile_id"], "additionalProperties": False}
    function = {"name": "lookup_export_profile", "description": "Read a local test export profile; has no external side effects.", "parameters": schema, "strict": True}
    prompt = "Call lookup_export_profile for sku_square. After receiving the tool result, return only JSON with receipt, width, height copied exactly from that result. Never invent values."
    if protocol == "responses":
        messages = [{"role": "user", "content": prompt}]
        common = {"model": model, "max_output_tokens": 1024, "store": False, "reasoning": {"effort": "low"}}
        tools = [{"type": "function", **function}]
        body = {**common, "input": messages, "tools": tools, "tool_choice": {"type": "function", "name": function["name"]}}
    else:
        messages = [{"role": "user", "content": prompt}]
        common = {"model": model, "max_tokens": 512}
        tools = [{"type": "function", "function": function}]
        body = {**common, "messages": messages, "tools": tools, "tool_choice": {"type": "function", "function": {"name": function["name"]}}}
    data, record = post(model + ":tool_call", endpoint, body)
    result["tool_request"] = record["number"]
    if data:
        if protocol == "responses":
            calls = [x for x in data.get("output", []) if x.get("type") == "function_call"]
        else:
            calls = data.get("choices", [{}])[0].get("message", {}).get("tool_calls", [])
        valid = False
        if len(calls) == 1:
            call = calls[0]
            f = call if protocol == "responses" else call.get("function", {})
            valid = f.get("name") == function["name"] and parse_object(f.get("arguments", "")) == {"profile_id": "sku_square"}
        result["tool_call"] = "pass" if valid else "fail"
        if valid:
            output = {"receipt": secrets.token_hex(8), "width": 2048, "height": 2048}
            if protocol == "responses":
                continuation = {**common, "input": messages + data["output"] + [{"type": "function_call_output", "call_id": call["call_id"], "output": json.dumps(output)}], "tools": tools, "tool_choice": "none"}
            else:
                continuation = {**common, "messages": messages + [data["choices"][0]["message"], {"role": "tool", "tool_call_id": call["id"], "content": json.dumps(output)}], "tools": tools, "tool_choice": "none"}
            follow, follow_record = post(model + ":tool_result", endpoint, continuation)
            result["tool_result_request"] = follow_record["number"]
            result["tool_roundtrip"] = "pass" if follow and parse_object(text_output(follow, protocol)) == output else "fail"
    else:
        result["tool_call"] = "request_failed"
    question = 'Compare the first and second image. Return only JSON with keys first_right_color, second_right_color, second_extra_shape, second_extra_color, unchanged_left_shape, unchanged_label. Use lowercase English color/shape words, and copy the visible label exactly. The second_extra fields refer to an object present only in image 2.'
    if protocol == "responses":
        content = [{"type": "input_text", "text": question}] + [{"type": "input_image", "image_url": as_url(folder / f"vision_{x}.png"), "detail": "high"} for x in ["a", "b"]]
        body = {**common, "input": [{"role": "user", "content": content}]}
    else:
        content = [{"type": "text", "text": question}] + [{"type": "image_url", "image_url": {"url": as_url(folder / f"vision_{x}.png"), "detail": "high"}} for x in ["a", "b"]]
        body = {**common, "messages": [{"role": "user", "content": content}]}
    data, record = post(model + ":multi_image", endpoint, body)
    result["vision_request"] = record["number"]
    expected = {"first_right_color": "blue", "second_right_color": "green", "second_extra_shape": "triangle", "second_extra_color": "yellow", "unchanged_left_shape": "square", "unchanged_label": "L7"}
    answer = parse_object(text_output(data, protocol)) if data else None
    result["vision_answer"] = answer
    result["vision_expected"] = expected
    checks = {k: isinstance(answer, dict) and str(answer.get(k, "")).lower() == v.lower() for k, v in expected.items()}
    if isinstance(answer, dict) and answer.get("unchanged_left_shape", "").lower() == "rectangle":
        checks["unchanged_left_shape"] = True
    result["vision_checks"] = checks
    result["multi_image"] = "pass" if all(checks.values()) else ("fail" if data else "request_failed")
    save_json(RUN / (model + "-core.json"), result)
    print(json.dumps(safe(result), ensure_ascii=False), flush=True)
    return result


def multipart(fields, files):
    boundary = "----PictureRenew" + uuid.uuid4().hex
    parts = []
    for name, value in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, path in files:
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{path.name}"\r\nContent-Type: image/png\r\n\r\n'.encode() + path.read_bytes() + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), "multipart/form-data; boundary=" + boundary


def edit(model, folder):
    fields = {"model": model, "prompt": "Edit the provided test product image. Change ONLY the flat gray background to a flat light cyan background (#b9eff2). Keep the exact red bottle silhouette, black cap, white label with L7, and small blue circular mark unchanged. The mask transparent area is editable; opaque area is protected. Do not add shadows, decorations or extra text.", "size": "1024x1024", "quality": "low", "n": "1"}
    data, record = post(model + ":masked_edit", "/v1/images/edits", multipart=multipart(fields, [("image", folder / "edit_original.png"), ("mask", folder / "edit_mask.png")]), timeout=180)
    result = {"model": model, "request": record["number"], "edit_interface": "request_failed", "content_quality": "not_evaluated", "settings": fields}
    if data:
        items = data.get("data", [])
        if items and items[0].get("b64_json"):
            raw = base64.b64decode(items[0]["b64_json"], validate=True)
            im = Image.open(io.BytesIO(raw)); im.load()
            out = RUN / (model + "-edit.png")
            im.save(out)
            result.update({"edit_interface": "pass", "image_file": out.name, "image_size": list(im.size), "image_mode": im.mode, "usage": data.get("usage"), "content_quality": "pending_visual_review"})
            if im.size == (1024, 1024):
                source = Image.open(folder / "edit_original.png").convert("RGB")
                diff = ImageChops.difference(source, im.convert("RGB"))
                protected = Image.open(folder / "edit_mask.png").getchannel("A")
                result["protected_region_mean_abs_channel_diff"] = sum(ImageStat.Stat(diff, mask=protected).mean) / 3
                protected_diff = Image.composite(diff, Image.new("RGB", diff.size), protected)
                result["protected_region_exact_match"] = protected_diff.getbbox() is None
                result["background_sample_rgb"] = list(im.convert("RGB").getpixel((100, 100)))
        elif items and items[0].get("url"):
            result.update({"edit_interface": "returned_remote_url_not_downloaded", "content_quality": "not_evaluated"})
        else:
            result["edit_interface"] = "no_image_in_response"
    save_json(RUN / (model + "-edit.json"), result)
    print(json.dumps(safe(result), ensure_ascii=False), flush=True)
    return result


def main():
    global KEY, BASE, RUN
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--suite", choices=["core", "edit", "all"], default="all")
    args = parser.parse_args()
    BASE = args.base_url.rstrip("/")
    if BASE != "http://192.168.11.88:3000":
        raise SystemExit("This probe is restricted to the user-authorized gateway")
    KEY = getpass.getpass("API key (hidden): ")
    stamp = datetime.now(ZoneInfo("Asia/Shanghai")).strftime("%Y-%m-%d_%H%M%S")
    RUN = ROOT / "evals" / "gateway-smoke" / stamp
    RUN.mkdir(parents=True)
    folder = fixtures()
    print("Evidence directory: " + str(RUN), flush=True)
    results = []
    if args.suite in {"core", "all"}:
        candidates = [("gpt-6.1-sol", "responses"), ("gpt-5.6-luna", "responses"), ("claude-sonnet-5-5", "chat")]
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            futures = [pool.submit(core, model, protocol, folder) for model, protocol in candidates]
            for future in concurrent.futures.as_completed(futures):
                try:
                    results.append(future.result())
                except Exception as error:
                    results.append({"probe_error": type(error).__name__, "message": str(error)})
    if args.suite in {"edit", "all"}:
        for model in ["gpt-image-2.5-sunburst", "gpt-image-2.5-flare", "gpt-image-2"]:
            try:
                results.append(edit(model, folder))
            except Exception as error:
                results.append({"model": model, "probe_error": type(error).__name__, "message": str(error)})
    save_json(RUN / "summary.json", {"suite": args.suite, "requests_sent": COUNT, "automatic_retries": 0, "settled_cost": None, "results": results})
    KEY = None
    print("Completed: " + str(RUN / "summary.json"), flush=True)


if __name__ == "__main__":
    main()
