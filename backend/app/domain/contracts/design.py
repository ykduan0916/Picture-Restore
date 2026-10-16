"""视觉设计规范契约定义。

DesignSpec 定义配色、布局、排版、背景要求与商品保护区域。
"""
from typing import Any

from pydantic import Field, field_validator

from .base import ContractBase


class DesignSpec(ContractBase):
    """
    视觉设计规范：定义素材的视觉风格与布局。

    包含品牌规范引用、配色方案、背景描述、排版布局、商品安全区与继承约束。
    """

    task_revision: int = Field(
        ...,
        ge=1,
        description="对应的任务契约修订号",
    )
    design_id: str = Field(
        ...,
        description="设计方案唯一标识",
        pattern=r"^design_[a-z0-9_]+$",
    )
    brand_spec: dict[str, Any] | None = Field(
        default=None,
        description="品牌规范引用，包含 id 和 version",
    )
    style: dict[str, Any] = Field(
        ...,
        description="风格定义：intent、palette、background、lighting、shadow",
    )
    promo_layout: dict[str, Any] | None = Field(
        default=None,
        description="促销排版布局（可选）",
    )
    constraints_inherited_from: str = Field(
        ...,
        description="继承的约束来源引用（格式：task:job_id@revision）",
    )

    @field_validator("brand_spec")
    @classmethod
    def validate_brand_spec(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        """校验品牌规范引用。"""
        if v is not None:
            if "id" not in v or "version" not in v:
                raise ValueError("brand_spec must contain 'id' and 'version'")
            if not isinstance(v["version"], int) or v["version"] < 1:
                raise ValueError("brand_spec version must be integer >= 1")
        return v

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: dict[str, Any]) -> dict[str, Any]:
        """校验风格定义。"""
        required = {"intent", "palette", "background", "lighting", "shadow"}
        if not required.issubset(v.keys()):
            raise ValueError(f"style must contain: {required}")

        # 校验 palette 是颜色列表
        if not isinstance(v["palette"], list) or len(v["palette"]) == 0:
            raise ValueError("style.palette must be a non-empty list")

        # 校验颜色格式（#RGB 或 #RRGGBB）
        import re
        color_pattern = re.compile(r"^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$")
        for color in v["palette"]:
            if not isinstance(color, str) or not color_pattern.match(color):
                raise ValueError(f"Invalid color format in palette: {color}, expected #RGB or #RRGGBB")

        # 校验其他字段是字符串
        for field in ["intent", "background", "lighting", "shadow"]:
            if not isinstance(v[field], str):
                raise ValueError(f"style.{field} must be a string")

        return v

    @field_validator("promo_layout")
    @classmethod
    def validate_promo_layout(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        """校验促销排版布局。"""
        if v is None:
            return v

        required = {
            "width",
            "height",
            "coordinate_system",
            "product_region",
            "title_region",
            "price_region",
        }
        if not required.issubset(v.keys()):
            raise ValueError(f"promo_layout must contain: {required}")

        # 校验尺寸
        if not isinstance(v["width"], int) or v["width"] <= 0:
            raise ValueError("promo_layout.width must be positive integer")
        if not isinstance(v["height"], int) or v["height"] <= 0:
            raise ValueError("promo_layout.height must be positive integer")

        # 校验坐标系
        if v["coordinate_system"] not in ["normalized_xywh", "pixels"]:
            raise ValueError("coordinate_system must be 'normalized_xywh' or 'pixels'")

        # 校验区域是 4 元素列表
        for region in ["product_region", "title_region", "price_region"]:
            if not isinstance(v[region], list) or len(v[region]) != 4:
                raise ValueError(f"{region} must be a list of 4 numbers [x, y, w, h]")

            # 校验归一化坐标范围
            if v["coordinate_system"] == "normalized_xywh":
                for val in v[region]:
                    if not isinstance(val, (int, float)) or val < 0 or val > 1:
                        raise ValueError(f"{region} normalized values must be in [0, 1]")

        # 校验事实引用格式（可选）
        if "title_fact_ref" in v:
            if not isinstance(v["title_fact_ref"], str) or not v["title_fact_ref"].startswith("facts."):
                raise ValueError("title_fact_ref must start with 'facts.'")
        if "price_fact_ref" in v:
            if not isinstance(v["price_fact_ref"], str) or not v["price_fact_ref"].startswith("facts."):
                raise ValueError("price_fact_ref must start with 'facts.'")

        # 校验文本渲染模式
        if "text_rendering" in v:
            if v["text_rendering"] not in ["deterministic_layer", "baked"]:
                raise ValueError("text_rendering must be 'deterministic_layer' or 'baked'")

        # 校验遮挡策略
        if "overlap_product_allowed" in v:
            if not isinstance(v["overlap_product_allowed"], bool):
                raise ValueError("overlap_product_allowed must be boolean")

        return v

    @field_validator("constraints_inherited_from")
    @classmethod
    def validate_constraints_reference(cls, v: str) -> str:
        """校验约束引用格式。"""
        from .base import validate_reference_format

        try:
            validate_reference_format(v, "task")
        except ValueError as e:
            raise ValueError(f"Invalid constraints_inherited_from reference: {e}")
        return v
