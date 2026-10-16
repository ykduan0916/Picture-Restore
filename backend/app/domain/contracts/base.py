"""契约系统基础类型与校验工具。

本模块定义跨契约共享的类型、引用格式与校验函数。
schema_version 当前为 0.2。
"""
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SchemaVersion(str, Enum):
    """契约 schema 版本枚举。"""

    V0_2 = "0.2"


class AgentRole(str, Enum):
    """四角色 Agent 枚举。"""

    PLANNER = "planner"
    DESIGNER = "designer"
    RETOUCHER = "retoucher"
    QA = "qa"


class StepKind(str, Enum):
    """执行步骤类型。"""

    AGENT = "agent"  # Agent 激活
    TOOL = "tool"  # 确定性工具


class ImagePurpose(str, Enum):
    """图片用途分类。"""

    PRODUCT_ORIGINAL = "product_original"  # 商品原图
    STYLE_REFERENCE = "style_reference"  # 风格参考
    CANDIDATE_RESULT = "candidate_result"  # 候选结果
    DETAIL_CROP = "detail_crop"  # 细节裁片


class SourceKind(str, Enum):
    """素材来源类型。"""

    USER_UPLOAD = "user_upload"
    TOOL_RESULT = "tool_result"
    DERIVED = "derived"
    SELF_AUTHORED_FIXTURE = "self_authored_fixture"
    FIXTURE_TOOL_RESULT = "fixture_tool_result"
    DERIVED_FIXTURE = "derived_fixture"


class ContractBase(BaseModel):
    """契约基类。"""

    model_config = ConfigDict(
        # 禁止额外字段
        extra="forbid",
        # 使用枚举值而非名称
        use_enum_values=True,
        # 严格类型检查（允许字符串转枚举）
        strict=False,
    )

    schema_version: Literal[SchemaVersion.V0_2] = Field(
        default=SchemaVersion.V0_2,
        description="契约 schema 版本，当前为 0.2",
    )
    example_only: bool = Field(
        default=False,
        description="标识为示例，禁止用于真实执行",
    )
    job_id: str = Field(
        ...,
        description="任务唯一标识",
        pattern=r"^job_[a-z0-9_]+$",
    )
    revision: int = Field(
        ...,
        ge=1,
        description="契约修订号，从 1 开始",
    )
    created_by_role: AgentRole = Field(
        ...,
        description="创建此契约的 Agent 角色",
    )


class AssetReference(BaseModel):
    """资源引用。"""

    asset_id: str = Field(
        ...,
        description="资源唯一标识",
        pattern=r"^asset_[a-z0-9_]+$",
    )
    version: int = Field(
        ...,
        ge=1,
        description="资源版本号",
    )
    purpose: ImagePurpose = Field(
        ...,
        description="图片用途分类",
    )
    sku_id: str = Field(
        ...,
        description="所属 SKU 标识",
        pattern=r"^[a-z0-9_]+$",
    )
    source: dict[str, str] = Field(
        ...,
        description="来源信息，包含 kind 和 authorization",
    )
    allowed_usage: list[str] = Field(
        default_factory=list,
        description="允许的使用方式",
    )
    forbidden_usage: list[str] = Field(
        default_factory=list,
        description="禁止的使用方式",
    )
    original_dimensions: tuple[int, int] | None = Field(
        default=None,
        description="原始尺寸 [width, height]",
    )
    parent: dict[str, int | str] | None = Field(
        default=None,
        description="父资源引用（用于裁片），包含 asset_id 和 version",
    )
    parent_dimensions: tuple[int, int] | None = Field(
        default=None,
        description="父资源尺寸 [width, height]",
    )
    crop_xywh_pixels: tuple[int, int, int, int] | None = Field(
        default=None,
        description="裁片区域 [x, y, width, height]（像素坐标）",
    )
    crop_dimensions: tuple[int, int] | None = Field(
        default=None,
        description="裁片尺寸 [width, height]",
    )
    resize_scale: float | None = Field(
        default=None,
        ge=0.01,
        le=100.0,
        description="缩放比例",
    )
    crop_to_parent_transform: list[float] | None = Field(
        default=None,
        description="裁片到父图的 3x3 变换矩阵（9 个元素）",
    )

    @field_validator("crop_to_parent_transform")
    @classmethod
    def validate_transform_matrix(cls, v: list[float] | None) -> list[float] | None:
        """校验 3x3 变换矩阵。"""
        if v is not None and len(v) != 9:
            raise ValueError("Transform matrix must have exactly 9 elements (3x3)")
        return v

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: dict[str, str]) -> dict[str, str]:
        """校验来源信息。"""
        if "kind" not in v or "authorization" not in v:
            raise ValueError("Source must contain 'kind' and 'authorization'")
        return v


class StepReference(BaseModel):
    """执行步骤引用。"""

    step_id: str = Field(
        ...,
        description="步骤唯一标识",
        pattern=r"^[a-z_]+$",
    )
    kind: StepKind = Field(
        ...,
        description="步骤类型",
    )
    executor: str = Field(
        ...,
        description="执行者（Agent 角色或工具名称）",
    )


def validate_reference_format(ref: str, expected_prefix: str) -> tuple[str, int]:
    """
    校验引用格式：prefix:id@version。

    Args:
        ref: 引用字符串
        expected_prefix: 期望的前缀（asset、task、design、report 等）

    Returns:
        (id, version) 元组

    Raises:
        ValueError: 引用格式不正确
    """
    parts = ref.split(":")
    if len(parts) != 2:
        raise ValueError(f"Invalid reference format: {ref}, expected {expected_prefix}:id@version")

    prefix, id_version = parts
    if prefix != expected_prefix:
        raise ValueError(f"Invalid reference prefix: {prefix}, expected {expected_prefix}")

    id_parts = id_version.split("@")
    if len(id_parts) != 2:
        raise ValueError(f"Invalid reference format: {ref}, expected {expected_prefix}:id@version")

    ref_id, version_str = id_parts
    try:
        version = int(version_str)
        if version < 1:
            raise ValueError(f"Version must be >= 1, got {version}")
    except ValueError as e:
        raise ValueError(f"Invalid version number in reference: {ref}") from e

    return ref_id, version


def detect_cycle(steps: list[dict], step_id: str, visited: set[str], rec_stack: set[str]) -> bool:
    """
    检测 DAG 中的环依赖。

    Args:
        steps: 所有步骤列表
        step_id: 当前检查的步骤 ID
        visited: 已访问的步骤集合
        rec_stack: 递归调用栈

    Returns:
        True 如果检测到环，False 否则
    """
    visited.add(step_id)
    rec_stack.add(step_id)

    # 查找当前步骤
    step = next((s for s in steps if s["id"] == step_id), None)
    if step is None:
        return False

    # 检查所有依赖
    for dep in step.get("depends_on", []):
        if dep not in visited:
            if detect_cycle(steps, dep, visited, rec_stack):
                return True
        elif dep in rec_stack:
            return True

    rec_stack.remove(step_id)
    return False
