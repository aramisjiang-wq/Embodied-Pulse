#!/bin/bash

# 开发环境启动脚本
# 同时启动前后端开发服务器

echo "🚀 启动 Embodied Pulse 开发环境..."

# 检查Docker服务是否运行
echo "检查数据库服务..."
docker-compose ps | grep -q "Up"
if [ $? -ne 0 ]; then
  echo "⚠️  数据库服务未启动,正在启动..."
  docker-compose up -d
  sleep 5
fi
echo "✓ 数据库服务正常"

# 启动后端(后台)
echo ""
echo "📡 启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端(前台)
echo ""
echo "🎨 启动前端服务..."
cd ../frontend
npm run dev

# Ctrl+C时清理
trap "kill $BACKEND_PID" EXIT
