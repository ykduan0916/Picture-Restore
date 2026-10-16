"""多模态输入上下文契约定义。

MultiModalContext 定义图片用途分离、裁片溯源、输入额度与安全策略。
"""
from typing import Any

from pydantic import Field, field_validator, model_validator

from .base import AssetReference, ContractBase


class MultiModalContext(ContractBase):
    """
    多模态输入上下文：定义图片用途、裁片溯源与传输策略。

    包含图片列表（带 purpose 分类）、SKU 归属、传输额度与静默丢弃策略。
    用于 Agent 多模态输入，区分原图、风格参考、候选结果与细节裁片。
    """

    sku_id: str = Field(
        ...,
        description="所属 SKU 标识",
        pattern=r"^[a-z0-9_]+$",
    )
    fact_authority: str = Field(
        ...,
        description="事实来源权威引用（格式：task:job_id@revision）",
    )
    images: list[AssetReference] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="图片列表，每个带 purpose 分类",
    )
    transport_policy: dict[str, Any] = Field(
        ...,
        description="传输策略：图片数量、总像素、分辨率限制",
    )

    @field_validator("fact_authority")
    @classmethod
    def validate_fact_authority(cls, v: str) -> str:
        """校验事实来源引用格式。"""
        from .base import validate_reference_format

        try:
            validate_reference_format(v, "task")
        except ValueError as e:
            raise ValueError(f"Invalid fact_authority reference: {e}")
        return v

    @field_validator("images")
    @classmethod
    def validate_images_purpose(cls, v: list[AssetReference]) -> list[AssetReference]:
        """校验图片用途分类。"""
        from .base import ImagePurpose

        has_product_original = False

        for img in v:
            if img.purpose == ImagePurpose.PRODUCT_ORIGINAL:
                has_product_original = True

            # 校验裁片必须有父图引用
            if img.purpose == ImagePurpose.DETAIL_CROP:
                if img.parent is None:
                    raise ValueError(f"Image {img.asset_id} with purpose='detail_crop' must have parent reference")
                if img.crop_xywh_pixels is None:
                    raise ValueError(f"Image {img.asset_id} with purpose='detail_crop' must have crop_xywh_pixels")
                if img.crop_to_parent_transform is None:
                    raise ValueError(
                        f"Image {img.asset_id} with purpose='detail_crop' must have crop_to_parent_transform"
                    )

            # 校验非裁片不应有裁片字段
            if img.purpose != ImagePurpose.DETAIL_CROP:
                if img.parent is not None:
                    raise ValueError(f"Image {img.asset_id} with purpose='{img.purpose}' should not have parent")

        # 至少有一个商品原图
        if not has_product_original:
            raise ValueError("images must contain at least one product_original")

        return v

    @field_validator("transport_policy")
    @classmethod
    def validate_transport_policy(cls, v: dict[str, Any]) -> dict[str, Any]:
        """校验传输策略。"""
        required = {
            "max_visual_images",
            "max_total_decoded_pixels",
            "overview_max_edge",
            "detail_max_edge",
            "silent_image_drop_allowed",
        }
        if not required.issubset(v.keys()):
            raise ValueError(f"transport_policy must contain: {required}")

        # 校验数值范围
        if not isinstance(v["max_visual_images"], int) or v["max_visual_images"] < 1 or v["max_visual_images"] > 20:
            raise ValueError("max_visual_images must be integer in [1, 20]")

        if (
            not isinstance(v["max_total_decoded_pixels"], int)
            or v["max_total_decoded_pixels"] < 100000
        ):
            raise ValueError("max_total_decoded_pixels must be integer >= 100000")

        if (
            not isinstance(v["overview_max_edge"], int)
            or v["overview_max_edge"] < 256
            or v["overview_max_edge"] > 4096
        ):
            raise ValueError("overview_max_edge must be integer in [256, 4096]")

        if (
            not isinstance(v["detail_max_edge"], int)
            or v["detail_max_edge"] < 256
            or v["detail_max_edge"] > 4096
        ):
            raise ValueError("detail_max_edge must be integer in [256, 4096]")

        if not isinstance(v["silent_image_drop_allowed"], bool):
            raise ValueError("silent_image_drop_allowed must be boolean")

        return v

    @model_validator(mode="after")
    def validate_image_count_within_policy(self) -> "MultiModalContext":
        """校验图片数量不超传输策略上限。"""
        if len(self.images) > self.transport_policy["max_visual_images"]:
            raise ValueError(
                f"Image count ({len(self.images)}) exceeds max_visual_images "
                f"({self.transport_policy['max_visual_images']})"
            )
        return self

    @model_validator(mode="after")
    def validate_total_pixels_within_policy(self) -> "MultiModalContext":
        """校验总像素数不超传输策略上限。"""
        total_pixels = 0
        for img in self.images:
            if img.original_dimensions:
                width, height = img.original_dimensions
                total_pixels += width * height

        if total_pixels > self.transport_policy["max_total_decoded_pixels"]:
            raise ValueError(
                f"Total decoded pixels ({total_pixels}) exceeds max_total_decoded_pixels "
                f"({self.transport_policy['max_total_decoded_pixels']})"
            )

        return self
