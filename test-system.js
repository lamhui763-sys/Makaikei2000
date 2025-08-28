import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testSystem() {
  console.log('🧪 開始測試旅遊易系統...\n');

  try {
    // 測試健康檢查
    console.log('1. 測試健康檢查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康檢查通過:', healthResponse.data);
    console.log('');

    // 測試主頁
    console.log('2. 測試主頁...');
    const homeResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ 主頁載入成功 (狀態碼:', homeResponse.status, ')');
    console.log('');

    // 測試註冊
    console.log('3. 測試用戶註冊...');
    const registerData = {
      email: 'test@example.com',
      password: 'testpassword123',
      name: '測試用戶',
      phone: '1234567890'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ 註冊成功:', registerResponse.data.message);
      const token = registerResponse.data.token;
      console.log('');

      // 測試登錄
      console.log('4. 測試用戶登錄...');
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ 登錄成功:', loginResponse.data.message);
      console.log('');

      // 測試創建旅行計劃
      console.log('5. 測試創建旅行計劃...');
      const planData = {
        destination: '東京',
        startDate: '2025-10-15',
        endDate: '2025-10-22',
        duration: 7
      };

      const planResponse = await axios.post(`${BASE_URL}/travel/plans`, planData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ 旅行計劃創建成功:', planResponse.data.message);
      console.log('計劃ID:', planResponse.data.travelPlan.id);
      console.log('');

      // 測試獲取旅行計劃列表
      console.log('6. 測試獲取旅行計劃列表...');
      const plansResponse = await axios.get(`${BASE_URL}/travel/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ 獲取計劃列表成功');
      console.log('計劃數量:', plansResponse.data.travelPlans.length);
      console.log('');

      // 測試獲取用戶信息
      console.log('7. 測試獲取用戶信息...');
      const userResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ 獲取用戶信息成功:', userResponse.data.user.email);
      console.log('');

      console.log('🎉 所有測試通過！系統運行正常。');
      console.log('\n📋 測試總結:');
      console.log('- ✅ 健康檢查');
      console.log('- ✅ 主頁載入');
      console.log('- ✅ 用戶註冊');
      console.log('- ✅ 用戶登錄');
      console.log('- ✅ 創建旅行計劃');
      console.log('- ✅ 獲取計劃列表');
      console.log('- ✅ 獲取用戶信息');

    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.error.includes('已被註冊')) {
        console.log('⚠️ 用戶已存在，跳過註冊測試');
        
        // 直接測試登錄
        console.log('4. 測試用戶登錄...');
        const loginData = {
          email: 'test@example.com',
          password: 'testpassword123'
        };

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✅ 登錄成功:', loginResponse.data.message);
        const token = loginResponse.data.token;
        console.log('');

        // 測試創建旅行計劃
        console.log('5. 測試創建旅行計劃...');
        const planData = {
          destination: '大阪',
          startDate: '2025-11-01',
          endDate: '2025-11-08',
          duration: 7
        };

        const planResponse = await axios.post(`${BASE_URL}/travel/plans`, planData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ 旅行計劃創建成功:', planResponse.data.message);
        console.log('');

        console.log('🎉 測試完成！系統運行正常。');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    if (error.response) {
      console.error('錯誤詳情:', error.response.data);
    }
    process.exit(1);
  }
}

// 運行測試
testSystem();