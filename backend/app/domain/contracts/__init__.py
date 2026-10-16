"""契约系统公开接口。

导出所有契约模型、基础类型与校验工具。
"""
from .base import (
    AgentRole,
    AssetReference,
    ContractBase,
    ImagePurpose,
    SchemaVersion,
    SourceKind,
    StepKind,
    StepReference,
    detect_cycle,
    validate_reference_format,
)
from .design import DesignSpec
from .multimodal import MultiModalContext
from .plan import ExecutionPlan
from .quality import QualityReport
from .task import TaskContract
from .tool_result import ToolResult

__all__ = [
    # 基础类型
    "SchemaVersion",
    "AgentRole",
    "StepKind",
    "ImagePurpose",
    "SourceKind",
    "ContractBase",
    "AssetReference",
    "StepReference",
    # 校验工具
    "validate_reference_format",
    "detect_cycle",
    # 契约模型
    "TaskContract",
    "ExecutionPlan",
    "DesignSpec",
    "QualityReport",
    "ToolResult",
    "MultiModalContext",
]
