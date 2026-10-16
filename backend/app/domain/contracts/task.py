"""任务契约定义。

TaskContract 定义单个 SKU 的任务约束、交付物、事实来源、保护规则与执行策略。
"""
from typing import Any, Literal

from pydantic import Field, field_validator

from .base import AssetReference, ContractBase


class TaskContract(ContractBase):
    """
    任务契约：定义单个 SKU 的完整任务。

    包含商品事实、品牌规范、保护约束、交付物清单、执行策略与验收规则。
    """

    base_document_version: int = Field(
        ...,
        ge=1,
        description="基准文档版本号",
    )
    sku_id: str = Field(
        ...,
        description="商品 SKU 唯一标识",
        pattern=r"^[a-z0-9_]+$",
    )
    input_assets: list[AssetReference] = Field(
        ...,
        min_length=1,
        description="输入资源列表，至少包含一个商品原图",
    )
    facts: dict[str, dict[str, Any]] = Field(
        default_factory=dict,
        description="商品事实字典，每个事实包含 value 和 source",
    )
    brand_spec: dict[str, Any] | None = Field(
        default=None,
        description="品牌规范引用，包含 id 和 version",
    )
    constraints: dict[str, Any] = Field(
        ...,
        description="保护约束：mode、preserve、allowed_operations、prohibited_operations",
    )
    deliverables: list[dict[str, Any]] = Field(
        ...,
        min_length=1,
        description="交付物清单",
    )
    execution_policy: dict[str, Any] = Field(
        ...,
        description="执行策略：付费开关、供应商模式、预算、重试上限、超时",
    )
    acceptance_rules_version: str = Field(
        ...,
        description="验收规则版本",
    )
    requires_user_acceptance: bool = Field(
        default=True,
        description="是否需要用户最终确认",
    )

    @field_validator("input_assets")
    @classmethod
    def validate_has_product_original(cls, v: list[AssetReference]) -> list[AssetReference]:
        """校验至少有一个商品原图。"""
        from .base import ImagePurpose

        has_original = any(asset.purpose == ImagePurpose.PRODUCT_ORIGINAL for asset in v)
        if not has_original:
            raise ValueError("input_assets must contain at least one product_original")
        return v

    @field_validator("facts")
    @classmethod
    def validate_facts(cls, v: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
        """校验每个事实包含 value 和 source。"""
        for key, fact in v.items():
            if not isinstance(fact, dict):
                raise ValueError(f"Fact '{key}' must be a dict")
            # 检查是否有 value 或 value_minor（价格的特殊情况）
            has_value = "value" in fact or "value_minor" in fact
            if not has_value:
                raise ValueError(f"Fact '{key}' missing 'value' or 'value_minor'")
            if "source" not in fact:
                raise ValueError(f"Fact '{key}' missing 'source'")
        return v

    @field_validator("brand_spec")
    @classmethod
    def validate_brand_spec(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        """校验品牌规范引用格式。"""
        if v is not None:
            if "id" not in v or "version" not in v:
                raise ValueError("brand_spec must contain 'id' and 'version'")
            if not isinstance(v["version"], int) or v["version"] < 1:
                raise ValueError("brand_spec version must be integer >= 1")
        return v

    @field_validator("constraints")
    @classmethod
    def validate_constraints(cls, v: dict[str, Any]) -> dict[str, Any]:
        """校验保护约束结构。"""
        required = {"mode", "preserve", "allowed_operations", "prohibited_operations"}
        if not required.issubset(v.keys()):
            raise ValueError(f"constraints must contain: {required}")

        # 校验 mode
        if v["mode"] not in ["preserve_product", "generative"]:
            raise ValueError("constraints.mode must be 'preserve_product' or 'generative'")

        # 校验列表字段
        for field in ["preserve", "allowed_operations", "prohibited_operations"]:
            if not isinstance(v[field], list):
                raise ValueError(f"constraints.{field} must be a list")

        return v

    @field_validator("deliverables")
    @classmethod
    def validate_deliverables(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """校验交付物格式。"""
        ids = set()
        for d in v:
            # 校验必需字段
            required = {"id", "purpose", "width", "height", "format"}
            if not required.issubset(d.keys()):
                raise ValueError(f"Deliverable must contain: {required}")

            # 校验 ID 唯一
            if d["id"] in ids:
                raise ValueError(f"Duplicate deliverable id: {d['id']}")
            ids.add(d["id"])

            # 校验尺寸
            if not isinstance(d["width"], int) or d["width"] <= 0:
                raise ValueError(f"Deliverable '{d['id']}' width must be positive integer")
            if not isinstance(d["height"], int) or d["height"] <= 0:
                raise ValueError(f"Deliverable '{d['id']}' height must be positive integer")

            # 校验格式
            if d["format"] not in ["png", "jpg", "jpeg", "webp"]:
                raise ValueError(f"Deliverable '{d['id']}' format must be png/jpg/jpeg/webp")

        return v

    @field_validator("execution_policy")
    @classmethod
    def validate_execution_policy(cls, v: dict[str, Any]) -> dict[str, Any]:
        """校验执行策略。"""
        required = {
            "paid_calls_enabled",
            "provider_mode",
            "max_quality_repair_rounds_per_deliverable",
            "max_feasibility_rounds",
            "max_agent_activations",
            "max_tool_calls_per_activation",
            "active_processing_deadline_seconds",
        }
        if not required.issubset(v.keys()):
            raise ValueError(f"execution_policy must contain: {required}")

        # 校验布尔值
        if not isinstance(v["paid_calls_enabled"], bool):
            raise ValueError("paid_calls_enabled must be boolean")

        # 校验 provider_mode
        if v["provider_mode"] not in ["mock", "real"]:
            raise ValueError("provider_mode must be 'mock' or 'real'")

        # 校验数值上限
        numeric_fields = {
            "max_quality_repair_rounds_per_deliverable": (0, 10),
            "max_feasibility_rounds": (0, 10),
            "max_agent_activations": (1, 100),
            "max_tool_calls_per_activation": (1, 50),
            "active_processing_deadline_seconds": (1, 3600),
        }
        for field, (min_val, max_val) in numeric_fields.items():
            val = v[field]
            if not isinstance(val, int) or val < min_val or val > max_val:
                raise ValueError(f"{field} must be integer in [{min_val}, {max_val}]")

        # 校验预算字段（可选）
        if "budget_limit_minor" in v and v["budget_limit_minor"] is not None:
            if not isinstance(v["budget_limit_minor"], int) or v["budget_limit_minor"] < 0:
                raise ValueError("budget_limit_minor must be non-negative integer or null")

        if "currency" in v:
            if not isinstance(v["currency"], str) or len(v["currency"]) != 3:
                raise ValueError("currency must be 3-letter ISO code")

        return v
