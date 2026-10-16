"""质量检查报告契约定义。

QualityReport 定义缺陷位置、严重性、建议责任方与处理状态。
"""
from typing import Any, Literal

from pydantic import Field, field_validator

from .base import AgentRole, ContractBase


class QualityReport(ContractBase):
    """
    质量检查报告：定义质检结果与缺陷列表。

    包含验收规则版本、检查范围、裁决结果、缺陷定位、建议责任方与用户接受状态。
    """

    task_revision: int = Field(
        ...,
        ge=1,
        description="对应的任务契约修订号",
    )
    acceptance_rules_version: str = Field(
        ...,
        description="使用的验收规则版本",
    )
    scope: Literal["single_deliverable", "all_deliverables"] = Field(
        ...,
        description="检查范围",
    )
    deliverable_id: str | None = Field(
        default=None,
        description="交付物 ID（scope=single_deliverable 时必需）",
    )
    artifact_ref: str | None = Field(
        default=None,
        description="被检查的产物引用（格式：artifact:id@version）",
    )
    verdict: Literal["pass", "fail", "uncertain"] = Field(
        ...,
        description="质检裁决结果",
    )
    issues: list[dict[str, Any]] = Field(
        default_factory=list,
        description="缺陷列表",
    )
    user_accepted: bool = Field(
        default=False,
        description="用户是否已接受",
    )

    @field_validator("deliverable_id")
    @classmethod
    def validate_deliverable_id_required(cls, v: str | None, info: Any) -> str | None:
        """校验 single_deliverable 时 deliverable_id 必需。"""
        scope = info.data.get("scope")
        if scope == "single_deliverable" and v is None:
            raise ValueError("deliverable_id is required when scope is single_deliverable")
        return v

    @field_validator("artifact_ref")
    @classmethod
    def validate_artifact_ref(cls, v: str | None) -> str | None:
        """校验产物引用格式。"""
        if v is not None:
            from .base import validate_reference_format

            try:
                validate_reference_format(v, "artifact")
            except ValueError as e:
                raise ValueError(f"Invalid artifact_ref: {e}")
        return v

    @field_validator("issues")
    @classmethod
    def validate_issues(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """校验缺陷列表。"""
        issue_ids = set()

        for issue in v:
            # 校验必需字段
            required = {"issue_id", "category", "severity", "evidence"}
            if not required.issubset(issue.keys()):
                raise ValueError(f"Issue must contain: {required}")

            # 校验 ID 唯一性
            issue_id = issue["issue_id"]
            if issue_id in issue_ids:
                raise ValueError(f"Duplicate issue_id: {issue_id}")
            issue_ids.add(issue_id)

            # 校验类别
            valid_categories = [
                "product_fidelity",
                "layout",
                "text_error",
                "visual_quality",
                "technical",
            ]
            if issue["category"] not in valid_categories:
                raise ValueError(f"Invalid issue category: {issue['category']}")

            # 校验严重性
            if issue["severity"] not in ["blocking", "major", "minor", "suggestion"]:
                raise ValueError(f"Invalid issue severity: {issue['severity']}")

            # 校验边界框（可选）
            if "bbox_xywh_normalized" in issue:
                bbox = issue["bbox_xywh_normalized"]
                if not isinstance(bbox, list) or len(bbox) != 4:
                    raise ValueError(f"Issue '{issue_id}' bbox must be list of 4 numbers")
                for val in bbox:
                    if not isinstance(val, (int, float)) or val < 0 or val > 1:
                        raise ValueError(f"Issue '{issue_id}' bbox values must be in [0, 1]")

            # 校验建议责任方（可选）
            if "suggested_owner" in issue:
                valid_roles = {role.value for role in AgentRole} | {"user", "tool"}
                if issue["suggested_owner"] not in valid_roles:
                    raise ValueError(
                        f"Issue '{issue_id}' suggested_owner must be one of {valid_roles}"
                    )

            # 校验参考资源（可选）
            if "reference_asset" in issue:
                from .base import validate_reference_format

                try:
                    validate_reference_format(issue["reference_asset"], "asset")
                except ValueError as e:
                    raise ValueError(f"Issue '{issue_id}' invalid reference_asset: {e}")

        return v

    @field_validator("verdict")
    @classmethod
    def validate_verdict_consistency(cls, v: str, info: Any) -> str:
        """校验裁决与缺陷一致性。"""
        issues = info.data.get("issues", [])

        # fail 时必须有缺陷
        if v == "fail" and not issues:
            raise ValueError("verdict 'fail' requires at least one issue")

        # blocking 问题必须导致 fail
        has_blocking = any(issue.get("severity") == "blocking" for issue in issues)
        if has_blocking and v != "fail":
            raise ValueError("verdict must be 'fail' when blocking issues exist")

        return v
