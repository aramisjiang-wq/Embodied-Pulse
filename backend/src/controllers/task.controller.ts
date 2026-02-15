/**
 * 任务控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getDailyTasks, signIn } from '../services/task.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getDailyTasksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const tasksData = await getDailyTasks(userId);
    sendSuccess(res, tasksData);
  } catch (error) {
    next(error);
  }
}

export async function signInHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const result = await signIn(userId);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message === 'ALREADY_SIGNED_IN') {
      return sendError(res, 1006, '今日已签到', 409);
    }
    next(error);
  }
}
