#!/bin/bash
# 重启前端服务脚本

echo "🔄 正在重启前端服务..."

cd "$(dirname "$0")/../frontend"

# 查找并停止现有的前端服务
echo "📋 查找运行中的前端服务..."
FRONTEND_PIDS=$(ps aux | grep -E "next-server|next dev" | grep -v grep | awk '{print $2}')

if [ -n "$FRONTEND_PIDS" ]; then
    echo "🛑 停止现有前端服务 (PIDs: $FRONTEND_PIDS)..."
    echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ 前端服务已停止"
else
    echo "ℹ️  没有运行中的前端服务"
fi

# 清理构建缓存
echo "🧹 清理构建缓存..."
rm -rf .next
echo "✅ 构建缓存已清理"

# 验证配置
echo ""
echo "📋 验证配置:"
if grep -q "NEXT_PUBLIC_API_URL=http://localhost:3001" .env.local; then
    echo "✅ API配置正确: http://localhost:3001"
else
    echo "❌ API配置错误，请检查 .env.local"
    exit 1
fi

# 启动前端服务
echo ""
echo "🚀 启动前端服务..."
npm run dev
