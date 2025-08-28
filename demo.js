import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function demo() {
  console.log('🎬 旅遊易系統演示\n');
  console.log('=' * 50);
  console.log('🏖️ 歡迎使用旅遊易 - 智能旅遊規劃個人助理');
  console.log('=' * 50);
  console.log('');

  try {
    // 1. 系統狀態檢查
    console.log('📊 1. 系統狀態檢查');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`   服務器狀態: ${healthResponse.data.status}`);
    console.log(`   版本: ${healthResponse.data.version}`);
    console.log(`   時間: ${new Date(healthResponse.data.timestamp).toLocaleString('zh-TW')}`);
    console.log('');

    // 2. 用戶註冊演示
    console.log('👤 2. 用戶註冊演示');
    const demoEmail = `demo${Date.now()}@example.com`;
    const registerData = {
      email: demoEmail,
      password: 'demo123456',
      name: '演示用戶',
      phone: '9876543210'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log(`   ✅ 註冊成功: ${registerResponse.data.message}`);
      console.log(`   用戶郵箱: ${demoEmail}`);
      console.log(`   用戶姓名: ${registerData.name}`);
      const token = registerResponse.data.token;
      console.log('');

      // 3. 創建旅行計劃演示
      console.log('✈️ 3. 創建旅行計劃演示');
      const planData = {
        destination: '京都',
        startDate: '2025-12-01',
        endDate: '2025-12-08',
        duration: 7
      };

      const planResponse = await axios.post(`${BASE_URL}/travel/plans`, planData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   ✅ 旅行計劃創建成功: ${planResponse.data.message}`);
      console.log(`   目的地: ${planData.destination}`);
      console.log(`   出發日期: ${planData.startDate}`);
      console.log(`   回程日期: ${planData.endDate}`);
      console.log(`   旅行天數: ${planData.duration}天`);
      console.log(`   預計報告日期: ${planResponse.data.estimatedReportDate}`);
      console.log('');

      // 4. 查看旅行計劃列表
      console.log('📋 4. 查看旅行計劃列表');
      const plansResponse = await axios.get(`${BASE_URL}/travel/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`   ✅ 獲取計劃列表成功`);
      console.log(`   總計劃數量: ${plansResponse.data.travelPlans.length}`);
      
      plansResponse.data.travelPlans.forEach((plan, index) => {
        console.log(`   計劃 ${index + 1}:`);
        console.log(`     - 目的地: ${plan.destination}`);
        console.log(`     - 狀態: ${plan.status}`);
        console.log(`     - 創建時間: ${new Date(plan.created_at).toLocaleString('zh-TW')}`);
      });
      console.log('');

      // 5. 查看計劃詳情
      console.log('🔍 5. 查看計劃詳情');
      const planId = planResponse.data.travelPlan.id;
      const detailResponse = await axios.get(`${BASE_URL}/travel/plans/${planId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const detail = detailResponse.data;
      console.log(`   ✅ 獲取計劃詳情成功`);
      console.log(`   航班選項: ${detail.flights.length}個`);
      console.log(`   酒店選項: ${detail.hotels.length}個`);
      console.log(`   景點推薦: ${detail.attractions.length}個`);
      console.log(`   天氣信息: ${detail.weather.length}天`);
      console.log(`   交通信息: ${detail.transportation.length}個`);
      console.log(`   報告數量: ${detail.reports.length}個`);
      console.log(`   任務數量: ${detail.tasks.length}個`);
      console.log('');

      // 6. 手動觸發搜索
      console.log('🔍 6. 手動觸發搜索');
      const searchResponse = await axios.post(`${BASE_URL}/travel/plans/${planId}/search`, {
        type: 'all'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   ✅ 搜索任務已安排: ${searchResponse.data.message}`);
      console.log('');

      // 7. 重新生成報告
      console.log('📄 7. 重新生成報告');
      const reportResponse = await axios.post(`${BASE_URL}/travel/plans/${planId}/report`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`   ✅ 報告重新生成任務已安排: ${reportResponse.data.message}`);
      console.log('');

      // 8. 查看任務狀態
      console.log('⚙️ 8. 查看任務狀態');
      const tasksResponse = await axios.get(`${BASE_URL}/travel/plans/${planId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`   ✅ 獲取任務狀態成功`);
      console.log(`   總任務數量: ${tasksResponse.data.tasks.length}`);
      
      const taskTypes = {};
      tasksResponse.data.tasks.forEach(task => {
        taskTypes[task.task_type] = (taskTypes[task.task_type] || 0) + 1;
      });

      Object.entries(taskTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}個任務`);
      });
      console.log('');

      // 9. 系統功能總結
      console.log('📊 9. 系統功能總結');
      console.log('   ✅ 用戶認證系統');
      console.log('   ✅ 旅行計劃管理');
      console.log('   ✅ 自動任務調度');
      console.log('   ✅ 航班和酒店搜索');
      console.log('   ✅ 景點和天氣信息');
      console.log('   ✅ AI報告生成');
      console.log('   ✅ 郵件通知系統');
      console.log('   ✅ 實時狀態監控');
      console.log('');

      console.log('🎉 演示完成！');
      console.log('');
      console.log('💡 系統特色:');
      console.log('   • 智能AI規劃師，為您生成個性化旅遊攻略');
      console.log('   • 自動搜索最優惠的機票和酒店');
      console.log('   • 實時天氣預報和景點推薦');
      console.log('   • 自動發送詳細旅遊報告到郵箱');
      console.log('   • 安全可靠的用戶認證系統');
      console.log('   • 現代化的響應式Web界面');
      console.log('');
      console.log('🌐 訪問地址: http://localhost:3000');
      console.log('📧 演示用戶郵箱: ' + demoEmail);
      console.log('🔑 演示密碼: demo123456');

    } catch (error) {
      console.error('❌ 演示過程中發生錯誤:', error.message);
      if (error.response) {
        console.error('錯誤詳情:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ 系統連接失敗:', error.message);
    console.log('請確保服務器正在運行: npm start');
  }
}

// 運行演示
demo();