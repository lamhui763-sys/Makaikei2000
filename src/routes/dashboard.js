import express from 'express';
import { authenticateToken } from './auth.js';

const router = express.Router();

// 儀表板頁面
router.get('/', authenticateToken, (req, res) => {
  res.render('dashboard', {
    title: '旅遊易 - 個人儀表板',
    user: req.user
  });
});

export default router;