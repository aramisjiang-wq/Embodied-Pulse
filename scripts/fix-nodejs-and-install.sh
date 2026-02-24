#!/bin/bash

# Node.js 自动修复和依赖安装脚本
# 自动检测、安装 Node.js，并更新项目依赖

set -e

PROJECT_ROOT="/Users/dong/Downloads/WaleHouse/01-Finance/打工-LimX（202503-至今）/Embodied Pulse"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🔍 检查 Node.js 安装状态..."
echo ""

# 检查 Node.js 是否在 PATH 中
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo "✅ Node.js 已安装"
    echo "   Node.js: $NODE_VERSION"
    echo "   npm: $NPM_VERSION"
    
    # 检查版本是否符合要求
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo "⚠️  Node.js 版本过低，需要 >= 20.x"
        echo "   当前版本: $NODE_VERSION"
        echo ""
        echo "请升级 Node.js："
        echo "  如果使用 nvm: nvm install 20 && nvm use 20"
        echo "  如果使用 Homebrew: brew upgrade node"
        exit 1
    fi
else
    echo "❌ Node.js 未安装或不在 PATH 中"
    echo ""
    echo "正在尝试安装 Node.js..."
    echo ""
    
    # 方法1: 尝试使用 nvm
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        echo "📦 检测到 nvm，使用 nvm 安装..."
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        nvm alias default 20
        
        # 添加到 .zshrc
        if ! grep -q "NVM_DIR" ~/.zshrc 2>/dev/null; then
            echo "" >> ~/.zshrc
            echo "# NVM Configuration" >> ~/.zshrc
            echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
            echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
            echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc
        fi
        
        # 重新加载
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    else
        # 方法2: 安装 nvm
        echo "📦 安装 nvm..."
        if curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh 2>/dev/null | bash; then
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
            
            echo "📦 使用 nvm 安装 Node.js 20..."
            nvm install 20
            nvm use 20
            nvm alias default 20
            
            # 添加到 .zshrc
            if ! grep -q "NVM_DIR" ~/.zshrc 2>/dev/null; then
                echo "" >> ~/.zshrc
                echo "# NVM Configuration" >> ~/.zshrc
                echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
                echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
                echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc
            fi
        else
            echo "❌ 自动安装失败"
            echo ""
            echo "请手动安装 Node.js："
            echo ""
            echo "方法1 - 使用 nvm（推荐）："
            echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
            echo "  source ~/.zshrc"
            echo "  nvm install 20"
            echo "  nvm use 20"
            echo ""
            echo "方法2 - 官网下载："
            echo "  访问 https://nodejs.org/zh-cn/ 下载 LTS 版本（20.x）"
            echo ""
            exit 1
        fi
    fi
    
    # 验证安装
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        echo ""
        echo "✅ Node.js 安装成功！"
        echo "   Node.js: $(node --version)"
        echo "   npm: $(npm --version)"
    else
        echo ""
        echo "⚠️  安装完成，但需要重新加载终端配置"
        echo "   请运行: source ~/.zshrc"
        echo "   然后重新运行此脚本"
        exit 1
    fi
fi

echo ""
echo "================================"
echo "📦 更新前端依赖..."
echo ""

# 进入前端目录
cd "$FRONTEND_DIR"

# 检查 package.json 是否已更新
if grep -q '"next": "^16.1.0"' package.json; then
    echo "✅ package.json 已更新到 Next.js 16.1.0"
else
    echo "⚠️  package.json 中的 Next.js 版本可能需要更新"
fi

# 安装依赖
echo ""
echo "正在安装依赖（这可能需要几分钟）..."
npm install

echo ""
echo "================================"
echo "✅ 完成！"
echo ""
echo "📝 下一步："
echo "1. 运行开发服务器: npm run dev"
echo "2. 或构建项目: npm run build"
echo ""
