#!/usr/bin/env node

/**
 * 旅遊易功能測試腳本
 * 這個腳本會測試主要的API功能
 */

import { searchFlights, searchHotels, formatFlightResults, formatHotelResults } from './src/services/amadeus.js';
import { getCurrentWeather, getWeatherForecast } from './src/services/weather.js';
import { generateTravelGuide } from './src/services/ai.js';
import { sendConfirmationEmail } from './src/services/email.js';
import { db } from './src/services/db.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🏝️ 旅遊易 Travel Easy - 功能測試');
console.log('=====================================');

async function testAmadeusAPI() {
    console.log('\n✈️ 測試 Amadeus API...');
    
    try {
        // 測試航班搜索
        const flightResult = await searchFlights('TPE', 'NRT', '2024-03-15', '2024-03-22', 1);
        console.log('✅ 航班搜索:', flightResult.success ? '成功' : '失敗');
        if (!flightResult.success) {
            console.log('❌ 錯誤:', flightResult.error);
        }
        
        // 測試酒店搜索
        const hotelResult = await searchHotels('TYO', '2024-03-15', '2024-03-22', 1, 1);
        console.log('✅ 酒店搜索:', hotelResult.success ? '成功' : '失敗');
        if (!hotelResult.success) {
            console.log('❌ 錯誤:', hotelResult.error);
        }
        
    } catch (error) {
        console.log('❌ Amadeus API 測試失敗:', error.message);
    }
}

async function testWeatherAPI() {
    console.log('\n🌤️ 測試天氣API...');
    
    try {
        const currentWeather = await getCurrentWeather('Tokyo');
        console.log('✅ 當前天氣:', currentWeather.success ? '成功' : '失敗');
        
        const forecast = await getWeatherForecast('Tokyo');
        console.log('✅ 天氣預報:', forecast.success ? '成功' : '失敗');
        
    } catch (error) {
        console.log('❌ 天氣API 測試失敗:', error.message);
    }
}

async function testAIService() {
    console.log('\n🤖 測試AI服務...');
    
    try {
        const guide = await generateTravelGuide('東京', 7, 2, '喜歡歷史文化', null, [], []);
        console.log('✅ AI旅遊攻略生成:', guide.success ? '成功' : '失敗');
        
    } catch (error) {
        console.log('❌ AI服務 測試失敗:', error.message);
    }
}

async function testEmailService() {
    console.log('\n📧 測試郵件服務...');
    
    try {
        // 這裡使用測試郵箱，實際使用時請替換
        const testEmail = process.env.EMAIL_USER;
        if (testEmail) {
            const result = await sendConfirmationEmail(testEmail, '測試用戶', '東京', '2024-03-15', 7);
            console.log('✅ 郵件發送:', result.success ? '成功' : '失敗');
            if (!result.success) {
                console.log('❌ 錯誤:', result.error);
            }
        } else {
            console.log('⚠️ 未配置郵件服務，跳過測試');
        }
        
    } catch (error) {
        console.log('❌ 郵件服務 測試失敗:', error.message);
    }
}

async function testDatabase() {
    console.log('\n🗄️ 測試數據庫...');
    
    try {
        // 測試數據庫連接
        const testQuery = db.prepare('SELECT 1 as test').get();
        console.log('✅ 數據庫連接:', testQuery ? '成功' : '失敗');
        
        // 測試插入測試數據
        const insertStmt = db.prepare(`
            INSERT INTO trips (name, email, destination, start_date, duration, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(
            '測試用戶',
            'test@example.com',
            '東京',
            '2024-03-15',
            7,
            new Date().toISOString()
        );
        
        console.log('✅ 測試數據插入:', result.lastInsertRowid ? '成功' : '失敗');
        
        // 清理測試數據
        db.prepare('DELETE FROM trips WHERE email = ?').run('test@example.com');
        console.log('✅ 測試數據清理: 完成');
        
    } catch (error) {
        console.log('❌ 數據庫 測試失敗:', error.message);
    }
}

async function checkConfiguration() {
    console.log('\n🔧 檢查配置...');
    
    const configs = {
        'Amadeus API Key': process.env.AMADEUS_API_KEY,
        'Amadeus API Secret': process.env.AMADEUS_API_SECRET,
        'Email User': process.env.EMAIL_USER,
        'Email Pass': process.env.EMAIL_PASS,
        'OpenAI API Key': process.env.OPENAI_API_KEY,
        'Weather API Key': process.env.WEATHER_API_KEY
    };
    
    for (const [name, value] of Object.entries(configs)) {
        const status = value ? '✅ 已配置' : '⚠️ 未配置';
        console.log(`${name}: ${status}`);
    }
}

async function runAllTests() {
    console.log('開始運行所有測試...\n');
    
    await checkConfiguration();
    await testDatabase();
    await testAmadeusAPI();
    await testWeatherAPI();
    await testAIService();
    await testEmailService();
    
    console.log('\n=====================================');
    console.log('🎉 測試完成！');
    console.log('=====================================');
}

// 執行測試
runAllTests().catch(error => {
    console.error('❌ 測試過程中發生錯誤:', error);
    process.exit(1);
});