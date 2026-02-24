/**
 * 从「具身智能GitHub仓库资源清单」仅用文档数据写入仓库（不请求 GitHub API）
 * 用于先把条目都加进库，缺失的 stars/forks/language 等由 backfill-repos-from-github.ts 后续补齐
 *
 * 运行: npx tsx src/scripts/add-repos-from-list-minimal.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { parseGitHubUrl } from '../services/github-repo-info.service';
import { createRepo } from '../services/repo.service';

const prisma = userPrisma;
const DOC_RELATIVE = 'docs/具身智能GitHub仓库资源清单.md';

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

function extractUrlFromCell(cell: string): string | null {
  const m = cell.match(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/);
  return m ? m[2].trim() : null;
}

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

function fullNameToRepoId(fullName: string): number {
  let h = 0;
  for (let i = 0; i < fullName.length; i++) {
    h = (h << 5) - h + fullName.charCodeAt(i);
    h = h & 0x7fffffff;
  }
  return Math.abs(h) + 1000000000;
}

async function main() {
  logger.info('从资源清单仅用文档数据添加仓库（不请求 GitHub）...');

  const resolved = resolveDocPath();
  if (!fs.existsSync(resolved)) {
    logger.error('未找到资源清单: ' + DOC_RELATIVE);
    process.exit(1);
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const parsed = parseMarkdown(content);

  const existing = await prisma.githubRepo.findMany({
    where: { fullName: { in: parsed.map((r) => (parseGitHubUrl(r.url) ? `${parseGitHubUrl(r.url)!.owner}/${parseGitHubUrl(r.url)!.repo}` : '')).filter(Boolean) as string[] } },
    select: { fullName: true },
  });
  const existingSet = new Set(existing.map((r) => r.fullName));

  let added = 0;
  const seen = new Set<string>();

  for (const row of parsed) {
    const p = parseGitHubUrl(row.url);
    if (!p) continue;
    const fullName = `${p.owner}/${p.repo}`;
    if (existingSet.has(fullName) || seen.has(fullName)) continue;
    seen.add(fullName);

    try {
      await createRepo({
        repoId: fullNameToRepoId(fullName),
        name: row.name.trim() || p.repo,
        fullName,
        owner: p.owner,
        description: row.description?.trim() || null,
        language: null,
        starsCount: 0,
        forksCount: 0,
        issuesCount: 0,
        topics: row.category ? [row.category] : [],
        createdDate: null,
        updatedDate: null,
        addedBy: 'admin',
        notifyEnabled: true,
        category: row.category || undefined,
      });
      added++;
      logger.info(`[${added}] 添加(仅文档): ${fullName}`);
    } catch (e: any) {
      if (e.message === 'REPO_ALREADY_EXISTS') continue;
      logger.error(`添加失败 ${fullName}: ${e.message}`);
    }
  }

  logger.info(`完成: 新增 ${added} 个仓库，已存在已跳过。可运行 npm run backfill:repos 分批从 GitHub 补齐字段。`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('脚本失败', err);
    process.exit(1);
  });
