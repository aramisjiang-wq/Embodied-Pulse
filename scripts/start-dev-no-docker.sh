#!/bin/bash
# 非Docker开发环境启动脚本
# 自动启动后端和前端服务

set -e

echo "🚀 Embodied Pulse - 非Docker开发环境启动"
echo "=========================================="
echo ""

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查PostgreSQL是否安装
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL未安装${NC}"
    echo ""
    echo "请先安装PostgreSQL："
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
    exit 1
fi

# 检查PostgreSQL是否运行
if ! pg_isready -q; then
    echo -e "${YELLOW}⚠️  PostgreSQL未运行，正在启动...${NC}"
    brew services start postgresql@15 2>/dev/null || {
        echo -e "${RED}❌ 无法自动启动PostgreSQL，请手动启动：${NC}"
        echo "  brew services start postgresql@15"
        exit 1
    }
    sleep 5
fi

# 检查Redis是否安装
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}❌ Redis未安装${NC}"
    echo ""
    echo "请先安装Redis："
    echo "  brew install redis"
    echo "  brew services start redis"
    exit 1
fi

# 检查Redis是否运行
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis未运行，正在启动...${NC}"
    brew services start redis 2>/dev/null || {
        echo -e "${RED}❌ 无法自动启动Redis，请手动启动：${NC}"
        echo "  brew services start redis"
        exit 1
    }
    sleep 3
fi

echo -e "${GREEN}✓ PostgreSQL和Redis已就绪${NC}"
echo ""

# 创建数据库（如果不存在）
echo "检查数据库..."
DB_NAME="embodiedpulse"
DB_EXISTS=$(psql -U "$USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo "创建数据库 $DB_NAME..."
    psql -U "$USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  数据库可能已存在或创建失败${NC}"
    }
else
    echo -e "${GREEN}✓ 数据库已存在${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ 环境准备完成！${NC}"
echo ""

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm未安装${NC}"
    exit 1
fi

# 设置环境变量
export PORT=3001
export NODE_ENV=development
export DATABASE_URL="postgresql://$USER@localhost:5432/$DB_NAME"
export JWT_SECRET="dev_secret_key_for_embodied_pulse_2026"
export REDIS_URL="redis://localhost:6379"
export NEXT_PUBLIC_API_URL="http://localhost:3001"

# 检查依赖是否安装
echo "检查依赖..."
if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd "$PROJECT_ROOT/backend"
    npm install
fi

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd "$PROJECT_ROOT/frontend"
    npm install
fi

echo ""
echo "================================"
echo "启动服务..."
echo ""

# 创建日志目录
mkdir -p "$PROJECT_ROOT/logs"

# 清理函数
cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo "服务已停止"
    exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 启动后端
echo -e "${GREEN}启动后端服务 (端口 3001)...${NC}"
cd "$PROJECT_ROOT/backend"
npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# 等待后端启动
echo "等待后端服务启动..."
sleep 5

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ 后端启动失败，请查看日志: logs/backend.log${NC}"
    exit 1
fi

# 检查后端健康状态
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 后端服务已启动${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  后端服务可能未完全启动，但继续启动前端...${NC}"
    fi
    sleep 1
done

# 启动前端
echo -e "${GREEN}启动前端服务 (端口 3000)...${NC}"
cd "$PROJECT_ROOT/frontend"
npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
echo "等待前端服务启动..."
sleep 8

# 检查前端是否启动成功
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ 前端启动失败，请查看日志: logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ 所有服务已启动！${NC}"
echo ""
echo "访问地址："
echo -e "  ${GREEN}用户端:${NC} http://localhost:3000"
echo -e "  ${GREEN}管理端:${NC} http://localhost:3000/admin/login"
echo ""
echo "日志文件："
echo "  后端: $PROJECT_ROOT/logs/backend.log"
echo "  前端: $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait
