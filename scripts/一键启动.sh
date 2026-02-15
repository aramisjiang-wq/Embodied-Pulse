#!/bin/bash
# Embodied Pulse - 一键启动脚本
# 自动检查Docker并启动所有服务

echo "🚀 Embodied Pulse 一键启动脚本"
echo "================================"
echo ""

# 函数：检查Docker是否运行
check_docker() {
    docker ps >/dev/null 2>&1
    return $?
}

# 1. 检查Docker Desktop
echo "1️⃣  检查Docker Desktop..."
if check_docker; then
    echo "   ✓ Docker正在运行"
else
    echo "   ✗ Docker未运行，正在启动..."
    open -a Docker
    
    echo "   ⏳ 等待Docker启动（最多60秒）..."
    echo ""
    echo "   💡 提示：如果Docker弹出窗口："
    echo "      - 点击'Accept'接受服务条款"
    echo "      - 点击'Use recommended settings'"
    echo "      - 输入Mac密码授权"
    echo ""
    
    # 等待Docker启动
    for i in {1..20}; do
        sleep 3
        if check_docker; then
            echo "   ✓ Docker启动成功!"
            break
        else
            echo -ne "   ⏳ 等待中... ${i}/20\r"
        fi
        
        if [ $i -eq 20 ]; then
            echo ""
            echo "   ❌ Docker启动超时"
            echo ""
            echo "   请手动完成以下步骤："
            echo "   1. 查找屏幕右上角的Docker图标（蓝色鲸鱼）"
            echo "   2. 如有弹窗，完成授权步骤"
            echo "   3. 等待图标变为静止状态"
            echo "   4. 然后重新运行此脚本"
            exit 1
        fi
    done
fi

echo ""

# 2. 启动数据库服务
echo "2️⃣  启动数据库服务..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo "   ✓ 数据库服务启动成功"
    echo "   等待10秒让服务完全启动..."
    sleep 10
else
    echo "   ✗ 数据库服务启动失败"
    exit 1
fi

echo ""

# 3. 检查数据库状态
echo "3️⃣  检查数据库状态..."
docker compose ps

echo ""

# 4. 执行数据库迁移
echo "4️⃣  执行数据库迁移..."
cd backend

DATABASE_URL="postgresql://embodiedpulse:embodiedpulse123@localhost:5432/embodiedpulse" \
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "   ✓ 数据库迁移完成"
else
    echo "   ⚠️  数据库迁移失败（可能已经迁移过）"
fi

echo ""

# 5. 导入种子数据
echo "5️⃣  导入种子数据..."
DATABASE_URL="postgresql://embodiedpulse:embodiedpulse123@localhost:5432/embodiedpulse" \
npm run db:seed

if [ $? -eq 0 ]; then
    echo "   ✓ 种子数据导入完成"
else
    echo "   ⚠️  种子数据导入失败（可能已经存在数据）"
fi

cd ..

echo ""
echo "================================"
echo "✅ 初始化完成!"
echo ""
echo "现在请在两个终端窗口分别执行："
echo ""
echo "📍 终端1 - 启动后端:"
echo "cd backend"
echo "PORT=3001 NODE_ENV=development \\"
echo "DATABASE_URL=\"postgresql://embodiedpulse:embodiedpulse123@localhost:5432/embodiedpulse\" \\"
echo "JWT_SECRET=\"dev_secret_key_for_embodied_pulse_2026\" \\"
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
echo "测试账号："
echo "- 管理员: admin@embodiedpulse.com / admin123456"
echo "- 普通用户: testuser / password123"
