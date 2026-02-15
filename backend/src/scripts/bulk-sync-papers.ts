/**
 * 批量同步 arXiv 论文脚本
 * 从最近到最远获取 1000 篇论文
 */

import { syncArxivPapers } from '../services/sync/arxiv.sync';
import { logger } from '../utils/logger';

const KEYWORDS = [
  'embodied AI',
  'robotics',
  'computer vision',
  'machine learning',
  'deep learning',
  'reinforcement learning',
  'neural networks',
  'natural language processing',
  'autonomous systems',
  'human-robot interaction',
  'robotic manipulation',
  'sim-to-real',
  'domain randomization',
  'multi-agent systems',
  'control systems',
  'perception',
  'planning',
  'navigation',
];

const TOTAL_PAPERS = 1000;
const BATCH_SIZE = 100;

async function main() {
  logger.info(`开始批量同步 ${TOTAL_PAPERS} 篇 arXiv 论文`);

  let totalSynced = 0;
  let totalErrors = 0;
  const results: any[] = [];

  for (let i = 0; i < KEYWORDS.length && totalSynced < TOTAL_PAPERS; i++) {
    const keyword = KEYWORDS[i];
    const remaining = TOTAL_PAPERS - totalSynced;
    const batchSize = Math.min(BATCH_SIZE, remaining);

    if (batchSize <= 0) break;

    try {
      logger.info(`正在同步关键词 "${keyword}"，批次大小: ${batchSize}`);
      
      const result = await syncArxivPapers(
        keyword,
        batchSize
      );

      totalSynced += result.synced;
      totalErrors += result.errors;
      
      results.push({
        keyword,
        synced: result.synced,
        errors: result.errors,
        total: result.total,
      });

      logger.info(`关键词 "${keyword}" 完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
      logger.info(`总进度: ${totalSynced}/${TOTAL_PAPERS} 篇`);

      if (totalSynced >= TOTAL_PAPERS) {
        logger.info('已达到目标数量，停止同步');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      logger.error(`同步关键词 "${keyword}" 失败: ${error.message}`);
      totalErrors++;
    }
  }

  logger.info('='.repeat(60));
  logger.info('批量同步完成！');
  logger.info('='.repeat(60));
  logger.info(`总成功: ${totalSynced} 篇`);
  logger.info(`总失败: ${totalErrors} 篇`);
  logger.info(`目标: ${TOTAL_PAPERS} 篇`);
  logger.info(`完成率: ${((totalSynced / TOTAL_PAPERS) * 100).toFixed(2)}%`);
  logger.info('='.repeat(60));

  results.forEach((r, idx) => {
    logger.info(`[${idx + 1}] ${r.keyword}: ${r.synced}/${r.total} (错误: ${r.errors})`);
  });

  process.exit(0);
}

main().catch((error) => {
  logger.error('脚本执行失败:', error);
  process.exit(1);
});
