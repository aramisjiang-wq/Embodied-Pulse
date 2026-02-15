#!/bin/bash
# 清理测试数据脚本
# 用途：清理数据库中的所有测试数据

echo "⚠️  警告：即将清理所有测试数据"
echo "这将删除以下数据："
echo "  - 所有论文"
echo "  - 所有视频"
echo "  - 所有GitHub项目"
echo "  - 所有用户"
echo "  - 所有帖子"
echo "  - 所有评论"
read -p "确认清理？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "开始清理测试数据..."

cd /Users/dong/Documents/Product/Embodied/backend

# 清理用户数据库
sqlite3 prisma/dev.db << 'EOF'
DELETE FROM user_actions;
DELETE FROM point_records;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM favorites;
DELETE FROM subscriptions;
DELETE FROM subscription_history;
DELETE FROM papers;
DELETE FROM videos;
DELETE FROM github_repos;
DELETE FROM huggingface_models;
DELETE FROM jobs;
DELETE FROM news;
DELETE FROM banners;
DELETE FROM announcements;
DELETE FROM home_modules;
DELETE FROM users;
VACUUM;
EOF

echo "✅ 测试数据已清理"
echo ""
echo "数据库状态："
sqlite3 prisma/dev.db "SELECT 'papers: ' || COUNT(*) FROM papers UNION SELECT 'videos: ' || COUNT(*) FROM videos UNION SELECT 'repos: ' || COUNT(*) FROM github_repos UNION SELECT 'users: ' || COUNT(*) FROM users;"
