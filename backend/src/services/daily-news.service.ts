/**
 * 每日新闻服务
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface DailyNewsListQuery {
  page?: number;
  size?: number;
  isPinned?: boolean;
}

export interface CreateDailyNewsDto {
  date: string;
  title: string;
  content: string;
  isPinned?: boolean;
}

export interface UpdateDailyNewsDto {
  date?: string;
  title?: string;
  content?: string;
  isPinned?: boolean;
}

export const dailyNewsService = {
  async findAll(query: DailyNewsListQuery) {
    const { page = 1, size = 20, isPinned } = query;
    const skip = (page - 1) * size;

    const where: any = {};
    if (isPinned !== undefined) {
      where.isPinned = isPinned;
    }

    const [items, total] = await Promise.all([
      prisma.dailyNews.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { date: 'desc' }],
        skip,
        take: size,
      }).catch((err) => {
        logger.error('Failed to fetch daily news:', err);
        return [];
      }),
      prisma.dailyNews.count({ where }).catch(() => 0),
    ]);

    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  },

  async findById(id: string) {
    const news = await prisma.dailyNews
      .findUnique({
        where: { id },
      })
      .catch((err) => {
        logger.error('Failed to fetch daily news by id:', err);
        return null;
      });

    if (news) {
      await prisma.dailyNews
        .update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        })
        .catch((err) => {
          logger.error('Failed to increment view count:', err);
        });
    }

    return news;
  },

  async create(data: CreateDailyNewsDto) {
    const now = new Date().toISOString();
    return prisma.dailyNews.create({
      data: {
        date: data.date,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned || false,
        pinnedAt: data.isPinned ? now : null,
        createdAt: now,
        updatedAt: now,
      },
    });
  },

  async update(id: string, data: UpdateDailyNewsDto) {
    const updateData: any = { ...data };

    if (data.isPinned !== undefined) {
      updateData.pinnedAt = data.isPinned ? new Date().toISOString() : null;
    }
    
    updateData.updatedAt = new Date().toISOString();

    return prisma.dailyNews.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return prisma.dailyNews.delete({
      where: { id },
    });
  },

  async getPinned() {
    return prisma.dailyNews
      .findMany({
        where: { isPinned: true },
        orderBy: { pinnedAt: 'desc' },
      })
      .catch((err) => {
        logger.error('Failed to fetch pinned daily news:', err);
        return [];
      });
  },

  async togglePin(id: string) {
    const news = await prisma.dailyNews.findUnique({ where: { id } });
    if (!news) throw new Error('DailyNews not found');

    return prisma.dailyNews.update({
      where: { id },
      data: {
        isPinned: !news.isPinned,
        pinnedAt: !news.isPinned ? new Date().toISOString() : null,
      },
    });
  },
};
