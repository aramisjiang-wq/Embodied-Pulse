#!/bin/bash
# 不使用Docker的启动脚本
# 适用于Docker Desktop无法正常工作的场景

echo "🚀 Embodied Pulse - 不使用Docker的启动方式"
echo "=========================================="
echo ""
echo "⚠️  注意：此方式需要本地安装PostgreSQL和Redis"
echo ""

# 检查PostgreSQL是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL未安装"
    echo ""
    echo "请先安装PostgreSQL："
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
    echo ""
    echo "或者使用Docker修复后启动："
    echo "  ./scripts/fix-docker.sh"
    exit 1
fi

# 检查PostgreSQL是否运行
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL未运行，正在启动..."
    brew services start postgresql@15 2>/dev/null || echo "请手动启动PostgreSQL"
    sleep 5
fi

# 检查Redis是否安装
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis未安装"
    echo ""
    echo "请先安装Redis："
    echo "  brew install redis"
    echo "  brew services start redis"
    echo ""
    exit 1
fi

# 检查Redis是否运行
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis未运行，正在启动..."
    brew services start redis 2>/dev/null || echo "请手动启动Redis"
    sleep 3
fi

echo "✓ PostgreSQL和Redis已就绪"
echo ""

# 创建数据库（如果不存在）
echo "检查数据库..."
psql -U $USER -d postgres -c "SELECT 1 FROM pg_database WHERE datname='embodiedpulse'" | grep -q 1 || \
psql -U $USER -d postgres -c "CREATE DATABASE embodiedpulse;" 2>/dev/null

echo ""
echo "================================"
echo "✅ 环境准备完成！"
echo ""
echo "现在请在两个终端窗口分别执行："
echo ""
echo "📍 终端1 - 启动后端:"
echo "cd backend"
echo "PORT=3001 NODE_ENV=development \\"
echo "DATABASE_URL=\"postgresql://$USER@localhost:5432/embodiedpulse\" \\"
echo "JWT_SECRET=\"dev_secret_key_for_embodied_pulse_2026\" \\"
echo "REDIS_URL=\"redis://localhost:6379\" \\"
echo "npm run dev"
echo ""
echo "📍 终端2 - 启动前端:"
echo "cd frontend"
echo "NEXT_PUBLIC_API_URL=\"http://localhost:3001\" \\"
echo "npm run dev"
echo ""
echo "访问地址："
echo "- 用户端: http://localhost:3000"
echo "- 管理端: http://localhost:3000/admin/login"
echo ""
