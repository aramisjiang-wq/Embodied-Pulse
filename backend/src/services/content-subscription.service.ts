/**
 * 内容订阅服务
 * 处理用户订阅具体内容（GitHub仓库、论文、HuggingFace模型）的逻辑
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

const prisma = userPrisma as any;

export interface CreateContentSubscriptionParams {
  userId: string;
  contentType: string;
  contentId: string;
  notifyEnabled?: boolean;
}

export interface UpdateContentSubscriptionParams {
  id: string;
  userId: string;
  notifyEnabled?: boolean;
}

export interface GetUserContentSubscriptionsParams {
  userId: string;
  skip: number;
  take: number;
  contentType?: string;
}

/**
 * 创建内容订阅
 */
export async function createContentSubscription(params: CreateContentSubscriptionParams) {
  try {
    if (!params.userId) {
      throw new Error('USER_ID_REQUIRED');
    }
    if (!params.contentType) {
      throw new Error('CONTENT_TYPE_REQUIRED');
    }
    if (!params.contentId) {
      throw new Error('CONTENT_ID_REQUIRED');
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const subscription = await prisma.contentSubscription.create({
      data: {
        userId: params.userId,
        contentType: params.contentType,
        contentId: params.contentId,
        notifyEnabled: params.notifyEnabled ?? true,
      },
    });

    logger.info(`内容订阅创建成功: ${subscription.id} (用户: ${params.userId}, 类型: ${params.contentType}, 内容ID: ${params.contentId})`);
    return subscription;
  } catch (error: any) {
    logger.error('Create content subscription error:', {
      error: error.message,
      stack: error.stack,
      userId: params.userId,
      contentType: params.contentType,
      contentId: params.contentId,
    });
    
    if (error.code === 'P2002') {
      throw new Error('ALREADY_SUBSCRIBED');
    }
    
    if (error.message === 'USER_ID_REQUIRED' || 
        error.message === 'CONTENT_TYPE_REQUIRED' || 
        error.message === 'CONTENT_ID_REQUIRED' ||
        error.message === 'USER_NOT_FOUND' ||
        error.message === 'ALREADY_SUBSCRIBED') {
      throw error;
    }
    
    throw new Error('CONTENT_SUBSCRIPTION_CREATE_FAILED');
  }
}

/**
 * 删除内容订阅
 */
export async function deleteContentSubscription(userId: string, contentType: string, contentId: string) {
  try {
    await prisma.contentSubscription.delete({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType,
          contentId,
        },
      },
    });

    logger.info(`内容订阅删除成功: ${contentType}:${contentId} (用户: ${userId})`);
  } catch (error) {
    logger.error('Delete content subscription error:', error);
    throw new Error('CONTENT_SUBSCRIPTION_DELETE_FAILED');
  }
}

/**
 * 获取用户的内容订阅列表
 */
export async function getUserContentSubscriptions(params: GetUserContentSubscriptionsParams) {
  try {
    const where: any = { userId: params.userId };
    if (params.contentType) {
      where.contentType = params.contentType;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.contentSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.contentSubscription.count({ where }),
    ]);

    return { subscriptions, total };
  } catch (error) {
    logger.error('Get user content subscriptions error:', error);
    throw new Error('CONTENT_SUBSCRIPTIONS_FETCH_FAILED');
  }
}

/**
 * 检查用户是否已订阅某个内容
 */
export async function checkContentSubscription(userId: string, contentType: string, contentId: string): Promise<boolean> {
  try {
    const subscription = await prisma.contentSubscription.findUnique({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType,
          contentId,
        },
      },
    });
    return !!subscription;
  } catch (error) {
    logger.error('Check content subscription error:', error);
    return false;
  }
}

/**
 * 更新内容订阅
 */
export async function updateContentSubscription(params: UpdateContentSubscriptionParams) {
  try {
    const subscription = await prisma.contentSubscription.update({
      where: {
        id: params.id,
      },
      data: {
        ...(params.notifyEnabled !== undefined && { notifyEnabled: params.notifyEnabled }),
        updatedAt: new Date(),
      },
    });

    logger.info(`内容订阅更新成功: ${subscription.id}`);
    return subscription;
  } catch (error) {
    logger.error('Update content subscription error:', error);
    throw new Error('CONTENT_SUBSCRIPTION_UPDATE_FAILED');
  }
}
