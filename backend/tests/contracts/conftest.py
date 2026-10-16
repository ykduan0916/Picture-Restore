"""契约测试的 pytest fixtures。"""
import pytest

from app.domain.contracts import AssetReference, ImagePurpose, SourceKind


@pytest.fixture
def valid_asset_original():
    """有效的商品原图资源引用。"""
    return AssetReference(
        asset_id="asset_test_001",
        version=1,
        purpose=ImagePurpose.PRODUCT_ORIGINAL,
        sku_id="test_sku_001",
        source={"kind": SourceKind.USER_UPLOAD.value, "authorization": "test_authorized"},
        allowed_usage=["visual_understanding", "product_reference"],
        original_dimensions=(2048, 2048),
    )


@pytest.fixture
def valid_asset_style_ref():
    """有效的风格参考资源引用。"""
    return AssetReference(
        asset_id="asset_style_001",
        version=1,
        purpose=ImagePurpose.STYLE_REFERENCE,
        sku_id="test_sku_001",
        source={"kind": SourceKind.USER_UPLOAD.value, "authorization": "test_authorized"},
        allowed_usage=["palette_reference", "layout_reference"],
        forbidden_usage=["product_facts", "price_source"],
        original_dimensions=(1024, 768),
    )


@pytest.fixture
def valid_asset_crop():
    """有效的细节裁片资源引用。"""
    return AssetReference(
        asset_id="asset_crop_001",
        version=1,
        purpose=ImagePurpose.DETAIL_CROP,
        sku_id="test_sku_001",
        source={"kind": SourceKind.DERIVED.value, "authorization": "derived_from_original"},
        allowed_usage=["detail_inspection"],
        parent={"asset_id": "asset_test_001", "version": 1},
        parent_dimensions=(2048, 2048),
        crop_xywh_pixels=(512, 512, 256, 256),
        crop_dimensions=(256, 256),
        resize_scale=1.0,
        crop_to_parent_transform=[1, 0, 512, 0, 1, 512, 0, 0, 1],
    )


@pytest.fixture
def valid_task_contract_data(valid_asset_original):
    """有效的任务契约数据。"""
    return {
        "schema_version": "0.2",
        "job_id": "job_test_001",
        "revision": 1,
        "created_by_role": "planner",
        "base_document_version": 1,
        "sku_id": "test_sku_001",
        "input_assets": [valid_asset_original],
        "facts": {
            "product_name": {"value": "测试商品", "source": "user_input"},
            "price": {"value_minor": 19900, "currency": "CNY", "source": "user_input"},
        },
        "brand_spec": {"id": "brand_test_001", "version": 1},
        "constraints": {
            "mode": "preserve_product",
            "preserve": ["shape", "color", "logo"],
            "allowed_operations": ["mask_refinement", "background_edit", "text_layer"],
            "prohibited_operations": ["product_regeneration", "viewpoint_change"],
        },
        "deliverables": [
            {"id": "white", "purpose": "white_background", "width": 2048, "height": 2048, "format": "png"},
            {"id": "scene", "purpose": "scene", "width": 2048, "height": 2048, "format": "png"},
        ],
        "execution_policy": {
            "paid_calls_enabled": False,
            "provider_mode": "mock",
            "budget_limit_minor": None,
            "currency": "CNY",
            "max_quality_repair_rounds_per_deliverable": 2,
            "max_feasibility_rounds": 2,
            "max_agent_activations": 12,
            "max_tool_calls_per_activation": 8,
            "active_processing_deadline_seconds": 600,
        },
        "acceptance_rules_version": "test_v1",
        "requires_user_acceptance": True,
    }


@pytest.fixture
def valid_plan_data():
    """有效的执行计划数据。"""
    return {
        "schema_version": "0.2",
        "job_id": "job_test_001",
        "revision": 1,
        "created_by_role": "planner",
        "task_revision": 1,
        "base_document_version": 1,
        "steps": [
            {
                "id": "design",
                "kind": "agent",
                "executor": "designer",
                "depends_on": [],
                "inputs": ["task:job_test_001@1"],
                "outputs": ["design:design_001@1"],
                "postconditions": ["design_respects_constraints"],
            },
            {
                "id": "prepare_subject",
                "kind": "agent",
                "executor": "retoucher",
                "depends_on": [],
                "inputs": ["task:job_test_001@1", "asset:asset_test_001@1"],
                "outputs": ["artifact:subject_001@1", "artifact:mask_001@1"],
            },
            {
                "id": "white",
                "kind": "tool",
                "executor": "compose_white_background",
                "depends_on": ["prepare_subject"],
                "inputs": ["artifact:subject_001@1", "artifact:mask_001@1"],
                "outputs": ["artifact:white_001@1"],
                "produces_deliverables": ["white"],
            },
        ],
        "total_budget_minor": 10000,
        "currency": "CNY",
    }
