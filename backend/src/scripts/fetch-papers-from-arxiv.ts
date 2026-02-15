/**
 * 从ArXiv API批量拉取论文
 * 基于论文搜索关键词管理页面的关键词
 */

import { logger } from '../utils/logger';
import userPrisma, { ensureUserDatabaseConnected } from '../config/database.user';
import adminPrisma, { ensureAdminDatabaseConnected } from '../config/database.admin';
import axios from 'axios';

const prisma = userPrisma;
const adminPrismaClient = adminPrisma;

interface ArXivPaper {
  id: string;
  title: string;
  summary: string;
  published: string;
  authors: { name: string }[];
  primary_category: string;
  categories: string[];
  pdf_url?: string;
}

interface ArXivResponse {
  feed: {
    entry: any[];
  };
}

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
const MAX_PAPERS_PER_KEYWORD = 50;
const MIN_TOTAL_PAPERS = 1000;

async function fetchArXivPapers(keyword: string, maxResults: number = MAX_PAPERS_PER_KEYWORD): Promise<ArXivPaper[]> {
  try {
    const query = `all:${keyword}`;
    const url = `${ARXIV_API_BASE}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

    logger.info(`正在从ArXiv拉取关键词 "${keyword}" 的论文...`);
    
    const response = await axios.get<string>(url, {
      headers: {
        'Accept': 'application/xml',
      },
      timeout: 60000,
    });

    const xml2js = require('xml2js');
    const result = await xml2js.parseStringPromise(response.data);
    
    const entries = result.feed?.entry || [];
    
    const papers: ArXivPaper[] = entries.map((entry: any) => {
      const idArray = Array.isArray(entry.id) ? entry.id : [entry.id];
      const id = typeof idArray[0] === 'string' ? idArray[0] : '';
      const arxivId = id.split('/').pop() || '';
      
      const titleArray = Array.isArray(entry.title) ? entry.title : [entry.title];
      const title = typeof titleArray[0] === 'string' ? titleArray[0].replace(/\s+/g, ' ').trim() : '';
      
      const summaryArray = Array.isArray(entry.summary) ? entry.summary : [entry.summary];
      const summary = typeof summaryArray[0] === 'string' ? summaryArray[0].replace(/\s+/g, ' ').trim() : '';
      
      const publishedArray = Array.isArray(entry.published) ? entry.published : [entry.published];
      const published = publishedArray[0] || '';
      
      const authors = Array.isArray(entry.author) 
        ? entry.author.map((a: any) => {
            const nameArray = Array.isArray(a.name) ? a.name : [a.name];
            return { name: typeof nameArray[0] === 'string' ? nameArray[0] : '' };
          })
        : entry.author 
        ? [{ name: '' }]
        : [];
      
      const primaryCategory = entry['arxiv:primary_category']?.[0]?.['$'] || entry['arxiv:primary_category']?.['$'] || '';
      
      const categories = Array.isArray(entry.category)
        ? entry.category.map((c: any) => c['$']?.term || c['$'] || '')
        : entry.category
        ? [entry.category['$']?.term || entry.category['$'] || '']
        : [];
      
      const pdf_url = Array.isArray(entry.link)
        ? entry.link.find((l: any) => l['$']?.type === 'application/pdf')?.['$'].href
        : undefined;
      
      return {
        id: arxivId,
        title,
        summary,
        published,
        authors,
        primary_category: primaryCategory,
        categories,
        pdf_url,
      };
    });

    logger.info(`关键词 "${keyword}" 获取到 ${papers.length} 篇论文`);
    return papers;
  } catch (error: any) {
    logger.error(`从ArXiv拉取关键词 "${keyword}" 的论文失败:`, error.message);
    return [];
  }
}

async function savePaperToDatabase(paper: ArXivPaper, keyword: string): Promise<boolean> {
  try {
    const arxivId = paper.id;
    
    const existing = await prisma.paper.findUnique({
      where: { arxivId },
    });

    if (existing) {
      return false;
    }

    await prisma.paper.create({
      data: {
        arxivId,
        title: paper.title,
        abstract: paper.summary,
        authors: JSON.stringify(paper.authors.map(a => a.name)),
        publishedDate: new Date(paper.published),
        categories: JSON.stringify(paper.categories),
        pdfUrl: paper.pdf_url || null,
        viewCount: 0,
        favoriteCount: 0,
        citationCount: 0,
      },
    });

    return true;
  } catch (error: any) {
    if (error.code !== 'P2002') {
      logger.error(`保存论文 ${paper.id} 失败:`, error.message);
    }
    return false;
  }
}

async function fetchAndSavePapers() {
  try {
    await ensureAdminDatabaseConnected();
    await ensureUserDatabaseConnected();

    logger.info('开始从ArXiv批量拉取论文...');

    const keywords = await adminPrismaClient.paper_search_keywords.findMany({
      where: {
        is_active: true,
        source_type: 'admin',
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
      select: {
        keyword: true,
      },
    });

    const keywordList = keywords.map(k => k.keyword);
    logger.info(`获取到 ${keywordList.length} 个关键词: ${keywordList.join(', ')}`);

    let totalPapers = 0;
    let savedPapers = 0;
    const allPapers: ArXivPaper[] = [];

    for (const keyword of keywordList) {
      const papers = await fetchArXivPapers(keyword);
      allPapers.push(...papers);
      totalPapers += papers.length;
      
      if (totalPapers >= MIN_TOTAL_PAPERS) {
        logger.info(`已达到最小论文数量要求 (${MIN_TOTAL_PAPERS} 篇)，停止拉取`);
        break;
      }
    }

    logger.info(`总共拉取到 ${allPapers.length} 篇论文`);

    const uniquePapers = new Map<string, ArXivPaper>();
    for (const paper of allPapers) {
      if (!uniquePapers.has(paper.id)) {
        uniquePapers.set(paper.id, paper);
      }
    }

    logger.info(`去重后剩余 ${uniquePapers.size} 篇论文`);

    for (const [id, paper] of uniquePapers) {
      const saved = await savePaperToDatabase(paper, '');
      if (saved) {
        savedPapers++;
      }
      
      if (savedPapers % 100 === 0) {
        logger.info(`已保存 ${savedPapers} 篇论文...`);
      }
    }

    logger.info(`论文拉取完成！`);
    logger.info(`总共拉取: ${allPapers.length} 篇`);
    logger.info(`去重后: ${uniquePapers.size} 篇`);
    logger.info(`成功保存: ${savedPapers} 篇`);
    logger.info(`已存在: ${uniquePapers.size - savedPapers} 篇`);

  } catch (error: any) {
    logger.error('批量拉取论文失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fetchAndSavePapers()
    .then(() => {
      logger.info('论文拉取任务完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('论文拉取任务失败:', error);
      process.exit(1);
    });
}

export { fetchAndSavePapers };
