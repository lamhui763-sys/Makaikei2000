import cron from 'node-cron';
import { travelPlanService } from './travelPlan.js';

export function startSchedulers(logger) {
  // 每天早上9點檢查需要發送報告的旅遊計劃
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('開始檢查需要發送的旅遊報告...');
      
      const pendingPlans = await travelPlanService.getPendingReports();
      
      if (pendingPlans.length === 0) {
        logger.info('沒有需要發送的旅遊報告');
        return;
      }

      logger.info(`找到 ${pendingPlans.length} 個需要發送的旅遊報告`);

      for (const plan of pendingPlans) {
        try {
          logger.info(`正在發送旅遊報告給 ${plan.user_name} (${plan.user_email}) - ${plan.destination}`);
          
          await travelPlanService.sendTravelReport(plan.id);
          
          logger.info(`成功發送旅遊報告給 ${plan.user_name}`);
        } catch (error) {
          logger.error(`發送旅遊報告失敗 ${plan.user_name}:`, error.message);
        }
      }
    } catch (error) {
      logger.error('定時任務執行失敗:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Hong_Kong"
  });

  // 每小時檢查一次旅遊計劃狀態
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('檢查旅遊計劃狀態...');
      
      const allPlans = await travelPlanService.getAllTravelPlans();
      const pendingPlans = allPlans.filter(plan => plan.status === 'pending');
      
      if (pendingPlans.length > 0) {
        logger.info(`發現 ${pendingPlans.length} 個待處理的旅遊計劃`);
        
        for (const plan of pendingPlans) {
          try {
            logger.info(`處理旅遊計劃: ${plan.destination} (ID: ${plan.id})`);
            await travelPlanService.collectTravelInfo(plan);
          } catch (error) {
            logger.error(`處理旅遊計劃失敗 ${plan.id}:`, error.message);
          }
        }
      }
    } catch (error) {
      logger.error('檢查旅遊計劃狀態失敗:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Hong_Kong"
  });

  logger.info('定時任務已啟動');
}

