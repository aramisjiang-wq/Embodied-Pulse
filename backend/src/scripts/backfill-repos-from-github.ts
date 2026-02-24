/**
 * 分批从 GitHub API 补齐仓库字段（stars/forks/language/updatedDate 等），规避限流
 * 每次运行只处理 BATCH 条，间隔 DELAY_MS，可多次执行或配合 cron 持续更新
 *
 * 运行: npx tsx src/scripts/backfill-repos-from-github.ts
 * 可选: BACKFILL_BATCH=5 BACKFILL_DELAY_MS=3000 npx tsx src/scripts/backfill-repos-from-github.ts
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { getGitHubRepoFromUrl, parseGitHubUrl } from '../services/github-repo-info.service';

const prisma = userPrisma;

const BATCH = Math.min(parseInt(process.env.BACKFILL_BATCH || '8', 10), 20);
const DELAY_MS = parseInt(process.env.BACKFILL_DELAY_MS || '2500', 10);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  logger.info(`Backfill: 每批 ${BATCH} 条，间隔 ${DELAY_MS}ms，可多次运行或配合 cron`);

  const needBackfill = await prisma.githubRepo.findMany({
    where: {
      OR: [{ starsCount: 0 }, { updatedDate: null }],
    },
    take: BATCH,
    orderBy: { updatedAt: 'asc' },
    select: { id: true, fullName: true },
  });

  if (needBackfill.length === 0) {
    logger.info('没有需要补齐的仓库，退出');
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;

  for (const repo of needBackfill) {
    const url = `https://github.com/${repo.fullName}`;
    try {
      const info = await getGitHubRepoFromUrl(url);
      const topicsValue = Array.isArray(info.topics) ? JSON.stringify(info.topics) : '[]';
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
          topics: topicsValue,
          createdDate: info.createdDate,
          updatedDate: info.updatedDate,
        },
      });
      ok++;
      logger.info(`[${ok}/${needBackfill.length}] 已补齐: ${repo.fullName} (stars=${info.starsCount})`);
    } catch (e: any) {
      fail++;
      logger.warn(`跳过 ${repo.fullName}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  logger.info(`本批结束: 成功 ${ok}, 失败 ${fail}。可再次运行以处理更多。`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Backfill 失败', err);
    process.exit(1);
  });
