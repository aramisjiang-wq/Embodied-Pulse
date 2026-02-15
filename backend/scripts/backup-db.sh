#!/bin/bash
# 数据库自动备份脚本
# 用途：定期备份数据库文件，防止数据丢失

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/Users/dong/Documents/Product/Embodied/backups"
mkdir -p $BACKUP_DIR

echo "开始备份数据库..."

# 备份用户数据库
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db $BACKUP_DIR/dev.db.$DATE
    echo "✅ 用户数据库已备份: dev.db.$DATE"
else
    echo "⚠️  用户数据库不存在: prisma/dev.db"
fi

# 备份管理数据库
if [ -f "prisma/admin.db" ]; then
    cp prisma/admin.db $BACKUP_DIR/admin.db.$DATE
    echo "✅ 管理数据库已备份: admin.db.$DATE"
else
    echo "⚠️  管理数据库不存在: prisma/admin.db"
fi

# 保留最近7天的备份
find $BACKUP_DIR -name "*.db.*" -mtime +7 -delete
echo "🗑️  已清理7天前的备份"

# 显示备份信息
echo ""
echo "备份完成！"
echo "备份目录: $BACKUP_DIR"
echo "备份时间: $DATE"
ls -lh $BACKUP_DIR | tail -5
