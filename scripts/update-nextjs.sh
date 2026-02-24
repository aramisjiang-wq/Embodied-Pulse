#!/bin/bash

# 使用 Cursor 自带的 Node.js 更新 Next.js 依赖

set -e

CURSOR_NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
FRONTEND_DIR="/Users/dong/Downloads/WaleHouse/01-Finance/打工-LimX（202503-至今）/Embodied Pulse/frontend"

echo "🚀 使用 Cursor Node.js 更新 Next.js 依赖..."
echo ""

# 检查 Node.js
if [ ! -f "$CURSOR_NODE" ]; then
    echo "❌ 未找到 Cursor Node.js"
    exit 1
fi

NODE_VERSION=$("$CURSOR_NODE" --version)
echo "✅ 使用 Node.js: $NODE_VERSION"
echo ""

cd "$FRONTEND_DIR"

# 检查 package.json 是否已更新
if grep -q '"next": "^16.1.0"' package.json; then
    echo "✅ package.json 已更新到 Next.js 16.1.0"
else
    echo "⚠️  package.json 需要更新"
fi

echo ""
echo "📦 安装/更新依赖..."
echo ""

# 方法：使用 node 直接运行 npm
# 首先尝试找到 npm，如果找不到，使用 npx
export PATH="$(dirname "$CURSOR_NODE"):$PATH"

# 尝试使用 node 运行 npm（通过查找全局 npm 或使用 npx）
"$CURSOR_NODE" -e "
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 尝试找到 npm
let npmPath;
try {
  // 检查 node_modules/.bin/npm（本地安装的 npm）
  const localNpm = path.join(process.cwd(), 'node_modules', '.bin', 'npm');
  if (fs.existsSync(localNpm)) {
    npmPath = localNpm;
  } else {
    // 尝试使用全局 npm
    npmPath = 'npm';
  }
} catch (e) {
  npmPath = 'npm';
}

try {
  console.log('正在运行 npm install...');
  execSync(npmPath + ' install', { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
  });
  console.log('✅ 依赖安装完成！');
} catch (error) {
  console.error('❌ 安装失败:', error.message);
  process.exit(1);
}
"

echo ""
echo "================================"
echo "✅ 完成！"
echo ""
echo "📝 下一步："
echo "  运行开发服务器: npm run dev"
echo "  或构建项目: npm run build"
echo ""
