#!/bin/bash

# 自动安装 npm 并更新 Next.js 依赖

set -e

CURSOR_NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
FRONTEND_DIR="/Users/dong/Downloads/WaleHouse/01-Finance/打工-LimX（202503-至今）/Embodied Pulse/frontend"
NPM_VERSION="10.9.2"

echo "🚀 自动安装 npm 并更新依赖..."
echo ""

# 检查 Cursor Node.js
if [ ! -f "$CURSOR_NODE" ]; then
    echo "❌ 未找到 Cursor Node.js"
    exit 1
fi

NODE_VERSION=$("$CURSOR_NODE" --version)
echo "✅ 使用 Node.js: $NODE_VERSION"
echo ""

# 检查是否已有 npm
if command -v npm &> /dev/null; then
    echo "✅ npm 已安装: $(npm --version)"
    NPM_CMD="npm"
else
    echo "📦 npm 未找到，正在安装..."
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # 下载并安装 npm
    echo "正在下载 npm..."
    "$CURSOR_NODE" -e "
    const https = require('https');
    const fs = require('fs');
    const path = require('path');
    
    const npmTarball = 'https://registry.npmjs.org/npm/-/npm-${NPM_VERSION}.tgz';
    const outputPath = path.join(process.cwd(), 'npm.tgz');
    
    const file = fs.createWriteStream(outputPath);
    https.get(npmTarball, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('下载完成');
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      console.error('下载失败:', err.message);
      process.exit(1);
    });
    " || {
        echo "❌ npm 下载失败"
        echo ""
        echo "请手动安装 Node.js："
        echo "  访问 https://nodejs.org/zh-cn/ 下载安装"
        exit 1
    }
    
    # 解压并安装 npm
    echo "正在安装 npm..."
    tar -xzf npm.tgz
    cd package
    "$CURSOR_NODE" bin/npm-cli.js install -g npm@${NPM_VERSION} || {
        # 如果全局安装失败，尝试本地安装
        echo "全局安装失败，尝试本地安装..."
        export PATH="$TEMP_DIR/package/bin:$PATH"
        NPM_CMD="$TEMP_DIR/package/bin/npm"
    }
    
    # 清理
    cd /
    rm -rf "$TEMP_DIR"
    
    if [ -z "$NPM_CMD" ]; then
        NPM_CMD="npm"
    fi
fi

echo ""
echo "📦 更新前端依赖..."
echo ""

cd "$FRONTEND_DIR"

# 检查 package.json
if grep -q '"next": "^16.1.0"' package.json; then
    echo "✅ package.json 已更新到 Next.js 16.1.0"
else
    echo "⚠️  package.json 需要更新"
fi

echo ""
echo "正在安装依赖（这可能需要几分钟）..."

# 运行 npm install
$NPM_CMD install

echo ""
echo "================================"
echo "✅ 完成！"
echo ""
echo "📝 下一步："
echo "  运行开发服务器: npm run dev"
echo "  或构建项目: npm run build"
echo ""
