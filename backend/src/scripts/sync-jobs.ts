/**
 * 手动同步Jobs招聘信息
 */

import { syncJobsFromGithub } from '../services/sync/jobs.sync';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('开始同步Jobs招聘信息...');
    
    const result = await syncJobsFromGithub({ maxResults: 50 });
    
    logger.info('Jobs同步完成！');
    logger.info(`成功同步: ${result.synced} 个`);
    logger.info(`失败: ${result.errors} 个`);
    
    process.exit(0);
  } catch (error: any) {
    logger.error('Jobs同步失败:', error);
    process.exit(1);
  }
}

main();
