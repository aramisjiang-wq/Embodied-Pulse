#!/bin/bash

# 完整的修复和安装脚本
# 1. 确认 package.json 已更新
# 2. 尝试使用各种方法安装依赖

set -e

PROJECT_ROOT="/Users/dong/Downloads/WaleHouse/01-Finance/打工-LimX（202503-至今）/Embodied Pulse"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
CURSOR_NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"

echo "🔧 开始修复和安装..."
echo ""

# 步骤1: 确认 package.json 已更新
echo "📝 步骤 1: 检查 package.json..."
cd "$FRONTEND_DIR"

if grep -q '"next": "^16.1.0"' package.json && grep -q '"eslint-config-next": "^16.1.0"' package.json; then
    echo "✅ package.json 已更新到 Next.js 16.1.0"
else
    echo "⚠️  package.json 需要更新"
    echo "正在更新..."
    
    # 更新 next
    if ! grep -q '"next": "^16.1.0"' package.json; then
        sed -i '' 's/"next": "[^"]*"/"next": "^16.1.0"/' package.json
        echo "✅ 已更新 next 到 16.1.0"
    fi
    
    # 更新 eslint-config-next
    if ! grep -q '"eslint-config-next": "^16.1.0"' package.json; then
        sed -i '' 's/"eslint-config-next": "[^"]*"/"eslint-config-next": "^16.1.0"/' package.json
        echo "✅ 已更新 eslint-config-next 到 16.1.0"
    fi
fi

echo ""
echo "📦 步骤 2: 安装依赖..."
echo ""

# 方法1: 尝试使用系统 npm
if command -v npm &> /dev/null; then
    echo "✅ 找到系统 npm，使用系统 npm 安装..."
    npm install
    echo ""
    echo "✅ 安装完成！"
    exit 0
fi

# 方法2: 尝试使用 Cursor Node.js + 查找 npm
if [ -f "$CURSOR_NODE" ]; then
    echo "🔍 尝试使用 Cursor Node.js..."
    
    # 尝试使用 npx（通常随 Node.js 一起提供）
    if "$CURSOR_NODE" -e "require('child_process').execSync('npx --version', {stdio: 'inherit'})" 2>/dev/null; then
        echo "✅ 找到 npx，使用 npx 安装..."
        "$CURSOR_NODE" -e "
        const { execSync } = require('child_process');
        execSync('npx npm@latest install', { stdio: 'inherit', cwd: process.cwd() });
        "
        echo ""
        echo "✅ 安装完成！"
        exit 0
    fi
fi

# 如果所有方法都失败，提供手动安装指南
echo "❌ 无法自动安装依赖"
echo ""
echo "📋 请手动完成以下步骤："
echo ""
echo "方法 1 - 安装 Node.js（推荐使用 nvm）："
echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
echo "  source ~/.zshrc"
echo "  nvm install 20"
echo "  nvm use 20"
echo "  cd $FRONTEND_DIR"
echo "  npm install"
echo ""
echo "方法 2 - 官网下载安装："
echo "  1. 访问 https://nodejs.org/zh-cn/"
echo "  2. 下载 LTS 版本（20.x）"
echo "  3. 安装后重新打开终端"
echo "  4. cd $FRONTEND_DIR"
echo "  5. npm install"
echo ""
echo "✅ package.json 已更新完成，安装 Node.js 后运行 npm install 即可"
echo ""

exit 1
