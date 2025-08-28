import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function initDatabase(logger) {
  const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../data/travel_easy.db');
  
  // 確保數據庫目錄存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  
  // 創建用戶表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 創建旅遊計劃表
  db.exec(`
    CREATE TABLE IF NOT EXISTS travel_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 創建航班信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS flight_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      airline TEXT,
      flight_number TEXT,
      departure_airport TEXT,
      arrival_airport TEXT,
      departure_time DATETIME,
      arrival_time DATETIME,
      price DECIMAL(10,2),
      booking_url TEXT,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 創建酒店信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS hotel_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      hotel_name TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      price_per_night DECIMAL(10,2),
      availability BOOLEAN,
      rating DECIMAL(3,2),
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 創建景點信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS attraction_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      attraction_name TEXT,
      description TEXT,
      address TEXT,
      rating DECIMAL(3,2),
      ticket_price DECIMAL(10,2),
      opening_hours TEXT,
      website TEXT,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 創建報告發送記錄表
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent',
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  logger.info('Database initialized successfully');
  return db;
}

export function getDatabase() {
  return db;
}

import fs from 'fs';

