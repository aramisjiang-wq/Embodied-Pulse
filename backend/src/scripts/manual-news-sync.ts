/**
 * 手动执行新闻同步
 */

import { syncFrom36Kr } from '../services/news-sync.service';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 开始手动同步36Kr新闻 ==========');
  
  try {
    const result = await syncFrom36Kr();
    logger.info(`同步完成: 新增 ${result.synced} 条新闻`);
    process.exit(0);
  } catch (error: any) {
    logger.error(`同步失败: ${error.message}`);
    process.exit(1);
  }
}

main();
