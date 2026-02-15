/**
 * 手动同步GitHub项目
 */

import { syncGithubRepos } from '../services/sync/github.sync';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('开始同步GitHub项目...');
    
    const result = await syncGithubRepos('embodied-ai OR robotics OR computer-vision stars:>50', 200);
    
    logger.info('GitHub同步完成！');
    logger.info(`成功同步: ${result.synced} 个`);
    logger.info(`失败: ${result.errors} 个`);
    
    process.exit(0);
  } catch (error: any) {
    logger.error('GitHub同步失败:', error);
    process.exit(1);
  }
}

main();
