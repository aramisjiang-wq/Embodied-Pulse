#!/bin/bash

# 修复前端服务

echo "=========================================="
echo "修复前端服务"
echo "=========================================="
echo ""

cd frontend

echo "1️⃣  清理 Next.js 缓存..."
rm -rf .next
echo "   ✓ 缓存已清理"
echo ""

echo "2️⃣  检查前端服务进程..."
if lsof -ti :3000 > /dev/null 2>&1; then
    PID=$(lsof -ti :3000 | head -1)
    echo "   发现运行中的前端服务 (PID: $PID)"
    echo "   请手动停止前端服务 (Ctrl+C 或 kill $PID)"
    echo ""
    echo "   然后运行: cd frontend && npm run dev"
else
    echo "   ✓ 前端服务未运行"
    echo ""
    echo "3️⃣  启动前端服务..."
    echo "   正在启动..."
    npm run dev
fi

echo ""
echo "=========================================="
echo "修复完成！"
echo "=========================================="
