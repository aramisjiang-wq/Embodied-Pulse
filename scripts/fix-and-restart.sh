#!/bin/bash

# Embodied Pulse - 完整修复和重启脚本
# 解决Prisma Client未生成和404问题

echo "🚀 Embodied Pulse 完整修复脚本"
echo "================================"

# 停止所有Node进程
echo ""
echo "1️⃣  停止所有Node进程..."
killall node 2>/dev/null || true
sleep 2

# 设置文件监控限制
echo ""
echo "2️⃣  设置文件监控限制..."
ulimit -n 65536
echo "   ✓ ulimit设置为 65536"

# 清除前端缓存
echo ""
echo "3️⃣  清除前端缓存..."
cd frontend
rm -rf .next
echo "   ✓ .next缓存已清除"
cd ..

# 生成Prisma Client (关键!)
echo ""
echo "4️⃣  生成Prisma Client (修复数据库访问)..."
cd backend
npm run db:generate
if [ $? -eq 0 ]; then
  echo "   ✓ Prisma Client生成成功"
else
  echo "   ✗ Prisma Client生成失败"
  exit 1
fi
cd ..

# 检查Docker
echo ""
echo "5️⃣  检查数据库服务..."
docker compose ps | grep -q "Up" 2>/dev/null
if [ $? -ne 0 ]; then
  echo "   ⚠️  数据库未启动,正在启动..."
  docker compose up -d
  sleep 5
fi
echo "   ✓ 数据库服务正常"

echo ""
echo "================================"
echo "✅ 修复完成!"
echo ""
echo "请在两个终端窗口分别执行:"
echo ""
echo "📍 终端1 - 启动后端:"
echo "cd backend"
echo "PORT=3001 NODE_ENV=development DATABASE_URL=\"postgresql://embodiedpulse:embodiedpulse123@localhost:5432/embodiedpulse\" JWT_SECRET=\"dev_secret_key_for_embodied_pulse_2026\" npm run dev"
echo ""
echo "📍 终端2 - 启动前端:"
echo "cd frontend"
echo "NEXT_PUBLIC_API_URL=\"http://localhost:3001\" npm run dev"
echo ""
echo "或使用后台启动(不推荐,无法看到日志):"
echo "./scripts/start-dev.sh"
