import { db } from '../services/db.js';

export async function initDatabase(logger) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      destination TEXT NOT NULL,
      start_date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      budget REAL,
      travelers INTEGER DEFAULT 1,
      preferences TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      search_date TEXT,
      email_sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS flight_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      return_date TEXT,
      price REAL,
      airline TEXT,
      flight_number TEXT,
      booking_url TEXT,
      searched_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    );

    CREATE TABLE IF NOT EXISTS hotel_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      hotel_name TEXT,
      price_per_night REAL,
      rating REAL,
      phone TEXT,
      website TEXT,
      amenities TEXT,
      availability TEXT,
      searched_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    );

    CREATE TABLE IF NOT EXISTS travel_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      attractions TEXT,
      weather_info TEXT,
      transportation_tips TEXT,
      local_cuisine TEXT,
      travel_guides TEXT,
      ai_recommendations TEXT,
      generated_at TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    );

    CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
    CREATE INDEX IF NOT EXISTS idx_trips_email ON trips(email);
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_flight_searches_trip_id ON flight_searches(trip_id);
    CREATE INDEX IF NOT EXISTS idx_hotel_searches_trip_id ON hotel_searches(trip_id);
    CREATE INDEX IF NOT EXISTS idx_travel_reports_trip_id ON travel_reports(trip_id);
  `);
  logger.info('旅遊易數據庫初始化完成');
}

