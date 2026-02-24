/**
 * 循环执行 backfill，直到没有待补齐仓库或达到最大轮数（规避 GitHub 限流）
 * 每轮间隔 INTERVAL_MINUTES 分钟，适合配置 GITHUB_TOKEN 后挂机跑
 *
 * 运行: GITHUB_TOKEN=xxx npx tsx src/scripts/backfill-repos-loop.ts
 * 或:   npm run backfill:repos:loop
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { getGitHubRepoFromUrl } from '../services/github-repo-info.service';

const prisma = userPrisma;
const BATCH = Math.min(parseInt(process.env.BACKFILL_BATCH || '6', 10), 15);
const DELAY_MS = parseInt(process.env.BACKFILL_DELAY_MS || '2500', 10);
const INTERVAL_MINUTES = parseInt(process.env.BACKFILL_INTERVAL_MINUTES || '60', 10);
const MAX_ROUNDS = parseInt(process.env.BACKFILL_MAX_ROUNDS || '0', 10) || 999;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function oneRound(): Promise<{ processed: number; ok: number }> {
  const need = await prisma.githubRepo.findMany({
    where: { OR: [{ starsCount: 0 }, { updatedDate: null }] },
    take: BATCH,
    orderBy: { updatedAt: 'asc' },
    select: { id: true, fullName: true },
  });
  if (need.length === 0) return { processed: 0, ok: 0 };

  let ok = 0;
  for (const repo of need) {
    try {
      const info = await getGitHubRepoFromUrl(`https://github.com/${repo.fullName}`);
      await prisma.githubRepo.update({
        where: { id: repo.id },
        data: {
          repoId: String(info.repoId),
          name: info.name,
          owner: info.owner,
          description: info.description || null,
          language: info.language || null,
          starsCount: info.starsCount,
          forksCount: info.forksCount,
          issuesCount: info.issuesCount,
          topics: JSON.stringify(info.topics || []),
          createdDate: info.createdDate,
          updatedDate: info.updatedDate,
        },
      });
      ok++;
      logger.info(`[backfill] ${repo.fullName} stars=${info.starsCount}`);
    } catch (e: any) {
      logger.warn(`[backfill] 跳过 ${repo.fullName}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }
  return { processed: need.length, ok };
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    logger.warn('未设置 GITHUB_TOKEN，请求易被 403 限流。建议在 .env 或环境变量中配置后重试。');
  }
  logger.info(`Backfill 循环: 每批 ${BATCH} 条，间隔 ${DELAY_MS}ms，每轮间隔 ${INTERVAL_MINUTES} 分钟，最多 ${MAX_ROUNDS} 轮`);

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const { processed, ok } = await oneRound();
    if (processed === 0) {
      logger.info('没有待补齐仓库，退出');
      process.exit(0);
    }
    logger.info(`第 ${round} 轮: 处理 ${processed} 条，成功 ${ok} 条`);
    if (round < MAX_ROUNDS) {
      const waitMs = INTERVAL_MINUTES * 60 * 1000;
      logger.info(`等待 ${INTERVAL_MINUTES} 分钟后进行下一轮...`);
      await sleep(waitMs);
    }
  }
  logger.info('已达最大轮数，退出');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Backfill 循环失败', err);
    process.exit(1);
  });
