/**
 * 帖子管理控制器（管理端）
 */

import { Request, Response, NextFunction } from 'express';
import { deletePost, restorePost, pinPost, featurePost, getCommunityStats } from '../services/post-admin.service';
import { getPosts } from '../services/post.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess } from '../utils/response';

/**
 * 删除帖子
 */
export async function deletePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    await deletePost(postId);
    sendSuccess(res, { message: '删除成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 恢复帖子
 */
export async function restorePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    await restorePost(postId);
    sendSuccess(res, { message: '恢复成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 置顶/取消置顶
 */
export async function pinPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    const { isTop } = req.body;
    await pinPost(postId, isTop);
    sendSuccess(res, { message: isTop ? '置顶成功' : '取消置顶成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 加精/取消加精
 */
export async function featurePostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    const { isFeatured } = req.body;
    await featurePost(postId, isFeatured);
    sendSuccess(res, { message: isFeatured ? '加精成功' : '取消加精成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 管理端获取帖子列表（支持 status 筛选，与用户端同源数据）
 */
export async function getAdminPostsListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, status } = req.query;

    const { posts, total } = await getPosts({
      skip,
      take,
      sort: (sort as 'hot' | 'latest') || 'latest',
      topicId: undefined,
      status: (status as string) || undefined,
    });

    sendSuccess(res, {
      items: posts,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 市集统计（管理端）
 */
export async function getCommunityStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getCommunityStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}
