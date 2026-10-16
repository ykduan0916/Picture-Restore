"""FastAPI 应用入口。"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import health, jobs


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """应用生命周期管理。"""
    # 启动时
    print("🚀 Picture Restore API 启动中...")
    yield
    # 关闭时
    print("👋 Picture Restore API 关闭")


app = FastAPI(
    title="Picture Restore API",
    description="电商商品图与营销素材自动化生成系统",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, prefix="/api", tags=["健康检查"])
app.include_router(jobs.router, prefix="/api", tags=["任务管理"])


@app.get("/")
async def root():
    """根路径。"""
    return {
        "name": "Picture Restore API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }
