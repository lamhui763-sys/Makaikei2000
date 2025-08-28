#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function demo() {
  console.log('🚀 旅遊易網站演示\n');
  
  try {
    // 1. 檢查服務器狀態
    console.log('1. 檢查服務器狀態...');
    const homeResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ 首頁加載成功');
    
    // 2. 創建旅遊計劃
    console.log('\n2. 創建旅遊計劃...');
    const travelPlan = {
      name: '張小明',
      email: 'zhang@example.com',
      destination: '巴黎',
      startDate: '2024-11-20',
      duration: 10
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/travel-plans`, travelPlan);
    console.log('✅ 旅遊計劃創建成功:', createResponse.data.message);
    
    // 3. 獲取旅遊計劃列表
    console.log('\n3. 獲取旅遊計劃列表...');
    const plansResponse = await axios.get(`${BASE_URL}/api/travel-plans`);
    const plans = plansResponse.data.plans;
    console.log(`✅ 找到 ${plans.length} 個旅遊計劃`);
    
    plans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.destination} (${plan.duration}天) - ${plan.user_name}`);
    });
    
    // 4. 獲取特定旅遊計劃詳情
    if (plans.length > 0) {
      console.log('\n4. 獲取旅遊計劃詳情...');
      const planId = plans[0].id;
      const detailResponse = await axios.get(`${BASE_URL}/api/travel-plans/${planId}`);
      const planDetail = detailResponse.data.plan;
      console.log(`✅ 旅遊計劃詳情獲取成功: ${planDetail.destination}`);
      
      if (planDetail.flights && planDetail.flights.length > 0) {
        console.log(`   - 找到 ${planDetail.flights.length} 個航班推薦`);
      }
      if (planDetail.hotels && planDetail.hotels.length > 0) {
        console.log(`   - 找到 ${planDetail.hotels.length} 個酒店推薦`);
      }
      if (planDetail.attractions && planDetail.attractions.length > 0) {
        console.log(`   - 找到 ${planDetail.attractions.length} 個景點推薦`);
      }
    }
    
    console.log('\n🎉 演示完成！');
    console.log('\n📱 您可以在瀏覽器中訪問以下頁面：');
    console.log(`   - 首頁: ${BASE_URL}/`);
    console.log(`   - 創建旅遊計劃: ${BASE_URL}/create`);
    console.log(`   - 旅遊計劃列表: ${BASE_URL}/plans`);
    
  } catch (error) {
    console.error('❌ 演示失敗:', error.message);
    if (error.response) {
      console.error('   狀態碼:', error.response.status);
      console.error('   錯誤信息:', error.response.data);
    }
  }
}

demo();