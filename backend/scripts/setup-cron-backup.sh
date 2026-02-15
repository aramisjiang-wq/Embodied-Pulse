#!/bin/bash
# 定时备份脚本 - 添加到crontab
# 用途：设置每天凌晨2点自动备份数据库

BACKUP_SCRIPT="/Users/dong/Documents/Product/Embodied/backend/scripts/backup-db.sh"
LOG_FILE="/Users/dong/Documents/Product/Embodied/backups/backup.log"

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ 备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 添加到crontab
echo "设置定时备份任务..."
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "0 2 * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1") | crontab -

echo "✅ 定时备份任务已设置"
echo "备份时间：每天凌晨2点"
echo "备份脚本：$BACKUP_SCRIPT"
echo "日志文件：$LOG_FILE"
echo ""
echo "当前crontab："
crontab -l
