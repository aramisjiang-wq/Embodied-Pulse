#!/bin/bash
# Docker Desktop 修复脚本
# 解决 "use of closed network connection" 错误

echo "🔧 Docker Desktop 修复脚本"
echo "================================"
echo ""

# 1. 完全关闭Docker
echo "1️⃣  关闭所有Docker进程..."
pkill -9 -f docker 2>/dev/null
pkill -9 Docker 2>/dev/null
sleep 3
echo "   ✓ 已关闭所有Docker进程"
echo ""

# 2. 清理Docker数据
echo "2️⃣  清理Docker数据..."
rm -rf ~/Library/Containers/com.docker.docker 2>/dev/null
rm -rf ~/Library/Application\ Support/Docker\ Desktop 2>/dev/null
rm -rf ~/.docker 2>/dev/null
echo "   ✓ 已清理Docker数据"
echo ""

# 3. 重新启动Docker Desktop
echo "3️⃣  重新启动Docker Desktop..."
open -a Docker
echo "   ✓ 已启动Docker Desktop"
echo ""

# 4. 等待Docker启动
echo "4️⃣  等待Docker完全启动（这可能需要30-60秒）..."
echo "   💡 请检查Docker Desktop窗口："
echo "      - 如果有授权弹窗，请完成授权"
echo "      - 等待状态栏Docker图标变为静止状态"
echo ""

for i in {1..20}; do
    sleep 3
    if docker ps >/dev/null 2>&1; then
        echo "   ✓ Docker已成功启动！"
        docker ps
        echo ""
        echo "================================"
        echo "✅ Docker修复完成！"
        echo ""
        echo "现在可以运行以下命令启动项目："
        echo "  cd \"$(pwd)\""
        echo "  docker-compose up -d"
        exit 0
    else
        echo -ne "   ⏳ 等待中... ($i/20)\r"
    fi
done

echo ""
echo "   ⚠️  Docker启动超时"
echo ""
echo "请手动检查："
echo "  1. Docker Desktop是否正常打开"
echo "  2. 是否有错误提示"
echo "  3. 状态栏Docker图标状态"
echo ""
echo "如果问题持续，请尝试："
echo "  1. 重启Mac系统"
echo "  2. 重新安装Docker Desktop"
echo "  3. 查看Docker日志: ~/Library/Containers/com.docker.docker/Data/log/host/"
