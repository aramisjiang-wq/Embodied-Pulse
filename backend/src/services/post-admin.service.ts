/**
 * 帖子管理服务（管理端）
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

/** 市集统计 */
export interface CommunityStats {
  totalPosts: number;
  activePosts: number;
  deletedPosts: number;
  pinnedPosts: number;
  featuredPosts: number;
  todayNewPosts: number;
  totalComments: number;
}

/**
 * 获取市集统计（管理端）
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalPosts,
    activePosts,
    deletedPosts,
    pinnedPosts,
    featuredPosts,
    todayNewPosts,
    totalComments,
  ] = await Promise.all([
    userPrisma.post.count(),
    userPrisma.post.count({ where: { status: 'active' } }),
    userPrisma.post.count({ where: { status: 'deleted' } }),
    userPrisma.post.count({ where: { isTop: true, status: 'active' } }),
    userPrisma.post.count({ where: { isFeatured: true, status: 'active' } }),
    userPrisma.post.count({ where: { createdAt: { gte: todayStart }, status: 'active' } }),
    userPrisma.comment.count(),
  ]);

  return {
    totalPosts,
    activePosts,
    deletedPosts,
    pinnedPosts,
    featuredPosts,
    todayNewPosts,
    totalComments,
  };
}

/**
 * 删除帖子（软删除，修改状态）
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    await userPrisma.post.update({
      where: { id: postId },
      data: { status: 'deleted' },
    });
    logger.info(`Post deleted: ${postId}`);
  } catch (error) {
    logger.error('Delete post error:', error);
    throw new Error('POST_DELETION_FAILED');
  }
}

/**
 * 恢复帖子
 */
export async function restorePost(postId: string): Promise<void> {
  try {
    await userPrisma.post.update({
      where: { id: postId },
      data: { status: 'active' },
    });
    logger.info(`Post restored: ${postId}`);
  } catch (error) {
    logger.error('Restore post error:', error);
    throw new Error('POST_RESTORE_FAILED');
  }
}

/**
 * 置顶帖子
 */
export async function pinPost(postId: string, isTop: boolean): Promise<void> {
  try {
    await userPrisma.post.update({
      where: { id: postId },
      data: { isTop } as any, // Prisma类型定义可能不完整
    });
    logger.info(`Post ${isTop ? 'pinned' : 'unpinned'}: ${postId}`);
  } catch (error) {
    logger.error('Pin post error:', error);
    throw new Error('POST_PIN_FAILED');
  }
}

/**
 * 加精帖子
 */
export async function featurePost(postId: string, isFeatured: boolean): Promise<void> {
  try {
    await userPrisma.post.update({
      where: { id: postId },
      data: { isFeatured } as any, // Prisma类型定义可能不完整
    });
    logger.info(`Post ${isFeatured ? 'featured' : 'unfeatured'}: ${postId}`);
  } catch (error) {
    logger.error('Feature post error:', error);
    throw new Error('POST_FEATURE_FAILED');
  }
}
