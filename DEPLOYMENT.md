# 智能生产管理系统 - Docker 部署指南

## 🚀 快速开始

### 使用 Docker Compose (推荐)

```bash
# 1. 克隆项目
git clone <项目地址>
cd zhongji

# 2. 构建并启动服务
make prod

# 或者分步执行
make docker-build
make docker-up
```

### 使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t zhongji-system:latest .

# 2. 运行容器
docker run -d \
  --name zhongji-production-system \
  -p 3000:3000 \
  -p 8000:8000 \
  zhongji-system:latest
```

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `make prod` | 生产环境快速启动 (构建+启动) |
| `make docker-build` | 构建 Docker 镜像 |
| `make docker-up` | 启动 Docker 容器 |
| `make docker-down` | 停止 Docker 容器 |
| `make docker-logs` | 查看 Docker 日志 |
| `make docker-restart` | 重启 Docker 容器 |
| `make docker-clean` | 完全清理 Docker 资源 |

## 🌐 访问地址

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

## 🔧 配置说明

### 环境变量

在 `docker-compose.yml` 中可以配置以下环境变量：

```yaml
environment:
  - NODE_ENV=production          # Node.js 环境
  - PORT=8000                   # 后端端口
  - NEXT_PORT=3000             # 前端端口
  - PYTHONUNBUFFERED=1         # Python 输出不缓冲
```

### 端口映射

默认端口映射：
- 前端: `3000:3000`
- 后端: `8000:8000`

如需修改，请编辑 `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # 前端映射到 8080
  - "9000:8000"  # 后端映射到 9000
```

### 数据持久化

默认挂载 `./data` 目录用于数据持久化：

```yaml
volumes:
  - ./data:/app/data
```

## 🏗️ 构建优化

### 多阶段构建

Dockerfile 使用多阶段构建优化镜像大小：

1. **构建阶段**: 使用 `node:18-alpine` 构建前端
2. **运行阶段**: 使用 `python:3.11-slim` 运行服务

### .dockerignore

已配置 `.dockerignore` 排除不必要的文件：
- 开发环境文件 (`node_modules`, `.next`)
- 版本控制文件 (`.git`)
- 文档和资源文件

## 📊 监控和日志

### 健康检查

容器内置健康检查：
- 检查间隔: 30秒
- 超时时间: 10秒
- 重试次数: 3次
- 启动时间: 40秒

### 查看日志

```bash
# 实时查看日志
make docker-logs

# 或使用 docker-compose
docker-compose logs -f zhongji-app

# 查看最近 100 行日志
docker-compose logs --tail=100 zhongji-app
```

## 🛠️ 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :8000
   
   # 强制关闭端口
   make kill-ports
   ```

2. **构建失败**
   ```bash
   # 清理 Docker 缓存
   docker system prune -a
   
   # 重新构建
   make docker-build
   ```

3. **容器启动失败**
   ```bash
   # 查看容器状态
   docker-compose ps
   
   # 查看详细日志
   docker-compose logs zhongji-app
   ```

### 调试模式

如需调试，可以进入容器：

```bash
# 进入运行中的容器
docker-compose exec zhongji-app bash

# 或启动新的调试容器
docker run -it --rm zhongji-system:latest bash
```

## 🔄 更新部署

```bash
# 1. 停止现有服务
make docker-down

# 2. 重新构建镜像
make docker-build

# 3. 启动新版本
make docker-up

# 或一键更新
make docker-restart
```

## 📝 生产环境建议

1. **使用反向代理** (Nginx)
2. **配置 HTTPS**
3. **设置日志轮转**
4. **配置监控告警**
5. **定期备份数据**
6. **使用 Docker Swarm 或 Kubernetes** (集群部署)

## 📞 支持

如遇问题请查看：
- 项目 README
- 日志输出
- GitHub Issues 