/**
 * 手动触发招聘信息同步脚本
 * 用于测试招聘信息同步功能
 */

import { logger } from '../utils/logger';
import JobSyncScheduler from '../services/job-sync-scheduler.service';

async function manualSync() {
  logger.info('开始手动触发招聘信息同步...');
  
  const scheduler = new JobSyncScheduler();
  const result = await scheduler.manualSync();
  
  console.log('\n========== 同步结果 ==========');
  console.log(`成功: ${result.success}`);
  console.log(`数据源数量: ${result.sources}`);
  console.log(`抓取数量: ${result.scraped}`);
  console.log(`清洗数量: ${result.cleaned}`);
  console.log(`去重数量: ${result.deduplicated}`);
  console.log(`过滤数量: ${result.filtered}`);
  console.log(`保存数量: ${result.saved}`);
  console.log(`耗时: ${result.duration}ms`);
  
  if (result.error) {
    console.log(`错误: ${result.error}`);
  }
  console.log('==============================\n');
  
  if (result.success) {
    logger.info('招聘信息同步成功完成');
    process.exit(0);
  } else {
    logger.error('招聘信息同步失败');
    process.exit(1);
  }
}

if (require.main === module) {
  manualSync()
    .then(() => {
      logger.info('同步脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('同步脚本执行失败:', error);
      process.exit(1);
    });
}

export { manualSync };
