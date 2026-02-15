#!/bin/bash
# 数据流转检查脚本
# 检查所有关键API端点的数据流转是否正常

set -e

echo "🔍 Embodied Pulse - 数据流转检查"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"
BASE_URL="${API_URL}/api"

# 检查计数器
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local need_auth=${5:-false}
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "测试 $description ... "
    
    local cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ "$need_auth" = "true" ]; then
        # 尝试从localStorage获取token（这里简化处理，实际应该从浏览器获取）
        cmd="$cmd -H 'Authorization: Bearer test-token'"
    fi
    
    if [ -n "$data" ]; then
        cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # 转义URL中的特殊字符
    local escaped_endpoint=$(printf '%s' "$endpoint" | sed "s/'/\\\\'/g")
    cmd="$cmd '$BASE_URL$escaped_endpoint'"
    
    local response=$(eval $cmd 2>/dev/null || echo -e "\n000")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    # 检查HTTP状态码
    # 200/201: 成功
    # 401/403: 对于需要认证的端点或登录失败是正常响应
    # 400: 对于登录API，错误的凭证返回400也是正常的
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓${NC}"
        PASSED=$((PASSED + 1))
        return 0
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        # 401/403 对于需要认证的端点或登录失败是正常响应
        if [ "$need_auth" = "true" ] || [ "$endpoint" = "/auth/login" ] || [ "$endpoint" = "/auth/admin/login" ]; then
            echo -e "${GREEN}✓${NC} (响应正常: HTTP $http_code)"
            PASSED=$((PASSED + 1))
            return 0
        fi
    elif [ "$http_code" = "400" ]; then
        # 400 对于登录API，错误的凭证返回400也是正常的
        if [ "$endpoint" = "/auth/login" ] || [ "$endpoint" = "/auth/admin/login" ]; then
            echo -e "${GREEN}✓${NC} (响应正常: HTTP $http_code)"
            PASSED=$((PASSED + 1))
            return 0
        fi
    fi
    
    echo -e "${RED}✗${NC} (HTTP $http_code)"
    FAILED=$((FAILED + 1))
    return 1
}

# 检查服务是否运行
echo -e "${BLUE}1. 检查服务状态${NC}"
echo "----------------------------------------"

if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务运行正常${NC}"
else
    echo -e "${RED}✗ 后端服务未运行或无法访问${NC}"
    echo "请确保后端服务已启动: cd backend && npm run dev"
    exit 1
fi

if curl -s "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务运行正常${NC}"
else
    echo -e "${YELLOW}⚠ 前端服务可能未完全启动${NC}"
fi

echo ""
echo -e "${BLUE}2. 检查用户端API端点${NC}"
echo "----------------------------------------"

# 用户端公开API
test_endpoint "GET" "/stats/content" "统计数据API"
test_endpoint "GET" "/banners" "Banner列表API"
test_endpoint "GET" "/announcements/active" "活跃公告API"
test_endpoint "GET" "/home-modules" "首页模块API"
test_endpoint "GET" "/papers?page=1&size=5" "论文列表API"
test_endpoint "GET" "/videos?page=1&size=5" "视频列表API"
test_endpoint "GET" "/repos?page=1&size=5" "GitHub项目列表API"
test_endpoint "GET" "/jobs?page=1&size=5" "岗位列表API"
test_endpoint "GET" "/huggingface?page=1&size=5" "HuggingFace模型列表API"
test_endpoint "GET" "/posts?page=1&size=5" "社区帖子列表API"
test_endpoint "GET" "/search?q=test&type=all" "搜索API"

echo ""
echo -e "${BLUE}3. 检查认证API端点${NC}"
echo "----------------------------------------"

# 认证API（不需要token）
test_endpoint "POST" "/auth/login" "用户登录API" '{"email":"test@test.com","password":"test"}' false
test_endpoint "POST" "/auth/admin/login" "管理员登录API" '{"email":"admin@test.com","password":"test"}' false

echo ""
echo -e "${BLUE}4. 检查管理端API端点${NC}"
echo "----------------------------------------"

# 管理端API（需要认证，但我们可以检查端点是否存在）
test_endpoint "GET" "/admin/me" "管理员信息API" "" true
test_endpoint "GET" "/admin/users" "用户管理API" "" true
test_endpoint "GET" "/admin/stats" "管理端统计数据API" "" true

echo ""
echo -e "${BLUE}5. 检查数据同步API端点${NC}"
echo "----------------------------------------"

# 数据同步API（需要管理员权限）
test_endpoint "GET" "/admin/sync/status" "同步状态API" "" true
test_endpoint "GET" "/admin/data-sources" "数据源列表API" "" true

echo ""
echo -e "${BLUE}6. 检查订阅API端点${NC}"
echo "----------------------------------------"

test_endpoint "GET" "/subscriptions" "订阅列表API" "" true

echo ""
echo "=================================="
echo -e "${BLUE}测试结果汇总${NC}"
echo "=================================="
echo "总测试数: $TOTAL"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 所有数据流转检查通过！${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  部分测试失败，请检查相关服务${NC}"
    exit 1
fi
