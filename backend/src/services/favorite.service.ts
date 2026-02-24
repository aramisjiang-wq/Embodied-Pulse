/**
 * 收藏服务
 */

import { Favorite } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import { updateUserPoints } from './user.service';
import userPrisma from '../config/database.user';
import mainPrisma from '../config/database';

const prisma = userPrisma as any;

export interface CreateFavoriteData {
  userId: string;
  contentType: string;
  contentId: string;
  folderId?: string;
}

/**
 * 收藏内容
 */
export async function createFavorite(data: CreateFavoriteData): Promise<Favorite> {
  try {
    // 验证userId是否存在
    const user = await userPrisma.user.findUnique({
      where: { id: data.userId },
    });
    
    if (!user) {
      logger.error(`User not found: ${data.userId}`);
      throw new Error('USER_NOT_FOUND');
    }

    // 检查是否已收藏
    const existing = await userPrisma.favorite.findUnique({
      where: {
        userId_contentType_contentId: {
          userId: data.userId,
          contentType: data.contentType,
          contentId: data.contentId,
        },
      },
    });

    if (existing) {
      throw new Error('ALREADY_FAVORITED');
    }

    // 创建收藏
    const favoriteData: any = {
      userId: data.userId,
      contentType: data.contentType,
      contentId: data.contentId,
    };
    
    // 只有当folderId存在且不为空字符串时才设置（如果schema支持）
    if (data.folderId && data.folderId.trim() !== '') {
      favoriteData.folderId = data.folderId;
    }
    // 注意：如果schema中没有folderId字段，不设置它（避免错误）
    
    logger.info(`Creating favorite: userId=${data.userId}, contentType=${data.contentType}, contentId=${data.contentId}, folderId=${favoriteData.folderId || 'not set'}`);
    
    const favorite = await userPrisma.favorite.create({
      data: favoriteData,
    });

    // 增加内容的收藏数（异步，不阻塞主流程）
    incrementContentFavoriteCount(data.contentType, data.contentId).catch(err => {
      logger.warn('Failed to increment favorite count:', err);
    });

    // 奖励积分（异步，积分失败不影响收藏成功）
    updateUserPoints(data.userId, 5, 'favorite', '收藏内容').catch(err => {
      logger.warn('Failed to award points for favorite:', err);
    });

    logger.info(`Favorite created: ${favorite.id} by user ${data.userId}`);
    return favorite;
  } catch (error: any) {
    if (error.message === 'ALREADY_FAVORITED' || error.message === 'USER_NOT_FOUND') {
      throw error;
    }
    logger.error('Create favorite error:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      userId: data.userId,
      contentType: data.contentType,
      contentId: data.contentId,
      folderId: data.folderId,
    });
    throw new Error('FAVORITE_CREATION_FAILED');
  }
}

/**
 * 取消收藏
 */
export async function deleteFavorite(userId: string, contentType: string, contentId: string): Promise<void> {
  try {
    const result = await userPrisma.favorite.deleteMany({
      where: {
        userId,
        contentType,
        contentId,
      },
    });

    if (result.count > 0) {
      // 减少内容的收藏数
      await decrementContentFavoriteCount(contentType, contentId);
      logger.info(`Favorite deleted: ${contentType}:${contentId} by user ${userId}`);
      return;
    }

    logger.warn(`Favorite not found for delete: ${contentType}:${contentId} by user ${userId}`);
  } catch (error) {
    logger.error('Delete favorite error:', error);
    throw new Error('FAVORITE_DELETION_FAILED');
  }
}

/**
 * 获取用户收藏列表
 */
export async function getUserFavorites(userId: string, contentType?: string, skip: number = 0, take: number = 20): Promise<{ favorites: any[]; total: number }> {
  try {
    const where: any = { userId };
    if (contentType) {
      where.contentType = contentType;
    }

    const [favorites, total] = await Promise.all([
      userPrisma.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      userPrisma.favorite.count({ where }),
    ]);

    return { favorites, total };
  } catch (error) {
    logger.error('Get user favorites error:', error);
    throw new Error('FAVORITES_FETCH_FAILED');
  }
}

/**
 * 增加内容收藏数
 */
async function incrementContentFavoriteCount(contentType: string, contentId: string): Promise<void> {
  try {
    switch (contentType) {
      case 'paper':
        await mainPrisma.paper.update({
          where: { id: contentId },
          data: { favoriteCount: { increment: 1 } },
        });
        break;
      case 'video':
        await mainPrisma.video.update({
          where: { id: contentId },
          data: { favoriteCount: { increment: 1 } },
        });
        break;
      case 'repo':
        await mainPrisma.githubRepo.update({
          where: { id: contentId },
          data: { favoriteCount: { increment: 1 } },
        });
        break;
      case 'job':
        await mainPrisma.job.update({
          where: { id: contentId },
          data: { favoriteCount: { increment: 1 } },
        });
        break;
      case 'huggingface':
        await mainPrisma.huggingFaceModel.update({
          where: { id: contentId },
          data: { favoriteCount: { increment: 1 } },
        });
        break;
      default:
        logger.warn(`Unknown contentType for favorite increment: ${contentType}`);
    }
  } catch (error: any) {
    // 如果内容不存在，记录警告但不抛出错误（避免影响收藏创建）
    if (error.code === 'P2025') {
      logger.warn(`Content not found for favorite increment: ${contentType}:${contentId}`);
    } else {
      logger.error('Increment favorite count error:', {
        contentType,
        contentId,
        error: error.message,
        code: error.code,
      });
    }
  }
}

/**
 * 减少内容收藏数
 */
async function decrementContentFavoriteCount(contentType: string, contentId: string): Promise<void> {
  try {
    switch (contentType) {
      case 'paper':
        await mainPrisma.paper.update({
          where: { id: contentId },
          data: { favoriteCount: { decrement: 1 } },
        });
        break;
      case 'video':
        await mainPrisma.video.update({
          where: { id: contentId },
          data: { favoriteCount: { decrement: 1 } },
        });
        break;
      case 'repo':
        await mainPrisma.githubRepo.update({
          where: { id: contentId },
          data: { favoriteCount: { decrement: 1 } },
        });
        break;
      case 'job':
        await mainPrisma.job.update({
          where: { id: contentId },
          data: { favoriteCount: { decrement: 1 } },
        });
        break;
      case 'huggingface':
        await mainPrisma.huggingFaceModel.update({
          where: { id: contentId },
          data: { favoriteCount: { decrement: 1 } },
        });
        break;
      default:
        logger.warn(`Unknown contentType for favorite decrement: ${contentType}`);
    }
  } catch (error: any) {
    // 如果内容不存在，记录警告但不抛出错误（避免影响收藏删除）
    if (error.code === 'P2025') {
      logger.warn(`Content not found for favorite decrement: ${contentType}:${contentId}`);
    } else {
      logger.error('Decrement favorite count error:', {
        contentType,
        contentId,
        error: error.message,
        code: error.code,
      });
    }
  }
}
