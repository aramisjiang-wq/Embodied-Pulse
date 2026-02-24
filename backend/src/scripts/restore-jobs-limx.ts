/**
 * 仅同步逐际动力 38 个岗位，不清空现有数据（用于恢复 /jobs 页面数据）
 * 使用: npm run restore:jobs 或 tsx src/scripts/restore-jobs-limx.ts
 */

import { syncLimXJobs } from '../services/sync/limx-jobs.sync';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 恢复岗位数据：同步逐际动力岗位（不清空） ==========');

  const result = await syncLimXJobs();

  console.log('\n========== 结果 ==========');
  console.log('逐际动力岗位: 成功', result.synced, '条，失败', result.errors, '条');
  console.log('========================\n');

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error('恢复岗位失败', err);
  process.exit(1);
});
