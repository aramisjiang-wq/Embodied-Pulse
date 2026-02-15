/**
 * 帖子控制器
 */

import { Request, Response, NextFunction } from 'express';
import { createPost, getPosts, getPostById, likePost, getMyPosts } from '../services/post.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

export async function createPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { contentType, contentId, title, content, images, tags, topicId } = req.body;

    console.log('[createPostHandler] Request body:', {
      userId,
      contentType,
      contentId,
      title,
      contentLength: content?.length,
      images,
      tags,
      topicId,
    });

    if (!content || content.length < 1 || content.length > 5000) {
      return sendError(res, 1001, '内容长度必须在1-5000字符之间', 400);
    }

    const post = await createPost({
      userId,
      contentType,
      contentId,
      title,
      content,
      images,
      tags,
      topicId,
    });

    console.log('[createPostHandler] Post created successfully:', post.id);

    // 如果帖子关联了内容（contentType和contentId），记录分享行为
    if (contentType && contentId) {
      createUserAction({
        userId,
        actionType: 'share',
        contentType: contentType as any,
        contentId,
        metadata: {
          postId: post.id,
          title: title || null,
        },
      }).catch(err => {
        console.error('[createPostHandler] Failed to create user action:', err);
      });
    }

    sendSuccess(res, {
      postId: post.id,
      pointsEarned: 20,
      estimatedViews: 500,
    });
  } catch (error) {
    console.error('[createPostHandler] Error:', error);
    next(error);
  }
}

export async function getPostsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, topicId, status } = req.query;

    const { posts, total } = await getPosts({
      skip,
      take,
      sort: sort as any,
      topicId: topicId as string,
      status: status as string,
    });

    sendSuccess(res, {
      items: posts,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    const post = await getPostById(postId);

    if (!post) {
      return sendError(res, 1005, '帖子不存在', 404);
    }

    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
}

export async function getMyPostsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, status } = req.query;

    const { posts, total } = await getMyPosts(userId, {
      skip,
      take,
      sort: sort as any,
      status: status as string,
    });

    sendSuccess(res, {
      items: posts,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

export async function likePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { postId } = req.params;
    await likePost(postId, userId);

    sendSuccess(res, { message: '点赞成功' });
  } catch (error) {
    next(error);
  }
}
