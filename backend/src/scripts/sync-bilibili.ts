/**
 * 手动同步Bilibili视频
 */

import { syncBilibiliVideos } from '../services/sync/bilibili.sync';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('开始同步Bilibili视频...');
    
    const result = await syncBilibiliVideos('机器人 OR 具身智能 OR 计算机视觉', 100);
    
    logger.info('Bilibili同步完成！');
    logger.info(`成功同步: ${result.synced} 个`);
    logger.info(`失败: ${result.errors} 个`);
    
    process.exit(0);
  } catch (error: any) {
    logger.error('Bilibili同步失败:', error);
    process.exit(1);
  }
}

main();
