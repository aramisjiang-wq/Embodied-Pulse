/**
 * 新闻服务
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { getCachedQuery, buildKey, CACHE_TTL } from './query-cache.service';

const prisma = userPrisma;

export interface GetNewsParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot';
  category?: string;
  keyword?: string;
}

function transformNewsForFrontend(news: any) {
  const categoryMap: Record<string, string> = {
    'tech': 'technology',
    'research': 'research',
    'product': 'product',
    'funding': 'funding',
    'policy': 'policy',
    'manual': 'technology',
    'baidu': 'technology',
    'weibo': 'technology',
    'zhihu': 'technology',
    'bilibili': 'technology',
    'douban': 'technology',
    'juejin': 'technology',
    '36kr': 'technology',
  };

  return {
    id: news.id,
    title: news.title,
    summary: news.description || '',
    content: news.description || '',
    imageUrl: `https://picsum.photos/seed/${news.id}/400/250`,
    publishedDate: news.publishedDate || news.createdAt,
    viewCount: news.viewCount || 0,
    favoriteCount: news.favoriteCount || 0,
    shareCount: news.shareCount || 0,
    category: categoryMap[news.platform] || news.platform || 'technology',
    platform: news.platform,
    source: news.platform || 'TechCrunch',
    author: '编辑',
    sourceUrl: news.url ? (() => { try { return new URL(news.url).origin; } catch { return ''; } })() : '',
    url: news.url,
    score: news.score,
    tags: [],
  };
}

export async function getNews(params: GetNewsParams): Promise<{ news: any[]; total: number }> {
  try {
    const cacheKey = buildKey('news:list', params);

    return getCachedQuery(cacheKey, async () => {
      const where: any = {};

      if (params.category) {
        where.platform = params.category;
      }

      if (params.keyword) {
        where.OR = [
          { title: { contains: params.keyword } },
          { description: { contains: params.keyword } },
        ];
      }

      let orderBy: any = {};
      switch (params.sort) {
        case 'hot':
          orderBy = { viewCount: 'desc' };
          break;
        case 'latest':
        default:
          orderBy = { publishedDate: 'desc' };
          break;
      }

      const [newsRaw, total] = await Promise.all([
        prisma.news.findMany({ where, orderBy, skip: params.skip, take: params.take }),
        prisma.news.count({ where }),
      ]);

      const news = newsRaw.map(transformNewsForFrontend);

      return { news, total };
    }, { ttl: CACHE_TTL.SHORT });
  } catch (error) {
    logger.error('Get news error:', error);
    throw new Error('NEWS_FETCH_FAILED');
  }
}

export async function getNewsById(id: string): Promise<any | null> {
  try {
    const newsRaw = await prisma.news.findUnique({ where: { id } });
    if (newsRaw) {
      await prisma.news.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      return transformNewsForFrontend(newsRaw);
    }
    return null;
  } catch (error) {
    logger.error('Get news by id error:', error);
    throw new Error('NEWS_FETCH_FAILED');
  }
}

export async function searchNews(keyword: string, page: number = 1, size: number = 20): Promise<{ news: any[]; total: number }> {
  const skip = (page - 1) * size;
  const take = size;

  const where: any = {
    OR: [
      { title: { contains: keyword } },
      { description: { contains: keyword } },
    ],
  };

  const [newsRaw, total] = await Promise.all([
    prisma.news.findMany({ where, orderBy: { publishedDate: 'desc' }, skip, take }),
    prisma.news.count({ where }),
  ]);

  const news = newsRaw.map(transformNewsForFrontend);

  return { news, total };
}

export async function getHotNews(days: number = 7, limit: number = 10): Promise<any[]> {
  try {
    const cacheKey = buildKey('news:hot', { days, limit });

    return getCachedQuery(cacheKey, async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const newsRaw = await prisma.news.findMany({
        where: {
          publishedDate: {
            gte: startDate,
          },
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      });

      return newsRaw.map(transformNewsForFrontend);
    }, { ttl: CACHE_TTL.MEDIUM });
  } catch (error) {
    logger.error('Get hot news error:', error);
    throw new Error('NEWS_FETCH_FAILED');
  }
}

export async function getRelatedNews(id: string, limit: number = 5): Promise<any[]> {
  try {
    const currentNews = await prisma.news.findUnique({ where: { id } });
    if (!currentNews) return [];

    const where: any = {
      id: { not: id },
    };

    const newsRaw = await prisma.news.findMany({
      where,
      orderBy: { publishedDate: 'desc' },
      take: limit,
    });

    return newsRaw.map(transformNewsForFrontend);
  } catch (error) {
    logger.error('Get related news error:', error);
    return [];
  }
}
