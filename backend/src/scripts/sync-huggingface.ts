/**
 * 手动同步HuggingFace模型
 */

import { syncHuggingFaceModels } from '../services/sync/huggingface.sync';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('开始同步HuggingFace模型...');
    
    const result = await syncHuggingFaceModels('robotics', 100);
    
    logger.info('HuggingFace同步完成！');
    logger.info(`成功同步: ${result.synced} 个`);
    logger.info(`失败: ${result.errors} 个`);
    
    process.exit(0);
  } catch (error: any) {
    logger.error('HuggingFace同步失败:', error);
    process.exit(1);
  }
}

main();
