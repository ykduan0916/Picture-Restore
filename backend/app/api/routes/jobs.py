"""任务管理路由。

接收商品事实与原图元数据，生成并校验 TaskContract。PostgreSQL 接入前，
任务保存在进程内存中，服务重启即丢失；health 接口的 storage 字段会注明这一点。
"""
import hashlib
import re
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, ValidationError

from ...domain.contracts import AssetReference, ImagePurpose, TaskContract
from .brands import Brand, get_brand

router = APIRouter()

DeliverableId = Literal["white", "scene", "promo"]

ALLOWED_SIZES: dict[str, set[tuple[int, int]]] = {
    "white": {(2048, 2048), (1200, 1200), (800, 800)},
    "scene": {(2048, 2048), (1200, 1200)},
    "promo": {(1080, 1440), (750, 1000), (1080, 1920)},
}

DELIVERABLE_PURPOSE = {"white": "white_background", "scene": "scene", "promo": "promotion"}

# 与 docs/contracts/task.example.json 和 docs/02 返工上限一致
EXECUTION_POLICY = {
    "paid_calls_enabled": False,
    "provider_mode": "mock",
    "budget_limit_minor": None,
    "currency": "CNY",
    "max_quality_repair_rounds_per_deliverable": 2,
    "max_feasibility_rounds": 2,
    "max_agent_activations": 12,
    "max_tool_calls_per_activation": 8,
    "active_processing_deadline_seconds": 600,
}

CONSTRAINTS = {
    "mode": "preserve_product",
    "preserve": ["shape", "color", "logo", "connectors", "quantity"],
    "allowed_operations": [
        "mask_refinement",
        "uniform_scale",
        "translate",
        "background_edit",
        "shadow_layer",
        "text_layer",
    ],
    "prohibited_operations": ["product_regeneration", "viewpoint_change", "invent_product_facts"],
}

SKU_CODE_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")
SHA256_PATTERN = r"^[0-9a-f]{64}$"
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
EDITABLE_STATUSES = {"draft", "needs_input", "ready"}


class AssetInput(BaseModel):
    sha256: str = Field(pattern=SHA256_PATTERN)
    purpose: Literal["product_original", "style_reference"]
    file_name: str = Field(min_length=1, max_length=255)
    mime_type: str
    byte_size: int = Field(gt=0, le=20 * 1024 * 1024)
    width: int = Field(gt=0, le=8192)
    height: int = Field(gt=0, le=8192)


class DeliverableInput(BaseModel):
    id: DeliverableId
    width: int
    height: int


class JobCreateRequest(BaseModel):
    sku_code: str = Field(min_length=1, max_length=64)
    product_name: str = Field(min_length=1, max_length=60)
    price_minor: int | None = Field(default=None, ge=0, le=999_999_999)
    unit: str | None = Field(default=None, max_length=8)
    selling_points: list[str] = Field(default_factory=list, max_length=3)
    scene_brief: str | None = Field(default=None, max_length=200)
    brand_id: str | None = None
    deliverables: list[DeliverableInput] = Field(min_length=1)
    assets: list[AssetInput] = Field(min_length=1, max_length=4)
    rights_confirmed: bool


class FactsPatch(BaseModel):
    price_minor: int | None = Field(default=None, ge=0, le=999_999_999)
    unit: str | None = Field(default=None, max_length=8)


class DeliverableState(BaseModel):
    id: DeliverableId
    width: int
    height: int
    status: Literal["pending", "running", "succeeded", "failed", "unknown", "cancelled"]


class JobFacts(BaseModel):
    product_name: str
    price_minor: int | None
    unit: str | None
    selling_points: list[str]


class BrandRef(BaseModel):
    id: str
    version: int
    name: str


class JobResponse(BaseModel):
    job_id: str
    sku_id: str
    sku_code: str
    revision: int
    status: Literal["draft", "needs_input", "ready"]
    created_at: str
    updated_at: str
    facts: JobFacts
    missing_facts: list[str]
    brand: BrandRef | None
    deliverables: list[DeliverableState]
    asset_count: int
    contract: dict


_JOBS: dict[str, JobResponse] = {}
_REQUESTS: dict[str, JobCreateRequest] = {}


def _field_error(fields: dict[str, str]) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={"message": "请检查标出的字段。", "fields": fields},
    )


def _normalize_sku(code: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", code.strip().lower()).strip("_")


def _validate(request: JobCreateRequest) -> dict[str, str]:
    fields: dict[str, str] = {}
    if not SKU_CODE_PATTERN.match(request.sku_code.strip()):
        fields["sku_code"] = "只能包含字母、数字、短横线和下划线。"
    if not request.product_name.strip():
        fields["product_name"] = "填写商品名称。"
    if not request.rights_confirmed:
        fields["rights_confirmed"] = "确认你有权使用这些图片后才能创建任务。"
    if request.brand_id and get_brand(request.brand_id) is None:
        fields["brand_id"] = "品牌规范不存在，可能已在服务重启后丢失。"

    if not any(a.purpose == "product_original" for a in request.assets):
        fields["assets"] = "至少需要一张商品原图。"
    for asset in request.assets:
        if asset.mime_type not in ALLOWED_MIME:
            fields["assets"] = f"{asset.file_name} 不是 JPEG、PNG 或 WebP。"
        if asset.width * asset.height > 20_000_000:
            fields["assets"] = f"{asset.file_name} 超过 2000 万像素上限。"

    seen: set[str] = set()
    for d in request.deliverables:
        if d.id in seen:
            fields["deliverables"] = "每种素材只能选一个尺寸。"
        seen.add(d.id)
        if (d.width, d.height) not in ALLOWED_SIZES[d.id]:
            fields["deliverables"] = f"{d.width}×{d.height} 不是可选尺寸。"

    if any(not p.strip() or len(p) > 16 for p in request.selling_points):
        fields["selling_points"] = "每条卖点 1 到 16 个字。"
    return fields


def _missing_facts(request: JobCreateRequest) -> list[str]:
    # 促销图需要价格；缺失时不编造，任务停在待补充（docs/02 状态机）
    needs_price = any(d.id == "promo" for d in request.deliverables)
    return ["price"] if needs_price and request.price_minor is None else []


def _build_contract(
    job_id: str, sku_id: str, request: JobCreateRequest, revision: int, brand: Brand | None
) -> TaskContract:
    input_assets = []
    for index, asset in enumerate(request.assets, start=1):
        purpose = ImagePurpose(asset.purpose)
        is_original = purpose == ImagePurpose.PRODUCT_ORIGINAL
        input_assets.append(
            AssetReference(
                asset_id=f"asset_{asset.sha256[:12]}_{index}",
                version=1,
                purpose=purpose,
                sku_id=sku_id,
                source={"kind": "user_upload", "authorization": "user_confirmed"},
                allowed_usage=(
                    ["visual_understanding", "product_reference"]
                    if is_original
                    else ["palette_reference", "layout_reference"]
                ),
                forbidden_usage=[] if is_original else ["product_facts", "price_source"],
                original_dimensions=(asset.width, asset.height),
            )
        )

    facts: dict[str, dict] = {"product_name": {"value": request.product_name.strip(), "source": "user_input"}}
    if request.price_minor is not None:
        facts["price"] = {"value_minor": request.price_minor, "currency": "CNY", "source": "user_input"}
    if request.unit:
        facts["unit"] = {"value": request.unit.strip(), "source": "user_input"}
    if request.selling_points:
        facts["selling_points"] = {"value": [p.strip() for p in request.selling_points], "source": "user_input"}
    if request.scene_brief and request.scene_brief.strip():
        facts["scene_brief"] = {"value": request.scene_brief.strip(), "source": "user_input"}

    return TaskContract(
        job_id=job_id,
        revision=revision,
        created_by_role="planner",
        base_document_version=1,
        sku_id=sku_id,
        input_assets=input_assets,
        facts=facts,
        brand_spec={"id": brand.brand_id, "version": brand.version} if brand else None,
        constraints=CONSTRAINTS,
        deliverables=[
            {
                "id": d.id,
                "purpose": DELIVERABLE_PURPOSE[d.id],
                "width": d.width,
                "height": d.height,
                "format": "png",
            }
            for d in request.deliverables
        ],
        execution_policy=EXECUTION_POLICY,
        acceptance_rules_version="s0_draft_v1",
        requires_user_acceptance=True,
    )


def _assemble(
    job_id: str,
    request: JobCreateRequest,
    revision: int,
    created_at: str,
    brand: Brand | None,
) -> JobResponse:
    sku_id = _normalize_sku(request.sku_code)
    try:
        contract = _build_contract(job_id, sku_id, request, revision, brand)
    except ValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": f"任务契约未通过校验：{error.errors()[0]['msg']}", "fields": {}},
        ) from error

    missing = _missing_facts(request)
    return JobResponse(
        job_id=job_id,
        sku_id=sku_id,
        sku_code=request.sku_code.strip(),
        revision=revision,
        status="needs_input" if missing else "ready",
        created_at=created_at,
        updated_at=datetime.now(timezone.utc).isoformat(),
        facts=JobFacts(
            product_name=request.product_name.strip(),
            price_minor=request.price_minor,
            unit=request.unit.strip() if request.unit else None,
            selling_points=[p.strip() for p in request.selling_points],
        ),
        missing_facts=missing,
        brand=BrandRef(id=brand.brand_id, version=brand.version, name=brand.name) if brand else None,
        deliverables=[
            DeliverableState(id=d.id, width=d.width, height=d.height, status="pending") for d in request.deliverables
        ],
        asset_count=len(request.assets),
        contract=contract.model_dump(mode="json"),
    )


def _get(job_id: str) -> JobResponse:
    job = _JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="任务不存在，或服务重启后已丢失。")
    return job


@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(request: JobCreateRequest) -> JobResponse:
    """校验商品事实与原图元数据，生成 TaskContract 并保存任务。"""
    fields = _validate(request)
    if fields:
        raise _field_error(fields)

    sku_id = _normalize_sku(request.sku_code)
    if not sku_id:
        raise _field_error({"sku_code": "至少包含一个字母或数字。"})

    created = datetime.now(timezone.utc).isoformat()
    seed = f"{sku_id}:{created}:{request.assets[0].sha256}"
    job_id = f"job_{sku_id}_{hashlib.sha256(seed.encode()).hexdigest()[:8]}"
    # 引用创建时的最新版本并固定下来
    brand = get_brand(request.brand_id) if request.brand_id else None

    job = _assemble(job_id, request, revision=1, created_at=created, brand=brand)
    _JOBS[job_id] = job
    _REQUESTS[job_id] = request
    return job


@router.patch("/jobs/{job_id}/facts", response_model=JobResponse)
async def update_facts(job_id: str, patch: FactsPatch) -> JobResponse:
    """补充或修改价格与单位，契约修订号加一。"""
    job = _get(job_id)
    if job.status not in EDITABLE_STATUSES:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="任务已开始处理，不能再修改商品事实。")

    changes = patch.model_dump(exclude_unset=True)
    if "unit" in changes:
        changes["unit"] = changes["unit"].strip() if changes["unit"] else None
    request = _REQUESTS[job_id].model_copy(update=changes)
    brand = get_brand(job.brand.id, job.brand.version) if job.brand else None
    updated = _assemble(job_id, request, revision=job.revision + 1, created_at=job.created_at, brand=brand)
    _JOBS[job_id] = updated
    _REQUESTS[job_id] = request
    return updated


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str) -> JobResponse:
    """获取任务详情。"""
    return _get(job_id)


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(limit: int = 50) -> list[JobResponse]:
    """按创建时间倒序列出任务。"""
    jobs = sorted(_JOBS.values(), key=lambda j: j.created_at, reverse=True)
    return jobs[: max(1, min(limit, 200))]
