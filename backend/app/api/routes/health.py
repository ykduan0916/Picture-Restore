"""健康检查路由。"""
from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """健康检查端点。"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "picture-restore-api",
        "version": "0.1.0",
    }


@router.get("/health/ready")
async def readiness_check():
    """就绪检查端点。"""
    # TODO: 检查数据库、Redis 连接
    return {
        "status": "ready",
        "database": "not_connected",
        "redis": "not_connected",
        "storage": "not_connected",
    }
