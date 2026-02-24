/**
 * 论文服务
 * 处理论文相关的业务逻辑
 */

import { Paper } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { queryCache } from './query-cache.service';

const prisma = userPrisma;


export interface GetPapersParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'citation';
  category?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 获取论文列表
 */
export async function getPapers(params: GetPapersParams): Promise<{ papers: Paper[]; total: number }> {
  const cacheKey = queryCache.generateKey('papers', params);

  return queryCache.execute(
    cacheKey,
    async () => {
      try {
        const where: any = {};

        // 分类筛选（SQLite 不支持 array_contains，使用字符串包含）
        if (params.category) {
          where.categories = {
            contains: params.category,
          };
        }

        // 关键词搜索（SQLite不支持mode: 'insensitive'，使用contains即可，SQLite的LIKE默认大小写不敏感）
        if (params.keyword) {
          where.OR = [
            { title: { contains: params.keyword } },
            { abstract: { contains: params.keyword } },
          ];
        }

        // 日期范围
        if (params.startDate || params.endDate) {
          where.publishedDate = {};
          if (params.startDate) {
            where.publishedDate.gte = new Date(params.startDate);
          }
          if (params.endDate) {
            where.publishedDate.lte = new Date(params.endDate);
          }
        }

        // 排序
        let orderBy: any = {};
        switch (params.sort) {
          case 'citation':
            orderBy = { citationCount: 'desc' };
            break;
          case 'hot':
            orderBy = { viewCount: 'desc' };
            break;
          case 'latest':
          default:
            orderBy = { publishedDate: 'desc' };
            break;
        }

        // 查询
        const [papers, total] = await Promise.all([
          prisma.paper.findMany({
            where,
            orderBy,
            skip: params.skip,
            take: params.take,
          }),
          prisma.paper.count({ where }),
        ]);

        return { papers, total };
      } catch (error) {
        logger.error('Get papers error:', error);
        throw new Error('PAPERS_FETCH_FAILED');
      }
    },
    300 as any
  );
}

/**
 * 获取论文详情
 */
export async function getPaperById(paperId: string): Promise<Paper | null> {
  try {
    // 获取论文
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    // 如果找到,增加浏览量
    if (paper) {
      await prisma.paper.update({
        where: { id: paperId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return paper;
  } catch (error) {
    logger.error('Get paper by ID error:', error);
    throw new Error('PAPER_FETCH_FAILED');
  }
}

/**
 * 创建论文
 */
export interface CreatePaperInput {
  arxivId?: string | null;
  title: string;
  authors: string;
  abstract?: string | null;
  categories?: string | null;
  pdfUrl?: string | null;
  publishedDate?: Date | null;
  citationCount?: number;
  venue?: string | null;
  isPinned?: boolean;
  pinnedAt?: Date | null;
}

export async function createPaper(data: CreatePaperInput): Promise<Paper> {
  try {
    const uniqueId = data.arxivId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const paper = await prisma.paper.upsert({
      where: { 
        arxivId: uniqueId
      },
      update: {
        title: data.title,
        authors: data.authors,
        abstract: data.abstract,
        categories: data.categories,
        pdfUrl: data.pdfUrl,
        publishedDate: data.publishedDate,
        citationCount: data.citationCount || 0,
        venue: data.venue,
      },
      create: {
        arxivId: data.arxivId,
        title: data.title,
        authors: data.authors,
        abstract: data.abstract,
        categories: data.categories,
        pdfUrl: data.pdfUrl,
        publishedDate: data.publishedDate,
        citationCount: data.citationCount || 0,
        venue: data.venue,
        isPinned: data.isPinned || false,
        pinnedAt: data.pinnedAt || null,
        viewCount: 0,
        favoriteCount: 0,
        shareCount: 0,
      },
    });
    logger.info(`Paper created/updated: ${paper.arxivId}`);
    return paper;
  } catch (error) {
    logger.error('Create paper error:', error);
    throw new Error('PAPER_CREATION_FAILED');
  }
}

/**
 * 更新论文
 */
export async function updatePaper(paperId: string, data: Partial<Paper>): Promise<Paper> {
  try {
    const paper = await prisma.paper.update({
      where: { id: paperId },
      data,
    });
    logger.info(`Paper updated: ${paper.id}`);
    return paper;
  } catch (error) {
    logger.error('Update paper error:', error);
    throw new Error('PAPER_UPDATE_FAILED');
  }
}

/**
 * 删除论文
 */
export async function deletePaper(paperId: string): Promise<void> {
  try {
    await prisma.paper.delete({
      where: { id: paperId },
    });
    logger.info(`Paper deleted: ${paperId}`);
  } catch (error) {
    logger.error('Delete paper error:', error);
    throw new Error('PAPER_DELETION_FAILED');
  }
}

/**
 * 增加论文收藏数
 */
export async function incrementPaperFavoriteCount(paperId: string): Promise<void> {
  try {
    await prisma.paper.update({
      where: { id: paperId },
      data: { favoriteCount: { increment: 1 } },
    });
  } catch (error) {
    logger.error('Increment paper favorite count error:', error);
  }
}

/**
 * 减少论文收藏数
 */
export async function decrementPaperFavoriteCount(paperId: string): Promise<void> {
  try {
    await prisma.paper.update({
      where: { id: paperId },
      data: { favoriteCount: { decrement: 1 } },
    });
  } catch (error) {
    logger.error('Decrement paper favorite count error:', error);
  }
}

/**
 * 增加论文分享数
 */
export async function incrementPaperShareCount(paperId: string): Promise<void> {
  try {
    await prisma.paper.update({
      where: { id: paperId },
      data: { shareCount: { increment: 1 } },
    });
  } catch (error) {
    logger.error('Increment paper share count error:', error);
  }
}
