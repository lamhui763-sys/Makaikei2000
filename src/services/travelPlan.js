import dayjs from 'dayjs';
import { getDatabase } from '../db/init.js';
import { amadeusService } from './amadeus.js';
import { travelInfoService } from './travelInfo.js';
import { emailService } from './email.js';

class TravelPlanService {
  constructor() {
    // 延遲初始化數據庫連接
  }

  getDb() {
    return getDatabase();
  }

  async createTravelPlan(userData, travelData) {
    try {
      // 創建或獲取用戶
      const db = this.getDb();
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userData.email);
      
      if (!user) {
        const result = db.prepare('INSERT INTO users (email, name) VALUES (?, ?)').run(userData.email, userData.name);
        user = { id: result.lastInsertRowid, email: userData.email, name: userData.name };
      }

      // 創建旅遊計劃
      const startDate = dayjs(travelData.startDate);
      const endDate = startDate.add(travelData.duration, 'day');
      
      const result = db.prepare(`
        INSERT INTO travel_plans (user_id, destination, start_date, end_date, duration, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        travelData.destination,
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
        travelData.duration,
        'pending'
      );

      const travelPlan = {
        id: result.lastInsertRowid,
        user_id: user.id,
        destination: travelData.destination,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        duration: travelData.duration,
        status: 'pending'
      };

      // 立即開始收集旅遊信息
      await this.collectTravelInfo(travelPlan);

      return travelPlan;
    } catch (error) {
      console.error('Failed to create travel plan:', error);
      throw error;
    }
  }

  async collectTravelInfo(travelPlan) {
    try {
      console.log(`開始收集 ${travelPlan.destination} 的旅遊信息...`);

      // 獲取城市代碼
      const cityCode = await amadeusService.getCityCode(travelPlan.destination);
      
      // 搜索航班
      const flights = await amadeusService.searchFlights(
        'HKG', // 香港出發
        cityCode || travelPlan.destination,
        travelPlan.start_date,
        travelPlan.end_date
      );

      // 搜索酒店
      const hotels = await amadeusService.searchHotels(
        cityCode || travelPlan.destination,
        travelPlan.start_date,
        travelPlan.end_date
      );

      // 搜索景點
      const attractions = await travelInfoService.searchAttractions(travelPlan.destination);

      // 獲取天氣信息
      const weather = await travelInfoService.getWeatherInfo(travelPlan.destination, travelPlan.start_date);

      // 獲取交通信息
      const transport = await travelInfoService.getTransportInfo(travelPlan.destination);

      // 生成旅遊攻略
      const guide = await travelInfoService.generateTravelGuide(travelPlan.destination, travelPlan.duration);

      // 保存到數據庫
      await this.saveTravelInfo(travelPlan.id, { flights, hotels, attractions, weather, transport, guide });

      // 更新旅遊計劃狀態
      const db = this.getDb();
      db.prepare('UPDATE travel_plans SET status = ? WHERE id = ?').run('completed', travelPlan.id);

      console.log(`旅遊信息收集完成：${travelPlan.destination}`);

      return { flights, hotels, attractions, weather, transport, guide };
    } catch (error) {
      console.error('Failed to collect travel info:', error);
      throw error;
    }
  }

  async saveTravelInfo(travelPlanId, travelInfo) {
    const { flights, hotels, attractions } = travelInfo;
    const db = this.getDb();

    // 保存航班信息
    for (const flight of flights) {
      db.prepare(`
        INSERT INTO flight_info (travel_plan_id, airline, flight_number, departure_airport, arrival_airport, departure_time, arrival_time, price, booking_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        travelPlanId,
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

    // 保存酒店信息
    for (const hotel of hotels) {
      db.prepare(`
        INSERT INTO hotel_info (travel_plan_id, hotel_name, address, phone, website, price_per_night, availability, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        travelPlanId,
        hotel.name,
        hotel.address,
        hotel.phone || '',
        hotel.bookingUrl,
        hotel.price,
        hotel.availability,
        hotel.rating
      );
    }

    // 保存景點信息
    for (const attraction of attractions) {
      db.prepare(`
        INSERT INTO attraction_info (travel_plan_id, attraction_name, description, address, rating, ticket_price, opening_hours, website)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        travelPlanId,
        attraction.name,
        attraction.description,
        attraction.address || '',
        attraction.rating,
        attraction.ticketPrice,
        attraction.openingHours || '',
        attraction.website || ''
      );
    }
  }

  async getTravelPlan(planId) {
    try {
      const db = this.getDb();
      const plan = db.prepare(`
        SELECT tp.*, u.name as user_name, u.email as user_email
        FROM travel_plans tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.id = ?
      `).get(planId);

      if (!plan) {
        return null;
      }

      // 獲取航班信息
      const flights = db.prepare('SELECT * FROM flight_info WHERE travel_plan_id = ?').all(planId);

      // 獲取酒店信息
      const hotels = db.prepare('SELECT * FROM hotel_info WHERE travel_plan_id = ?').all(planId);

      // 獲取景點信息
      const attractions = db.prepare('SELECT * FROM attraction_info WHERE travel_plan_id = ?').all(planId);

      return {
        ...plan,
        flights,
        hotels,
        attractions
      };
    } catch (error) {
      console.error('Failed to get travel plan:', error);
      throw error;
    }
  }

  async sendTravelReport(planId) {
    try {
      const travelPlan = await this.getTravelPlan(planId);
      if (!travelPlan) {
        throw new Error('Travel plan not found');
      }

      // 重新收集最新信息
      const travelInfo = await this.collectTravelInfo(travelPlan);

      // 發送郵件報告
      await emailService.sendTravelReport(
        travelPlan.user_email,
        travelPlan.user_name,
        travelPlan,
        travelInfo
      );

      return { success: true, message: 'Travel report sent successfully' };
    } catch (error) {
      console.error('Failed to send travel report:', error);
      throw error;
    }
  }

  async getPendingReports() {
    try {
      // 獲取需要發送報告的旅遊計劃（旅行前3天）
      const threeDaysFromNow = dayjs().add(3, 'day').format('YYYY-MM-DD');
      const db = this.getDb();
      
      const plans = db.prepare(`
        SELECT tp.*, u.name as user_name, u.email as user_email
        FROM travel_plans tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.start_date = ? AND tp.status = 'completed'
      `).all(threeDaysFromNow);

      return plans;
    } catch (error) {
      console.error('Failed to get pending reports:', error);
      throw error;
    }
  }

  async getAllTravelPlans() {
    try {
      const db = this.getDb();
      const plans = db.prepare(`
        SELECT tp.*, u.name as user_name, u.email as user_email
        FROM travel_plans tp
        JOIN users u ON tp.user_id = u.id
        ORDER BY tp.created_at DESC
      `).all();

      return plans;
    } catch (error) {
      console.error('Failed to get all travel plans:', error);
      throw error;
    }
  }
}

export const travelPlanService = new TravelPlanService();