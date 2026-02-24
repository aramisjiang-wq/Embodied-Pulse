/**
 * 帖子服务
 */

import { Post } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import { updateUserPoints } from './user.service';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface CreatePostData {
  userId: string;
  contentType: string;
  contentId?: string;
  title?: string;
  content: string;
  images?: any;
  tags?: any;
  topicId?: string;
}

export interface GetPostsParams {
  skip: number;
  take: number;
  sort?: 'hot' | 'latest' | 'follow';
  userId?: string;
  topicId?: string;
  status?: string; // 管理端可以查询所有状态
}

export interface GetMyPostsParams {
  skip: number;
  take: number;
  sort?: 'hot' | 'latest';
  status?: string;
}

/**
 * 创建帖子
 */
export async function createPost(data: CreatePostData): Promise<Post> {
  try {
    logger.info('Creating post with data:', {
      userId: data.userId,
      contentType: data.contentType,
      contentId: data.contentId,
      title: data.title,
      contentLength: data.content?.length,
    });

    const post = await prisma.post.create({
      data: {
        userId: data.userId,
        contentType: data.contentType,
        contentId: data.contentId || '',
        title: data.title || '',
        content: data.content,
        tags: data.tags ? JSON.stringify(data.tags) : null,
      },
    });

    logger.info(`Post created successfully: ${post.id}`);

    try {
      await updateUserPoints(data.userId, 10, 'create_post', '发布帖子');
    } catch (pointsError) {
      logger.error('Failed to update points:', pointsError);
    }

    return post;
  } catch (error) {
    logger.error('Create post error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      data: {
        userId: data.userId,
        contentType: data.contentType,
        contentId: data.contentId,
      },
    });
    throw new Error('POST_CREATION_FAILED');
  }
}

/**
 * 获取帖子列表(市集广场)
 */
export async function getPosts(params: GetPostsParams): Promise<{ posts: any[]; total: number }> {
  try {
    const where: any = {};
    
    // 如果指定了status，使用指定的；否则默认只查询active
    if (params.status) {
      where.status = params.status;
    } else {
      where.status = 'active';
    }

    const [allPosts, total] = await Promise.all([
      params.sort === 'hot'
        ? prisma.post.findMany({
            where,
            skip: 0,
            take: params.take * 3, // 多取一些，用于计算热度分数后排序
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
          })
        : prisma.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: params.skip,
            take: params.take,
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
      prisma.post.count({ where }),
    ]);

    let posts = allPosts;

    // 如果是"最热"排序，计算热度分数并排序
    if (params.sort === 'hot') {
      posts = allPosts
        .map(post => ({
          ...post,
          hotScore: calculatePostHotScore(post),
        }))
        .sort((a, b) => b.hotScore - a.hotScore)
        .slice(params.skip, params.skip + params.take);
    }

    return { posts, total };
  } catch (error) {
    logger.error('Get posts error:', error);
    throw new Error('POSTS_FETCH_FAILED');
  }
}

/**
 * 获取帖子详情
 */
export async function getPostById(postId: string): Promise<any | null> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
    });

    // 增加浏览量
    if (post) {
      await prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return post;
  } catch (error) {
    logger.error('Get post by ID error:', error);
    throw new Error('POST_FETCH_FAILED');
  }
}

/**
 * 获取我的帖子
 */
export async function getMyPosts(userId: string, params: GetMyPostsParams): Promise<{ posts: any[]; total: number }> {
  try {
    const where: any = { userId };
    if (params.status) {
      where.status = params.status;
    }

    const orderBy: any = { createdAt: 'desc' };
    if (params.sort === 'hot') {
      orderBy.likeCount = 'desc';
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
              points: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const normalized = posts.map(p => ({
      ...p,
      commentCount: p._count?.comments ?? p.commentCount ?? 0,
      tags: (() => {
        if (Array.isArray(p.tags)) return p.tags;
        if (typeof p.tags === 'string' && p.tags) {
          try { return JSON.parse(p.tags); } catch { return []; }
        }
        return [];
      })(),
    }));

    return { posts: normalized, total };
  } catch (error: any) {
    logger.error('Get my posts error:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId,
      params,
    });
    throw new Error('MY_POSTS_FETCH_FAILED');
  }
}

/**
 * 更新帖子
 */
export async function updatePost(
  postId: string,
  userId: string,
  data: { contentType?: string; title?: string; content?: string; tags?: string[] }
): Promise<any> {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('POST_NOT_FOUND');
    if (post.userId !== userId) throw new Error('POST_PERMISSION_DENIED');

    const updateData: any = {};
    if (data.contentType !== undefined) updateData.contentType = data.contentType;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) {
      if (data.content.length < 1 || data.content.length > 5000) {
        throw new Error('POST_CONTENT_INVALID');
      }
      updateData.content = data.content;
    }
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }

    return await prisma.post.update({ where: { id: postId }, data: updateData });
  } catch (error: any) {
    if (['POST_NOT_FOUND', 'POST_PERMISSION_DENIED', 'POST_CONTENT_INVALID'].includes(error.message)) {
      throw error;
    }
    logger.error('Update post error:', error);
    throw new Error('POST_UPDATE_FAILED');
  }
}

/**
 * 删除帖子
 */
export async function deletePost(postId: string, userId: string): Promise<void> {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('POST_NOT_FOUND');
    if (post.userId !== userId) throw new Error('POST_PERMISSION_DENIED');

    await prisma.post.delete({ where: { id: postId } });
    logger.info(`Post deleted: ${postId} by user ${userId}`);
  } catch (error: any) {
    if (['POST_NOT_FOUND', 'POST_PERMISSION_DENIED'].includes(error.message)) {
      throw error;
    }
    logger.error('Delete post error:', error);
    throw new Error('POST_DELETE_FAILED');
  }
}

/**
 * 点赞帖子
 */
export async function likePost(postId: string, userId: string): Promise<void> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!post) {
      throw new Error('POST_NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
      updateUserPoints(post.userId, 1, 'post_liked', '帖子被点赞'),
    ] as any);

    logger.info(`Post liked: ${postId} by user ${userId}`);
  } catch (error) {
    logger.error('Like post error:', error);
    throw new Error('POST_LIKE_FAILED');
  }
}

/**
 * 计算帖子热度分数
 * 综合考虑浏览量、点赞数、评论数、时间衰减
 */
function calculatePostHotScore(post: any): number {
  const viewScore = (post.viewCount || 0) * 0.3;
  const likeScore = (post.likeCount || 0) * 0.4; // 点赞数权重最高
  const commentScore = (post.commentCount || 0) * 0.2;
  
  // 时间衰减因子（市集帖子时效性很重要，使用较短的衰减周期）
  const timeDecay = calculateTimeDecay(post.createdAt, 7); // 7天衰减周期
  
  const baseScore = viewScore + likeScore + commentScore;
  return baseScore * timeDecay;
}

/**
 * 计算时间衰减因子
 */
function calculateTimeDecay(date: Date | string | null, halfLifeDays: number = 7): number {
  if (!date) return 0.1;
  const now = new Date();
  const publishDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(publishDate.getTime())) return 0.1;
  const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublish < 0) return 1.0;
  if (daysSincePublish === 0) return 1.0;
  const decay = Math.pow(2, -daysSincePublish / halfLifeDays);
  return Math.max(decay, 0.1);
}
