#!/bin/bash

# 修复 Next.js 开发服务器脚本
# 解决静态资源 404 问题

echo "🔧 修复 Next.js 开发服务器..."
echo ""

cd "$(dirname "$0")"

# 1. 停止所有占用 3000 端口的进程
echo "1️⃣  停止占用 3000 端口的进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ 已停止所有进程"
echo ""

# 2. 清理构建缓存
echo "2️⃣  清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ 缓存已清理"
echo ""

# 3. 检查 Tailwind CSS 配置
echo "3️⃣  检查 Tailwind CSS 配置..."
if [ ! -f "tailwind.config.js" ]; then
    echo "⚠️  tailwind.config.js 不存在"
fi
if [ ! -f "postcss.config.js" ]; then
    echo "⚠️  postcss.config.js 不存在"
fi
echo "✅ 配置检查完成"
echo ""

# 4. 启动开发服务器
echo "4️⃣  启动开发服务器..."
echo ""
echo "访问地址：http://localhost:3000"
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev
