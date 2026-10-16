"""健康检查路由。"""
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """服务存活与当前能力状态。

    生成能力和持久化尚未接入时如实返回，前端据此提示用户。
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "picture-restore-api",
        "version": "0.1.0",
        "storage": "memory",
        "generation": "not_connected",
    }
