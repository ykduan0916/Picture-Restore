# Picture Restore 开发指南

## 🚀 快速启动

### 1. 启动基础设施

```bash
# 启动 PostgreSQL、Redis、MinIO
docker-compose up -d

# 查看服务状态
docker-compose ps
```

服务地址：
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001` (minioadmin/minioadmin)

### 2. 启动后端

```bash
cd backend

# 复制环境变量
cp .env.example .env

# 安装依赖
uv sync

# 运行测试
uv run pytest -v

# 启动 API 服务器
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8888
```

访问：
- API 根路径: http://localhost:8888
- API 文档: http://localhost:8888/docs
- 健康检查: http://localhost:8888/api/health

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问: http://localhost:5174

## 📁 项目结构

```
Picture_Renew/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── models.py            # 数据库模型
│   │   ├── api/
│   │   │   └── routes/          # API 路由
│   │   └── contracts/           # Pydantic 契约
│   ├── tests/                   # 单元测试
│   ├── pyproject.toml           # Python 依赖
│   └── .env.example             # 环境变量模板
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 主应用
│   │   ├── components/          # React 组件
│   │   └── main.tsx             # 入口
│   └── package.json             # Node.js 依赖
├── docs/                        # 设计文档
├── docker-compose.yml           # 基础设施配置
└── README.md                    # 项目说明
```

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

## 🔧 开发工具

- **代码格式化**: 
  - Python: `uv run black app tests`
  - TypeScript: `npm run format`
  
- **类型检查**:
  - Python: `uv run mypy app`
  - TypeScript: `npm run type-check`

## 📊 API 测试示例

```bash
# 健康检查
curl http://localhost:8888/api/health

# 创建任务
curl -X POST http://localhost:8888/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "sku_id": "TEST001",
    "product_name": "测试商品",
    "deliverables": ["white", "scene"]
  }'

# 查询任务
curl http://localhost:8888/api/jobs/job_TEST001
```

## 🐛 故障排查

### 端口已被占用

如果 8888 端口被占用，修改启动命令：
```bash
uv run uvicorn app.main:app --reload --port 9999
```

### Docker 服务无法启动

```bash
# 查看日志
docker-compose logs postgres

# 重启服务
docker-compose restart

# 完全重建
docker-compose down -v
docker-compose up -d
```

### 前端构建失败

```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

## 📚 相关文档

- [产品需求](../docs/01-product-requirements.md)
- [技术架构](../docs/03-technical-architecture.md)
- [迭代清单](../docs/07-first-iteration-backlog.md)
