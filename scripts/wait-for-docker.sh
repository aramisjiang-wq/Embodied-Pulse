#!/bin/bash
# 等待Docker启动完成的脚本

echo "🐳 等待Docker Desktop启动..."
echo ""
echo "提示:"
echo "1. 查看屏幕右上角Docker图标（蓝色鲸鱼）"
echo "2. 如有授权弹窗，点击'Accept'并输入密码"
echo "3. 等待图标从动画变为静止"
echo ""

MAX_WAIT=120  # 最多等待120秒
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if docker ps >/dev/null 2>&1; then
        echo "✅ Docker启动成功!"
        docker --version
        echo ""
        echo "现在可以启动项目数据库了"
        exit 0
    fi
    
    echo -n "⏳ 等待中... ($ELAPSED/${MAX_WAIT}秒)"
    sleep 3
    ELAPSED=$((ELAPSED + 3))
    echo -ne "\r"
done

echo ""
echo "❌ Docker启动超时"
echo ""
echo "请手动检查:"
echo "1. Docker Desktop是否打开？"
echo "2. 是否完成了授权？"
echo "3. 尝试重启Docker Desktop"
exit 1
