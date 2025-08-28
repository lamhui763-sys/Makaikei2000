import express from 'express';
import moment from 'moment';
import { db } from '../services/db.js';
import { performTravelSearch } from '../services/travel-search.js';
import { sendConfirmationEmail } from '../services/email.js';

export const router = express.Router();

// 首頁路由
router.get('/', (req, res) => {
  res.render('home', {
    title: '旅遊易 Travel Easy - AI 智能旅遊助理',
    subtitle: '讓AI為您規劃完美旅程'
  });
});

// 創建旅行計劃
router.post('/trips', async (req, res) => {
  try {
    const { name, email, destination, startDate, duration, budget, travelers, preferences } = req.body;
    
    // 驗證必填字段
    if (!name || !email || !destination || !startDate || !duration) {
      return res.status(400).render('home', { 
        title: '旅遊易 Travel Easy', 
        error: '請填寫所有必填字段（姓名、郵箱、目的地、出發日期、旅行天數）' 
      });
    }

    const start = moment(startDate);
    const durationInt = parseInt(duration, 10);
    const travelersInt = parseInt(travelers, 10) || 1;
    const budgetFloat = parseFloat(budget) || null;

    // 驗證日期格式
    if (!start.isValid()) {
      return res.status(400).render('home', { 
        title: '旅遊易 Travel Easy', 
        error: '請輸入有效的出發日期' 
      });
    }

    // 驗證天數
    if (durationInt < 1 || durationInt > 30) {
      return res.status(400).render('home', { 
        title: '旅遊易 Travel Easy', 
        error: '旅行天數必須在1-30天之間' 
      });
    }

    // 檢查日期不能是過去的日期
    if (start.isBefore(moment(), 'day')) {
      return res.status(400).render('home', { 
        title: '旅遊易 Travel Easy', 
        error: '出發日期不能是過去的日期' 
      });
    }

    // 保存到數據庫
    const stmt = db.prepare(`
      INSERT INTO trips (
        name, email, destination, start_date, duration, 
        budget, travelers, preferences, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    
    const info = stmt.run(
      name, 
      email, 
      destination, 
      start.format('YYYY-MM-DD'), 
      durationInt,
      budgetFloat,
      travelersInt,
      preferences || null,
      moment().toISOString()
    );

    // 發送確認郵件
    await sendConfirmationEmail(email, name, destination, start.format('YYYY-MM-DD'), durationInt);

    return res.render('submitted', { 
      id: info.lastInsertRowid,
      trip: {
        name,
        destination,
        startDate: start.format('YYYY年MM月DD日'),
        duration: durationInt
      }
    });
  } catch (error) {
    console.error('創建旅行計劃時發生錯誤:', error);
    return res.status(500).render('home', { 
      title: '旅遊易 Travel Easy', 
      error: '系統錯誤，請稍後再試' 
    });
  }
});

// 查看旅行計劃詳情
router.get('/trips/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    
    if (!trip) {
      return res.status(404).render('error', { 
        message: '找不到指定的旅行計劃',
        code: 404
      });
    }

    // 獲取相關的搜索結果
    const flights = db.prepare('SELECT * FROM flight_searches WHERE trip_id = ? ORDER BY price ASC LIMIT 5').all(id);
    const hotels = db.prepare('SELECT * FROM hotel_searches WHERE trip_id = ? ORDER BY price_per_night ASC LIMIT 10').all(id);
    const reports = db.prepare('SELECT * FROM travel_reports WHERE trip_id = ? ORDER BY generated_at DESC LIMIT 1').get(id);

    return res.render('trip-detail', { 
      trip, 
      flights, 
      hotels, 
      report: reports,
      moment
    });
  } catch (error) {
    console.error('查看旅行計劃時發生錯誤:', error);
    return res.status(500).render('error', { 
      message: '系統錯誤，請稍後再試',
      code: 500
    });
  }
});

// 手動觸發搜索（用於測試）
router.post('/trips/:id/search', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    
    if (!trip) {
      return res.status(404).json({ success: false, error: '找不到指定的旅行計劃' });
    }

    // 執行旅遊搜索
    const result = await performTravelSearch(id);
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: '搜索完成，報告已發送到您的郵箱',
        tripId: id
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: result.error || '搜索過程中發生錯誤'
      });
    }
  } catch (error) {
    console.error('手動搜索時發生錯誤:', error);
    return res.status(500).json({ 
      success: false, 
      error: '系統錯誤，請稍後再試'
    });
  }
});

// API接口：獲取所有旅行計劃
router.get('/api/trips', (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT id, name, email, destination, start_date, duration, 
             status, created_at, email_sent_at
      FROM trips 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();

    return res.json({ success: true, data: trips });
  } catch (error) {
    console.error('獲取旅行計劃列表時發生錯誤:', error);
    return res.status(500).json({ success: false, error: '系統錯誤' });
  }
});

// 關於頁面
router.get('/about', (req, res) => {
  res.render('about', {
    title: '關於旅遊易 - AI 智能旅遊助理'
  });
});

