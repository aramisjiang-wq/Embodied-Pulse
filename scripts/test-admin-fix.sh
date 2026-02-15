#!/bin/bash

# 测试管理端登录修复

echo "=========================================="
echo "测试管理端登录修复"
echo "=========================================="
echo ""

API_URL="http://localhost:3001"
ADMIN_EMAIL="admin@embodiedpulse.com"
ADMIN_PASSWORD="admin123"

# 1. 登录获取Token
echo "1️⃣  登录获取Token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('token', ''))" 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('id', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
    USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id' 2>/dev/null)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ 登录失败"
    exit 1
fi

echo "✓ Token获取成功"
echo "  用户ID: $USER_ID"
echo ""

# 2. 测试 /api/v1/auth/me
echo "2️⃣  测试 /api/v1/auth/me..."
ME_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$API_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$ME_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
ME_BODY=$(echo "$ME_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ /api/v1/auth/me 成功"
    echo "$ME_BODY" | python3 -m json.tool 2>/dev/null | head -10
else
    echo "❌ /api/v1/auth/me 失败 (HTTP $HTTP_CODE)"
    echo "$ME_BODY" | python3 -m json.tool 2>/dev/null || echo "$ME_BODY"
fi
echo ""

# 3. 测试 /api/v1/admin/stats
echo "3️⃣  测试 /api/v1/admin/stats..."
STATS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$API_URL/api/v1/admin/stats" \
  -H "Authorization: Bearer $TOKEN")

STATS_HTTP_CODE=$(echo "$STATS_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
STATS_BODY=$(echo "$STATS_RESPONSE" | grep -v "HTTP_CODE")

if [ "$STATS_HTTP_CODE" = "200" ]; then
    echo "✓ /api/v1/admin/stats 成功"
    echo "$STATS_BODY" | python3 -m json.tool 2>/dev/null | head -10
else
    echo "❌ /api/v1/admin/stats 失败 (HTTP $STATS_HTTP_CODE)"
    echo "$STATS_BODY" | python3 -m json.tool 2>/dev/null || echo "$STATS_BODY"
fi
echo ""

echo "=========================================="
if [ "$HTTP_CODE" = "200" ] && [ "$STATS_HTTP_CODE" = "200" ]; then
    echo "✅ 所有测试通过！"
else
    echo "⚠️  部分测试失败，请检查后端日志"
fi
echo "=========================================="
