"""任务管理路由。"""
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class JobCreateRequest(BaseModel):
    """创建任务请求。"""

    sku_id: str
    product_name: str
    deliverables: List[str] = ["white", "scene", "promo"]


class JobResponse(BaseModel):
    """任务响应。"""

    job_id: str
    sku_id: str
    status: str
    created_at: str


@router.post("/jobs", response_model=JobResponse)
async def create_job(request: JobCreateRequest):
    """创建新任务。"""
    # TODO: 实际创建任务逻辑
    return {
        "job_id": f"job_{request.sku_id}",
        "sku_id": request.sku_id,
        "status": "pending",
        "created_at": "2024-01-01T00:00:00Z",
    }


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """获取任务详情。"""
    # TODO: 从数据库查询
    return {
        "job_id": job_id,
        "sku_id": "test_sku",
        "status": "completed",
        "created_at": "2024-01-01T00:00:00Z",
    }


@router.get("/jobs", response_model=List[JobResponse])
async def list_jobs(skip: int = 0, limit: int = 10):
    """列出所有任务。"""
    # TODO: 从数据库查询
    return []
