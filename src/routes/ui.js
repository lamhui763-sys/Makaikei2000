import express from 'express';
import dayjs from 'dayjs';
import { db } from '../services/db.js';
import { aggregateForTrip } from '../adapters/aggregate.js';

export const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', {
    title: '旅遊易 TravelEase',
  });
});

router.post('/trips', (req, res) => {
  const { name, email, destination, city, startDate, days } = req.body;
  const start = dayjs(startDate);
  const daysInt = parseInt(days, 10);

  if (!name || !email || !destination || !city || !start.isValid() || !daysInt) {
    return res.status(400).render('home', { title: '旅遊易 TravelEase', error: '請填寫所有必填字段' });
  }

  const stmt = db.prepare(
    `INSERT INTO trips (name, email, country, city, start_date, days, created_at) VALUES (?,?,?,?,?,?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
  );
  const info = stmt.run(name, email, destination, city, start.format('YYYY-MM-DD'), daysInt);

  return res.render('submitted', { id: info.lastInsertRowid });
});

router.get('/trips/:id/preview', async (req, res) => {
  const id = Number(req.params.id);
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) {
    return res.status(404).send('Trip not found');
  }
  try {
    const report = await aggregateForTrip(trip, console);
    return res.render('preview', { trip, report });
  } catch (error) {
    return res.status(500).send('Failed to aggregate data');
  }
});

