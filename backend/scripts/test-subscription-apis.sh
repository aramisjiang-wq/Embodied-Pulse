#!/bin/bash

# 订阅管理系统API测试脚本
# 用法: ./test-subscription-apis.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 订阅管理系统API测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 登录获取Token
echo "1️⃣ 登录管理员账号..."
TOKEN=$(curl -s -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@embodied.ai","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 2. 测试订阅统计
echo "2️⃣ 测试订阅统计API..."
curl -s -X GET "http://localhost:3001/api/v1/admin/subscriptions/stats" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['code'] == 0:
    stats = d['data']
    print('✅ 订阅统计成功')
    print(f'   总订阅: {stats[\"total\"]}')
    print(f'   活跃: {stats[\"active\"]}')
    print(f'   同步启用: {stats[\"syncEnabled\"]}')
    print(f'   24h同步: {stats[\"last24h\"][\"syncCount\"]}次')
else:
    print(f'❌ 失败: {d.get(\"message\")}')"
echo ""

# 3. 测试获取订阅列表
echo "3️⃣ 测试获取订阅列表..."
curl -s -X GET "http://localhost:3001/api/v1/admin/subscriptions?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['code'] == 0:
    items = d['data']['items']
    print(f'✅ 获取列表成功，共{len(items)}条')
    for i, item in enumerate(items[:3], 1):
        print(f'   {i}. {item[\"contentType\"]} - {item[\"user\"][\"username\"]} - 同步开关: {item[\"syncEnabled\"]}')
else:
    print(f'❌ 失败: {d.get(\"message\")}')"
echo ""

# 4. 测试数据流动监控
echo "4️⃣ 测试数据流动监控..."
curl -s -X GET "http://localhost:3001/api/v1/admin/subscriptions/monitor" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['code'] == 0:
    summary = d['data']['summary']
    print('✅ 监控数据获取成功')
    print(f'   1小时内同步: {summary[\"totalSyncs\"]}次')
    print(f'   总匹配: {summary[\"totalMatched\"]}条')
    print(f'   新增: {summary[\"totalNew\"]}条')
else:
    print(f'❌ 失败: {d.get(\"message\")}')"
echo ""

# 5. 测试批量切换开关（先获取一个订阅ID）
echo "5️⃣ 测试批量切换订阅开关..."
SUBSCRIPTION_ID=$(curl -s -X GET "http://localhost:3001/api/v1/admin/subscriptions?page=1&size=1" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['items'][0]['id'] if data['data']['items'] else '')")

if [ -n "$SUBSCRIPTION_ID" ]; then
  curl -s -X POST "http://localhost:3001/api/v1/admin/subscriptions/toggle-batch" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"ids\":[\"$SUBSCRIPTION_ID\"],\"syncEnabled\":true}" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['code'] == 0:
    print(f'✅ 批量切换成功，已更新{d[\"data\"][\"updated\"]}个订阅')
else:
    print(f'❌ 失败: {d.get(\"message\")}')"
else
  echo "⚠️ 无订阅数据，跳过测试"
fi
echo ""

# 6. 测试手动同步（如果有订阅ID）
if [ -n "$SUBSCRIPTION_ID" ]; then
  echo "6️⃣ 测试手动同步..."
  curl -s -X POST "http://localhost:3001/api/v1/admin/subscriptions/$SUBSCRIPTION_ID/sync" \
    -H "Authorization: Bearer $TOKEN" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['code'] == 0:
    result = d['data']
    print('✅ 手动同步成功')
    print(f'   匹配: {result[\"matchedCount\"]}条')
    print(f'   新增: {result[\"newCount\"]}条')
    print(f'   耗时: {result[\"duration\"]}ms')
else:
    print(f'❌ 失败: {d.get(\"message\")}')"
  echo ""
fi

# 7. 测试获取趋势（如果有订阅ID）
if [ -n "$SUBSCRIPTION_ID" ]; then
  echo "7️⃣ 测试获取订阅趋势..."
  curl -s -X GET "http://localhost:3001/api/v1/admin/subscriptions/$SUBSCRIPTION_ID/trends?days=7" \
    -H "Authorization: Bearer $TOKEN" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['code'] == 0:
    summary = d['data']['summary']
    print('✅ 趋势数据获取成功')
    print(f'   总同步: {summary[\"totalSyncs\"]}次')
    print(f'   总匹配: {summary[\"totalMatched\"]}条')
    print(f'   成功率: {summary[\"successRate\"]}%')
else:
    print(f'❌ 失败: {d.get(\"message\")}')"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 所有测试完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
