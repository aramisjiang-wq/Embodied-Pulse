#!/bin/bash
# UP主配置恢复脚本
# 用途：从文档中恢复UP主配置信息

echo "⚠️  警告：即将恢复UP主配置信息"
echo "这将添加以下UP主："
echo "  1. 逐际动力 (MID: 1172054289)"
echo "  2. 宇树科技 (MID: 521974986)"
read -p "确认恢复？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "开始恢复UP主配置..."

cd /Users/dong/Documents/Product/Embodied/backend

# 添加已知的UP主
sqlite3 prisma/dev.db << 'EOF'
INSERT INTO bilibili_uploaders (id, mid, name, description, tags, is_active, video_count, created_at, updated_at)
VALUES 
  ('逐际动力-1172054289', '1172054289', '逐际动力', '具身智能机器人公司', '具身智能,机器人', 1, 0, datetime('now'), datetime('now')),
  ('宇树科技-521974986', '521974986', '宇树科技', '人形机器人公司', '机器人,人形机器人', 1, 0, datetime('now'), datetime('now'))
ON CONFLICT(mid) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  tags = excluded.tags,
  is_active = excluded.is_active,
  updated_at = datetime('now');
EOF

echo "✅ 已恢复2个UP主配置"
echo ""
echo "数据库状态："
sqlite3 prisma/dev.db "SELECT mid, name, description, is_active FROM bilibili_uploaders"
