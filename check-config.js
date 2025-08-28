#!/usr/bin/env node

/**
 * 旅遊易配置檢查腳本
 */

import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('🏝️ 旅遊易 Travel Easy - 配置檢查');
console.log('=====================================');

// 檢查.env文件
if (!fs.existsSync('.env')) {
    console.log('❌ .env 文件不存在！');
    console.log('請複製 .env 文件並配置以下環境變數：');
    console.log(`
# Amadeus API (必需)
AMADEUS_API_KEY=你的Amadeus_API_Key
AMADEUS_API_SECRET=你的Amadeus_API_Secret
AMADEUS_HOSTNAME=test

# 郵件服務配置 (必需)
EMAIL_SERVICE=gmail
EMAIL_USER=你的郵箱@gmail.com
EMAIL_PASS=你的應用密碼

# OpenAI API (可選)
OPENAI_API_KEY=你的OpenAI_API_Key

# 天氣API (可選)
WEATHER_API_KEY=你的OpenWeather_API_Key
    `);
    process.exit(1);
}

console.log('✅ .env 文件存在');

// 檢查必需配置
const requiredConfigs = {
    'AMADEUS_API_KEY': 'Amadeus API Key (必需)',
    'AMADEUS_API_SECRET': 'Amadeus API Secret (必需)',
    'EMAIL_USER': '郵件用戶名 (必需)',
    'EMAIL_PASS': '郵件密碼 (必需)'
};

const optionalConfigs = {
    'OPENAI_API_KEY': 'OpenAI API Key (可選 - 用於AI助理)',
    'WEATHER_API_KEY': 'Weather API Key (可選 - 用於天氣預報)'
};

console.log('\n📋 必需配置檢查:');
let hasAllRequired = true;

for (const [key, description] of Object.entries(requiredConfigs)) {
    const value = process.env[key];
    if (value) {
        console.log(`✅ ${description}: 已配置`);
    } else {
        console.log(`❌ ${description}: 未配置`);
        hasAllRequired = false;
    }
}

console.log('\n📋 可選配置檢查:');
for (const [key, description] of Object.entries(optionalConfigs)) {
    const value = process.env[key];
    const status = value ? '✅ 已配置' : '⚠️ 未配置';
    console.log(`${status} ${description}`);
}

// 檢查數據庫文件
console.log('\n🗄️ 數據庫檢查:');
if (fs.existsSync('data.sqlite')) {
    const stats = fs.statSync('data.sqlite');
    console.log(`✅ 數據庫文件存在 (大小: ${(stats.size / 1024).toFixed(2)} KB)`);
} else {
    console.log('⚠️ 數據庫文件不存在，首次啟動時會自動創建');
}

// 檢查node_modules
console.log('\n📦 依賴檢查:');
if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules 存在');
} else {
    console.log('❌ node_modules 不存在，請運行 npm install');
    hasAllRequired = false;
}

console.log('\n=====================================');

if (hasAllRequired) {
    console.log('🎉 配置檢查完成！系統已準備就緒。');
    console.log('💡 運行 npm run dev 或 ./start.sh 來啟動應用');
} else {
    console.log('❌ 配置不完整，請完成必需配置後再啟動應用');
    process.exit(1);
}

console.log('=====================================');