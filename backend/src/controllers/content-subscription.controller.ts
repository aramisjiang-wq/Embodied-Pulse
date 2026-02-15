/**
 * 内容订阅控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  createContentSubscription,
  deleteContentSubscription,
  getUserContentSubscriptions,
  checkContentSubscription,
  updateContentSubscription,
} from '../services/content-subscription.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export async function createContentSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { contentType, contentId, notifyEnabled } = req.body;

    if (!contentType || !contentId) {
      return sendError(res, 1001, '缺少必填字段', 400);
    }

    const subscription = await createContentSubscription({
      userId,
      contentType,
      contentId,
      notifyEnabled,
    });

    sendSuccess(res, {
      subscriptionId: subscription.id,
      pointsEarned: 5,
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_SUBSCRIBED') {
      return sendError(res, 1006, '已经订阅过该内容', 409);
    }
    if (error.message === 'USER_NOT_FOUND') {
      return sendError(res, 1005, '用户不存在', 404);
    }
    next(error);
  }
}

export async function deleteContentSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { contentType, contentId } = req.params;
    await deleteContentSubscription(userId, contentType, contentId);

    sendSuccess(res, { message: '取消订阅成功' });
  } catch (error) {
    next(error);
  }
}

export async function getContentSubscriptionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { page = 1, size = 20, contentType } = req.query;
    const skip = (Number(page) - 1) * Number(size);
    const take = Number(size);

    const { subscriptions, total } = await getUserContentSubscriptions({
      userId,
      skip,
      take,
      contentType: contentType as string,
    });

    sendSuccess(res, {
      items: subscriptions,
      pagination: {
        page: Number(page),
        size: Number(size),
        total,
        totalPages: Math.ceil(total / Number(size)),
        hasNext: skip + take < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkContentSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { contentType, contentId } = req.params;
    const isSubscribed = await checkContentSubscription(userId, contentType, contentId);

    sendSuccess(res, { isSubscribed });
  } catch (error) {
    next(error);
  }
}

export async function updateContentSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { id } = req.params;
    const { notifyEnabled } = req.body;

    const subscription = await updateContentSubscription({
      id,
      userId,
      notifyEnabled,
    });

    sendSuccess(res, subscription);
  } catch (error) {
    next(error);
  }
}
