/**
 * 定时任务控制器
 */

import { Request, Response } from 'express';
import {
  startScheduledSync,
  stopScheduledSync,
  isScheduledSyncRunning,
  getScheduleInfo,
  startSubscriptionUpdateCheck,
  stopSubscriptionUpdateCheck,
  isSubscriptionUpdateCheckRunning,
} from '../services/scheduler.service';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

export async function start(req: Request, res: Response) {
  try {
    startScheduledSync();
    
    const info = getScheduleInfo();
    
    sendSuccess(res, info, '定时同步任务已启动');
  } catch (error: any) {
    logger.error('启动定时同步任务失败:', error);
    sendError(res, 500, error.message || '启动失败');
  }
}

export async function stop(req: Request, res: Response) {
  try {
    stopScheduledSync();
    
    sendSuccess(res, null, '定时同步任务已停止');
  } catch (error: any) {
    logger.error('停止定时同步任务失败:', error);
    sendError(res, 500, error.message || '停止失败');
  }
}

export async function getStatus(req: Request, res: Response) {
  try {
    const info = getScheduleInfo();
    
    sendSuccess(res, info);
  } catch (error: any) {
    logger.error('获取定时任务状态失败:', error);
    sendError(res, 500, error.message || '获取状态失败');
  }
}

export async function startSubscriptionCheck(req: Request, res: Response) {
  try {
    startSubscriptionUpdateCheck();
    
    const isRunning = isSubscriptionUpdateCheckRunning();
    
    sendSuccess(res, { isRunning }, '订阅更新检查任务已启动');
  } catch (error: any) {
    logger.error('启动订阅更新检查任务失败:', error);
    sendError(res, 500, error.message || '启动失败');
  }
}

export async function stopSubscriptionCheck(req: Request, res: Response) {
  try {
    stopSubscriptionUpdateCheck();
    
    sendSuccess(res, null, '订阅更新检查任务已停止');
  } catch (error: any) {
    logger.error('停止订阅更新检查任务失败:', error);
    sendError(res, 500, error.message || '停止失败');
  }
}

export async function getSubscriptionCheckStatus(req: Request, res: Response) {
  try {
    const isRunning = isSubscriptionUpdateCheckRunning();
    
    sendSuccess(res, {
      isRunning,
      schedule: '0 */6 * * *',
    });
  } catch (error: any) {
    logger.error('获取订阅更新检查任务状态失败:', error);
    sendError(res, 500, error.message || '获取状态失败');
  }
}