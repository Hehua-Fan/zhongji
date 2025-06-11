# 智能生产管理系统 Makefile
# 用于启动前端和后端服务

.PHONY: help dev frontend backend stop clean install check kill-ports docker-build docker-up docker-down docker-logs prod

# 默认目标
help:
	@echo "智能生产管理系统 - 可用命令:"
	@echo ""
	@echo "🚀 开发环境:"
	@echo "  make dev        - 同时启动前端和后端服务"
	@echo "  make frontend   - 只启动前端服务 (localhost:3000)"
	@echo "  make backend    - 只启动后端服务 (localhost:8000)"
	@echo "  make stop       - 停止所有服务"
	@echo ""
	@echo "🐳 Docker 部署:"
	@echo "  make docker-build - 构建 Docker 镜像"
	@echo "  make docker-up    - 启动 Docker 容器"
	@echo "  make docker-down  - 停止 Docker 容器"
	@echo "  make docker-logs  - 查看 Docker 日志"
	@echo "  make prod         - 生产环境快速启动"
	@echo ""
	@echo "🔧 工具命令:"
	@echo "  make install    - 安装依赖"
	@echo "  make check      - 检查环境"
	@echo "  make clean      - 清理缓存和临时文件"
	@echo "  make kill-ports - 强制关闭占用的端口"
	@echo ""

# 同时启动前端和后端
dev:
	@echo "🚀 启动智能生产管理系统..."
	@echo "📦 前端: http://localhost:3000"
	@echo "🔧 后端: http://localhost:8000"
	@echo ""
	@make check
	@echo "正在启动服务..."
	@(make backend &) && (sleep 3 && make frontend)

# 启动前端
frontend:
	@echo "🎨 启动前端服务..."
	@cd frontend && npm run dev

# 启动后端
backend:
	@echo "⚙️  启动后端服务..."
	@cd backend && conda run -n zhongji python start.py

# 停止所有服务
stop:
	@echo "🛑 停止所有服务..."
	@pkill -f "npm run dev" || true
	@pkill -f "python start.py" || true
	@pkill -f "next-server" || true
	@echo "✅ 所有服务已停止"

# 强制关闭占用的端口
kill-ports:
	@echo "🔪 强制关闭占用的端口..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@echo "✅ 端口已释放"

# 安装依赖
install:
	@echo "📦 安装依赖..."
	@echo "安装前端依赖..."
	@cd frontend && npm install
	@echo "检查后端环境..."
	@conda info --envs | grep zhongji || (echo "❌ conda 环境 'zhongji' 不存在，请先创建" && exit 1)
	@echo "✅ 依赖安装完成"

# 检查环境
check:
	@echo "🔍 检查环境..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js 未安装" && exit 1)
	@command -v npm >/dev/null 2>&1 || (echo "❌ npm 未安装" && exit 1)
	@command -v conda >/dev/null 2>&1 || (echo "❌ conda 未安装" && exit 1)
	@conda info --envs | grep zhongji >/dev/null || (echo "❌ conda 环境 'zhongji' 不存在" && exit 1)
	@test -f frontend/package.json || (echo "❌ 前端项目不存在" && exit 1)
	@test -f backend/start.py || (echo "❌ 后端启动文件不存在" && exit 1)
	@echo "✅ 环境检查通过"

# 清理缓存和临时文件
clean:
	@echo "🧹 清理缓存和临时文件..."
	@cd frontend && rm -rf .next node_modules/.cache 2>/dev/null || true
	@cd backend && find . -name "*.pyc" -delete 2>/dev/null || true
	@cd backend && find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ 清理完成"

# 重启服务
restart: stop dev

# 查看日志 (需要服务在后台运行)
logs:
	@echo "📋 查看服务日志..."
	@echo "前端日志:"
	@tail -f frontend/npm-debug.log 2>/dev/null || echo "前端日志文件不存在"
	@echo "后端日志:"
	@tail -f backend/app.log 2>/dev/null || echo "后端日志文件不存在"

# 生产构建
build:
	@echo "🏗️  构建生产版本..."
	@cd frontend && npm run build
	@echo "✅ 构建完成"

# 运行测试
test:
	@echo "🧪 运行测试..."
	@cd frontend && npm test || true
	@cd backend && conda run -n zhongji python -m pytest || true

# 快速启动 (跳过检查)
quick:
	@echo "⚡ 快速启动 (跳过环境检查)..."
	@(cd backend && conda run -n zhongji python start.py &) && (sleep 2 && cd frontend && npm run dev)

# ====== Docker 命令 ======

# 构建 Docker 镜像
docker-build:
	@echo "🐳 构建 Docker 镜像..."
	@docker build -t zhongji-system:latest .
	@echo "✅ Docker 镜像构建完成"

# 启动 Docker 容器
docker-up:
	@echo "🚀 启动 Docker 容器..."
	@docker-compose up -d
	@echo "✅ 服务已启动"
	@echo "📦 前端: http://localhost:3000"
	@echo "🔧 后端: http://localhost:8000"

# 停止 Docker 容器
docker-down:
	@echo "🛑 停止 Docker 容器..."
	@docker-compose down
	@echo "✅ 容器已停止"

# 查看 Docker 日志
docker-logs:
	@echo "📋 查看 Docker 日志..."
	@docker-compose logs -f zhongji-app

# 重启 Docker 容器
docker-restart: docker-down docker-up

# 生产环境快速启动 (构建并启动)
prod: docker-build docker-up

# 完全清理 Docker 资源
docker-clean:
	@echo "🧹 清理 Docker 资源..."
	@docker-compose down --volumes --remove-orphans
	@docker system prune -f
	@echo "✅ Docker 资源清理完成"
