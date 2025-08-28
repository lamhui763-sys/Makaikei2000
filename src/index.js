import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pino from 'pino';
import pinoPretty from 'pino-pretty';

// 路由導入
import authRoutes from './routes/auth.js';
import travelRoutes from './routes/travel.js';
import apiRoutes from './routes/api.js';
import dashboardRoutes from './routes/dashboard.js';

// 數據庫初始化
import { initDatabase } from './db/database.js';

// 服務導入
import schedulerService from './services/schedulerService.js';

// 環境變量配置
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 日誌配置
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中間件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.amadeus.com", "https://api.openai.com"]
    }
  }
}));

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 限制每個IP 15分鐘內最多100個請求
  message: '請求過於頻繁，請稍後再試'
});
app.use('/api/', limiter);

// 解析中間件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態文件服務
app.use(express.static(join(__dirname, '../public')));

// 設置視圖引擎
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// 路由
app.use('/auth', authRoutes);
app.use('/travel', travelRoutes);
app.use('/api', apiRoutes);
app.use('/dashboard', dashboardRoutes);

// 主頁路由
app.get('/', (req, res) => {
  res.render('index', {
    title: '旅遊易 - 智能旅遊規劃個人助理',
    description: '讓AI為您規劃完美的旅行體驗'
  });
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).render('404', {
    title: '頁面未找到',
    message: '抱歉，您訪問的頁面不存在'
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '服務器內部錯誤' 
      : err.message
  });
});

// 啟動服務器
async function startServer() {
  try {
    // 初始化數據庫
    await initDatabase();
    logger.info('數據庫初始化完成');

    // 啟動任務調度器
    schedulerService.startSchedulers();
    logger.info('任務調度器已啟動');

    app.listen(PORT, () => {
      logger.info(`旅遊易服務器運行在端口 ${PORT}`);
      logger.info(`訪問地址: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('服務器啟動失敗:', error);
    process.exit(1);
  }
}

startServer();

