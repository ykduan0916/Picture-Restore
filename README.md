# Picture Renew

电商商品图与营销素材自动化生成系统。

## 快速开始

### 前置要求

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- uv (Python 包管理器)

### 启动基础设施

```bash
# 启动 PostgreSQL + Redis + MinIO
docker-compose up -d

# 检查服务状态
docker-compose ps
```

### 后端启动

```bash
cd backend

# 安装依赖（uv 会自动创建虚拟环境）
uv sync

# 运行测试
uv run pytest

# 启动 FastAPI 开发服务器
uv run uvicorn app.main:app --reload --port 8000
```

访问：
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问: http://localhost:5173

## 项目结构

```
Picture_Renew/
├── backend/
│   ├── app/
│   │   ├── domain/
│   │   │   └── contracts/      # 契约系统（已完成）
│   │   ├── api/                # FastAPI 路由
│   │   ├── services/           # 业务逻辑
│   │   ├── models/             # SQLAlchemy 模型
│   │   └── main.py             # FastAPI 应用入口
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.tsx
│   └── package.json
├── docs/                       # 项目文档
└── docker-compose.yml
```

## 开发进度

### ✅ S0 技术验证 - W-02 & W-03

- [x] 契约系统（7个核心契约 + 校验器）
- [x] 55个单元测试全部通过
- [x] Docker Compose 基础设施
- [ ] 数据库模型骨架
- [ ] FastAPI 基础 API
- [ ] React 前端骨架

### 🔲 S0 后续任务

- [ ] W-04: 假供应商闭环
- [ ] W-05: 保真验证
- [ ] W-06: 渲染导出
- [ ] W-07: 真实模型验证

## 技术栈

| 层 | 技术选择 |
|---|---|
| 前端 | React + TypeScript + Vite + react-konva |
| API | Python 3.12 + FastAPI + Pydantic |
| 数据库 | PostgreSQL + SQLAlchemy |
| 编排 | LangGraph + PostgreSQL checkpointer |
| 队列 | ARQ + Redis |
| 图像 | Pillow + OpenCV |
| 存储 | MinIO (S3兼容) |

## 文档

详细文档见 `docs/` 目录：
- [01-需求明确](docs/01-requirements.md)
- [02-核心契约](docs/02-core-contracts.md)
- [03-执行模型](docs/03-execution-model.md)
- [04-可靠性设计](docs/04-reliability-design.md)
- [05-保真策略](docs/05-fidelity-strategy.md)
- [06-技术验证清单](docs/06-tech-validation-checklist.md)
- [07-首轮执行清单](docs/07-first-iteration-backlog.md)

## License

Proprietary
