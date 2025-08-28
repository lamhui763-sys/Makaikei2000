import { searchFlights, searchHotels, formatFlightResults, formatHotelResults } from './amadeus.js';
import { getCurrentWeather, getWeatherForecast, generateWeatherAdvice } from './weather.js';
import { generateTravelGuide, generateAttractionRecommendations } from './ai.js';
import { sendTravelReport } from './email.js';
import { db } from './db.js';
import moment from 'moment';

/**
 * 執行完整的旅遊搜索
 */
export async function performTravelSearch(tripId) {
  try {
    // 從數據庫獲取旅行信息
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    console.log(`開始為旅行 ${tripId} 執行搜索：${trip.destination}`);

    // 1. 搜索航班
    const flightResults = await searchFlightOffers(trip);
    
    // 2. 搜索酒店
    const hotelResults = await searchHotelOffers(trip);
    
    // 3. 獲取天氣信息
    const weatherResults = await getWeatherInformation(trip.destination);
    
    // 4. 生成AI旅遊攻略
    const travelGuide = await generateTravelGuide(
      trip.destination,
      trip.duration,
      trip.travelers,
      trip.preferences,
      weatherResults.advice,
      flightResults.data,
      hotelResults.data
    );

    // 5. 保存搜索結果到數據庫
    await saveTravelResults(tripId, flightResults.data, hotelResults.data, travelGuide, weatherResults);

    // 6. 發送郵件給用戶
    const emailResult = await sendTravelReport(
      trip.email,
      trip.name,
      trip.destination,
      travelGuide,
      flightResults.data,
      hotelResults.data,
      weatherResults.advice
    );

    // 7. 更新旅行狀態
    db.prepare(`
      UPDATE trips 
      SET status = 'completed', search_date = ?, email_sent_at = ?
      WHERE id = ?
    `).run(
      moment().toISOString(),
      emailResult.success ? moment().toISOString() : null,
      tripId
    );

    return {
      success: true,
      tripId: tripId,
      emailSent: emailResult.success,
      searchResults: {
        flights: flightResults.data,
        hotels: hotelResults.data,
        weather: weatherResults,
        guide: travelGuide
      }
    };

  } catch (error) {
    console.error(`旅遊搜索失敗 (Trip ${tripId}):`, error);
    
    // 更新失敗狀態
    db.prepare(`
      UPDATE trips 
      SET status = 'failed', search_date = ?
      WHERE id = ?
    `).run(moment().toISOString(), tripId);

    return {
      success: false,
      error: error.message,
      tripId: tripId
    };
  }
}

/**
 * 搜索航班優惠
 */
async function searchFlightOffers(trip) {
  try {
    console.log(`搜索航班：${trip.destination}`);
    
    // 這裡需要確定起始機場代碼
    // 可以根據用戶位置或讓用戶選擇
    const originCode = 'TPE'; // 預設台北桃園機場
    const destinationCode = await getAirportCode(trip.destination);
    
    const departureDate = moment(trip.start_date).format('YYYY-MM-DD');
    const returnDate = moment(trip.start_date).add(trip.duration, 'days').format('YYYY-MM-DD');

    const result = await searchFlights(
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      trip.travelers
    );

    if (result.success) {
      const formattedFlights = formatFlightResults(result.data);
      
      // 保存航班搜索結果
      for (const flight of formattedFlights.slice(0, 5)) { // 只保存前5個結果
        db.prepare(`
          INSERT INTO flight_searches (
            trip_id, origin, destination, departure_date, return_date,
            price, airline, flight_number, booking_url, searched_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          trip.id,
          originCode,
          destinationCode,
          departureDate,
          returnDate,
          flight.price,
          flight.airline,
          flight.flightNumber,
          flight.deepLink,
          moment().toISOString()
        );
      }

      return {
        success: true,
        data: formattedFlights.slice(0, 5)
      };
    } else {
      console.error('航班搜索失敗:', result.error);
      return {
        success: false,
        data: [],
        error: result.error
      };
    }
  } catch (error) {
    console.error('航班搜索異常:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}

/**
 * 搜索酒店優惠
 */
async function searchHotelOffers(trip) {
  try {
    console.log(`搜索酒店：${trip.destination}`);
    
    const cityCode = await getCityCode(trip.destination);
    const checkInDate = moment(trip.start_date).format('YYYY-MM-DD');
    const checkOutDate = moment(trip.start_date).add(trip.duration, 'days').format('YYYY-MM-DD');

    const result = await searchHotels(
      cityCode,
      checkInDate,
      checkOutDate,
      trip.travelers,
      1 // 預設1間房
    );

    if (result.success) {
      const formattedHotels = formatHotelResults(result.data);
      
      // 保存酒店搜索結果
      for (const hotel of formattedHotels.slice(0, 10)) { // 只保存前10個結果
        db.prepare(`
          INSERT INTO hotel_searches (
            trip_id, location, check_in_date, check_out_date,
            hotel_name, price_per_night, rating, phone, website,
            amenities, availability, searched_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          trip.id,
          trip.destination,
          checkInDate,
          checkOutDate,
          hotel.name,
          hotel.price,
          hotel.rating,
          hotel.contact ? hotel.contact.phone : null,
          hotel.bookingUrl,
          hotel.amenities ? JSON.stringify(hotel.amenities) : null,
          'available',
          moment().toISOString()
        );
      }

      return {
        success: true,
        data: formattedHotels.slice(0, 10)
      };
    } else {
      console.error('酒店搜索失敗:', result.error);
      return {
        success: false,
        data: [],
        error: result.error
      };
    }
  } catch (error) {
    console.error('酒店搜索異常:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}

/**
 * 獲取天氣信息
 */
async function getWeatherInformation(destination) {
  try {
    console.log(`獲取天氣信息：${destination}`);
    
    const currentWeather = await getCurrentWeather(destination);
    const forecast = await getWeatherForecast(destination);
    
    let weatherInfo = '';
    let advice = '';

    if (currentWeather.success) {
      const weather = currentWeather.data;
      weatherInfo += `當前天氣：${weather.temperature}°C，${weather.description}\n`;
      weatherInfo += `體感溫度：${weather.feelsLike}°C，濕度：${weather.humidity}%\n`;
    }

    if (forecast.success) {
      advice = generateWeatherAdvice(forecast.data);
      weatherInfo += `\n天氣預報：\n`;
      forecast.data.forecasts.slice(0, 5).forEach(f => {
        weatherInfo += `${f.date}：${f.temperature}°C，${f.description}，降雨機率：${f.rainProbability}%\n`;
      });
    }

    return {
      current: currentWeather.data,
      forecast: forecast.data,
      info: weatherInfo,
      advice: advice
    };
  } catch (error) {
    console.error('天氣信息獲取失敗:', error);
    return {
      current: null,
      forecast: null,
      info: '暫無天氣信息',
      advice: '建議出發前查看最新天氣預報'
    };
  }
}

/**
 * 保存旅遊結果到數據庫
 */
async function saveTravelResults(tripId, flightResults, hotelResults, travelGuide, weatherResults) {
  try {
    const attractionRecommendations = generateAttractionRecommendations();
    
    db.prepare(`
      INSERT INTO travel_reports (
        trip_id, attractions, weather_info, transportation_tips,
        local_cuisine, travel_guides, ai_recommendations, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tripId,
      attractionRecommendations,
      weatherResults.info,
      '建議使用當地公共交通或計程車',
      '品嚐當地特色美食',
      travelGuide.content,
      JSON.stringify({
        flights: flightResults.slice(0, 3),
        hotels: hotelResults.slice(0, 5)
      }),
      moment().toISOString()
    );

    console.log(`旅遊報告已保存到數據庫 (Trip ${tripId})`);
  } catch (error) {
    console.error('保存旅遊結果失敗:', error);
  }
}

/**
 * 獲取機場代碼 - 簡化版本
 */
async function getAirportCode(destination) {
  // 這裡可以擴展為更完整的機場代碼查詢
  const airportCodes = {
    '東京': 'NRT',
    '大阪': 'KIX',
    '首爾': 'ICN',
    '曼谷': 'BKK',
    '新加坡': 'SIN',
    '吉隆坡': 'KUL',
    '香港': 'HKG',
    '上海': 'PVG',
    '北京': 'PEK'
  };

  return airportCodes[destination] || 'NRT'; // 預設東京
}

/**
 * 獲取城市代碼 - 簡化版本
 */
async function getCityCode(destination) {
  // 這裡可以擴展為更完整的城市代碼查詢
  const cityCodes = {
    '東京': 'TYO',
    '大阪': 'OSA',
    '首爾': 'SEL',
    '曼谷': 'BKK',
    '新加坡': 'SIN',
    '吉隆坡': 'KUL',
    '香港': 'HKG',
    '上海': 'SHA',
    '北京': 'BJS'
  };

  return cityCodes[destination] || 'TYO'; // 預設東京
}