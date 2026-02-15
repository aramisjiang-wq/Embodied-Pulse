#!/bin/bash

# Embodied Pulse 页面和API测试脚本

echo "=========================================="
echo "Embodied Pulse 页面和API测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 统计变量
TOTAL_PAGES=0
TOTAL_APIS=0
PASS_PAGES=0
FAIL_PAGES=0
PASS_APIS=0
FAIL_APIS=0

# 测试结果数组
declare -a FAILED_PAGES
declare -a FAILED_APIS

echo "1. 测试用户端页面（27个）"
echo "=========================================="

USER_PAGES=(
    "/"
    "/papers"
    "/papers/test-id"
    "/videos"
    "/videos/test-id"
    "/repos"
    "/repos/test-id"
    "/huggingface"
    "/huggingface/test-id"
    "/jobs"
    "/jobs/test-id"
    "/news"
    "/bilibili-analytics"
    "/community"
    "/community/test-id"
    "/my-community"
    "/login"
    "/register"
    "/profile"
    "/settings"
    "/favorites"
    "/subscriptions"
    "/subscriptions/test-id"
    "/subscriptions-new"
    "/user/test-id"
    "/search"
    "/ranking"
)

for page in "${USER_PAGES[@]}"; do
    TOTAL_PAGES=$((TOTAL_PAGES + 1))
    echo -n "测试页面: $page ... "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "304" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $STATUS)"
        PASS_PAGES=$((PASS_PAGES + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $STATUS)"
        FAIL_PAGES=$((FAIL_PAGES + 1))
        FAILED_PAGES+=("$page")
    fi
done

echo ""
echo "2. 测试管理端页面（22个）"
echo "=========================================="

ADMIN_PAGES=(
    "/admin"
    "/admin/content"
    "/admin/sync"
    "/admin/users"
    "/admin/admins"
    "/admin/banners"
    "/admin/home-modules"
    "/admin/announcements"
    "/admin/community-config"
    "/admin/data-sources"
    "/admin/bilibili-uploaders"
    "/admin/bilibili-search-keywords"
    "/admin/cookies"
    "/admin/sync-queue"
    "/admin/scheduler"
    "/admin/subscriptions"
    "/admin/login"
    "/admin/content/papers"
    "/admin/content/videos"
    "/admin/content/repos"
    "/admin/content/huggingface"
    "/admin/content/jobs"
)

for page in "${ADMIN_PAGES[@]}"; do
    TOTAL_PAGES=$((TOTAL_PAGES + 1))
    echo -n "测试页面: $page ... "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "304" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $STATUS)"
        PASS_PAGES=$((PASS_PAGES + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $STATUS)"
        FAIL_PAGES=$((FAIL_PAGES + 1))
        FAILED_PAGES+=("$page")
    fi
done

echo ""
echo "3. 测试关键API端点"
echo "=========================================="

API_ENDPOINTS=(
    "/api/v1/stats/content"
    "/api/v1/announcements/active"
    "/api/v1/home-modules"
    "/api/v1/banners"
    "/api/v1/papers"
    "/api/v1/videos"
    "/api/v1/repos"
    "/api/v1/huggingface"
    "/api/v1/jobs"
    "/api/v1/news"
    "/api/v1/posts"
    "/api/v1/community"
    "/api/v1/ranking/overall"
    "/api/v1/ranking/posts"
    "/api/v1/ranking/users"
    "/api/v1/ranking/papers"
    "/api/v1/ranking/videos"
    "/api/v1/ranking/repos"
)

for api in "${API_ENDPOINTS[@]}"; do
    TOTAL_APIS=$((TOTAL_APIS + 1))
    echo -n "测试API: $api ... "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001$api")
    
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $STATUS)"
        PASS_APIS=$((PASS_APIS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $STATUS)"
        FAIL_APIS=$((FAIL_APIS + 1))
        FAILED_APIS+=("$api")
    fi
done

echo ""
echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo ""
echo "页面测试:"
echo "  总计: $TOTAL_PAGES"
echo "  通过: $PASS_PAGES"
echo "  失败: $FAIL_PAGES"
echo "  通过率: $(awk "BEGIN {printf \"%.1f\", ($PASS_PAGES/$TOTAL_PAGES)*100}")%"
echo ""

if [ ${#FAILED_PAGES[@]} -gt 0 ]; then
    echo -e "${RED}失败的页面:${NC}"
    for page in "${FAILED_PAGES[@]}"; do
        echo "  - $page"
    done
    echo ""
fi

echo "API测试:"
echo "  总计: $TOTAL_APIS"
echo "  通过: $PASS_APIS"
echo "  失败: $FAIL_APIS"
echo "  通过率: $(awk "BEGIN {printf \"%.1f\", ($PASS_APIS/$TOTAL_APIS)*100}")%"
echo ""

if [ ${#FAILED_APIS[@]} -gt 0 ]; then
    echo -e "${RED}失败的API:${NC}"
    for api in "${FAILED_APIS[@]}"; do
        echo "  - $api"
    done
    echo ""
fi

echo "=========================================="
echo "测试完成"
echo "=========================================="

# 返回退出码
if [ $FAIL_PAGES -gt 0 ] || [ $FAIL_APIS -gt 0 ]; then
    exit 1
else
    exit 0
fi
