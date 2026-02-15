import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

export interface CreateNewsData {
  title: string;
  description?: string;
  url: string;
  score?: string;
  platform: string;
  publishedDate?: Date | string;
}

export interface UpdateNewsData {
  title?: string;
  description?: string;
  url?: string;
  score?: string;
  platform?: string;
  publishedDate?: Date | string;
}

export async function createNews(data: CreateNewsData) {
  try {
    const news = await userPrisma.news.create({
      data: {
        title: data.title,
        description: data.description || null,
        url: data.url,
        score: data.score || null,
        platform: data.platform,
        publishedDate: data.publishedDate ? new Date(data.publishedDate) : new Date(),
      },
    });
    logger.info(`News created: ${news.id}`);
    return news;
  } catch (error: any) {
    logger.error('Create news error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
      throw new Error('NEWS_URL_EXISTS: 该URL已存在');
    }
    throw error;
  }
}

export async function updateNews(id: string, data: UpdateNewsData) {
  try {
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.score !== undefined) updateData.score = data.score || null;
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.publishedDate !== undefined) updateData.publishedDate = new Date(data.publishedDate);

    const news = await userPrisma.news.update({
      where: { id },
      data: updateData,
    });
    logger.info(`News updated: ${news.id}`);
    return news;
  } catch (error: any) {
    logger.error('Update news error:', error);
    if (error.code === 'P2025') {
      throw new Error('NEWS_NOT_FOUND: 新闻不存在');
    }
    throw error;
  }
}

export async function deleteNews(id: string) {
  try {
    await userPrisma.news.delete({
      where: { id },
    });
    logger.info(`News deleted: ${id}`);
  } catch (error: any) {
    logger.error('Delete news error:', error);
    if (error.code === 'P2025') {
      throw new Error('NEWS_NOT_FOUND: 新闻不存在');
    }
    throw error;
  }
}

export async function getNewsList(params: {
  skip?: number;
  take?: number;
  platform?: string;
  keyword?: string;
}) {
  try {
    const where: any = {};

    if (params.platform) {
      where.platform = params.platform;
    }

    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      userPrisma.news.findMany({
        where,
        orderBy: { publishedDate: 'desc' },
        skip: params.skip || 0,
        take: params.take || 20,
      }),
      userPrisma.news.count({ where }),
    ]);

    return { items, total };
  } catch (error) {
    logger.error('Get news list error:', error);
    throw error;
  }
}
