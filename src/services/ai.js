import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let openai = null;

// 初始化OpenAI客戶端（如果有API key）
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * 生成旅遊建議和攻略
 */
export async function generateTravelGuide(destination, duration, travelers, preferences, weatherInfo, flightInfo, hotelInfo) {
  try {
    if (!openai) {
      // 如果沒有OpenAI API key，使用預設模板
      return generateDefaultTravelGuide(destination, duration, travelers, preferences, weatherInfo, flightInfo, hotelInfo);
    }

    const prompt = `
作為一個專業的旅遊顧問，請為以下旅行計劃生成詳細的旅遊攻略和建議：

目的地：${destination}
旅行天數：${duration}天
旅行人數：${travelers}人
特殊偏好：${preferences || '無特殊偏好'}

天氣信息：
${weatherInfo || '暫無天氣信息'}

航班信息：
${formatFlightInfoForAI(flightInfo)}

酒店信息：
${formatHotelInfoForAI(hotelInfo)}

請生成包含以下內容的旅遊攻略：
1. 推薦景點和活動安排（按天數規劃）
2. 當地美食推薦
3. 交通指南
4. 購物建議
5. 文化禮儀注意事項
6. 實用小貼士
7. 預算建議

請用繁體中文回答，格式清晰，內容實用。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一個專業的旅遊顧問，擅長為旅客提供詳細、實用的旅遊建議和攻略。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return {
      success: true,
      content: completion.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    // 回退到預設模板
    return generateDefaultTravelGuide(destination, duration, travelers, preferences, weatherInfo, flightInfo, hotelInfo);
  }
}

/**
 * 生成預設旅遊攻略模板
 */
function generateDefaultTravelGuide(destination, duration, travelers, preferences, weatherInfo, flightInfo, hotelInfo) {
  let guide = `# ${destination} 旅遊攻略\n\n`;
  
  guide += `## 旅行概要\n`;
  guide += `📍 目的地：${destination}\n`;
  guide += `📅 旅行天數：${duration}天\n`;
  guide += `👥 旅行人數：${travelers}人\n`;
  if (preferences) {
    guide += `🎯 特殊偏好：${preferences}\n`;
  }
  guide += `\n`;

  if (weatherInfo) {
    guide += `## 天氣資訊\n`;
    guide += `${weatherInfo}\n\n`;
  }

  if (flightInfo && flightInfo.length > 0) {
    guide += `## 航班資訊\n`;
    flightInfo.forEach((flight, index) => {
      guide += `✈️ 航班 ${index + 1}：${flight.airline} ${flight.flightNumber}\n`;
      guide += `   出發：${flight.departure.airport} ${new Date(flight.departure.time).toLocaleString('zh-TW')}\n`;
      guide += `   抵達：${flight.arrival.airport} ${new Date(flight.arrival.time).toLocaleString('zh-TW')}\n`;
      guide += `   價格：${flight.currency} ${flight.price}\n\n`;
    });
  }

  if (hotelInfo && hotelInfo.length > 0) {
    guide += `## 住宿資訊\n`;
    hotelInfo.forEach((hotel, index) => {
      guide += `🏨 酒店 ${index + 1}：${hotel.name}\n`;
      if (hotel.rating) guide += `   評級：${hotel.rating}星\n`;
      if (hotel.price) guide += `   價格：${hotel.currency} ${hotel.price}/晚\n`;
      if (hotel.contact && hotel.contact.phone) guide += `   電話：${hotel.contact.phone}\n`;
      guide += `\n`;
    });
  }

  guide += `## 推薦行程安排\n`;
  for (let day = 1; day <= Math.min(duration, 7); day++) {
    guide += `### 第${day}天\n`;
    guide += `🌅 上午：探索當地著名景點\n`;
    guide += `🍽️ 中午：品嚐當地特色美食\n`;
    guide += `🌆 下午：文化體驗或購物\n`;
    guide += `🌙 晚上：休閒漫步或夜生活\n\n`;
  }

  guide += `## 旅遊小貼士\n`;
  guide += `💡 建議提前預訂熱門景點門票\n`;
  guide += `🗣️ 學習幾句當地常用語言\n`;
  guide += `💳 準備多種支付方式\n`;
  guide += `📱 下載當地地圖和翻譯應用\n`;
  guide += `🎒 根據天氣情況準備合適的衣物\n`;

  return {
    success: true,
    content: guide
  };
}

/**
 * 格式化航班信息供AI使用
 */
function formatFlightInfoForAI(flightInfo) {
  if (!flightInfo || !flightInfo.length) return '暫無航班信息';
  
  return flightInfo.map(flight => 
    `${flight.airline} ${flight.flightNumber}，價格：${flight.currency} ${flight.price}`
  ).join('，');
}

/**
 * 格式化酒店信息供AI使用
 */
function formatHotelInfoForAI(hotelInfo) {
  if (!hotelInfo || !hotelInfo.length) return '暫無酒店信息';
  
  return hotelInfo.map(hotel => 
    `${hotel.name}（${hotel.rating || 'N/A'}星）${hotel.price ? `，價格：${hotel.currency} ${hotel.price}/晚` : ''}`
  ).join('，');
}

/**
 * 生成景點推薦
 */
export function generateAttractionRecommendations(destination, duration, preferences) {
  const attractions = {
    "東京": ["淺草寺", "東京鐵塔", "明治神宮", "新宿御苑", "築地市場"],
    "大阪": ["大阪城", "道頓堀", "環球影城", "奈良公園", "清水寺"],
    "首爾": ["明洞", "景福宮", "弘大", "江南區", "N首爾塔"],
    "曼谷": ["大皇宮", "臥佛寺", "湄南河", "暹羅廣場", "週末市集"],
    "新加坡": ["濱海灣花園", "聖淘沙", "牛車水", "小印度", "克拉碼頭"],
    "吉隆坡": ["雙子塔", "黑風洞", "獨立廣場", "中央市場", "阿羅街"],
    // 可以添加更多城市
  };

  const cityAttractions = attractions[destination] || [
    "當地知名景點", "歷史文化遺址", "自然風光", "購物區域", "美食街區"
  ];

  let recommendations = `## ${destination} 推薦景點\n\n`;
  
  cityAttractions.forEach((attraction, index) => {
    recommendations += `${index + 1}. **${attraction}**\n`;
    recommendations += `   建議遊覽時間：2-3小時\n\n`;
  });

  if (preferences) {
    recommendations += `\n*根據您的偏好「${preferences}」，特別推薦相關的景點和活動。*\n`;
  }

  return recommendations;
}