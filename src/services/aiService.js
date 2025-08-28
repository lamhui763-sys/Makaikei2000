import OpenAI from 'openai';
import dayjs from 'dayjs';

class AIService {
  constructor() {
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async generateTravelReport(travelPlan, flightInfo, hotelInfo, attractions, weatherInfo, transportationInfo) {
    try {
      if (!this.openai) {
        // 如果沒有OpenAI API，返回模擬報告
        return this.generateMockReport(travelPlan, flightInfo, hotelInfo, attractions, weatherInfo, transportationInfo);
      }

      const prompt = this.buildTravelReportPrompt(travelPlan, flightInfo, hotelInfo, attractions, weatherInfo, transportationInfo);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "你是一個專業的旅遊規劃師，專門為客戶提供詳細的旅遊報告和建議。請用繁體中文回答，並提供實用、詳細的信息。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('生成旅遊報告失敗:', error);
      // 如果AI服務失敗，返回模擬報告
      return this.generateMockReport(travelPlan, flightInfo, hotelInfo, attractions, weatherInfo, transportationInfo);
    }
  }

  buildTravelReportPrompt(travelPlan, flightInfo, hotelInfo, attractions, weatherInfo, transportationInfo) {
    const startDate = dayjs(travelPlan.start_date);
    const endDate = dayjs(travelPlan.end_date);
    
    return `
請為以下旅遊計劃生成一份詳細的旅遊報告：

目的地：${travelPlan.destination}
旅行日期：${startDate.format('YYYY年MM月DD日')} 至 ${endDate.format('YYYY年MM月DD日')}
旅行天數：${travelPlan.duration}天

航班信息：
${flightInfo.map(flight => `
- 航空公司：${flight.airline}
- 航班號：${flight.flightNumber}
- 出發機場：${flight.departureAirport}
- 到達機場：${flight.arrivalAirport}
- 出發時間：${dayjs(flight.departureTime).format('YYYY-MM-DD HH:mm')}
- 到達時間：${dayjs(flight.arrivalTime).format('YYYY-MM-DD HH:mm')}
- 價格：${flight.price} ${flight.currency}
`).join('\n')}

酒店信息：
${hotelInfo.map(hotel => `
- 酒店名稱：${hotel.name}
- 地址：${hotel.address}
- 評分：${hotel.rating}/5
- 每晚價格：${hotel.price} ${hotel.currency}
- 設施：${hotel.amenities?.join(', ') || '無'}
`).join('\n')}

景點信息：
${attractions.map(attraction => `
- 景點名稱：${attraction.name}
- 描述：${attraction.description}
- 地址：${attraction.address}
- 評分：${attraction.rating}/5
- 門票：${attraction.price} ${attraction.currency || 'HKD'}
- 開放時間：${attraction.openingHours}
`).join('\n')}

天氣信息：
${weatherInfo.map(weather => `
- 日期：${dayjs(weather.date).format('YYYY年MM月DD日')}
- 最高溫度：${weather.temperatureHigh}°C
- 最低溫度：${weather.temperatureLow}°C
- 天氣狀況：${weather.condition}
- 濕度：${weather.humidity}%
- 風速：${weather.windSpeed} km/h
`).join('\n')}

交通信息：
${transportationInfo.map(transport => `
- 交通類型：${transport.type}
- 描述：${transport.description}
- 費用：${transport.cost} HKD
- 所需時間：${transport.durationMinutes}分鐘
- 路線：${transport.route}
`).join('\n')}

請生成一份包含以下內容的詳細旅遊報告：

1. 行程概覽
2. 航班建議和注意事項
3. 酒店推薦和入住建議
4. 必訪景點和行程安排
5. 天氣預報和穿衣建議
6. 交通指南
7. 美食推薦
8. 購物建議
9. 安全注意事項
10. 緊急聯繫方式
11. 預算分析
12. 實用貼士

請確保報告內容實用、詳細，並提供具體的建議和注意事項。
    `;
  }

  async generateItinerary(travelPlan, attractions) {
    try {
      const prompt = `
請為以下旅遊計劃生成詳細的每日行程安排：

目的地：${travelPlan.destination}
旅行日期：${dayjs(travelPlan.start_date).format('YYYY年MM月DD日')} 至 ${dayjs(travelPlan.end_date).format('YYYY年MM月DD日')}
旅行天數：${travelPlan.duration}天

可用景點：
${attractions.map(attraction => `
- ${attraction.name}：${attraction.description}
- 地址：${attraction.address}
- 開放時間：${attraction.openingHours}
- 建議遊覽時間：2-3小時
`).join('\n')}

請為每一天安排合理的行程，包括：
1. 上午活動
2. 午餐建議
3. 下午活動
4. 晚餐建議
5. 晚上活動（如果適用）

請考慮景點的地理位置、開放時間和遊覽時間，合理安排行程順序。
    `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "你是一個專業的旅遊行程規劃師，請用繁體中文回答，並提供實用、詳細的每日行程安排。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('生成行程安排失敗:', error);
      throw new Error('無法生成行程安排');
    }
  }

  async generateBudgetAnalysis(travelPlan, flightInfo, hotelInfo, attractions, transportationInfo) {
    try {
      const totalFlightCost = flightInfo.reduce((sum, flight) => sum + flight.price, 0);
      const totalHotelCost = hotelInfo.reduce((sum, hotel) => sum + (hotel.price * travelPlan.duration), 0);
      const totalAttractionCost = attractions.reduce((sum, attraction) => sum + (attraction.price || 0), 0);
      const totalTransportCost = transportationInfo.reduce((sum, transport) => sum + transport.cost, 0);

      const prompt = `
請為以下旅遊計劃生成預算分析：

目的地：${travelPlan.destination}
旅行天數：${travelPlan.duration}天

費用明細：
- 機票費用：${totalFlightCost} HKD
- 酒店費用（${travelPlan.duration}晚）：${totalHotelCost} HKD
- 景點門票：${totalAttractionCost} HKD
- 交通費用：${totalTransportCost} HKD

請提供：
1. 總預算分析
2. 各項費用佔比
3. 節省建議
4. 額外費用預估（餐飲、購物、小費等）
5. 預算優化建議
    `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "你是一個專業的旅遊預算分析師，請用繁體中文回答，並提供詳細的預算分析和建議。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('生成預算分析失敗:', error);
      throw new Error('無法生成預算分析');
    }
  }

  generateMockReport(travelPlan, flightInfo, hotelInfo, attractions, weatherInfo, transportationInfo) {
    const startDate = dayjs(travelPlan.start_date);
    const endDate = dayjs(travelPlan.end_date);
    
    return `
# ${travelPlan.destination} 旅遊報告

## 📋 行程概覽
- **目的地**: ${travelPlan.destination}
- **出發日期**: ${startDate.format('YYYY年MM月DD日')}
- **回程日期**: ${endDate.format('YYYY年MM月DD日')}
- **旅行天數**: ${travelPlan.duration}天

## ✈️ 航班信息
${flightInfo.length > 0 ? flightInfo.map(flight => `
- **航空公司**: ${flight.airline}
- **航班號**: ${flight.flightNumber}
- **出發機場**: ${flight.departureAirport}
- **到達機場**: ${flight.arrivalAirport}
- **出發時間**: ${dayjs(flight.departureTime).format('YYYY-MM-DD HH:mm')}
- **到達時間**: ${dayjs(flight.arrivalTime).format('YYYY-MM-DD HH:mm')}
- **價格**: ${flight.price} ${flight.currency}
`).join('\n') : '- 暫無航班信息'}

## 🏨 酒店推薦
${hotelInfo.length > 0 ? hotelInfo.map(hotel => `
- **酒店名稱**: ${hotel.name}
- **地址**: ${hotel.address}
- **評分**: ${hotel.rating}/5
- **每晚價格**: ${hotel.price} ${hotel.currency}
- **設施**: ${hotel.amenities || '無'}
`).join('\n') : '- 暫無酒店信息'}

## 🏛️ 景點推薦
${attractions.length > 0 ? attractions.map(attraction => `
- **景點名稱**: ${attraction.name}
- **描述**: ${attraction.description}
- **地址**: ${attraction.address}
- **評分**: ${attraction.rating}/5
- **門票**: ${attraction.price} ${attraction.currency || 'HKD'}
- **開放時間**: ${attraction.openingHours}
`).join('\n') : '- 暫無景點信息'}

## 🌤️ 天氣預報
${weatherInfo.length > 0 ? weatherInfo.map(weather => `
- **日期**: ${dayjs(weather.date).format('YYYY年MM月DD日')}
- **最高溫度**: ${weather.temperatureHigh}°C
- **最低溫度**: ${weather.temperatureLow}°C
- **天氣狀況**: ${weather.condition}
- **濕度**: ${weather.humidity}%
- **風速**: ${weather.windSpeed} km/h
`).join('\n') : '- 暫無天氣信息'}

## 🚗 交通指南
${transportationInfo.length > 0 ? transportationInfo.map(transport => `
- **交通類型**: ${transport.type}
- **描述**: ${transport.description}
- **費用**: ${transport.cost} HKD
- **所需時間**: ${transport.durationMinutes}分鐘
- **路線**: ${transport.route}
`).join('\n') : '- 暫無交通信息'}

## 💡 實用貼士
1. **證件準備**: 請確保護照有效期至少6個月
2. **貨幣兌換**: 建議提前兌換當地貨幣
3. **保險**: 建議購買旅遊保險
4. **緊急聯繫**: 當地緊急電話請撥打當地緊急服務號碼
5. **網絡**: 建議購買當地SIM卡或使用國際漫遊

## 📱 實用應用
- Google Maps: 導航和地圖
- Google Translate: 語言翻譯
- 當地交通應用: 查詢公共交通
- 美食應用: 尋找當地美食

## ⚠️ 注意事項
- 請提前確認所有預訂信息
- 注意當地天氣變化，準備合適衣物
- 保管好重要證件和財物
- 遵守當地法律法規和風俗習慣

祝您旅途愉快！🎉
    `;
  }
}

export default new AIService();