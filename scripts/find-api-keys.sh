#!/bin/bash
# API Key查找辅助脚本

echo "=== 查找可能的API Key存储位置 ==="
echo ""
echo "1. 检查.env文件..."
if [ -f "backend/.env" ]; then
    echo "   ✅ 找到 backend/.env"
    grep -i "semantic" backend/.env | head -3
else
    echo "   ❌ 未找到 backend/.env"
fi

echo ""
echo "2. 检查是否有.env备份文件..."
find . -name ".env*" -type f 2>/dev/null | grep -v node_modules | head -5

echo ""
echo "3. 建议检查的位置："
echo "   - Semantic Scholar账号: https://www.semanticscholar.org/product/api"
echo "   - 浏览器密码管理器"
echo "   - macOS Keychain (钥匙串访问)"
echo "   - 个人笔记或文档"
echo "   - 其他项目的配置文件"

echo ""
echo "4. 如果找到了API key，运行以下命令配置："
echo "   ./scripts/configure-semantic-scholar-api-key.sh"
