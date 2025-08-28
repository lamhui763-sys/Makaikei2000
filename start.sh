#!/bin/bash

echo "🏝️ 旅遊易 Travel Easy - 啟動腳本"
echo "======================================"

# 檢查Node.js版本
echo "📋 檢查Node.js版本..."
node --version

# 檢查npm版本
echo "📋 檢查npm版本..."
npm --version

# 檢查依賴
echo "📦 檢查依賴..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules不存在，執行npm install..."
    npm install
fi

# 檢查環境配置
echo "🔧 檢查環境配置..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env文件不存在，請先配置環境變數"
    echo "參考 .env.example 或 README.md 進行配置"
    exit 1
fi

# 初始化數據庫
echo "🗄️  初始化數據庫..."
if [ ! -f "data.sqlite" ]; then
    echo "創建新的數據庫文件..."
    touch data.sqlite
fi

# 啟動應用
echo "🚀 啟動旅遊易應用..."
echo "======================================"
echo "應用將在 http://localhost:3000 啟動"
echo "按 Ctrl+C 停止應用"
echo "======================================"

npm run dev