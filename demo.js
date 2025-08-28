#!/usr/bin/env node

/**
 * 旅遊易功能示範腳本
 * 創建一個示範旅行計劃並展示系統功能
 */

import { db } from './src/services/db.js';
import { performTravelSearch } from './src/services/travel-search.js';
import { sendConfirmationEmail } from './src/services/email.js';
import moment from 'moment';
import dotenv from 'dotenv';

dotenv.config();

console.log('🏝️ 旅遊易 Travel Easy - 功能示範');
console.log('=====================================');

async function createDemoTrip() {
    console.log('\n📝 創建示範旅行計劃...');
    
    // 創建一個示範旅行計劃（明天出發，這樣可以立即觸發搜索）
    const demoTrip = {
        name: '示範用戶',
        email: process.env.EMAIL_USER || 'demo@example.com',
        destination: '東京',
        startDate: moment().add(1, 'day').format('YYYY-MM-DD'), // 明天出發
        duration: 7,
        budget: 50000,
        travelers: 2,
        preferences: '喜歡歷史文化景點、美食探索，希望體驗當地傳統文化'
    };
    
    console.log('示範計劃詳情:');
    console.log(`👤 姓名: ${demoTrip.name}`);
    console.log(`📧 郵箱: ${demoTrip.email}`);
    console.log(`🗺️ 目的地: ${demoTrip.destination}`);
    console.log(`📅 出發日期: ${demoTrip.startDate}`);
    console.log(`⏰ 旅行天數: ${demoTrip.duration}天`);
    console.log(`👥 旅行人數: ${demoTrip.travelers}人`);
    console.log(`💰 預算: NT$${demoTrip.budget.toLocaleString()}`);
    console.log(`💭 偏好: ${demoTrip.preferences}`);
    
    // 保存到數據庫
    const stmt = db.prepare(`
        INSERT INTO trips (
            name, email, destination, start_date, duration, 
            budget, travelers, preferences, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    
    const result = stmt.run(
        demoTrip.name,
        demoTrip.email,
        demoTrip.destination,
        demoTrip.startDate,
        demoTrip.duration,
        demoTrip.budget,
        demoTrip.travelers,
        demoTrip.preferences,
        moment().toISOString()
    );
    
    console.log(`✅ 旅行計劃已創建，ID: ${result.lastInsertRowid}`);
    
    return result.lastInsertRowid;
}

async function demonstrateSearch(tripId) {
    console.log('\n🔍 執行旅遊搜索示範...');
    console.log('這將展示以下功能:');
    console.log('  ✈️ Amadeus API 航班搜索');
    console.log('  🏨 Amadeus API 酒店搜索');
    console.log('  🌤️ 天氣API 天氣預報');
    console.log('  🤖 AI 旅遊攻略生成');
    console.log('  📧 自動郵件發送');
    
    console.log('\n⏳ 開始搜索（這可能需要一些時間）...');
    
    try {
        const searchResult = await performTravelSearch(tripId);
        
        if (searchResult.success) {
            console.log('✅ 搜索完成！');
            console.log('\n📊 搜索結果摘要:');
            
            if (searchResult.searchResults.flights && searchResult.searchResults.flights.length > 0) {
                console.log(`✈️ 找到 ${searchResult.searchResults.flights.length} 個航班選項`);
                const cheapestFlight = searchResult.searchResults.flights[0];
                console.log(`   最便宜航班: ${cheapestFlight.airline} ${cheapestFlight.flightNumber} - $${cheapestFlight.price}`);
            }
            
            if (searchResult.searchResults.hotels && searchResult.searchResults.hotels.length > 0) {
                console.log(`🏨 找到 ${searchResult.searchResults.hotels.length} 個酒店選項`);
                const cheapestHotel = searchResult.searchResults.hotels[0];
                console.log(`   推薦酒店: ${cheapestHotel.name} - $${cheapestHotel.price}/晚`);
            }
            
            if (searchResult.searchResults.weather) {
                console.log(`🌤️ 天氣信息: 已獲取`);
            }
            
            if (searchResult.searchResults.guide) {
                console.log(`🤖 AI攻略: 已生成`);
            }
            
            if (searchResult.emailSent) {
                console.log(`📧 郵件發送: 成功`);
            } else {
                console.log(`📧 郵件發送: 失敗（請檢查郵件配置）`);
            }
            
        } else {
            console.log('❌ 搜索失敗:', searchResult.error);
        }
        
    } catch (error) {
        console.log('❌ 搜索過程中發生錯誤:', error.message);
    }
}

async function showTripDetails(tripId) {
    console.log('\n📋 查看旅行計劃詳情...');
    
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    const flights = db.prepare('SELECT * FROM flight_searches WHERE trip_id = ? ORDER BY price ASC LIMIT 3').all(tripId);
    const hotels = db.prepare('SELECT * FROM hotel_searches WHERE trip_id = ? ORDER BY price_per_night ASC LIMIT 3').all(tripId);
    const report = db.prepare('SELECT * FROM travel_reports WHERE trip_id = ? ORDER BY generated_at DESC LIMIT 1').get(tripId);
    
    console.log(`\n🎯 旅行計劃 #${tripId}`);
    console.log(`狀態: ${trip.status}`);
    console.log(`創建時間: ${moment(trip.created_at).format('YYYY-MM-DD HH:mm:ss')}`);
    if (trip.search_date) {
        console.log(`搜索時間: ${moment(trip.search_date).format('YYYY-MM-DD HH:mm:ss')}`);
    }
    if (trip.email_sent_at) {
        console.log(`郵件發送時間: ${moment(trip.email_sent_at).format('YYYY-MM-DD HH:mm:ss')}`);
    }
    
    if (flights.length > 0) {
        console.log(`\n✈️ 推薦航班 (${flights.length}個):`);
        flights.forEach((flight, index) => {
            console.log(`  ${index + 1}. ${flight.airline} ${flight.flight_number} - $${flight.price}`);
        });
    }
    
    if (hotels.length > 0) {
        console.log(`\n🏨 推薦酒店 (${hotels.length}個):`);
        hotels.forEach((hotel, index) => {
            console.log(`  ${index + 1}. ${hotel.hotel_name} - $${hotel.price_per_night}/晚`);
        });
    }
    
    if (report) {
        console.log(`\n🤖 AI攻略已生成 (${moment(report.generated_at).format('YYYY-MM-DD HH:mm:ss')})`);
    }
}

async function runDemo() {
    try {
        console.log('開始功能示範...\n');
        
        // 1. 創建示範旅行計劃
        const tripId = await createDemoTrip();
        
        // 2. 發送確認郵件
        console.log('\n📧 發送確認郵件...');
        const emailResult = await sendConfirmationEmail(
            process.env.EMAIL_USER || 'demo@example.com',
            '示範用戶',
            '東京',
            moment().add(1, 'day').format('YYYY-MM-DD'),
            7
        );
        console.log('確認郵件:', emailResult.success ? '✅ 已發送' : '❌ 發送失敗');
        
        // 3. 執行搜索示範
        await demonstrateSearch(tripId);
        
        // 4. 顯示詳情
        await showTripDetails(tripId);
        
        console.log('\n=====================================');
        console.log('🎉 示範完成！');
        console.log('📱 您可以訪問 http://localhost:3000 來使用旅遊易');
        console.log(`📋 或訪問 http://localhost:3000/trips/${tripId} 查看示範計劃詳情`);
        console.log('=====================================');
        
    } catch (error) {
        console.error('❌ 示範過程中發生錯誤:', error);
        process.exit(1);
    }
}

// 檢查是否提供了命令行參數
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
使用方法:
  node demo.js          # 運行完整示範
  node demo.js --help   # 顯示幫助信息

示範將會:
1. 創建一個示範旅行計劃
2. 發送確認郵件
3. 執行完整的旅遊搜索
4. 顯示搜索結果
5. 生成並發送旅遊攻略郵件

注意: 請確保已正確配置 .env 文件中的API密鑰
    `);
    process.exit(0);
}

// 執行示範
runDemo();