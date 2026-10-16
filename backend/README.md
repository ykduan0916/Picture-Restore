# Picture Renew Backend

电商商品图与营销素材制作系统后端服务。

## 技术栈

- Python 3.12+
- FastAPI - Web 框架
- Pydantic v2 - 数据验证与契约定义
- SQLAlchemy 2.0 - ORM
- PostgreSQL - 业务数据库
- Redis + ARQ - 异步任务队列
- LangGraph - Agent 工作流编排
- Pillow - 图像处理

## 开发环境设置

### 前置要求

- Python 3.12+
- Docker & Docker Compose
- [uv](https://github.com/astral-sh/uv) - Python 包管理器

### 快速启动

```bash
# 1. 安装依赖
uv sync

# 2. 启动基础设施（PostgreSQL、Redis、MinIO）
docker-compose up -d

# 3. 运行数据库迁移
uv run alembic upgrade head

# 4. 启动开发服务器
uv run uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000
```

访问：
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- MinIO 控制台: http://localhost:9001 (minioadmin / minioadmin)

## 项目结构

```
backend/
├── app/
│   ├── domain/              # 领域模型与契约
│   │   ├── contracts/       # Pydantic 契约定义
│   │   └── entities/        # 业务实体
│   ├── application/         # 应用服务层
│   │   ├── services/        # 业务服务
│   │   └── harness/         # 执行校验与权限
│   ├── agents/              # 四角色 Agent
│   │   ├── planner.py       # 任务规划
│   │   ├── designer.py      # 视觉设计
│   │   ├── retoucher.py     # 修图执行
│   │   └── qa.py            # 质量验收
│   ├── tools/               # 图像处理与排版工具
│   ├── providers/           # 模型供应商适配器
│   ├── infrastructure/      # 基础设施
│   │   ├── database/        # 数据库连接与仓储
│   │   ├── queue/           # ARQ 队列
│   │   └── storage/         # S3 兼容对象存储
│   └── api/                 # FastAPI 路由
├── tests/
│   ├── contracts/           # 契约校验测试
│   ├── integration/         # 集成测试
│   └── unit/                # 单元测试
├── alembic/                 # 数据库迁移脚本
├── pyproject.toml           # uv 依赖配置
└── docker-compose.yml       # 本地开发环境
```

## 测试

```bash
# 运行所有测试
uv run pytest

# 契约校验测试
uv run pytest tests/contracts/ -v

# 集成测试
uv run pytest tests/integration/ -v

# 覆盖率报告
uv run pytest --cov=app --cov-report=html
```

## 代码质量

```bash
# 代码检查
uv run ruff check app/ tests/

# 代码格式化
uv run ruff format app/ tests/

# 类型检查
uv run mypy app/
```

## 环境变量

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

关键配置项：
- `DATABASE_URL` - PostgreSQL 连接字符串
- `REDIS_URL` - Redis 连接字符串
- `S3_ENDPOINT` - S3 兼容存储端点
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` - 存储访问凭证

## 核心契约

系统使用版本化的 Pydantic 契约进行四角色协作：

- **TaskContract** - 任务约束与交付物
- **ExecutionPlan** - DAG 步骤依赖
- **DesignSpec** - 视觉设计规范
- **QualityReport** - 质检结果
- **MultiModalContext** - 多模态输入协议
- **ToolResult** - 工具调用记录
- **ArtifactVersion** - 不可变资源版本

契约 schema_version 当前为 `0.2`。

## 许可证

待定 - 本项目独立立项，不继承其他项目许可证。
