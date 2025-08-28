import cron from 'node-cron';
import dayjs from 'dayjs';
import { getDatabase } from '../db/database.js';
import amadeusService from './amadeusService.js';
import aiService from './aiService.js';
import emailService from './emailService.js';
import axios from 'axios';

class SchedulerService {
  constructor() {
    this.db = getDatabase();
  }

  startSchedulers() {
    // 每小時檢查一次需要處理的任務
    cron.schedule('0 * * * *', () => {
      this.processPendingTasks();
    });

    // 每天早上9點發送行程提醒
    cron.schedule('0 9 * * *', () => {
      this.sendTripReminders();
    });

    // 每6小時更新一次天氣信息
    cron.schedule('0 */6 * * *', () => {
      this.updateWeatherInfo();
    });

    console.log('任務調度器已啟動');
  }

  async processPendingTasks() {
    try {
      const tasks = this.db.prepare(`
        SELECT t.*, tp.*, u.email 
        FROM tasks t
        JOIN travel_plans tp ON t.travel_plan_id = tp.id
        JOIN users u ON tp.user_id = u.id
        WHERE t.status = 'pending' 
        AND t.scheduled_at <= datetime('now')
        ORDER BY t.priority DESC, t.created_at ASC
      `).all();

      for (const task of tasks) {
        try {
          await this.processTask(task);
          
          // 更新任務狀態為完成
          this.db.prepare(`
            UPDATE tasks 
            SET status = 'completed', completed_at = datetime('now')
            WHERE id = ?
          `).run(task.id);
          
        } catch (error) {
          console.error(`處理任務 ${task.id} 失敗:`, error);
          
          // 更新任務狀態為失敗
          this.db.prepare(`
            UPDATE tasks 
            SET status = 'failed', error_message = ?
            WHERE id = ?
          `).run(error.message, task.id);
        }
      }
    } catch (error) {
      console.error('處理待處理任務失敗:', error);
    }
  }

  async processTask(task) {
    switch (task.task_type) {
      case 'search_flights':
        await this.searchFlights(task);
        break;
      case 'search_hotels':
        await this.searchHotels(task);
        break;
      case 'search_attractions':
        await this.searchAttractions(task);
        break;
      case 'get_weather':
        await this.getWeatherInfo(task);
        break;
      case 'generate_report':
        await this.generateTravelReport(task);
        break;
      case 'send_report':
        await this.sendTravelReport(task);
        break;
      default:
        throw new Error(`未知的任務類型: ${task.task_type}`);
    }
  }

  async searchFlights(task) {
    console.log(`開始搜索航班: ${task.destination}`);
    
    // 獲取出發地機場代碼（假設從香港出發）
    const originCode = 'HKG';
    
    // 獲取目的地機場代碼
    const destinationCode = await amadeusService.getCityCode(task.destination);
    
    // 計算出發日期（提前3天）
    const departureDate = dayjs(task.start_date).subtract(3, 'day').format('YYYY-MM-DD');
    
    // 搜索航班
    const flights = await amadeusService.searchFlights(
      originCode, 
      destinationCode, 
      departureDate, 
      null, 
      1
    );

    // 保存航班信息
    for (const flight of flights.slice(0, 5)) { // 只保存前5個選項
      this.db.prepare(`
        INSERT INTO flight_info (
          travel_plan_id, airline, flight_number, departure_airport, 
          arrival_airport, departure_time, arrival_time, price, booking_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.travel_plan_id,
        flight.airline,
        flight.flightNumber,
        flight.departureAirport,
        flight.arrivalAirport,
        flight.departureTime,
        flight.arrivalTime,
        flight.price,
        flight.bookingUrl
      );
    }

    console.log(`航班搜索完成，找到 ${flights.length} 個選項`);
  }

  async searchHotels(task) {
    console.log(`開始搜索酒店: ${task.destination}`);
    
    // 獲取目的地城市代碼
    const cityCode = await amadeusService.getCityCode(task.destination);
    
    // 搜索酒店
    const hotels = await amadeusService.searchHotels(
      cityCode,
      task.start_date,
      task.end_date,
      1
    );

    // 保存酒店信息
    for (const hotel of hotels.slice(0, 10)) { // 保存前10個選項
      this.db.prepare(`
        INSERT INTO hotel_info (
          travel_plan_id, hotel_name, address, phone, website,
          price_per_night, rating, amenities, availability, booking_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.travel_plan_id,
        hotel.name,
        hotel.address?.line1 || '',
        hotel.phone || '',
        hotel.website || '',
        hotel.price,
        hotel.rating || 0,
        JSON.stringify(hotel.amenities || []),
        hotel.availability ? 1 : 0,
        hotel.bookingUrl
      );
    }

    console.log(`酒店搜索完成，找到 ${hotels.length} 個選項`);
  }

  async searchAttractions(task) {
    console.log(`開始搜索景點: ${task.destination}`);
    
    // 這裡使用模擬數據，實際應用中可以接入Google Places API或其他景點API
    const attractions = [
      {
        name: `${task.destination}主要景點1`,
        description: '這是該地區最受歡迎的景點之一，擁有豐富的文化歷史和美麗的自然風光。',
        address: `${task.destination}市中心`,
        rating: 4.5,
        price: 100,
        openingHours: '09:00-18:00',
        website: 'https://example.com',
        imageUrl: 'https://via.placeholder.com/300x200'
      },
      {
        name: `${task.destination}博物館`,
        description: '展示當地歷史文化的博物館，是了解當地文化的好去處。',
        address: `${task.destination}文化區`,
        rating: 4.2,
        price: 50,
        openingHours: '10:00-17:00',
        website: 'https://example.com',
        imageUrl: 'https://via.placeholder.com/300x200'
      },
      {
        name: `${task.destination}公園`,
        description: '美麗的城市公園，是放鬆身心的理想場所。',
        address: `${task.destination}公園區`,
        rating: 4.0,
        price: 0,
        openingHours: '全天開放',
        website: 'https://example.com',
        imageUrl: 'https://via.placeholder.com/300x200'
      }
    ];

    // 保存景點信息
    for (const attraction of attractions) {
      this.db.prepare(`
        INSERT INTO attractions (
          travel_plan_id, name, description, address, rating,
          price, opening_hours, website, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.travel_plan_id,
        attraction.name,
        attraction.description,
        attraction.address,
        attraction.rating,
        attraction.price,
        attraction.openingHours,
        attraction.website,
        attraction.imageUrl
      );
    }

    console.log(`景點搜索完成，找到 ${attractions.length} 個景點`);
  }

  async getWeatherInfo(task) {
    console.log(`開始獲取天氣信息: ${task.destination}`);
    
    // 這裡使用模擬數據，實際應用中可以接入OpenWeatherMap API
    const startDate = dayjs(task.start_date);
    const endDate = dayjs(task.end_date);
    const days = endDate.diff(startDate, 'day') + 1;
    
    const weatherData = [];
    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day');
      weatherData.push({
        date: date.format('YYYY-MM-DD'),
        temperatureHigh: Math.floor(Math.random() * 15) + 20, // 20-35°C
        temperatureLow: Math.floor(Math.random() * 10) + 15,  // 15-25°C
        condition: ['晴天', '多雲', '陰天', '小雨'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
        windSpeed: Math.floor(Math.random() * 20) + 5  // 5-25 km/h
      });
    }

    // 保存天氣信息
    for (const weather of weatherData) {
      this.db.prepare(`
        INSERT INTO weather_info (
          travel_plan_id, date, temperature_high, temperature_low,
          condition, humidity, wind_speed
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.travel_plan_id,
        weather.date,
        weather.temperatureHigh,
        weather.temperatureLow,
        weather.condition,
        weather.humidity,
        weather.windSpeed
      );
    }

    console.log(`天氣信息獲取完成，共 ${weatherData.length} 天`);
  }

  async generateTravelReport(task) {
    console.log(`開始生成旅遊報告: ${task.destination}`);
    
    // 獲取所有相關信息
    const travelPlan = this.db.prepare('SELECT * FROM travel_plans WHERE id = ?').get(task.travel_plan_id);
    const flightInfo = this.db.prepare('SELECT * FROM flight_info WHERE travel_plan_id = ?').all(task.travel_plan_id);
    const hotelInfo = this.db.prepare('SELECT * FROM hotel_info WHERE travel_plan_id = ?').all(task.travel_plan_id);
    const attractions = this.db.prepare('SELECT * FROM attractions WHERE travel_plan_id = ?').all(task.travel_plan_id);
    const weatherInfo = this.db.prepare('SELECT * FROM weather_info WHERE travel_plan_id = ?').all(task.travel_plan_id);
    const transportationInfo = this.db.prepare('SELECT * FROM transportation_info WHERE travel_plan_id = ?').all(task.travel_plan_id);

    // 生成報告
    const reportContent = await aiService.generateTravelReport(
      travelPlan,
      flightInfo,
      hotelInfo,
      attractions,
      weatherInfo,
      transportationInfo
    );

    // 保存報告
    this.db.prepare(`
      INSERT INTO reports (travel_plan_id, report_type, content, status)
      VALUES (?, 'travel_report', ?, 'pending')
    `).run(task.travel_plan_id, reportContent);

    console.log('旅遊報告生成完成');
  }

  async sendTravelReport(task) {
    console.log(`開始發送旅遊報告: ${task.destination}`);
    
    const user = this.db.prepare(`
      SELECT u.email, tp.* 
      FROM users u 
      JOIN travel_plans tp ON u.id = tp.user_id 
      WHERE tp.id = ?
    `).get(task.travel_plan_id);

    const report = this.db.prepare(`
      SELECT * FROM reports 
      WHERE travel_plan_id = ? AND report_type = 'travel_report'
      ORDER BY generated_at DESC LIMIT 1
    `).get(task.travel_plan_id);

    if (user && report) {
      await emailService.sendTravelReport(user.email, user, report.content);
      console.log('旅遊報告發送完成');
    } else {
      throw new Error('找不到用戶或報告信息');
    }
  }

  async sendTripReminders() {
    try {
      const upcomingTrips = this.db.prepare(`
        SELECT tp.*, u.email 
        FROM travel_plans tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.start_date BETWEEN date('now') AND date('now', '+7 days')
        AND tp.status = 'active'
      `).all();

      for (const trip of upcomingTrips) {
        const daysUntilTrip = dayjs(trip.start_date).diff(dayjs(), 'day');
        
        if (daysUntilTrip <= 3 && daysUntilTrip >= 0) {
          await emailService.sendItineraryReminder(trip.email, trip);
          console.log(`已發送行程提醒給 ${trip.email}`);
        }
      }
    } catch (error) {
      console.error('發送行程提醒失敗:', error);
    }
  }

  async updateWeatherInfo() {
    try {
      const activeTrips = this.db.prepare(`
        SELECT tp.*, u.email 
        FROM travel_plans tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.start_date BETWEEN date('now') AND date('now', '+14 days')
        AND tp.status = 'active'
      `).all();

      for (const trip of activeTrips) {
        // 重新獲取天氣信息
        await this.getWeatherInfo(trip);
        
        // 發送天氣更新郵件
        const weatherInfo = this.db.prepare(`
          SELECT * FROM weather_info 
          WHERE travel_plan_id = ? 
          ORDER BY date ASC
        `).all(trip.id);

        if (weatherInfo.length > 0) {
          await emailService.sendWeatherUpdate(trip.email, trip, weatherInfo);
          console.log(`已發送天氣更新給 ${trip.email}`);
        }
      }
    } catch (error) {
      console.error('更新天氣信息失敗:', error);
    }
  }

  async scheduleTask(travelPlanId, taskType, scheduledAt, priority = 1) {
    this.db.prepare(`
      INSERT INTO tasks (travel_plan_id, task_type, status, priority, scheduled_at)
      VALUES (?, ?, 'pending', ?, ?)
    `).run(travelPlanId, taskType, priority, scheduledAt);
  }
}

export default new SchedulerService();