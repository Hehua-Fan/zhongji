#!/bin/bash
set -e

echo "🚀 启动智能生产管理系统..."
echo "📦 前端: http://localhost:$NEXT_PORT"
echo "🔧 后端: http://localhost:$PORT"
echo ""

# 启动后端服务
cd /app/backend && python start.py &
BACKEND_PID=$!
echo "⚙️  后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端服务
cd /app/frontend && npm start &
FRONTEND_PID=$!
echo "🎨 前端服务已启动 (PID: $FRONTEND_PID)"

# 优雅关闭处理
cleanup() {
    echo "🛑 正在停止服务..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ 服务已停止"
    exit 0
}

trap cleanup SIGTERM SIGINT

# 等待服务
wait 