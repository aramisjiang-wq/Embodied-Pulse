/**
 * Banner服务
 */

import { Banner } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface GetBannersParams {
  skip: number;
  take: number;
  status?: 'active' | 'inactive';
}

export async function getBanners(params: GetBannersParams): Promise<{ banners: Banner[]; total: number }> {
  try {
    const where: any = {};
    if (params.status === 'active') {
      where.isActive = true;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    }

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.banner.count({ where }),
    ]);

    return { banners, total };
  } catch (error) {
    logger.error('Get banners error:', error);
    throw new Error('BANNERS_FETCH_FAILED');
  }
}

export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return banners;
  } catch (error: any) {
    logger.error('Get active banners error:', error);
    // 如果是表不存在或其他数据库错误，返回空数组而不是抛出错误
    if (error.message?.includes('does not exist') || error.code === 'P2021') {
      logger.warn('Banner table may not exist yet, returning empty array');
      return [];
    }
    throw new Error('BANNERS_FETCH_FAILED');
  }
}

/** 将前端可能传的 sortOrder 转为 Prisma 的 order，并去掉非法字段 */
function normalizeBannerData(data: Record<string, unknown>): Record<string, unknown> {
  const { sortOrder, ...rest } = data;
  return {
    ...rest,
    order: typeof sortOrder === 'number' ? sortOrder : (rest.order ?? 0),
  };
}

export async function createBanner(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
  try {
    // 限制最多3个Banner
    const existingCount = await prisma.banner.count();
    if (existingCount >= 3) {
      throw new Error('BANNER_LIMIT_EXCEEDED: 最多只能创建3个Banner');
    }
    const normalized = normalizeBannerData(data as Record<string, unknown>);
    return await prisma.banner.create({ data: normalized as Parameters<typeof prisma.banner.create>[0]['data'] });
  } catch (error: any) {
    logger.error('Create banner error:', error);
    if (error.message?.includes('BANNER_LIMIT_EXCEEDED')) {
      throw error;
    }
    throw new Error('BANNER_CREATION_FAILED');
  }
}

export async function updateBanner(bannerId: string, data: Partial<Banner>): Promise<Banner> {
  try {
    const normalized = normalizeBannerData(data as Record<string, unknown>);
    return await prisma.banner.update({ where: { id: bannerId }, data: normalized as Parameters<typeof prisma.banner.update>[0]['data'] });
  } catch (error) {
    logger.error('Update banner error:', error);
    throw new Error('BANNER_UPDATE_FAILED');
  }
}

export async function deleteBanner(bannerId: string): Promise<void> {
  try {
    await prisma.banner.delete({ where: { id: bannerId } });
  } catch (error) {
    logger.error('Delete banner error:', error);
    throw new Error('BANNER_DELETE_FAILED');
  }
}
