/**
 * 用户行为记录服务
 * 用于记录用户的各种操作行为
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

export type ActionType = 'view' | 'favorite' | 'unfavorite' | 'comment' | 'share' | 'like' | 'unlike';
export type ContentType = 'paper' | 'video' | 'repo' | 'huggingface' | 'job' | 'post' | 'news';

export interface CreateUserActionData {
  userId: string;
  actionType: ActionType;
  contentType: ContentType;
  contentId: string;
  metadata?: Record<string, any>;
}

/**
 * 创建用户行为记录
 */
export async function createUserAction(data: CreateUserActionData): Promise<void> {
  try {
    // 验证用户是否存在
    const user = await userPrisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      logger.warn(`尝试为不存在的用户创建行为记录: ${data.userId}`);
      return;
    }

    // 检查是否在短时间内有相同的操作（避免重复记录）
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const recentAction = await userPrisma.userAction.findFirst({
      where: {
        userId: data.userId,
        actionType: data.actionType,
        contentType: data.contentType,
        contentId: data.contentId,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    // 如果是查看操作，允许在1分钟内重复记录（因为用户可能刷新页面）
    // 其他操作（收藏、评论等）在1分钟内不重复记录
    if (recentAction && data.actionType !== 'view') {
      logger.debug(`用户 ${data.userId} 在1分钟内已有相同的${data.actionType}操作，跳过记录`);
      return;
    }

    // 创建行为记录
    await userPrisma.userAction.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        contentType: data.contentType,
        contentId: data.contentId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    logger.debug(`用户行为记录创建成功: ${data.userId} - ${data.actionType} - ${data.contentType} - ${data.contentId}`);
  } catch (error: any) {
    // 行为记录失败不应该影响主流程，只记录警告
    logger.warn('创建用户行为记录失败（不影响主流程）:', {
      error: error.message,
      userId: data.userId,
      actionType: data.actionType,
      contentType: data.contentType,
      contentId: data.contentId,
    });
  }
}

/**
 * 批量创建用户行为记录（用于批量操作）
 */
export async function createUserActions(actions: CreateUserActionData[]): Promise<void> {
  try {
    await Promise.all(actions.map(action => createUserAction(action)));
  } catch (error: any) {
    logger.warn('批量创建用户行为记录失败:', error.message);
  }
}
