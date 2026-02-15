/**
 * 帖子管理控制器（管理端）
 */

import { Request, Response, NextFunction } from 'express';
import { deletePost, restorePost, pinPost, featurePost } from '../services/post-admin.service';
import { sendSuccess, sendError } from '../utils/response';

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
