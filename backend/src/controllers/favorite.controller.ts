/**
 * 收藏控制器
 */

import { Request, Response, NextFunction } from 'express';
import { createFavorite, deleteFavorite, getUserFavorites } from '../services/favorite.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

export async function createFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { contentType, contentId, folderId } = req.body;

    if (!contentType || !contentId) {
      return sendError(res, 1001, '缺少必填字段', 400);
    }

    const favorite = await createFavorite({
      userId,
      contentType,
      contentId,
      folderId,
    });

    // 记录用户收藏行为
    createUserAction({
      userId,
      actionType: 'favorite',
      contentType: contentType as any,
      contentId,
      metadata: {
        folderId: folderId || null,
      },
    }).catch(err => {
      // 行为记录失败不影响主流程
    });

    sendSuccess(res, {
      favoriteId: favorite.id,
      pointsEarned: 5,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_FAVORITED') {
      return sendError(res, 1006, '已经收藏过该内容', 409);
    }
    if (error.message === 'USER_NOT_FOUND') {
      return sendError(res, 1005, '用户不存在', 404);
    }
    next(error);
  }
}

export async function deleteFavoriteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { contentType, contentId } = req.params;
    await deleteFavorite(userId, contentType, contentId);

    // 记录用户取消收藏行为
    createUserAction({
      userId,
      actionType: 'unfavorite',
      contentType: contentType as any,
      contentId,
    }).catch(err => {
      // 行为记录失败不影响主流程
    });

    sendSuccess(res, { message: '取消收藏成功' });
  } catch (error) {
    next(error);
  }
}

export async function getFavoritesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { type } = req.query;

    const { favorites, total } = await getUserFavorites(userId, type as string, skip, take);

    sendSuccess(res, {
      items: favorites,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}
