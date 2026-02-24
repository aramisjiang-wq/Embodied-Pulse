#!/bin/bash

# 使用 Cursor 自带的 Node.js 安装依赖

set -e

CURSOR_NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
PROJECT_ROOT="/Users/dong/Downloads/WaleHouse/01-Finance/打工-LimX（202503-至今）/Embodied Pulse"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🔍 使用 Cursor 自带的 Node.js 安装依赖..."
echo ""

# 检查 Cursor Node.js
if [ -f "$CURSOR_NODE" ]; then
    NODE_VERSION=$("$CURSOR_NODE" --version)
    echo "✅ 找到 Cursor Node.js: $NODE_VERSION"
else
    echo "❌ 未找到 Cursor Node.js"
    exit 1
fi

echo ""
echo "📦 更新前端依赖..."
echo ""

cd "$FRONTEND_DIR"

# 使用 Cursor 的 Node.js 运行 npm
# npm 是 Node.js 的内置模块，可以直接通过 node 运行
echo "正在安装依赖（这可能需要几分钟）..."

# 设置 PATH 以便 npm 可以找到 node
export PATH="$(dirname "$CURSOR_NODE"):$PATH"

# 使用 node 直接运行 npm（npm 会通过 PATH 找到 node）
"$CURSOR_NODE" -e "
const { spawn } = require('child_process');
const npm = spawn('npm', ['install'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PATH: process.env.PATH }
});
npm.on('close', (code) => process.exit(code));
npm.on('error', (err) => { console.error(err); process.exit(1); });
" || {
  # 如果上面的方法失败，尝试直接调用 npm
  echo "尝试直接调用 npm..."
  "$CURSOR_NODE" $(which npm 2>/dev/null || echo "") install || {
    echo "❌ 无法运行 npm"
    echo ""
    echo "请手动安装 Node.js，然后运行:"
    echo "  cd $FRONTEND_DIR"
    echo "  npm install"
    exit 1
  }
}

echo ""
echo "================================"
echo "✅ 依赖安装完成！"
echo ""
