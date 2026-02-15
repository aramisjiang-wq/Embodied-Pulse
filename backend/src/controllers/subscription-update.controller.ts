/**
 * 订阅更新检查控制器
 */

import { Request, Response, NextFunction } from 'express';
import { checkAllSubscriptionUpdates, checkUserSubscriptionUpdates } from '../services/subscription-update.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export async function checkAllUpdatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await checkAllSubscriptionUpdates();
    sendSuccess(res, result);
  } catch (error: any) {
    logger.error('Check all subscription updates error:', error);
    next(error);
  }
}

export async function checkUserUpdatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const result = await checkUserSubscriptionUpdates(userId);
    sendSuccess(res, result);
  } catch (error: any) {
    logger.error('Check user subscription updates error:', error);
    next(error);
  }
}
