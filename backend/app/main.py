"""FastAPI 应用入口。"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import brands, health, jobs


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """应用生命周期管理。"""
    yield


app = FastAPI(
    title="Picture Restore API",
    description="电商商品图与营销素材自动化生成系统",
    version="0.1.0",
    lifespan=lifespan,
)

# 开发时前端经 Vite 代理访问 /api；直接跨域访问仅允许本机 Vite 端口
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):51\d\d$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, prefix="/api", tags=["健康检查"])
app.include_router(jobs.router, prefix="/api", tags=["任务管理"])
app.include_router(brands.router, prefix="/api", tags=["品牌规范"])


@app.get("/")
async def root():
    """根路径。"""
    return {
        "name": "Picture Restore API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }
