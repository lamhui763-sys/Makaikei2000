import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export function getDatabase() {
  if (!db) {
    const dbPath = process.env.DATABASE_URL || './data/travel_easy.db';
    
    // 確保數據目錄存在
    const dbDir = dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export async function initDatabase() {
  const database = getDatabase();
  
  // 用戶表
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 旅行計劃表
  database.exec(`
    CREATE TABLE IF NOT EXISTS travel_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 航班信息表
  database.exec(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 酒店信息表
  database.exec(`
    CREATE TABLE IF NOT EXISTS hotel_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      hotel_name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      website TEXT,
      price_per_night DECIMAL(10,2),
      rating DECIMAL(3,2),
      amenities TEXT,
      availability BOOLEAN DEFAULT 1,
      booking_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 景點信息表
  database.exec(`
    CREATE TABLE IF NOT EXISTS attractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      rating DECIMAL(3,2),
      price DECIMAL(10,2),
      opening_hours TEXT,
      website TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 天氣信息表
  database.exec(`
    CREATE TABLE IF NOT EXISTS weather_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      date DATE NOT NULL,
      temperature_high DECIMAL(5,2),
      temperature_low DECIMAL(5,2),
      condition TEXT,
      humidity INTEGER,
      wind_speed DECIMAL(5,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 交通信息表
  database.exec(`
    CREATE TABLE IF NOT EXISTS transportation_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      cost DECIMAL(10,2),
      duration_minutes INTEGER,
      route TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 報告表
  database.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      content TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  // 任務隊列表
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travel_plan_id INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 1,
      scheduled_at DATETIME,
      completed_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travel_plan_id) REFERENCES travel_plans (id)
    )
  `);

  console.log('數據庫表結構初始化完成');
}