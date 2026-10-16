"""执行计划契约定义。

ExecutionPlan 定义 DAG 步骤依赖、并行执行、输入输出版本与预算分配。
"""
from typing import Any

from pydantic import Field, field_validator, model_validator

from .base import AgentRole, ContractBase, StepKind, detect_cycle


class ExecutionPlan(ContractBase):
    """
    执行计划：定义任务的 DAG 步骤依赖。

    包含步骤顺序、并行策略、输入输出版本引用、预算分配与前后置条件。
    必须无环、依赖步骤必须存在、预算分配总和不超父任务额度。
    """

    task_revision: int = Field(
        ...,
        ge=1,
        description="对应的任务契约修订号",
    )
    base_document_version: int = Field(
        ...,
        ge=1,
        description="基准文档版本号",
    )
    steps: list[dict[str, Any]] = Field(
        ...,
        min_length=1,
        description="执行步骤列表（DAG 节点）",
    )
    total_budget_minor: int | None = Field(
        default=None,
        ge=0,
        description="总预算（最小货币单位），None 表示无限制",
    )
    currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
        description="货币代码（ISO 4217）",
    )

    @field_validator("steps")
    @classmethod
    def validate_steps_structure(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """校验步骤基本结构。"""
        step_ids = set()

        for step in v:
            # 校验必需字段
            required = {"id", "kind", "executor", "depends_on", "inputs", "outputs"}
            if not required.issubset(step.keys()):
                raise ValueError(f"Step must contain: {required}")

            # 校验 ID 唯一性
            step_id = step["id"]
            if step_id in step_ids:
                raise ValueError(f"Duplicate step id: {step_id}")
            step_ids.add(step_id)

            # 校验 ID 格式
            if not isinstance(step_id, str) or not step_id.replace("_", "").isalnum():
                raise ValueError(f"Step id must be alphanumeric with underscores: {step_id}")

            # 校验 kind
            if step["kind"] not in ["agent", "tool"]:
                raise ValueError(f"Step kind must be 'agent' or 'tool', got {step['kind']}")

            # 校验 executor
            if step["kind"] == "agent":
                valid_roles = {role.value for role in AgentRole}
                if step["executor"] not in valid_roles:
                    raise ValueError(f"Agent executor must be one of {valid_roles}, got {step['executor']}")

            # 校验依赖是列表
            if not isinstance(step["depends_on"], list):
                raise ValueError(f"Step '{step_id}' depends_on must be a list")

            # 校验输入输出是列表
            if not isinstance(step["inputs"], list):
                raise ValueError(f"Step '{step_id}' inputs must be a list")
            if not isinstance(step["outputs"], list):
                raise ValueError(f"Step '{step_id}' outputs must be a list")

            # 校验前后置条件（可选）
            if "preconditions" in step and not isinstance(step["preconditions"], list):
                raise ValueError(f"Step '{step_id}' preconditions must be a list")
            if "postconditions" in step and not isinstance(step["postconditions"], list):
                raise ValueError(f"Step '{step_id}' postconditions must be a list")

            # 校验预算分配（可选）
            if "budget_minor" in step:
                if not isinstance(step["budget_minor"], (int, type(None))):
                    raise ValueError(f"Step '{step_id}' budget_minor must be integer or null")
                if isinstance(step["budget_minor"], int) and step["budget_minor"] < 0:
                    raise ValueError(f"Step '{step_id}' budget_minor must be non-negative")

        return v

    @model_validator(mode="after")
    def validate_dependencies_and_cycles(self) -> "ExecutionPlan":
        """校验依赖关系与环检测。"""
        step_ids = {step["id"] for step in self.steps}

        # 校验所有依赖步骤存在
        for step in self.steps:
            for dep in step["depends_on"]:
                if dep not in step_ids:
                    raise ValueError(
                        f"Step '{step['id']}' depends on non-existent step '{dep}'"
                    )

        # 检测环依赖
        visited: set[str] = set()
        rec_stack: set[str] = set()

        for step in self.steps:
            step_id = step["id"]
            if step_id not in visited:
                if detect_cycle(self.steps, step_id, visited, rec_stack):
                    raise ValueError(
                        f"Circular dependency detected involving step '{step_id}'"
                    )

        return self

    @model_validator(mode="after")
    def validate_budget_allocation(self) -> "ExecutionPlan":
        """校验预算分配总和不超父任务额度。"""
        if self.total_budget_minor is None:
            return self

        allocated_sum = 0
        for step in self.steps:
            if "budget_minor" in step and step["budget_minor"] is not None:
                allocated_sum += step["budget_minor"]

        if allocated_sum > self.total_budget_minor:
            raise ValueError(
                f"Step budget allocation sum ({allocated_sum}) exceeds total budget ({self.total_budget_minor})"
            )

        return self


    def get_parallel_steps(self) -> list[list[str]]:
        """
        返回可并行执行的步骤分层。

        Returns:
            每层包含可并行的步骤 ID 列表
        """
        step_dict = {step["id"]: step for step in self.steps}
        completed = set()
        layers = []

        while len(completed) < len(self.steps):
            # 找到所有依赖已完成的步骤
            ready = []
            for step_id, step in step_dict.items():
                if step_id not in completed:
                    deps = set(step.get("depends_on", []))
                    if deps.issubset(completed):
                        ready.append(step_id)

            if not ready:
                # 不应该发生（环检测已覆盖）
                break

            layers.append(ready)
            completed.update(ready)

        return layers
