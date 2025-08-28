import express from 'express';
import amadeusService from '../services/amadeusService.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// 搜索航班
router.get('/flights', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: '請提供出發地、目的地和出發日期' });
    }

    const flights = await amadeusService.searchFlights(
      origin,
      destination,
      departureDate,
      returnDate || null,
      parseInt(adults) || 1
    );

    res.json({ flights });
  } catch (error) {
    console.error('搜索航班失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 搜索酒店
router.get('/hotels', authenticateToken, async (req, res) => {
  try {
    const { cityCode, checkInDate, checkOutDate, adults } = req.query;

    if (!cityCode || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: '請提供城市代碼、入住日期和退房日期' });
    }

    const hotels = await amadeusService.searchHotels(
      cityCode,
      checkInDate,
      checkOutDate,
      parseInt(adults) || 1
    );

    res.json({ hotels });
  } catch (error) {
    console.error('搜索酒店失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取城市代碼
router.get('/cities', authenticateToken, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: '請提供城市名稱關鍵字' });
    }

    const cityCode = await amadeusService.getCityCode(keyword);
    res.json({ cityCode, cityName: keyword });
  } catch (error) {
    console.error('獲取城市代碼失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取機場代碼
router.get('/airports', authenticateToken, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: '請提供機場名稱關鍵字' });
    }

    const airportCode = await amadeusService.getAirportCode(keyword);
    res.json({ airportCode, airportName: keyword });
  } catch (error) {
    console.error('獲取機場代碼失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康檢查
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      amadeus: 'available',
      database: 'available'
    }
  });
});

// API使用統計
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { getDatabase } = require('../db/database.js');
    const db = getDatabase();

    const stats = {
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      totalTravelPlans: db.prepare('SELECT COUNT(*) as count FROM travel_plans').get().count,
      activeTravelPlans: db.prepare("SELECT COUNT(*) as count FROM travel_plans WHERE status = 'active'").get().count,
      totalFlights: db.prepare('SELECT COUNT(*) as count FROM flight_info').get().count,
      totalHotels: db.prepare('SELECT COUNT(*) as count FROM hotel_info').get().count,
      totalReports: db.prepare('SELECT COUNT(*) as count FROM reports').get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('獲取統計信息失敗:', error);
    res.status(500).json({ error: '獲取統計信息失敗' });
  }
});

export default router;