"""数据库模型定义。"""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Project(Base):
    """项目表。"""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    jobs = relationship("Job", back_populates="project", cascade="all, delete-orphan")


class Job(Base):
    """任务表。"""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(100), unique=True, nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sku_id = Column(String(255), nullable=False)
    status = Column(
        Enum("pending", "planning", "executing", "completed", "failed", name="job_status"),
        default="pending",
        nullable=False,
    )
    task_contract = Column(JSON, nullable=True)  # TaskContract JSON
    execution_plan = Column(JSON, nullable=True)  # ExecutionPlan JSON
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    project = relationship("Project", back_populates="jobs")
    assets = relationship("Asset", back_populates="job", cascade="all, delete-orphan")
    steps = relationship("Step", back_populates="job", cascade="all, delete-orphan")


class Asset(Base):
    """资源表。"""

    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(100), unique=True, nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    purpose = Column(
        Enum(
            "product_original",
            "style_reference",
            "candidate_result",
            "detail_crop",
            name="asset_purpose",
        ),
        nullable=False,
    )
    storage_path = Column(String(500), nullable=False)  # S3 路径
    mime_type = Column(String(100), nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    asset_metadata = Column(JSON, nullable=True)  # AssetReference JSON
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 关系
    job = relationship("Job", back_populates="assets")


class Step(Base):
    """执行步骤表。"""

    __tablename__ = "steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    step_id = Column(String(100), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    kind = Column(Enum("agent", "tool", name="step_kind"), nullable=False)
    executor = Column(String(100), nullable=False)
    status = Column(
        Enum("pending", "running", "succeeded", "failed", name="step_status"),
        default="pending",
        nullable=False,
    )
    inputs = Column(JSON, nullable=True)
    outputs = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 关系
    job = relationship("Job", back_populates="steps")
