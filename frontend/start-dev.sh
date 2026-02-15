#!/bin/bash

# 停止所有占用3000端口的进程
echo "正在停止占用3000端口的进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# 清除缓存
echo "正在清除构建缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 启动开发服务器
echo "正在启动开发服务器..."
npm run dev
