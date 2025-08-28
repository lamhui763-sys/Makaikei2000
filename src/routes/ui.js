import express from 'express';
import { travelPlanService } from '../services/travelPlan.js';

export const router = express.Router();

// 主頁
router.get('/', (req, res) => {
  res.render('index', {
    title: '旅遊易 - 智能旅遊個人助理',
    message: req.query.message || ''
  });
});

// 創建旅遊計劃頁面
router.get('/create', (req, res) => {
  res.render('create', {
    title: '創建旅遊計劃',
    message: req.query.message || ''
  });
});

// 旅遊計劃列表頁面
router.get('/plans', async (req, res) => {
  try {
    const plans = await travelPlanService.getAllTravelPlans();
    res.render('plans', {
      title: '旅遊計劃列表',
      plans: plans
    });
  } catch (error) {
    res.render('plans', {
      title: '旅遊計劃列表',
      plans: [],
      error: error.message
    });
  }
});

// 旅遊計劃詳情頁面
router.get('/plan/:id', async (req, res) => {
  try {
    const plan = await travelPlanService.getTravelPlan(req.params.id);
    if (!plan) {
      return res.redirect('/plans?message=旅遊計劃不存在');
    }
    
    res.render('plan-detail', {
      title: `${plan.destination} 旅遊計劃`,
      plan: plan
    });
  } catch (error) {
    res.redirect(`/plans?message=${encodeURIComponent(error.message)}`);
  }
});

// API: 創建旅遊計劃
router.post('/api/travel-plans', async (req, res) => {
  try {
    const { name, email, destination, startDate, duration } = req.body;
    
    if (!name || !email || !destination || !startDate || !duration) {
      return res.status(400).json({
        success: false,
        message: '請填寫所有必要信息'
      });
    }

    const userData = { name, email };
    const travelData = { destination, startDate, duration: parseInt(duration) };
    
    const travelPlan = await travelPlanService.createTravelPlan(userData, travelData);
    
    res.json({
      success: true,
      message: '旅遊計劃創建成功！我們將在旅行前三天發送完整報告到您的郵箱。',
      planId: travelPlan.id
    });
  } catch (error) {
    console.error('創建旅遊計劃失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建旅遊計劃失敗，請稍後再試'
    });
  }
});

// API: 獲取旅遊計劃
router.get('/api/travel-plans/:id', async (req, res) => {
  try {
    const plan = await travelPlanService.getTravelPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '旅遊計劃不存在'
      });
    }
    
    res.json({
      success: true,
      plan: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取旅遊計劃失敗'
    });
  }
});

// API: 手動發送旅遊報告
router.post('/api/travel-plans/:id/send-report', async (req, res) => {
  try {
    const result = await travelPlanService.sendTravelReport(req.params.id);
    res.json({
      success: true,
      message: '旅遊報告已發送'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '發送旅遊報告失敗'
    });
  }
});

// API: 獲取所有旅遊計劃
router.get('/api/travel-plans', async (req, res) => {
  try {
    const plans = await travelPlanService.getAllTravelPlans();
    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取旅遊計劃列表失敗'
    });
  }
});

