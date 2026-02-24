#!/bin/bash

echo "========================================"
echo "完整认证流程测试"
echo "========================================"

# 1. 登录获取 token
echo ""
echo "[步骤1] 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123456"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取 token"
  exit 1
fi

echo ""
echo "✅ 登录成功！"
echo "Token: ${TOKEN:0:50}..."

# 2. 测试 favorites API
echo ""
echo "[步骤2] 测试 /favorites API..."
FAVORITES_RESPONSE=$(curl -s http://localhost:3001/api/v1/favorites?page=1\&size=10 \
  -H "Authorization: Bearer $TOKEN")
echo "$FAVORITES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FAVORITES_RESPONSE"

# 3. 测试 notifications API
echo ""
echo "[步骤3] 测试 /notifications/unread-count API..."
NOTIFICATIONS_RESPONSE=$(curl -s http://localhost:3001/api/v1/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN")
echo "$NOTIFICATIONS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$NOTIFICATIONS_RESPONSE"

# 4. 测试 subscriptions API
echo ""
echo "[步骤4] 测试 /subscriptions API..."
SUBSCRIPTIONS_RESPONSE=$(curl -s http://localhost:3001/api/v1/subscriptions?page=1\&size=10 \
  -H "Authorization: Bearer $TOKEN")
echo "$SUBSCRIPTIONS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SUBSCRIPTIONS_RESPONSE"

# 5. 测试 auth/me API
echo ""
echo "[步骤5] 测试 /auth/me API..."
ME_RESPONSE=$(curl -s http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN")
echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ME_RESPONSE"

echo ""
echo "========================================"
echo "后端 API 测试完成"
echo "========================================"
echo ""
echo "现在请手动测试前端："
echo "1. 打开 http://localhost:3000/login"
echo "2. 使用 test@test.com / Test123456 登录"
echo "3. 观察浏览器控制台日志"
echo "4. 把日志复制给我"
