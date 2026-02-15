/**
 * 评论服务
 */

import { Comment } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import { updateUserPoints } from './user.service';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface CreateCommentData {
  userId: string;
  postId: string;
  parentId?: string;
  content: string;
}

/**
 * 创建评论
 */
export async function createComment(data: CreateCommentData): Promise<Comment> {
  try {
    const comment = await prisma.$transaction(async (tx) => {
      // 创建评论
      const newComment = await tx.comment.create({
        data: {
          userId: data.userId,
          postId: data.postId,
          parentId: data.parentId,
          content: data.content,
        },
      });

      // 更新帖子评论数
      await tx.post.update({
        where: { id: data.postId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    // 奖励积分
    await updateUserPoints(data.userId, 15, 'create_comment', '发表评论');

    logger.info(`Comment created: ${comment.id} by user ${data.userId}`);
    return comment;
  } catch (error) {
    logger.error('Create comment error:', error);
    throw new Error('COMMENT_CREATION_FAILED');
  }
}

/**
 * 获取帖子评论列表
 */
export async function getCommentsByPostId(
  postId: string,
  skip: number = 0,
  take: number = 20
): Promise<{ comments: any[]; total: number }> {
  try {
    const where = {
      postId,
      status: 'active',
    };
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return { comments, total };
  } catch (error) {
    logger.error('Get comments error:', error);
    throw new Error('COMMENTS_FETCH_FAILED');
  }
}

/**
 * 点赞评论
 */
export async function likeComment(commentId: string, userId: string): Promise<void> {
  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
    });
    logger.info(`Comment liked: ${commentId} by user ${userId}`);
  } catch (error) {
    logger.error('Like comment error:', error);
    throw new Error('COMMENT_LIKE_FAILED');
  }
}
