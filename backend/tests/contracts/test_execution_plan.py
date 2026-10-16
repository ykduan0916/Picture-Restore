"""ExecutionPlan 契约测试。"""
import pytest
from pydantic import ValidationError

from app.domain.contracts import ExecutionPlan


class TestExecutionPlanValid:
    """测试有效的 ExecutionPlan。"""

    def test_valid_plan_passes(self, valid_plan_data):
        """有效示例通过校验。"""
        plan = ExecutionPlan(**valid_plan_data)

        assert plan.schema_version == "0.2"
        assert plan.job_id == "job_test_001"
        assert plan.task_revision == 1
        assert len(plan.steps) == 3
        assert plan.total_budget_minor == 10000

    def test_parallel_steps(self, valid_plan_data):
        """并行步骤（设计+主体准备）通过。"""
        plan = ExecutionPlan(**valid_plan_data)

        # 获取并行分层
        layers = plan.get_parallel_steps()

        # 第一层应包含 design 和 prepare_subject（无依赖）
        assert len(layers) >= 2
        assert set(layers[0]) == {"design", "prepare_subject"}
        # 第二层应包含 white（依赖 prepare_subject）
        assert "white" in layers[1]

    def test_budget_allocation(self, valid_plan_data):
        """预算分配通过。"""
        valid_plan_data["steps"][0]["budget_minor"] = 3000
        valid_plan_data["steps"][1]["budget_minor"] = 5000
        valid_plan_data["steps"][2]["budget_minor"] = 2000

        plan = ExecutionPlan(**valid_plan_data)
        assert plan.total_budget_minor == 10000

    def test_optional_budget(self, valid_plan_data):
        """预算可选。"""
        valid_plan_data["total_budget_minor"] = None
        plan = ExecutionPlan(**valid_plan_data)
        assert plan.total_budget_minor is None


class TestExecutionPlanMissingFields:
    """测试缺失必需字段。"""

    def test_missing_task_revision_fails(self, valid_plan_data):
        """缺少 task_revision 失败。"""
        del valid_plan_data["task_revision"]
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "task_revision" in str(exc_info.value)

    def test_missing_steps_fails(self, valid_plan_data):
        """缺少 steps 失败。"""
        del valid_plan_data["steps"]
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "steps" in str(exc_info.value)

    def test_empty_steps_fails(self, valid_plan_data):
        """空步骤列表失败。"""
        valid_plan_data["steps"] = []
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "steps" in str(exc_info.value)


class TestExecutionPlanStepStructure:
    """测试步骤结构校验。"""

    def test_step_missing_required_field_fails(self, valid_plan_data):
        """步骤缺少必需字段失败。"""
        valid_plan_data["steps"][0] = {
            "id": "incomplete",
            "kind": "agent",
            # 缺少 executor, depends_on, inputs, outputs
        }
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        error_msg = str(exc_info.value)
        assert any(field in error_msg for field in ["executor", "depends_on", "inputs", "outputs"])

    def test_duplicate_step_id_fails(self, valid_plan_data):
        """重复步骤 ID 失败。"""
        valid_plan_data["steps"].append(valid_plan_data["steps"][0].copy())
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "Duplicate" in str(exc_info.value)

    def test_invalid_step_kind_fails(self, valid_plan_data):
        """非法步骤类型失败。"""
        valid_plan_data["steps"][0]["kind"] = "invalid"
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "kind" in str(exc_info.value)

    def test_invalid_agent_executor_fails(self, valid_plan_data):
        """非法 Agent 执行者失败。"""
        valid_plan_data["steps"][0]["executor"] = "invalid_agent"
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "executor" in str(exc_info.value)

    def test_tool_executor_allows_custom_name(self, valid_plan_data):
        """工具执行者允许自定义名称。"""
        valid_plan_data["steps"][2]["executor"] = "custom_tool_name"
        plan = ExecutionPlan(**valid_plan_data)
        assert plan.steps[2]["executor"] == "custom_tool_name"


class TestExecutionPlanDependencies:
    """测试依赖关系校验。"""

    def test_nonexistent_dependency_fails(self, valid_plan_data):
        """依赖不存在的步骤失败。"""
        valid_plan_data["steps"][2]["depends_on"] = ["nonexistent_step"]
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "nonexistent_step" in str(exc_info.value)

    def test_valid_dependency_chain(self, valid_plan_data):
        """有效依赖链通过。"""
        # design -> prepare_subject -> white
        valid_plan_data["steps"][1]["depends_on"] = ["design"]
        valid_plan_data["steps"][2]["depends_on"] = ["prepare_subject"]

        plan = ExecutionPlan(**valid_plan_data)
        layers = plan.get_parallel_steps()

        # 应该有三层
        assert len(layers) == 3
        assert layers[0] == ["design"]
        assert layers[1] == ["prepare_subject"]
        assert layers[2] == ["white"]


class TestExecutionPlanCircularDependency:
    """测试环依赖检测。"""

    def test_simple_self_loop_fails(self, valid_plan_data):
        """简单自循环失败。"""
        valid_plan_data["steps"][0]["depends_on"] = ["design"]
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "Circular" in str(exc_info.value)

    def test_two_step_cycle_fails(self, valid_plan_data):
        """两步循环失败。"""
        # design -> prepare_subject -> design
        valid_plan_data["steps"][0]["depends_on"] = ["prepare_subject"]
        valid_plan_data["steps"][1]["depends_on"] = ["design"]
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "Circular" in str(exc_info.value)

    def test_three_step_cycle_fails(self, valid_plan_data):
        """三步循环失败。"""
        # design -> prepare_subject -> white -> design
        valid_plan_data["steps"][0]["depends_on"] = ["white"]
        valid_plan_data["steps"][1]["depends_on"] = ["design"]
        valid_plan_data["steps"][2]["depends_on"] = ["prepare_subject"]
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "Circular" in str(exc_info.value)

    def test_complex_cycle_with_branches_fails(self, valid_plan_data):
        """复杂环（带分支）失败。"""
        # 添加更多步骤构建复杂图
        valid_plan_data["steps"].extend([
            {
                "id": "quality",
                "kind": "agent",
                "executor": "qa",
                "depends_on": ["white"],
                "inputs": ["artifact:white_001@1"],
                "outputs": ["report:quality_001@1"],
            },
            {
                "id": "rework",
                "kind": "agent",
                "executor": "retoucher",
                "depends_on": ["quality"],
                "inputs": ["report:quality_001@1"],
                "outputs": ["artifact:white_002@1"],
            },
        ])
        # 创建环：design -> prepare_subject -> white -> quality -> rework -> design
        valid_plan_data["steps"][0]["depends_on"] = ["rework"]
        valid_plan_data["steps"][1]["depends_on"] = ["design"]

        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "Circular" in str(exc_info.value)


class TestExecutionPlanBudgetValidation:
    """测试预算分配校验。"""

    def test_budget_overflow_fails(self, valid_plan_data):
        """预算超限失败。"""
        valid_plan_data["steps"][0]["budget_minor"] = 5000
        valid_plan_data["steps"][1]["budget_minor"] = 4000
        valid_plan_data["steps"][2]["budget_minor"] = 3000
        # 总计 12000 > 10000

        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "budget" in str(exc_info.value).lower()

    def test_exact_budget_allocation_passes(self, valid_plan_data):
        """精确预算分配通过。"""
        valid_plan_data["steps"][0]["budget_minor"] = 3000
        valid_plan_data["steps"][1]["budget_minor"] = 4000
        valid_plan_data["steps"][2]["budget_minor"] = 3000
        # 总计 10000 = 10000

        plan = ExecutionPlan(**valid_plan_data)
        assert plan.total_budget_minor == 10000

    def test_partial_budget_allocation_passes(self, valid_plan_data):
        """部分步骤有预算通过。"""
        valid_plan_data["steps"][0]["budget_minor"] = 5000
        # 其他步骤无预算分配

        plan = ExecutionPlan(**valid_plan_data)
        assert plan.total_budget_minor == 10000

    def test_negative_step_budget_fails(self, valid_plan_data):
        """负步骤预算失败。"""
        valid_plan_data["steps"][0]["budget_minor"] = -100
        with pytest.raises(ValidationError) as exc_info:
            ExecutionPlan(**valid_plan_data)
        assert "budget_minor" in str(exc_info.value)


class TestExecutionPlanParallelValidation:
    """测试并行策略校验。"""

    def test_both_steps_independent_allows_parallel(self, valid_plan_data):
        """设计和主体准备都独立时允许并行。"""
        # 默认情况：两者都无依赖
        plan = ExecutionPlan(**valid_plan_data)
        layers = plan.get_parallel_steps()
        # 第一层应包含这两个独立步骤
        assert "design" in layers[0]
        assert "prepare_subject" in layers[0]

    def test_subject_depends_on_design_串行_but_valid(self, valid_plan_data):
        """主体准备依赖设计时为串行但仍有效。"""
        valid_plan_data["steps"][1]["depends_on"] = ["design"]
        plan = ExecutionPlan(**valid_plan_data)
        layers = plan.get_parallel_steps()
        # 串行执行
        assert "design" in layers[0]
        assert "prepare_subject" in layers[1]

    def test_design_depends_on_subject_串行_but_valid(self, valid_plan_data):
        """设计依赖主体准备时为串行但仍有效（不太常见但不违反DAG）。"""
        valid_plan_data["steps"][0]["depends_on"] = ["prepare_subject"]
        plan = ExecutionPlan(**valid_plan_data)
        layers = plan.get_parallel_steps()
        # 串行执行
        assert "prepare_subject" in layers[0]
        assert "design" in layers[1]

    def test_optional_steps_without_parallel_constraint(self, valid_plan_data):
        """没有 design/prepare_subject 步骤时不校验并行约束。"""
        valid_plan_data["steps"] = [
            {
                "id": "custom_step",
                "kind": "tool",
                "executor": "custom_tool",
                "depends_on": [],
                "inputs": ["task:job_test_001@1"],
                "outputs": ["artifact:result_001@1"],
            }
        ]
        plan = ExecutionPlan(**valid_plan_data)
        assert len(plan.steps) == 1
