/**
 * 定时数据同步任务
 * 使用node-cron或直接通过npm script定期执行
 */

import { syncAllData, syncEmbodiedAIData } from '../services/sync';
import { logger } from '../utils/logger';

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all'; // all | embodied-ai

  logger.info(`========== 开始定时同步任务 (模式: ${mode}) ==========`);

  try {
    if (mode === 'embodied-ai') {
      await syncEmbodiedAIData();
    } else {
      await syncAllData();
    }

    logger.info('========== 定时同步任务完成 ==========');
    process.exit(0);
  } catch (error: any) {
    logger.error(`定时同步任务失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行
main();
