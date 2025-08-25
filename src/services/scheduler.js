import cron from 'node-cron';
import dayjs from 'dayjs';
import { db } from './db.js';
import { aggregateForTrip } from '../adapters/aggregate.js';
import { sendItineraryEmail } from './sendEmail.js';

export async function startSchedulers(logger) {
  // Run every day at 09:00 server time
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Scheduler tick: checking trips for T-3 days');
      const today = dayjs().format('YYYY-MM-DD');
      const targetDate = dayjs().add(3, 'day').format('YYYY-MM-DD');
      const trips = db
        .prepare(
          `SELECT * FROM trips WHERE start_date = ? AND (emailed_at IS NULL)`
        )
        .all(targetDate);

      for (const trip of trips) {
        logger.info({ tripId: trip.id }, 'Aggregating data');
        const report = await aggregateForTrip(trip, logger);
        await sendItineraryEmail(trip, report, logger);
        db.prepare(`UPDATE trips SET emailed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`).run(trip.id);
      }
    } catch (error) {
      logger.error({ error }, 'Error during scheduled job');
    }
  });
}

