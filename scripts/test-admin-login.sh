#!/bin/bash

# 管理端登录流程测试脚本

echo "=========================================="
echo "管理端登录流程测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
API_URL="http://localhost:3001"
ADMIN_EMAIL="admin@embodiedpulse.com"
ADMIN_PASSWORD="admin123"

echo "📋 测试配置:"
echo "  API URL: $API_URL"
echo "  管理员邮箱: $ADMIN_EMAIL"
echo ""

# 测试1: 检查后端服务是否运行
echo "1️⃣  检查后端服务..."
if curl -s "$API_URL/health" > /dev/null 2>&1 || curl -s "$API_URL/api/v1/health" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} 后端服务运行正常"
else
    echo -e "   ${RED}✗${NC} 后端服务未运行，请先启动后端服务"
    echo "   启动命令: cd backend && npm run dev"
    exit 1
fi
echo ""

# 测试2: 测试管理员登录API
echo "2️⃣  测试管理员登录API..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q '"code":0'; then
    echo -e "   ${GREEN}✓${NC} 登录API调用成功"
    
    # 提取token
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('token', ''))" 2>/dev/null)
    
    if [ -z "$TOKEN" ]; then
        # 尝试使用jq
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
    fi
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "   ${GREEN}✓${NC} Token获取成功 (长度: ${#TOKEN})"
        echo "   Token前缀: ${TOKEN:0:20}..."
    else
        echo -e "   ${YELLOW}⚠${NC} 无法提取Token，但登录响应正常"
        echo "   响应: $LOGIN_RESPONSE"
    fi
else
    echo -e "   ${RED}✗${NC} 登录API调用失败"
    echo "   响应: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 测试3: 使用Token访问管理端API
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "3️⃣  测试Token认证..."
    
    # 测试获取用户信息
    ME_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/auth/me" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q '"code":0'; then
        echo -e "   ${GREEN}✓${NC} Token认证成功"
        
        # 提取用户信息
        USER_EMAIL=$(echo "$ME_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('email', ''))" 2>/dev/null)
        if [ -z "$USER_EMAIL" ]; then
            USER_EMAIL=$(echo "$ME_RESPONSE" | jq -r '.data.email' 2>/dev/null)
        fi
        
        if [ -n "$USER_EMAIL" ]; then
            echo "   用户邮箱: $USER_EMAIL"
        fi
    else
        echo -e "   ${RED}✗${NC} Token认证失败"
        echo "   响应: $ME_RESPONSE"
    fi
    echo ""
    
    # 测试访问管理端统计API
    echo "4️⃣  测试管理端统计API..."
    STATS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/admin/stats" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$STATS_RESPONSE" | grep -q '"code":0'; then
        echo -e "   ${GREEN}✓${NC} 管理端API访问成功"
    else
        echo -e "   ${YELLOW}⚠${NC} 管理端API访问失败（可能是权限问题）"
        echo "   响应: $STATS_RESPONSE"
    fi
    echo ""
fi

# 测试4: 测试错误情况
echo "5️⃣  测试错误情况..."

# 测试错误密码
echo "   测试错误密码..."
ERROR_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong_password\"}")

if echo "$ERROR_RESPONSE" | grep -q '"code":1002'; then
    echo -e "   ${GREEN}✓${NC} 错误密码正确返回错误码"
else
    echo -e "   ${YELLOW}⚠${NC} 错误密码处理可能有问题"
    echo "   响应: $ERROR_RESPONSE"
fi
echo ""

# 测试缺少字段
echo "   测试缺少字段..."
MISSING_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}")

if echo "$MISSING_RESPONSE" | grep -q '"code":1001'; then
    echo -e "   ${GREEN}✓${NC} 缺少字段正确返回错误码"
else
    echo -e "   ${YELLOW}⚠${NC} 缺少字段处理可能有问题"
    echo "   响应: $MISSING_RESPONSE"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}测试完成!${NC}"
echo "=========================================="
echo ""
echo "📝 下一步:"
echo "  1. 打开浏览器访问: http://localhost:3000/admin/login"
echo "  2. 使用以下账号登录:"
echo "     邮箱: $ADMIN_EMAIL"
echo "     密码: $ADMIN_PASSWORD"
echo "  3. 检查是否能成功登录并跳转到管理端首页"
echo ""
