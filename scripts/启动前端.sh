#!/bin/bash

# 启动前端服务脚本

echo "🚀 启动前端开发服务器..."
echo ""

cd "$(dirname "$0")/../frontend"

# 检查端口是否被占用
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  端口3000已被占用"
    PID=$(lsof -ti:3000 | head -1)
    echo "   进程ID: $PID"
    read -p "   是否停止该进程并重新启动? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID 2>/dev/null
        sleep 2
        echo "✅ 已停止旧进程"
    else
        echo "❌ 取消启动"
        exit 1
    fi
fi

# 检查后端服务是否运行
echo "📡 检查后端服务..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常 (http://localhost:3001)"
else
    echo "⚠️  后端服务未运行，前端可能无法正常工作"
    echo "   请先启动后端服务: cd backend && npm run dev"
fi

echo ""

# 清理缓存
echo "🧹 清理构建缓存..."
rm -rf .next
echo "✅ 缓存已清理"

echo ""

# 检查环境变量
if [ ! -f .env.local ]; then
    echo "⚠️  未找到 .env.local 文件，创建默认配置..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
    echo "✅ 已创建 .env.local"
fi

echo ""

# 启动前端服务
echo "🎨 启动前端服务 (端口 3000)..."
echo ""
echo "访问地址："
echo "  - 用户端: http://localhost:3000"
echo "  - 管理端: http://localhost:3000/admin/login"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev
