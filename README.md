# Picture Restore

> 电商商品图与营销素材自动化生成系统  
> AI-Powered E-commerce Product Image Generation Platform

[![GitHub](https://img.shields.io/badge/GitHub-ykduan0916%2FPicture--Restore-blue?logo=github)](https://github.com/ykduan0916/Picture-Restore)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 项目概述

Picture Restore 是一个基于 AI 的商品图片自动化生成系统，能够将真实商品原图转换为白底图、场景图、促销图等多种营销素材。系统采用四 Agent 协作模式，确保商品主体保真的同时生成高质量背景和文案。

### 核心特性

- 🎨 **智能分层编辑** - 商品、背景、阴影、文字独立图层，支持蒙版修正
- 🔒 **商品保真处理** - 商品像素来自原图，不被 AI 模型重新解释
- 🤖 **四 Agent 协作** - 任务规划、视觉设计、修图执行、质量验收
- 📐 **契约驱动** - Pydantic 类型安全的任务约束与验收标准
- 🎭 **多模态能力** - 工具调用续接、双图理解、原图蒙版编辑

## 🏗️ 技术架构

### 后端

- **语言**: Python 3.12
- **框架**: FastAPI + Pydantic
- **编排**: LangGraph + PostgreSQL checkpointer
- **队列**: ARQ + Redis
- **数据库**: PostgreSQL + SQLAlchemy
- **图像**: Pillow + OpenCV
- **存储**: S3 兼容对象存储

### 前端

- **框架**: React 18 + TypeScript
- **构建**: Vite 6
- **UI**: Tailwind CSS + Lucide Icons
- **画布**: react-konva (图层编辑)
- **状态**: Zustand + TanStack Query

### 基础设施

- Docker Compose (PostgreSQL + Redis + MinIO)
- uv (Python 依赖管理)
- pytest (单元测试)

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.12+
- Docker & Docker Compose
- uv (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

### 启动开发环境

```bash
# 1. 克隆仓库
git clone https://github.com/ykduan0916/Picture-Restore.git
cd Picture-Restore

# 2. 启动基础设施
docker-compose up -d

# 3. 启动后端
cd backend
cp .env.example .env
uv sync
uv run pytest  # 运行测试
uv run uvicorn app.main:app --reload

# 4. 启动前端
cd ../frontend
npm install
npm run dev  # 访问 http://localhost:5174
```

## 📊 当前进度

### ✅ 已完成 (S0 技术验证)

- [x] **W-02**: 契约系统 - 7 个核心 Pydantic 模型 + 55 个测试
- [x] **W-03**: 项目骨架 - Docker Compose + 前端界面
- [x] **网关验证**: gpt-6.1-sol、claude-sonnet-5-5 工具续接通过
- [x] Code Review 1: 修复 10 个发现的问题

### 🔄 进行中

- [ ] **W-04**: 数据库模型 (Project、Asset、Job、Step)
- [ ] **W-05**: FastAPI 基础路由 + 健康检查
- [ ] **W-06**: 假供应商集成测试

### 📋 待开发

参见 [docs/07-first-iteration-backlog.md](docs/07-first-iteration-backlog.md)

## 📐 契约系统

系统采用 Pydantic 类型安全的契约协议，确保四 Agent 之间的交接清晰可验证：

| 契约 | 用途 | 核心字段 |
|------|------|----------|
| `TaskContract` | 任务约束与交付物 | 预算、风格、商品保护区 |
| `ExecutionPlan` | DAG 步骤依赖 | 环检测、并行校验 |
| `DesignSpec` | 视觉设计规范 | 颜色、布局、文字位置 |
| `QualityReport` | 质检结果 | 保真度、视觉一致性 |
| `ToolResult` | 工具调用记录 | 版本、蒙版、哈希 |

示例文档: [docs/contracts/](docs/contracts/)

## 🎨 前端界面

参考 [Canva](https://www.canva.com/design-school/resources/how-to-edit-flat-images-with-magic-layers/) 和 [Figma](https://www.figma.com/solutions/ai-image-editor/) 的设计模式：

- **左侧边栏**: 工作区导航与项目管理
- **中央画布**: react-konva 分层编辑
- **右侧面板**: 图层属性与设计参数
- **顶部工具栏**: 撤销/重做、缩放、导出

![前端界面](docs/screenshots/frontend.png)
*现代化的图层编辑界面*

## 🧪 测试

```bash
# 后端测试
cd backend
uv run pytest -v

# 契约测试
uv run pytest tests/contracts/ -v

# 覆盖率报告
uv run pytest --cov=app --cov-report=html
```

## 📚 文档

- [产品需求](docs/01-product-requirements.md)
- [Agent 编排](docs/02-agent-orchestration.md)
- [技术架构](docs/03-technical-architecture.md)
- [迭代路线](docs/04-iteration-roadmap.md)
- [模型选择](docs/08-model-selection.md)

## 🛠️ 开发规范

- **代码风格**: Black (Python), ESLint + Prettier (TypeScript)
- **提交规范**: Conventional Commits
- **分支策略**: GitFlow
- **Code Review**: 每个 PR 必须通过 /code-review skill

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🙏 致谢

参考项目：
- [Canva Magic Layers](https://www.canva.com/newsroom/news/magic-layers/)
- [Figma AI Image Editor](https://www.figma.com/solutions/ai-image-editor/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)

---

**开发者**: [ykduan0916](https://github.com/ykduan0916)  
**仓库**: https://github.com/ykduan0916/Picture-Restore
