#!/bin/bash

# 项目初始化脚本
# 自动安装前后端依赖

echo "🚀 开始初始化 Embodied Pulse 项目..."

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js版本过低,需要 >= 20.x"
  exit 1
fi
echo "✓ Node.js版本检查通过: $(node -v)"

# 安装后端依赖
echo ""
echo "📦 安装后端依赖..."
cd backend
npm install
if [ $? -ne 0 ]; then
  echo "❌ 后端依赖安装失败"
  exit 1
fi
echo "✓ 后端依赖安装完成"

# 安装前端依赖
echo ""
echo "📦 安装前端依赖..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
  echo "❌ 前端依赖安装失败"
  exit 1
fi
echo "✓ 前端依赖安装完成"

cd ..

echo ""
echo "✅ 项目初始化完成!"
echo ""
echo "📝 下一步操作:"
echo "1. 启动数据库服务: docker-compose up -d"
echo "2. 初始化数据库: cd backend && npm run db:migrate"
echo "3. 生成Prisma Client: npm run db:generate"
echo "4. (可选)导入种子数据: npm run db:seed"
echo "5. 启动后端: npm run dev"
echo "6. 启动前端: cd ../frontend && npm run dev"
