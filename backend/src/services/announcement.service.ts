/**
 * 公告服务
 */

import { Announcement } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface GetAnnouncementsParams {
  skip?: number;
  take?: number;
  isActive?: boolean;
}

/**
 * 获取公告列表
 */
export async function getAnnouncements(params: GetAnnouncementsParams = {}): Promise<{ announcements: Announcement[]; total: number }> {
  try {
    const where: any = {};
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    // 检查时间范围（SQLite简化处理：只检查isActive，时间范围在应用层处理）
    // 暂时移除复杂的OR查询，避免SQLite兼容性问题

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: params.skip,
        take: params.take,
      }),
      prisma.announcement.count({ where }),
    ]);

    return { announcements, total };
  } catch (error) {
    logger.error('Get announcements error:', error);
    throw new Error('ANNOUNCEMENTS_FETCH_FAILED');
  }
}

/**
 * 获取活跃公告（首页显示）
 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    // 简化查询：只查询isActive的公告，时间范围在应用层过滤
    const allActive = await prisma.announcement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return allActive.slice(0, 5); // 最多返回5条
  } catch (error: any) {
    logger.error('Get active announcements error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
    });
    // 如果是表不存在或其他数据库错误，返回空数组
    if (error.message?.includes('does not exist') || 
        error.code === 'P2021' || 
        error.code === 'P2001' ||
        error.message?.includes('no such table')) {
      logger.warn('Announcement table may not exist yet, returning empty array');
      return [];
    }
    throw new Error('ANNOUNCEMENTS_FETCH_FAILED');
  }
}

/**
 * 创建公告
 */
export async function createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
  try {
    return await prisma.announcement.create({ data });
  } catch (error) {
    logger.error('Create announcement error:', error);
    throw new Error('ANNOUNCEMENT_CREATION_FAILED');
  }
}

/**
 * 更新公告
 */
export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
  try {
    return await prisma.announcement.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error('Update announcement error:', error);
    throw new Error('ANNOUNCEMENT_UPDATE_FAILED');
  }
}

/**
 * 删除公告
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    await prisma.announcement.delete({ where: { id } });
  } catch (error) {
    logger.error('Delete announcement error:', error);
    throw new Error('ANNOUNCEMENT_DELETION_FAILED');
  }
}
