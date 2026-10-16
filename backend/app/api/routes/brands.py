"""品牌规范路由（REQ-13）。

保存品牌颜色、字体和 Logo 引用；每次保存生成新版本，任务引用固定版本，
后续修改不会改变已创建任务的目标。PostgreSQL 接入前保存在进程内存中。
"""
import secrets
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

HEX_COLOR = r"^#[0-9A-Fa-f]{6}$"


class BrandInput(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    primary_color: str = Field(pattern=HEX_COLOR)
    accent_color: str = Field(pattern=HEX_COLOR)
    text_color: str = Field(pattern=HEX_COLOR)
    font: Literal["system_sans", "system_serif"] = "system_sans"
    logo_sha256: str | None = Field(default=None, pattern=r"^[0-9a-f]{64}$")


class Brand(BrandInput):
    brand_id: str
    version: int
    updated_at: str


_BRANDS: dict[str, list[Brand]] = {}


def get_brand(brand_id: str, version: int | None = None) -> Brand | None:
    """返回指定版本；version 为空时返回最新版本。"""
    versions = _BRANDS.get(brand_id)
    if not versions:
        return None
    if version is None:
        return versions[-1]
    return versions[version - 1] if 1 <= version <= len(versions) else None


def _checked(payload: BrandInput) -> BrandInput:
    if not payload.name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "请检查标出的字段。", "fields": {"name": "填写品牌名称。"}},
        )
    return payload.model_copy(update={"name": payload.name.strip()})


@router.get("/brands", response_model=list[Brand])
async def list_brands() -> list[Brand]:
    """每个品牌规范的最新版本，最近修改的在前。"""
    latest = [versions[-1] for versions in _BRANDS.values()]
    return sorted(latest, key=lambda b: b.updated_at, reverse=True)


@router.post("/brands", response_model=Brand, status_code=status.HTTP_201_CREATED)
async def create_brand(payload: BrandInput) -> Brand:
    brand = Brand(
        **_checked(payload).model_dump(),
        brand_id=f"brand_{secrets.token_hex(4)}",
        version=1,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    _BRANDS[brand.brand_id] = [brand]
    return brand


@router.put("/brands/{brand_id}", response_model=Brand)
async def update_brand(brand_id: str, payload: BrandInput) -> Brand:
    """保存为新版本，旧版本保留给已引用它的任务。"""
    versions = _BRANDS.get(brand_id)
    if not versions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="品牌规范不存在。")
    brand = Brand(
        **_checked(payload).model_dump(),
        brand_id=brand_id,
        version=len(versions) + 1,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    versions.append(brand)
    return brand


@router.get("/brands/{brand_id}/versions/{version}", response_model=Brand)
async def get_brand_version(brand_id: str, version: int) -> Brand:
    brand = get_brand(brand_id, version)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="品牌规范或该版本不存在。")
    return brand
