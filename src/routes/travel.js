import express from 'express';
import dayjs from 'dayjs';
import { getDatabase } from '../db/database.js';
import { authenticateToken } from './auth.js';
import schedulerService from '../services/schedulerService.js';

const router = express.Router();
const db = getDatabase();

// 創建旅行計劃
router.post('/plans', authenticateToken, async (req, res) => {
  try {
    const { destination, startDate, endDate, duration } = req.body;

    // 驗證輸入
    if (!destination || !startDate || !endDate || !duration) {
      return res.status(400).json({ error: '請提供完整的目的地、開始日期、結束日期和旅行天數' });
    }

    // 驗證日期格式
    if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
      return res.status(400).json({ error: '請提供有效的日期格式' });
    }

    // 驗證日期邏輯
    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      return res.status(400).json({ error: '開始日期不能晚於結束日期' });
    }

    if (dayjs(startDate).isBefore(dayjs())) {
      return res.status(400).json({ error: '開始日期不能早於今天' });
    }

    // 創建旅行計劃
    const result = db.prepare(`
      INSERT INTO travel_plans (user_id, destination, start_date, end_date, duration, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(req.user.userId, destination, startDate, endDate, duration);

    const travelPlanId = result.lastInsertRowid;

    // 計算任務調度時間（提前3天開始搜索）
    const searchStartDate = dayjs(startDate).subtract(3, 'day');
    const now = dayjs();

    if (searchStartDate.isAfter(now)) {
      // 如果搜索日期在未來，安排延遲任務
      const scheduledAt = searchStartDate.format('YYYY-MM-DD HH:mm:ss');
      
      // 安排搜索任務
      await schedulerService.scheduleTask(travelPlanId, 'search_flights', scheduledAt, 1);
      await schedulerService.scheduleTask(travelPlanId, 'search_hotels', scheduledAt, 1);
      await schedulerService.scheduleTask(travelPlanId, 'search_attractions', scheduledAt, 2);
      await schedulerService.scheduleTask(travelPlanId, 'get_weather', scheduledAt, 2);
      
      // 安排報告生成和發送任務
      const reportDate = searchStartDate.add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
      await schedulerService.scheduleTask(travelPlanId, 'generate_report', reportDate, 3);
      await schedulerService.scheduleTask(travelPlanId, 'send_report', reportDate, 3);
    } else {
      // 如果搜索日期已過，立即執行任務
      await schedulerService.scheduleTask(travelPlanId, 'search_flights', now.format('YYYY-MM-DD HH:mm:ss'), 1);
      await schedulerService.scheduleTask(travelPlanId, 'search_hotels', now.format('YYYY-MM-DD HH:mm:ss'), 1);
      await schedulerService.scheduleTask(travelPlanId, 'search_attractions', now.format('YYYY-MM-DD HH:mm:ss'), 2);
      await schedulerService.scheduleTask(travelPlanId, 'get_weather', now.format('YYYY-MM-DD HH:mm:ss'), 2);
      
      // 延遲1小時生成和發送報告
      const reportDate = now.add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
      await schedulerService.scheduleTask(travelPlanId, 'generate_report', reportDate, 3);
      await schedulerService.scheduleTask(travelPlanId, 'send_report', reportDate, 3);
    }

    // 獲取創建的旅行計劃
    const travelPlan = db.prepare('SELECT * FROM travel_plans WHERE id = ?').get(travelPlanId);

    res.status(201).json({
      message: '旅行計劃創建成功',
      travelPlan,
      estimatedReportDate: searchStartDate.add(1, 'day').format('YYYY-MM-DD')
    });
  } catch (error) {
    console.error('創建旅行計劃失敗:', error);
    res.status(500).json({ error: '創建旅行計劃失敗，請稍後再試' });
  }
});

// 獲取用戶的所有旅行計劃
router.get('/plans', authenticateToken, (req, res) => {
  try {
    const travelPlans = db.prepare(`
      SELECT * FROM travel_plans 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.userId);

    res.json({ travelPlans });
  } catch (error) {
    console.error('獲取旅行計劃失敗:', error);
    res.status(500).json({ error: '獲取旅行計劃失敗' });
  }
});

// 獲取特定旅行計劃的詳細信息
router.get('/plans/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // 獲取旅行計劃基本信息
    const travelPlan = db.prepare(`
      SELECT * FROM travel_plans 
      WHERE id = ? AND user_id = ?
    `).get(id, req.user.userId);

    if (!travelPlan) {
      return res.status(404).json({ error: '旅行計劃不存在' });
    }

    // 獲取航班信息
    const flights = db.prepare('SELECT * FROM flight_info WHERE travel_plan_id = ?').all(id);

    // 獲取酒店信息
    const hotels = db.prepare('SELECT * FROM hotel_info WHERE travel_plan_id = ?').all(id);

    // 獲取景點信息
    const attractions = db.prepare('SELECT * FROM attractions WHERE travel_plan_id = ?').all(id);

    // 獲取天氣信息
    const weather = db.prepare('SELECT * FROM weather_info WHERE travel_plan_id = ? ORDER BY date ASC').all(id);

    // 獲取交通信息
    const transportation = db.prepare('SELECT * FROM transportation_info WHERE travel_plan_id = ?').all(id);

    // 獲取報告
    const reports = db.prepare('SELECT * FROM reports WHERE travel_plan_id = ? ORDER BY generated_at DESC').all(id);

    // 獲取任務狀態
    const tasks = db.prepare('SELECT * FROM tasks WHERE travel_plan_id = ? ORDER BY created_at ASC').all(id);

    res.json({
      travelPlan,
      flights,
      hotels,
      attractions,
      weather,
      transportation,
      reports,
      tasks
    });
  } catch (error) {
    console.error('獲取旅行計劃詳情失敗:', error);
    res.status(500).json({ error: '獲取旅行計劃詳情失敗' });
  }
});

// 更新旅行計劃狀態
router.put('/plans/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: '無效的狀態值' });
    }

    const result = db.prepare(`
      UPDATE travel_plans 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(status, id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '旅行計劃不存在' });
    }

    res.json({ message: '旅行計劃狀態更新成功' });
  } catch (error) {
    console.error('更新旅行計劃狀態失敗:', error);
    res.status(500).json({ error: '更新旅行計劃狀態失敗' });
  }
});

// 刪除旅行計劃
router.delete('/plans/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // 檢查旅行計劃是否存在且屬於當前用戶
    const travelPlan = db.prepare(`
      SELECT id FROM travel_plans 
      WHERE id = ? AND user_id = ?
    `).get(id, req.user.userId);

    if (!travelPlan) {
      return res.status(404).json({ error: '旅行計劃不存在' });
    }

    // 開始事務
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // 刪除相關數據
      db.prepare('DELETE FROM flight_info WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM hotel_info WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM attractions WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM weather_info WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM transportation_info WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM reports WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM tasks WHERE travel_plan_id = ?').run(id);
      db.prepare('DELETE FROM travel_plans WHERE id = ?').run(id);

      // 提交事務
      db.prepare('COMMIT').run();

      res.json({ message: '旅行計劃刪除成功' });
    } catch (error) {
      // 回滾事務
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('刪除旅行計劃失敗:', error);
    res.status(500).json({ error: '刪除旅行計劃失敗' });
  }
});

// 手動觸發搜索（用於測試）
router.post('/plans/:id/search', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    // 檢查旅行計劃是否存在且屬於當前用戶
    const travelPlan = db.prepare(`
      SELECT * FROM travel_plans 
      WHERE id = ? AND user_id = ?
    `).get(id, req.user.userId);

    if (!travelPlan) {
      return res.status(404).json({ error: '旅行計劃不存在' });
    }

    // 安排立即執行的任務
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    
    if (type === 'flights' || type === 'all') {
      await schedulerService.scheduleTask(id, 'search_flights', now, 1);
    }
    
    if (type === 'hotels' || type === 'all') {
      await schedulerService.scheduleTask(id, 'search_hotels', now, 1);
    }
    
    if (type === 'attractions' || type === 'all') {
      await schedulerService.scheduleTask(id, 'search_attractions', now, 2);
    }
    
    if (type === 'weather' || type === 'all') {
      await schedulerService.scheduleTask(id, 'get_weather', now, 2);
    }

    res.json({ message: '搜索任務已安排，請稍後查看結果' });
  } catch (error) {
    console.error('觸發搜索失敗:', error);
    res.status(500).json({ error: '觸發搜索失敗' });
  }
});

// 重新生成報告
router.post('/plans/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查旅行計劃是否存在且屬於當前用戶
    const travelPlan = db.prepare(`
      SELECT * FROM travel_plans 
      WHERE id = ? AND user_id = ?
    `).get(id, req.user.userId);

    if (!travelPlan) {
      return res.status(404).json({ error: '旅行計劃不存在' });
    }

    // 安排報告生成和發送任務
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const reportDate = dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss');
    
    await schedulerService.scheduleTask(id, 'generate_report', reportDate, 1);
    await schedulerService.scheduleTask(id, 'send_report', reportDate, 1);

    res.json({ message: '報告重新生成任務已安排，預計5分鐘後完成' });
  } catch (error) {
    console.error('重新生成報告失敗:', error);
    res.status(500).json({ error: '重新生成報告失敗' });
  }
});

// 獲取任務狀態
router.get('/plans/:id/tasks', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // 檢查旅行計劃是否存在且屬於當前用戶
    const travelPlan = db.prepare(`
      SELECT id FROM travel_plans 
      WHERE id = ? AND user_id = ?
    `).get(id, req.user.userId);

    if (!travelPlan) {
      return res.status(404).json({ error: '旅行計劃不存在' });
    }

    const tasks = db.prepare(`
      SELECT * FROM tasks 
      WHERE travel_plan_id = ? 
      ORDER BY created_at DESC
    `).all(id);

    res.json({ tasks });
  } catch (error) {
    console.error('獲取任務狀態失敗:', error);
    res.status(500).json({ error: '獲取任務狀態失敗' });
  }
});

export default router;