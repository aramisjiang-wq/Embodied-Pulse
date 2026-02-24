/**
 * 按「具身智能GitHub仓库资源清单」对已有仓库重分类（写入 category 字段）
 * 清单中出现的 fullName 会更新为对应 1.1～6.7 分类；未出现的可设为 6.3（综合资源）或保持 null。
 *
 * 运行（在 backend 目录下）:
 *   npx tsx src/scripts/reclassify-repos-from-list.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { parseGitHubUrl } from '../services/github-repo-info.service';

const prisma = userPrisma;
const DOC_RELATIVE = 'docs/08-资源/具身智能GitHub仓库资源清单.md';

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

function parseMarkdown(content: string): { fullName: string; category: string }[] {
  const rows: { fullName: string; category: string }[] = [];
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
    const lastCell = cells[cells.length - 1];
    const rawUrl = extractUrlFromCell(lastCell) || lastCell;
    if (!rawUrl || !rawUrl.includes('github.com')) continue;
    const normalized = normalizeGitHubUrl(rawUrl);
    if (!normalized) continue;
    const p = parseGitHubUrl(normalized);
    if (!p) continue;
    const fullName = `${p.owner}/${p.repo}`;
    rows.push({ fullName, category: currentCategory });
  }
  return rows;
}

async function main() {
  logger.info('按资源清单重分类已有仓库（category）...');

  const resolved = resolveDocPath();
  if (!fs.existsSync(resolved)) {
    logger.error('未找到资源清单文件: ' + DOC_RELATIVE);
    process.exit(1);
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const parsed = parseMarkdown(content);
  const fullNameToCategory = new Map<string, string>();
  for (const row of parsed) {
    fullNameToCategory.set(row.fullName, row.category);
  }
  logger.info(`清单中共 ${fullNameToCategory.size} 个 GitHub 仓库（去重前 ${parsed.length} 条）`);

  const allRepos = await prisma.githubRepo.findMany({
    select: { id: true, fullName: true, category: true },
  });

  let updated = 0;
  for (const repo of allRepos) {
    const targetCategory = fullNameToCategory.get(repo.fullName);
    if (!targetCategory) continue;
    if (repo.category !== targetCategory) {
      await prisma.githubRepo.update({
        where: { id: repo.id },
        data: { category: targetCategory },
      });
      updated++;
    }
  }

  const inList = allRepos.filter((r) => fullNameToCategory.has(r.fullName)).length;
  logger.info(`重分类结束: 清单中已有仓库 ${inList} 个，本次更新 category 共 ${updated} 个；未在清单中的仓库保持原 category（或空）`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('脚本执行失败', err);
    process.exit(1);
  });
