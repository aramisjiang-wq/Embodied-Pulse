#!/bin/bash

# 检查后端服务是否运行

echo "=========================================="
echo "检查后端服务状态"
echo "=========================================="
echo ""

API_URL="http://localhost:3001"

# 检查端口是否被占用
echo "1️⃣  检查端口 3001..."
if lsof -ti :3001 > /dev/null 2>&1; then
    echo "   ✓ 端口 3001 已被占用"
    PID=$(lsof -ti :3001 | head -1)
    echo "   进程ID: $PID"
    
    # 检查进程信息
    if ps -p $PID > /dev/null 2>&1; then
        echo "   进程状态: 运行中"
        ps -p $PID -o command= | head -1 | cut -c1-80
    else
        echo "   ⚠️  进程不存在"
    fi
else
    echo "   ✗ 端口 3001 未被占用"
    echo "   后端服务可能未运行"
fi
echo ""

# 检查API是否可访问
echo "2️⃣  检查API可访问性..."
if curl -s --connect-timeout 2 "$API_URL/health" > /dev/null 2>&1 || \
   curl -s --connect-timeout 2 "$API_URL/api/v1/health" > /dev/null 2>&1 || \
   curl -s --connect-timeout 2 "$API_URL/api/v1/stats" > /dev/null 2>&1; then
    echo "   ✓ API 可访问"
else
    echo "   ✗ API 不可访问"
    echo "   请检查后端服务是否已启动"
fi
echo ""

# 检查管理端API
echo "3️⃣  检查管理端API（需要Token）..."
# 这里不测试，因为需要Token
echo "   需要登录Token才能测试"
echo ""

echo "=========================================="
echo "建议操作："
echo "  1. 如果端口未被占用，启动后端服务："
echo "     cd backend && npm run dev"
echo ""
echo "  2. 如果端口被占用但API不可访问，检查："
echo "     - 后端服务是否正常启动"
echo "     - 是否有错误日志"
echo "     - 防火墙设置"
echo "=========================================="
