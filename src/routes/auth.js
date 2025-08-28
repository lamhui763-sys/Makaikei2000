import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database.js';

const router = express.Router();
const db = getDatabase();

// 用戶註冊
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // 驗證輸入
    if (!email || !password) {
      return res.status(400).json({ error: '請提供郵箱和密碼' });
    }

    // 檢查郵箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '請提供有效的郵箱地址' });
    }

    // 檢查郵箱是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: '該郵箱已被註冊' });
    }

    // 加密密碼
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 創建用戶
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, phone)
      VALUES (?, ?, ?, ?)
    `).run(email, passwordHash, name || null, phone || null);

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: result.lastInsertRowid, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '註冊成功',
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        name,
        phone
      }
    });
  } catch (error) {
    console.error('註冊失敗:', error);
    res.status(500).json({ error: '註冊失敗，請稍後再試' });
  }
});

// 用戶登錄
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 驗證輸入
    if (!email || !password) {
      return res.status(400).json({ error: '請提供郵箱和密碼' });
    }

    // 查找用戶
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: '郵箱或密碼錯誤' });
    }

    // 驗證密碼
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '郵箱或密碼錯誤' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登錄成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('登錄失敗:', error);
    res.status(500).json({ error: '登錄失敗，請稍後再試' });
  }
});

// 驗證令牌中間件
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '請提供訪問令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌無效或已過期' });
    }
    req.user = user;
    next();
  });
};

// 獲取當前用戶信息
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?').get(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('獲取用戶信息失敗:', error);
    res.status(500).json({ error: '獲取用戶信息失敗' });
  }
});

// 更新用戶信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const result = db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || null, phone || null, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const updatedUser = db.prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?').get(req.user.userId);

    res.json({
      message: '個人資料更新成功',
      user: updatedUser
    });
  } catch (error) {
    console.error('更新個人資料失敗:', error);
    res.status(500).json({ error: '更新個人資料失敗' });
  }
});

// 修改密碼
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '請提供當前密碼和新密碼' });
    }

    // 獲取當前用戶信息
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // 驗證當前密碼
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: '當前密碼錯誤' });
    }

    // 加密新密碼
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密碼
    const result = db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPasswordHash, req.user.userId);

    if (result.changes === 0) {
      return res.status(500).json({ error: '密碼更新失敗' });
    }

    res.json({ message: '密碼修改成功' });
  } catch (error) {
    console.error('修改密碼失敗:', error);
    res.status(500).json({ error: '修改密碼失敗' });
  }
});

// 登出（客戶端刪除令牌）
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: '登出成功' });
});

export default router;