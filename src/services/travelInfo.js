import axios from 'axios';
import puppeteer from 'puppeteer';
import { parse } from 'node-html-parser';

class TravelInfoService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async searchAttractions(destination) {
    try {
      // 使用 TripAdvisor API 或網頁爬蟲
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(destination)}%20attractions`);
      await page.waitForSelector('.result-title', { timeout: 10000 });
      
      const attractions = await page.evaluate(() => {
        const items = document.querySelectorAll('.result-title');
        return Array.from(items, (item, index) => ({
          name: item.textContent.trim(),
          url: item.href,
          rating: Math.random() * 2 + 3, // 模擬評分
          description: `Top attraction in ${destination}`,
          ticketPrice: Math.floor(Math.random() * 200) + 50
        })).slice(0, 10);
      });
      
      await browser.close();
      return attractions;
    } catch (error) {
      console.error('Failed to search attractions:', error.message);
      // 返回模擬數據
      return [
        {
          name: `${destination} 主要景點`,
          description: `${destination} 最受歡迎的旅遊景點`,
          rating: 4.5,
          ticketPrice: 150,
          openingHours: '09:00-18:00',
          website: 'https://example.com'
        }
      ];
    }
  }

  async getWeatherInfo(destination, date) {
    try {
      // 使用 OpenWeatherMap API (免費)
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: destination,
          appid: 'your_openweathermap_api_key', // 需要註冊獲取免費API key
          units: 'metric'
        }
      });

      return {
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed
      };
    } catch (error) {
      console.error('Failed to get weather info:', error.message);
      // 返回模擬天氣數據
      return {
        temperature: 25,
        description: '晴天',
        humidity: 60,
        windSpeed: 10
      };
    }
  }

  async getTransportInfo(destination) {
    try {
      // 模擬交通信息
      return {
        airport: `${destination} 國際機場`,
        publicTransport: '地鐵、巴士、計程車',
        airportTransfer: '機場快線、計程車、巴士',
        localTransport: '地鐵、巴士、電車',
        transportCard: '建議購買交通卡'
      };
    } catch (error) {
      console.error('Failed to get transport info:', error.message);
      return {
        airport: '機場信息',
        publicTransport: '公共交通信息',
        airportTransfer: '機場接送信息',
        localTransport: '當地交通信息',
        transportCard: '交通卡信息'
      };
    }
  }

  async generateTravelGuide(destination, duration) {
    try {
      if (!this.openaiApiKey) {
        return this.generateMockTravelGuide(destination, duration);
      }

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一個專業的旅遊顧問，請為用戶提供詳細的旅遊攻略。'
          },
          {
            role: 'user',
            content: `請為${destination}的${duration}天旅行提供詳細攻略，包括：1. 必去景點 2. 美食推薦 3. 購物指南 4. 注意事項 5. 行程建議`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Failed to generate travel guide:', error.message);
      return this.generateMockTravelGuide(destination, duration);
    }
  }

  generateMockTravelGuide(destination, duration) {
    return `
# ${destination} ${duration}天旅遊攻略

## 必去景點
1. ${destination} 主要景點 - 必訪地標
2. 歷史文化景點 - 了解當地文化
3. 自然景觀 - 欣賞美麗風景

## 美食推薦
1. 當地特色菜 - 品嚐地道美食
2. 街頭小吃 - 體驗當地生活
3. 高級餐廳 - 享受精緻料理

## 購物指南
1. 傳統市場 - 購買紀念品
2. 購物中心 - 現代化購物體驗
3. 特色商店 - 獨特商品

## 注意事項
- 請提前預訂酒店和機票
- 注意當地天氣和季節
- 準備必要的證件和保險
- 了解當地文化和習俗

## 行程建議
第1天：抵達後休息，熟悉環境
第2-${duration-1}天：遊覽主要景點
第${duration}天：購物和準備返程
    `;
  }

  async searchLocalInfo(destination) {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(destination)}%20旅遊%20攻略`);
      await page.waitForSelector('h3', { timeout: 10000 });
      
      const results = await page.evaluate(() => {
        const items = document.querySelectorAll('h3');
        return Array.from(items, item => ({
          title: item.textContent.trim(),
          url: item.closest('a')?.href || ''
        })).slice(0, 5);
      });
      
      await browser.close();
      return results;
    } catch (error) {
      console.error('Failed to search local info:', error.message);
      return [
        {
          title: `${destination} 旅遊攻略`,
          url: 'https://example.com'
        }
      ];
    }
  }
}

export const travelInfoService = new TravelInfoService();