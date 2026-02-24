/**
 * 定时任务服务
 * 使用 node-cron 实现定时同步
 */

import * as cron from 'node-cron';
import { syncAllUploaders } from './sync-queue.service';
import { checkAllSubscriptionUpdates } from './subscription-update.service';
import { logger } from '../utils/logger';

let syncJob: ReturnType<typeof cron.schedule> | null = null;
let subscriptionUpdateJob: ReturnType<typeof cron.schedule> | null = null;

const SYNC_SCHEDULE = '0 2 * * *';
const SUBSCRIPTION_UPDATE_SCHEDULE = '0 */6 * * *';

export function startScheduledSync(): void {
  try {
    if (syncJob) {
      logger.warn('定时同步任务已在运行');
      return;
    }

    logger.info(`启动定时同步任务，计划: ${SYNC_SCHEDULE}`);
    
    syncJob = cron.schedule(SYNC_SCHEDULE, async () => {
      try {
        logger.info('开始执行定时同步任务');
        const result = await syncAllUploaders(100);
        logger.info(`定时同步完成: 成功 ${result.totalSynced} 个, 失败 ${result.totalErrors} 个`);
      } catch (error: any) {
        logger.error('定时同步任务失败:', error);
      }
    });

    logger.info('定时同步任务已启动');
  } catch (error: any) {
    logger.error('启动定时同步任务失败:', error);
  }
}

export function startSubscriptionUpdateCheck(): void {
  try {
    if (subscriptionUpdateJob) {
      logger.warn('订阅更新检查任务已在运行');
      return;
    }

    logger.info(`启动订阅更新检查任务，计划: ${SUBSCRIPTION_UPDATE_SCHEDULE}`);
    
    subscriptionUpdateJob = cron.schedule(SUBSCRIPTION_UPDATE_SCHEDULE, async () => {
      try {
        logger.info('开始执行订阅更新检查任务');
        const result = await checkAllSubscriptionUpdates();
        logger.info(`订阅更新检查完成: 检查 ${result.totalChecked} 个，更新 ${result.totalUpdated} 个，错误 ${result.errors} 个`);
      } catch (error: any) {
        logger.error('订阅更新检查任务失败:', error);
      }
    });

    logger.info('订阅更新检查任务已启动');
  } catch (error: any) {
    logger.error('启动订阅更新检查任务失败:', error);
  }
}

export function stopScheduledSync(): void {
  try {
    if (syncJob) {
      logger.info('停止定时同步任务');
      syncJob.stop();
      syncJob = null;
    }
  } catch (error: any) {
    logger.error('停止定时同步任务失败:', error);
  }
}

export function stopSubscriptionUpdateCheck(): void {
  try {
    if (subscriptionUpdateJob) {
      logger.info('停止订阅更新检查任务');
      subscriptionUpdateJob.stop();
      subscriptionUpdateJob = null;
    }
  } catch (error: any) {
    logger.error('停止订阅更新检查任务失败:', error);
  }
}

export function isScheduledSyncRunning(): boolean {
  return syncJob !== null;
}

export function isSubscriptionUpdateCheckRunning(): boolean {
  return subscriptionUpdateJob !== null;
}

export function getScheduleInfo(): {
  isRunning: boolean;
  schedule: string;
  nextRun?: Date;
} {
  try {
    let nextRun: Date | undefined;
    const jobWithNextDate = syncJob as any;
    if (syncJob && jobWithNextDate.nextDate) {
      if (typeof jobWithNextDate.nextDate === 'function') {
        const nextDate = jobWithNextDate.nextDate();
        if (nextDate && typeof nextDate.toDate === 'function') {
          nextRun = nextDate.toDate();
        }
      } else if (jobWithNextDate.nextDate instanceof Date) {
        nextRun = jobWithNextDate.nextDate;
      }
    }
    return {
      isRunning: syncJob !== null,
      schedule: SYNC_SCHEDULE,
      nextRun,
    };
  } catch (error: any) {
    logger.error('获取调度器信息失败:', error);
    return {
      isRunning: syncJob !== null,
      schedule: SYNC_SCHEDULE,
      nextRun: undefined,
    };
  }
}
