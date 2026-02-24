/**
 * 从 GitHub Awesome-Embodied-AI-Job 抓取 2026 年岗位，不清空现有数据（与逐际动力等并存）
 * 使用: npm run sync:github-jobs-2026 或 tsx src/scripts/sync-github-jobs-2026.ts
 */

import { syncJobsFromGithub } from '../services/sync/jobs.sync';
import { logger } from '../utils/logger';

async function main() {
  logger.info('========== 抓取 GitHub 2026 年岗位（不清空现有） ==========');

  const result = await syncJobsFromGithub({
    year: 2026,
    clearExisting: false,
    maxResults: 2000,
  });

  console.log('\n========== 结果 ==========');
  console.log('GitHub 2026 岗位: 成功', result.synced, '条，失败', result.errors, '条');
  console.log('========================\n');

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error('抓取 GitHub 岗位失败', err);
  process.exit(1);
});
