# ────────────────────────────────────────────────────────────────
# Multi‑stage Dockerfile  ‑  智能生产管理系统
#   • Stage 1  ➜  Build & optimize Next.js frontend (Node 18‑alpine)
#   • Stage 2  ➜  Run FastAPI backend + Next.js production server
# ────────────────────────────────────────────────────────────────

###############################
# 1️⃣  Frontend Build Stage   #
###############################
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app/frontend

# 复制package文件并安装依赖
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps --only=production

# 复制源代码
COPY frontend/ ./

# 构建生产版本
RUN npm run build

###############################
# 2️⃣  Production Runtime     #
###############################
FROM python:3.11 AS production

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PORT=8000 \
    NEXT_PORT=3000

# 安装系统依赖和Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    bash \
    make \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制构建好的前端文件
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /app/frontend/next.config.* ./frontend/

# 复制前端的必要文件
COPY frontend/components.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/next-env.d.ts ./frontend/

# 安装前端生产依赖
WORKDIR /app/frontend
RUN npm ci --only=production && npm cache clean --force

# 返回应用根目录
WORKDIR /app

# 复制后端代码和依赖文件
COPY backend/ ./backend/
COPY Makefile ./

# 安装Python依赖
RUN pip install --no-cache-dir -r backend/requirements.txt

# 复制启动脚本
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# 暴露端口
EXPOSE 3000 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 && curl -f http://localhost:8000/health || exit 1

# 启动服务
CMD ["./start.sh"] 