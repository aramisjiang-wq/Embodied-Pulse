#!/bin/bash
# Prisma Client 使用检查脚本
# 检查所有服务文件是否正确使用了 Prisma Client

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 检查 Prisma Client 使用情况..."
echo ""

ERRORS=0
WARNINGS=0

# 检查不应该使用的导入
echo "❌ 检查错误的 Prisma Client 导入..."

# 1. 检查是否直接创建了新的 PrismaClient 实例
echo "  1. 检查是否创建了新的 PrismaClient() 实例..."
FILES_WITH_NEW_PRISMA=$(grep -r "new PrismaClient()" src/ --include="*.ts" --exclude-dir=node_modules | grep -v "node_modules" || true)
if [ -n "$FILES_WITH_NEW_PRISMA" ]; then
    echo "    发现以下文件创建了新的 PrismaClient 实例:"
    COUNT=0
    echo "$FILES_WITH_NEW_PRISMA" | while read -r line; do
        echo "      ⚠️  $line"
        COUNT=$((COUNT + 1))
    done
    ERRORS=$((ERRORS + $(echo "$FILES_WITH_NEW_PRISMA" | wc -l | tr -d ' ')))
else
    echo "     ✅ 未发现创建新 PrismaClient 实例"
fi

# 2. 检查是否从错误的路径导入 database
echo ""
echo "  2. 检查是否从错误的路径导入 database..."
FILES_WITH_WRONG_IMPORT=$(grep -r "from '../config/database'" src/ --include="*.ts" --exclude-dir=node_modules | grep -v "node_modules" || true)
if [ -n "$FILES_WITH_WRONG_IMPORT" ]; then
    echo "    发现以下文件从错误的路径导入 database:"
    echo "$FILES_WITH_WRONG_IMPORT" | while read -r line; do
        echo "      ⚠️  $line"
    done
    ERRORS=$((ERRORS + $(echo "$FILES_WITH_WRONG_IMPORT" | wc -l | tr -d ' ')))
else
    echo "     ✅ 未发现错误的 database 导入"
fi

# 3. 检查用户端服务是否使用了 userPrisma
echo ""
echo "  3. 检查用户端服务是否正确使用 userPrisma..."
USER_SERVICES=(
    "src/services/feed.service.ts"
    "src/services/favorite.service.ts"
    "src/services/comment.service.ts"
    "src/services/discovery.service.ts"
    "src/services/repo.service.ts"
    "src/services/video.service.ts"
    "src/services/paper.service.ts"
    "src/services/user.service.ts"
    "src/services/news.service.ts"
    "src/services/job.service.ts"
    "src/services/huggingface.service.ts"
)

for file in "${USER_SERVICES[@]}"; do
    if [ -f "$file" ]; then
        if ! grep -q "from '../config/database.user'" "$file" && ! grep -q "userPrisma" "$file"; then
            echo "      ⚠️  $file 可能未使用 userPrisma"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

# 4. 检查管理端服务是否使用了 adminPrisma
echo ""
echo "  4. 检查管理端服务是否正确使用 adminPrisma..."
ADMIN_SERVICES=(
    "src/services/admin.service.ts"
    "src/services/admin-auth.service.ts"
    "src/services/data-source.service.ts"
)

for file in "${ADMIN_SERVICES[@]}"; do
    if [ -f "$file" ]; then
        if ! grep -q "from '../config/database.admin'" "$file" && ! grep -q "adminPrisma" "$file"; then
            echo "      ⚠️  $file 可能未使用 adminPrisma"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

# 总结
echo ""
echo "=========================================="
echo "检查完成"
echo "  错误: $ERRORS"
echo "  警告: $WARNINGS"
echo "=========================================="

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "❌ 发现 $ERRORS 个错误，请修复后再提交代码"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    echo "⚠️  发现 $WARNINGS 个警告，请检查"
    exit 0
else
    echo ""
    echo "✅ 所有检查通过"
    exit 0
fi
