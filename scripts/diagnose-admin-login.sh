#!/bin/bash

# 管理端登录诊断脚本

echo "=========================================="
echo "管理端登录诊断"
echo "=========================================="
echo ""

API_URL="http://localhost:3001"
ADMIN_EMAIL="admin@embodiedpulse.com"
ADMIN_PASSWORD="admin123"

# 1. 测试登录并获取Token
echo "1️⃣  测试登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "登录响应:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# 提取Token和用户ID
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('token', ''))" 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
    USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id' 2>/dev/null)
fi

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✓ Token获取成功"
    echo "  Token长度: ${#TOKEN}"
    echo "  Token前缀: ${TOKEN:0:30}..."
    echo "  用户ID: $USER_ID"
    echo ""
    
    # 2. 测试Token认证
    echo "2️⃣  测试Token认证 (/api/v1/auth/me)..."
    ME_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/auth/me" \
      -H "Authorization: Bearer $TOKEN" \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$ME_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    ME_BODY=$(echo "$ME_RESPONSE" | grep -v "HTTP_CODE")
    
    echo "HTTP状态码: $HTTP_CODE"
    echo "响应内容:"
    echo "$ME_BODY" | python3 -m json.tool 2>/dev/null || echo "$ME_BODY"
    echo ""
    
    # 3. 测试管理端API
    echo "3️⃣  测试管理端API (/api/v1/admin/stats)..."
    STATS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/admin/stats" \
      -H "Authorization: Bearer $TOKEN" \
      -w "\nHTTP_CODE:%{http_code}")
    
    STATS_HTTP_CODE=$(echo "$STATS_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    STATS_BODY=$(echo "$STATS_RESPONSE" | grep -v "HTTP_CODE")
    
    echo "HTTP状态码: $STATS_HTTP_CODE"
    echo "响应内容:"
    echo "$STATS_BODY" | python3 -m json.tool 2>/dev/null || echo "$STATS_BODY"
    echo ""
    
    # 4. 解码Token查看内容（如果安装了jwt-cli）
    if command -v jwt &> /dev/null; then
        echo "4️⃣  解码Token查看内容..."
        echo "$TOKEN" | jwt decode -
        echo ""
    else
        echo "4️⃣  跳过Token解码（需要安装jwt-cli: npm install -g jwt-cli）"
        echo ""
    fi
    
else
    echo "✗ 无法获取Token"
    exit 1
fi

echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "📝 检查要点:"
echo "  1. Token是否正确生成"
echo "  2. 用户ID是否与数据库中的管理员ID匹配"
echo "  3. 认证中间件是否能找到管理员"
echo "  4. 后端日志中是否有错误信息"
echo ""
