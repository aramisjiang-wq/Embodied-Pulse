#!/bin/bash

# Node.js 安装脚本
# 使用 nvm (Node Version Manager) 安装 Node.js 20

set -e

echo "🚀 开始安装 Node.js..."
echo ""

# 检查是否已安装 nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "✓ nvm 已安装"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
    echo "📦 安装 nvm..."
    echo "正在下载 nvm 安装脚本..."
    
    # 尝试下载 nvm
    if curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh 2>/dev/null | bash; then
        echo "✓ nvm 安装完成"
    else
        echo "❌ nvm 自动安装失败，请手动安装："
        echo ""
        echo "方法1: 手动运行以下命令："
        echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        echo ""
        echo "方法2: 访问 Node.js 官网下载安装包："
        echo "  https://nodejs.org/zh-cn/download/"
        echo ""
        exit 1
    fi
    
    # 加载 nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
fi

# 安装 Node.js 20
echo ""
echo "📦 安装 Node.js 20..."
if command -v nvm &> /dev/null || [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
    nvm alias default 20
    
    # 验证安装
    echo ""
    echo "✅ 安装完成！"
    echo ""
    echo "Node.js 版本: $(node --version)"
    echo "npm 版本: $(npm --version)"
    echo ""
    echo "📝 下一步："
    echo "1. 重新打开终端，或运行: source ~/.zshrc"
    echo "2. 进入项目目录: cd frontend"
    echo "3. 安装依赖: npm install"
else
    echo "❌ nvm 未正确加载，请手动执行："
    echo "  source ~/.zshrc"
    echo "  nvm install 20"
    echo "  nvm use 20"
fi
