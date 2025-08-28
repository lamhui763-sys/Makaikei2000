import cron from 'node-cron';
import moment from 'moment';
import { db } from './db.js';
import { performTravelSearch } from './travel-search.js';

export async function startSchedulers(logger) {
  // 每天上午9點檢查需要執行搜索的旅行計劃
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('旅遊易調度器：檢查T-3天的旅行計劃');
      
      const today = moment().format('YYYY-MM-DD');
      const targetDate = moment().add(3, 'days').format('YYYY-MM-DD');
      
      // 查找3天後出發且尚未發送郵件的旅行計劃
      const trips = db
        .prepare(`
          SELECT * FROM trips 
          WHERE start_date = ? 
          AND status = 'pending' 
          AND email_sent_at IS NULL
        `)
        .all(targetDate);

      logger.info(`找到 ${trips.length} 個需要處理的旅行計劃`);

      for (const trip of trips) {
        try {
          logger.info(`開始處理旅行計劃 ${trip.id}：${trip.name} - ${trip.destination}`);
          
          // 執行完整的旅遊搜索和報告生成
          const result = await performTravelSearch(trip.id);
          
          if (result.success) {
            logger.info(`旅行計劃 ${trip.id} 處理成功，郵件已發送`);
          } else {
            logger.error(`旅行計劃 ${trip.id} 處理失敗：${result.error}`);
          }
        } catch (tripError) {
          logger.error({ tripId: trip.id, error: tripError }, '處理單個旅行計劃時發生錯誤');
        }
      }
      
      logger.info('旅遊易調度器執行完成');
    } catch (error) {
      logger.error({ error }, '調度器執行時發生錯誤');
    }
  });

  // 每小時檢查一次過期的待處理任務
  cron.schedule('0 * * * *', async () => {
    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      
      // 將昨天之前仍然是pending狀態的任務標記為過期
      const result = db.prepare(`
        UPDATE trips 
        SET status = 'expired' 
        WHERE start_date < ? 
        AND status = 'pending'
      `).run(yesterday);

      if (result.changes > 0) {
        logger.info(`標記了 ${result.changes} 個過期的旅行計劃`);
      }
    } catch (error) {
      logger.error({ error }, '清理過期任務時發生錯誤');
    }
  });

  logger.info('旅遊易調度器已啟動');
}

