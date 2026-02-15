import { syncAllUploaders } from './src/services/sync-queue.service';
import { logger } from './src/utils/logger';
import { BilibiliCookieManager } from './src/services/bilibili-cookie-manager.service';

BilibiliCookieManager.initialize();
logger.info('Bilibili Cookie manager initialized');

async function syncAllWithMoreVideos() {
  try {
    logger.info('开始同步所有UP主，每个UP主最多同步200个视频');
    logger.info('注意：系统会自动在UP主之间添加延迟以规避风控');
    
    const result = await syncAllUploaders(200);
    
    logger.info('同步完成！');
    logger.info(`总计: ${result.totalSynced} 个视频成功, ${result.totalErrors} 个失败`);
    logger.info(`详细结果:`);
    
    result.tasks.forEach((task, index) => {
      if (task.status === 'completed') {
        logger.info(`  [${index + 1}] ${task.name}: 成功 ${task.synced} 个`);
      } else if (task.status === 'failed') {
        logger.error(`  [${index + 1}] ${task.name}: 失败 - ${task.error}`);
      } else {
        logger.warn(`  [${index + 1}] ${task.name}: ${task.status}`);
      }
    });
    
    process.exit(0);
  } catch (error: any) {
    logger.error('同步失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

syncAllWithMoreVideos();