"""工具调用结果契约定义。

ToolResult 记录工具执行的输入输出、状态、耗时、费用与幂等标识。
"""
from typing import Any, Literal

from pydantic import Field, field_validator

from .base import ContractBase


class ToolResult(ContractBase):
    """
    工具调用结果：记录工具执行轨迹。

    包含输入输出版本引用、实际参数、执行状态、耗时、费用状态、
    provider_request_id、错误分类与重试判断。
    """

    tool_name: str = Field(
        ...,
        description="工具名称",
        min_length=1,
    )
    idempotency_key: str = Field(
        ...,
        description="幂等键，防止重复执行",
        pattern=r"^[a-zA-Z0-9_-]+$",
    )
    provider_request_id: str | None = Field(
        default=None,
        description="供应商返回的请求 ID（用于对账与查询）",
    )
    input_refs: list[str] = Field(
        default_factory=list,
        description="输入版本引用列表",
    )
    input_params: dict[str, Any] = Field(
        default_factory=dict,
        description="实际调用参数",
    )
    output_refs: list[str] = Field(
        default_factory=list,
        description="输出版本引用列表",
    )
    status: Literal["pending", "running", "succeeded", "failed", "unknown"] = Field(
        ...,
        description="执行状态",
    )
    elapsed_seconds: float | None = Field(
        default=None,
        ge=0,
        description="执行耗时（秒）",
    )
    cost_minor: int | None = Field(
        default=None,
        ge=0,
        description="实际费用（最小货币单位）",
    )
    cost_currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
        description="费用货币代码（ISO 4217）",
    )
    cost_status: Literal["known", "estimated", "unknown", "not_applicable"] = Field(
        default="not_applicable",
        description="费用状态",
    )
    error_category: str | None = Field(
        default=None,
        description="错误分类（network、validation、quota、provider_error 等）",
    )
    error_message: str | None = Field(
        default=None,
        description="错误消息",
    )
    retryable: bool | None = Field(
        default=None,
        description="是否可重试",
    )
    attempt_number: int = Field(
        default=1,
        ge=1,
        description="尝试次数（含首次）",
    )

    @field_validator("input_refs")
    @classmethod
    def validate_input_refs(cls, v: list[str]) -> list[str]:
        """校验输入引用格式。"""
        from .base import validate_reference_format

        for ref in v:
            # 尝试解析常见引用格式
            if ":" in ref:
                prefix = ref.split(":")[0]
                try:
                    validate_reference_format(ref, prefix)
                except ValueError as e:
                    raise ValueError(f"Invalid input reference: {e}")
        return v

    @field_validator("output_refs")
    @classmethod
    def validate_output_refs(cls, v: list[str]) -> list[str]:
        """校验输出引用格式。"""
        from .base import validate_reference_format

        for ref in v:
            if ":" in ref:
                prefix = ref.split(":")[0]
                try:
                    validate_reference_format(ref, prefix)
                except ValueError as e:
                    raise ValueError(f"Invalid output reference: {e}")
        return v

    @field_validator("cost_currency")
    @classmethod
    def validate_cost_currency(cls, v: str | None, info: Any) -> str | None:
        """校验费用货币与费用状态一致性。"""
        cost_minor = info.data.get("cost_minor")
        cost_status = info.data.get("cost_status")

        if cost_minor is not None and cost_status in ["known", "estimated"]:
            if v is None:
                raise ValueError("cost_currency is required when cost_minor is set")
        return v

    @field_validator("error_category")
    @classmethod
    def validate_error_category(cls, v: str | None, info: Any) -> str | None:
        """校验失败状态必须有错误分类。"""
        status = info.data.get("status")
        if status == "failed" and v is None:
            raise ValueError("error_category is required when status is 'failed'")

        # 校验常见错误分类
        if v is not None:
            valid_categories = {
                "network",
                "validation",
                "quota",
                "provider_error",
                "timeout",
                "permission_denied",
                "not_found",
                "conflict",
                "unknown",
            }
            if v not in valid_categories:
                # 警告但不拒绝（允许自定义分类）
                pass

        return v

    @field_validator("retryable")
    @classmethod
    def validate_retryable(cls, v: bool | None, info: Any) -> bool | None:
        """校验失败状态应明确可重试性。"""
        status = info.data.get("status")
        if status == "failed" and v is None:
            raise ValueError("retryable should be explicitly set when status is 'failed'")
        return v
