"""TaskContract 契约测试。"""
import pytest
from pydantic import ValidationError

from app.domain.contracts import ImagePurpose, TaskContract


class TestTaskContractValid:
    """测试有效的 TaskContract。"""

    def test_valid_task_contract_passes(self, valid_task_contract_data):
        """有效示例通过校验。"""
        contract = TaskContract(**valid_task_contract_data)

        assert contract.schema_version == "0.2"
        assert contract.job_id == "job_test_001"
        assert contract.revision == 1
        assert contract.sku_id == "test_sku_001"
        assert len(contract.input_assets) == 1
        assert contract.input_assets[0].purpose == ImagePurpose.PRODUCT_ORIGINAL
        assert len(contract.deliverables) == 2
        assert contract.execution_policy["provider_mode"] == "mock"

    def test_multiple_deliverables(self, valid_task_contract_data):
        """支持多个交付物。"""
        valid_task_contract_data["deliverables"].append(
            {"id": "promo", "purpose": "promotion", "width": 1080, "height": 1440, "format": "png"}
        )
        contract = TaskContract(**valid_task_contract_data)
        assert len(contract.deliverables) == 3

    def test_optional_brand_spec(self, valid_task_contract_data):
        """品牌规范可选。"""
        valid_task_contract_data["brand_spec"] = None
        contract = TaskContract(**valid_task_contract_data)
        assert contract.brand_spec is None


class TestTaskContractMissingFields:
    """测试缺失必需字段。"""

    def test_missing_job_id_fails(self, valid_task_contract_data):
        """缺少 job_id 失败。"""
        del valid_task_contract_data["job_id"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "job_id" in str(exc_info.value)

    def test_missing_sku_id_fails(self, valid_task_contract_data):
        """缺少 sku_id 失败。"""
        del valid_task_contract_data["sku_id"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "sku_id" in str(exc_info.value)

    def test_missing_input_assets_fails(self, valid_task_contract_data):
        """缺少 input_assets 失败。"""
        del valid_task_contract_data["input_assets"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "input_assets" in str(exc_info.value)

    def test_empty_input_assets_fails(self, valid_task_contract_data):
        """空 input_assets 失败。"""
        valid_task_contract_data["input_assets"] = []
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "input_assets" in str(exc_info.value)

    def test_missing_deliverables_fails(self, valid_task_contract_data):
        """缺少 deliverables 失败。"""
        del valid_task_contract_data["deliverables"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "deliverables" in str(exc_info.value)


class TestTaskContractInvalidValues:
    """测试非法字段值。"""

    def test_no_product_original_fails(self, valid_task_contract_data, valid_asset_style_ref):
        """没有商品原图失败。"""
        valid_task_contract_data["input_assets"] = [valid_asset_style_ref]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "product_original" in str(exc_info.value)

    def test_invalid_job_id_format_fails(self, valid_task_contract_data):
        """非法 job_id 格式失败。"""
        valid_task_contract_data["job_id"] = "invalid_format"
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "job_id" in str(exc_info.value)

    def test_invalid_revision_fails(self, valid_task_contract_data):
        """revision 必须 >= 1。"""
        valid_task_contract_data["revision"] = 0
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "revision" in str(exc_info.value)

    def test_invalid_schema_version_fails(self, valid_task_contract_data):
        """非法 schema_version 失败。"""
        valid_task_contract_data["schema_version"] = "0.1"
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "schema_version" in str(exc_info.value)


class TestTaskContractFacts:
    """测试事实字段校验。"""

    def test_fact_without_value_fails(self, valid_task_contract_data):
        """事实缺少 value 失败。"""
        valid_task_contract_data["facts"]["price"] = {"source": "user_input"}
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "value" in str(exc_info.value)

    def test_fact_without_source_fails(self, valid_task_contract_data):
        """事实缺少 source 失败。"""
        valid_task_contract_data["facts"]["price"] = {"value_minor": 19900}
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "source" in str(exc_info.value)

    def test_empty_facts_allowed(self, valid_task_contract_data):
        """空事实字典允许。"""
        valid_task_contract_data["facts"] = {}
        contract = TaskContract(**valid_task_contract_data)
        assert len(contract.facts) == 0


class TestTaskContractConstraints:
    """测试保护约束校验。"""

    def test_missing_constraint_mode_fails(self, valid_task_contract_data):
        """缺少 mode 失败。"""
        del valid_task_contract_data["constraints"]["mode"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "mode" in str(exc_info.value)

    def test_invalid_constraint_mode_fails(self, valid_task_contract_data):
        """非法 mode 失败。"""
        valid_task_contract_data["constraints"]["mode"] = "invalid_mode"
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "mode" in str(exc_info.value)

    def test_missing_preserve_list_fails(self, valid_task_contract_data):
        """缺少 preserve 列表失败。"""
        del valid_task_contract_data["constraints"]["preserve"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "preserve" in str(exc_info.value)


class TestTaskContractDeliverables:
    """测试交付物校验。"""

    def test_deliverable_missing_required_field_fails(self, valid_task_contract_data):
        """交付物缺少必需字段失败。"""
        valid_task_contract_data["deliverables"] = [{"id": "test", "width": 1024}]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        # 应该提示缺少 purpose/height/format
        error_msg = str(exc_info.value)
        assert any(field in error_msg for field in ["purpose", "height", "format"])

    def test_duplicate_deliverable_id_fails(self, valid_task_contract_data):
        """重复的交付物 ID 失败。"""
        valid_task_contract_data["deliverables"].append(
            {"id": "white", "purpose": "duplicate", "width": 1024, "height": 1024, "format": "png"}
        )
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "Duplicate" in str(exc_info.value)

    def test_invalid_deliverable_dimensions_fails(self, valid_task_contract_data):
        """非法尺寸失败。"""
        valid_task_contract_data["deliverables"][0]["width"] = 0
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "width" in str(exc_info.value)

    def test_invalid_deliverable_format_fails(self, valid_task_contract_data):
        """非法格式失败。"""
        valid_task_contract_data["deliverables"][0]["format"] = "bmp"
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "format" in str(exc_info.value)


class TestTaskContractExecutionPolicy:
    """测试执行策略校验。"""

    def test_missing_policy_field_fails(self, valid_task_contract_data):
        """缺少策略字段失败。"""
        del valid_task_contract_data["execution_policy"]["max_agent_activations"]
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "max_agent_activations" in str(exc_info.value)

    def test_invalid_provider_mode_fails(self, valid_task_contract_data):
        """非法 provider_mode 失败。"""
        valid_task_contract_data["execution_policy"]["provider_mode"] = "invalid"
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "provider_mode" in str(exc_info.value)

    def test_excessive_activations_fails(self, valid_task_contract_data):
        """过大的激活上限失败。"""
        valid_task_contract_data["execution_policy"]["max_agent_activations"] = 200
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "max_agent_activations" in str(exc_info.value)

    def test_negative_budget_fails(self, valid_task_contract_data):
        """负预算失败。"""
        valid_task_contract_data["execution_policy"]["budget_limit_minor"] = -100
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "budget_limit_minor" in str(exc_info.value)

    def test_invalid_currency_format_fails(self, valid_task_contract_data):
        """非法货币代码失败。"""
        valid_task_contract_data["execution_policy"]["currency"] = "INVALID"
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "currency" in str(exc_info.value)


class TestTaskContractBrandSpec:
    """测试品牌规范引用校验。"""

    def test_brand_spec_missing_version_fails(self, valid_task_contract_data):
        """品牌规范缺少 version 失败。"""
        valid_task_contract_data["brand_spec"] = {"id": "brand_test_001"}
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "version" in str(exc_info.value)

    def test_brand_spec_invalid_version_fails(self, valid_task_contract_data):
        """品牌规范 version 必须 >= 1。"""
        valid_task_contract_data["brand_spec"] = {"id": "brand_test_001", "version": 0}
        with pytest.raises(ValidationError) as exc_info:
            TaskContract(**valid_task_contract_data)
        assert "version" in str(exc_info.value)
