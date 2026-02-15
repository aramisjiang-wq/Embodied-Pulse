#!/bin/bash

# Semantic Scholar API Key 配置脚本
# 用途: 帮助用户快速配置 Semantic Scholar API Key

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Semantic Scholar API Key 配置工具 ===${NC}\n"

# 检查.env文件是否存在
ENV_FILE="backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}错误: 找不到 $ENV_FILE 文件${NC}"
    echo "请先创建 .env 文件: cp backend/.env.example backend/.env"
    exit 1
fi

# 检查是否已配置
if grep -q "SEMANTIC_SCHOLAR_API_KEY=" "$ENV_FILE"; then
    CURRENT_KEY=$(grep "SEMANTIC_SCHOLAR_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"')
    
    if [ -z "$CURRENT_KEY" ] || [ "$CURRENT_KEY" == "" ]; then
        echo -e "${YELLOW}检测到 SEMANTIC_SCHOLAR_API_KEY 配置项，但值为空${NC}\n"
    else
        echo -e "${GREEN}检测到已配置的 API Key: ${CURRENT_KEY:0:10}...${NC}"
        read -p "是否要更新? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "已取消"
            exit 0
        fi
    fi
else
    echo -e "${YELLOW}未找到 SEMANTIC_SCHOLAR_API_KEY 配置项，将添加${NC}\n"
fi

# 获取API Key
echo -e "${GREEN}请输入您的 Semantic Scholar API Key:${NC}"
echo -e "${YELLOW}提示: 如果还没有API Key，请访问 https://www.semanticscholar.org/product/api 申请${NC}\n"
read -p "API Key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo -e "${RED}错误: API Key 不能为空${NC}"
    exit 1
fi

# 更新.env文件
if grep -q "SEMANTIC_SCHOLAR_API_KEY=" "$ENV_FILE"; then
    # 如果已存在，替换
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|SEMANTIC_SCHOLAR_API_KEY=.*|SEMANTIC_SCHOLAR_API_KEY=\"$API_KEY\"|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|SEMANTIC_SCHOLAR_API_KEY=.*|SEMANTIC_SCHOLAR_API_KEY=\"$API_KEY\"|" "$ENV_FILE"
    fi
else
    # 如果不存在，追加
    echo "" >> "$ENV_FILE"
    echo "# Semantic Scholar API Key配置" >> "$ENV_FILE"
    echo "SEMANTIC_SCHOLAR_API_KEY=\"$API_KEY\"" >> "$ENV_FILE"
fi

echo -e "\n${GREEN}✅ API Key 配置成功!${NC}\n"

# 验证配置
echo -e "${GREEN}验证配置:${NC}"
grep "SEMANTIC_SCHOLAR_API_KEY=" "$ENV_FILE" | sed 's/\(.\{20\}\).*\(.\{10\}\)/\1...\2/'

echo -e "\n${YELLOW}⚠️  重要提示:${NC}"
echo "1. 配置完成后，需要重启后端服务才能生效"
echo "2. 不要将 .env 文件提交到 Git 仓库"
echo "3. 如果API Key泄露，请及时在 Semantic Scholar 账号中重置"
echo -e "\n${GREEN}下一步:${NC}"
echo "1. 重启后端服务: cd backend && npm run dev"
echo "2. 在管理端测试同步: http://localhost:3000/admin/data-sources"
