/**
 * 队列管理控制器
 * 提供队列管理的API端点
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import {
  getQueueStats,
  getAllQueueStats,
  cleanQueue,
  cleanAllQueues,
  pauseQueue,
  resumeQueue,
  retryFailedJobs,
} from '../queues/queue.service';
import { logger } from '../utils/logger';

export async function getQueueStatsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { queueName } = req.params;
    const stats = await getQueueStats(queueName);
    sendSuccess(res, { queueName, ...stats });
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    next(error);
  }
}

export async function getAllQueueStatsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getAllQueueStats();
    sendSuccess(res, { queues: stats });
  } catch (error) {
    logger.error('Failed to get all queue stats:', error);
    next(error);
  }
}

export async function cleanQueueHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { queueName } = req.params;
    await cleanQueue(queueName);
    sendSuccess(res, { message: `Queue ${queueName} cleaned successfully` });
  } catch (error) {
    logger.error('Failed to clean queue:', error);
    next(error);
  }
}

export async function cleanAllQueuesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cleanAllQueues();
    sendSuccess(res, { message: 'All queues cleaned successfully' });
  } catch (error) {
    logger.error('Failed to clean all queues:', error);
    next(error);
  }
}

export async function pauseQueueHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { queueName } = req.params;
    await pauseQueue(queueName);
    sendSuccess(res, { message: `Queue ${queueName} paused successfully` });
  } catch (error) {
    logger.error('Failed to pause queue:', error);
    next(error);
  }
}

export async function resumeQueueHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { queueName } = req.params;
    await resumeQueue(queueName);
    sendSuccess(res, { message: `Queue ${queueName} resumed successfully` });
  } catch (error) {
    logger.error('Failed to resume queue:', error);
    next(error);
  }
}

export async function retryFailedJobsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { queueName } = req.params;
    const retried = await retryFailedJobs(queueName);
    sendSuccess(res, { message: `Retried ${retried} failed jobs`, retried });
  } catch (error) {
    logger.error('Failed to retry failed jobs:', error);
    next(error);
  }
}
