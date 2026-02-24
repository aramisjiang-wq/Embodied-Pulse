/**
 * 管理端批量导入：从「具身智能GitHub仓库资源清单.md」按分类导入仓库
 * - 以管理员身份录入（addedBy = 'admin'），模拟管理端配置流程
 * - 批量去重：一次查询出已存在的 fullName，只对未收录的仓库请求 GitHub 并写入
 * - 并发拉取：可控并发数 + 请求间隔，带重试，避免限流与失败雪崩
 *
 * 运行（在 backend 目录下）:
 *   npx tsx src/scripts/import-embodied-repos-from-list.ts
 * 或: npm run import:embodied-repos
 *
 * 环境变量:
 *   GITHUB_TOKEN - 可选，提高限流后可适当增大并发
 */

import * as fs from 'fs';
import * as path from 'path';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { getGitHubRepoFromUrl, parseGitHubUrl } from '../services/github-repo-info.service';
import { createRepo } from '../services/repo.service';

const prisma = userPrisma;

const DOC_RELATIVE = 'docs/具身智能GitHub仓库资源清单.md';

/** 无 token 时并发数，有 token 时可更高 */
const CONCURRENCY = process.env.GITHUB_TOKEN ? 5 : 3;
/** 每批请求之间的间隔（ms），避免 403 */
const DELAY_MS = process.env.GITHUB_TOKEN ? 200 : 450;
/** 可重试的错误码 */
const RETRY_STATUSES = [403, 502, 503];
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [2000, 5000];

function resolveDocPath(): string {
  const fromCwd = path.resolve(process.cwd(), DOC_RELATIVE);
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromCwdParent = path.resolve(process.cwd(), '..', DOC_RELATIVE);
  if (fs.existsSync(fromCwdParent)) return fromCwdParent;
  return path.resolve(__dirname, '../../../', DOC_RELATIVE);
}

function normalizeGitHubUrl(url: string): string | null {
  const u = url.trim();
  const m = u.match(/https?:\/\/github\.com\/([^\/]+)\/([^\/\?#]+)/i);
  if (!m) return null;
  return `https://github.com/${m[1]}/${m[2]}`;
}

/** 从 Markdown 链接单元格提取 URL，如 [GitHub](https://github.com/xx/yy) */
function extractUrlFromCell(cell: string): string | null {
  const m = cell.match(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/);
  return m ? m[2].trim() : null;
}

/** 从 ## 1.1 视觉-语言-动作模型 (VLA) 提取分类 id "1.1" */
function extractCategoryId(heading: string): string | null {
  const m = heading.match(/^(\d+\.\d+)\s/);
  return m ? m[1] : null;
}

interface ParsedRow {
  name: string;
  url: string;
  description: string;
  category: string;
}

function parseMarkdown(content: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let currentCategory = '';

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const heading = sectionMatch[1].trim();
      const id = extractCategoryId(heading);
      if (id) currentCategory = id;
      continue;
    }
    if (!line.startsWith('|') || line.includes('---')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const name = cells[0];
    const lastCell = cells[cells.length - 1];
    const rawUrl = extractUrlFromCell(lastCell) || lastCell;
    if (!rawUrl || !rawUrl.includes('github.com')) continue;
    const normalized = normalizeGitHubUrl(rawUrl);
    if (!normalized) continue;
    const description = cells.length >= 3 ? (cells[cells.length - 2] || '') : '';
    rows.push({ name, url: normalized, description, category: currentCategory });
  }
  return rows;
}

/** 带重试的拉取单条 GitHub 信息 */
async function fetchRepoWithRetry(url: string): Promise<ReturnType<typeof getGitHubRepoFromUrl>> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await getGitHubRepoFromUrl(url);
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status ?? e?.status;
      const isRetryable = RETRY_STATUSES.includes(status) || e?.message?.includes('API访问受限');
      if (attempt < MAX_RETRIES && isRetryable) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 5000;
        logger.warn(`拉取失败将重试 (${url}), ${delay}ms 后第 ${attempt + 2} 次: ${e?.message}`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }
  throw lastErr || new Error('fetchRepoWithRetry failed');
}

/** 并发池：最多 concurrency 个任务同时执行，按 index 回填结果 */
async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  delayBetweenStartMs: number
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = undefined;
        logger.error(`任务 ${i + 1}/${items.length} 失败:`, (e as Error)?.message);
      }
      if (delayBetweenStartMs > 0) {
        await new Promise((r) => setTimeout(r, delayBetweenStartMs));
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  logger.info('管理端批量导入：从具身智能GitHub仓库资源清单导入（addedBy=admin）...');

  const resolved = resolveDocPath();
  if (!fs.existsSync(resolved)) {
    logger.error('未找到资源清单文件: ' + DOC_RELATIVE);
    process.exit(1);
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const parsed = parseMarkdown(content);
  logger.info(`解析到 ${parsed.length} 条仓库记录`);

  const allFullNames = parsed
    .map((r) => parseGitHubUrl(r.url) && `${parseGitHubUrl(r.url)!.owner}/${parseGitHubUrl(r.url)!.repo}`)
    .filter(Boolean) as string[];

  const uniqueFullNames = [...new Set(allFullNames)];
  if (uniqueFullNames.length === 0) {
    logger.info('没有有效的 GitHub 仓库链接，退出');
    process.exit(0);
  }

  const existingRepos = await prisma.githubRepo.findMany({
    where: { fullName: { in: uniqueFullNames } },
    select: { fullName: true },
  });
  const existingSet = new Set(existingRepos.map((r) => r.fullName));

  const toAdd: ParsedRow[] = [];
  const seen = new Set<string>();
  for (const row of parsed) {
    const p = parseGitHubUrl(row.url);
    if (!p) continue;
    const fullName = `${p.owner}/${p.repo}`;
    if (existingSet.has(fullName) || seen.has(fullName)) continue;
    seen.add(fullName);
    toAdd.push(row);
  }

  logger.info(`已存在 ${existingSet.size} 个，待导入 ${toAdd.length} 个，并发数 ${CONCURRENCY}，间隔 ${DELAY_MS}ms`);

  const results = await runPool(
    toAdd,
    CONCURRENCY,
    async (row, index) => {
      const repoInfo = await fetchRepoWithRetry(row.url);
      const topics = Array.isArray(repoInfo.topics) ? [...repoInfo.topics] : [];
      if (row.category && !topics.includes(row.category)) topics.push(row.category);

      await createRepo({
        repoId: repoInfo.repoId,
        name: repoInfo.name,
        fullName: repoInfo.fullName,
        owner: repoInfo.owner,
        description: row.description || repoInfo.description,
        language: repoInfo.language,
        starsCount: repoInfo.starsCount,
        forksCount: repoInfo.forksCount,
        issuesCount: repoInfo.issuesCount,
        topics,
        createdDate: repoInfo.createdDate,
        updatedDate: repoInfo.updatedDate,
        addedBy: 'admin',
        notifyEnabled: true,
        category: row.category || undefined,
      });

      logger.info(`[${index + 1}/${toAdd.length}] 添加: ${repoInfo.fullName}`);
      return repoInfo;
    },
    DELAY_MS
  );

  const successCount = results.filter(Boolean).length;
  const errorCount = toAdd.length - successCount;
  logger.info('导入结束: 成功=%s, 跳过(已存在)=%s, 失败=%s', successCount, existingSet.size, errorCount);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('脚本执行失败', err);
    process.exit(1);
  });
