import { db } from '../services/db.js';

export async function initDatabase(logger) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      start_date TEXT NOT NULL,
      days INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      last_run_at TEXT,
      emailed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
    CREATE INDEX IF NOT EXISTS idx_trips_email ON trips(email);
  `);
  logger.info('Database initialized');
}

