/**
 * 招聘信息同步控制器
 * 用于管理招聘信息同步任务
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import JobSyncScheduler from '../services/job-sync-scheduler.service';
import { sendSuccess, sendError } from '../utils/response';

let schedulerInstance: JobSyncScheduler | null = null;

export function getScheduler(): JobSyncScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new JobSyncScheduler();
  }
  return schedulerInstance;
}

export async function syncJobsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const scheduler = getScheduler();
    const result = await scheduler.manualSync();

    if (result.success) {
      sendSuccess(res, result, '招聘信息同步成功');
    } else {
      sendError(res, 6001, result.error || '同步失败', 500);
    }
  } catch (error: any) {
    logger.error('同步招聘信息失败:', error);
    sendError(res, 6002, error.message || '同步失败', 500);
  }
}

export async function getSyncStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const scheduler = getScheduler();
    const isRunning = scheduler.isSyncRunning();

    sendSuccess(res, {
      isRunning,
      message: isRunning ? '同步任务正在运行中' : '同步任务空闲',
    }, '获取同步状态成功');
  } catch (error: any) {
    logger.error('获取同步状态失败:', error);
    sendError(res, 6003, error.message || '获取状态失败', 500);
  }
}

export async function startScheduleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { type = 'daily', cron } = req.body;
    const scheduler = getScheduler();

    switch (type) {
      case 'daily':
        scheduler.startDailySchedule(cron);
        break;
      case 'hourly':
        scheduler.startHourlySchedule();
        break;
      case 'custom':
        if (!cron) {
          return sendError(res, 6004, '自定义定时任务需要提供cron表达式', 400);
        }
        scheduler.startCustomSchedule(cron);
        break;
      default:
        return sendError(res, 6005, '无效的定时任务类型', 400);
    }

    sendSuccess(res, { type, cron }, '定时任务启动成功');
  } catch (error: any) {
    logger.error('启动定时任务失败:', error);
    sendError(res, 6006, error.message || '启动定时任务失败', 500);
  }
}
