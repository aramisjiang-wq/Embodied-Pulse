/**
 * HuggingFace定时同步服务
 * 定期同步HuggingFace Papers和作者模型
 */

import cron from 'node-cron';
import { syncHuggingFacePapersByDate } from './sync/huggingface-papers.sync';
import { getAllAuthorSubscriptions, syncAuthorModels } from './huggingface-author-subscription.service';
import { getSubscribedPapersUsers, getSubscribedAuthorUsers } from './user-huggingface-subscription.service';
import { logger } from '../utils/logger';
import { createNotification } from './notification.service';

let papersSyncJob: cron.ScheduledTask | null = null;
let authorSyncJob: cron.ScheduledTask | null = null;

export function startHuggingFaceSyncScheduler() {
  if (papersSyncJob) {
    logger.warn('HuggingFace Papers同步任务已在运行');
    return;
  }

  papersSyncJob = cron.schedule('0 9 * * *', async () => {
    logger.info('开始定时同步HuggingFace每日论文...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await syncHuggingFacePapersByDate(today, 100);

      if (result.success && result.synced > 0) {
        logger.info(`HuggingFace论文同步完成: ${result.synced} 篇`);

        const subscribedUsers = await getSubscribedPapersUsers();
        for (const { userId } of subscribedUsers) {
          await createNotification({
            userId,
            type: 'paper_new',
            title: 'HuggingFace每日论文更新',
            content: `今日新增 ${result.synced} 篇论文，快来看看吧！`,
            contentType: 'huggingface',
            contentId: 'papers',
          }).catch(err => logger.error('创建论文通知失败:', err));
        }
      }
    } catch (error: any) {
      logger.error('HuggingFace论文定时同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  logger.info('HuggingFace Papers同步任务已启动 (每天09:00)');
}

export function stopHuggingFaceSyncScheduler() {
  if (papersSyncJob) {
    papersSyncJob.stop();
    papersSyncJob = null;
    logger.info('HuggingFace Papers同步任务已停止');
  }
}

export function startAuthorSyncScheduler() {
  if (authorSyncJob) {
    logger.warn('HuggingFace作者同步任务已在运行');
    return;
  }

  authorSyncJob = cron.schedule('0 */6 * * *', async () => {
    logger.info('开始定时同步HuggingFace作者模型...');
    try {
      const subscriptions = await getAllAuthorSubscriptions();
      const activeSubscriptions = subscriptions.filter(s => s.isActive);

      for (const sub of activeSubscriptions) {
        try {
          const result = await syncAuthorModels(sub.author, 50);

          if (result.synced > 0) {
            const subscribedUsers = await getSubscribedAuthorUsers(sub.author);
            for (const { userId } of subscribedUsers) {
              await createNotification({
                userId,
                type: 'repo_update',
                title: `${sub.author} 发布新模型`,
                content: `${sub.author} 发布了 ${result.synced} 个新模型`,
                contentType: 'huggingface',
                contentId: sub.author,
              }).catch(err => logger.error('创建作者通知失败:', err));
            }
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          logger.error(`同步作者 ${sub.author} 失败:`, error.message);
        }
      }

      logger.info('HuggingFace作者同步完成');
    } catch (error: any) {
      logger.error('HuggingFace作者定时同步失败:', error.message);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  logger.info('HuggingFace作者同步任务已启动 (每6小时)');
}

export function stopAuthorSyncScheduler() {
  if (authorSyncJob) {
    authorSyncJob.stop();
    authorSyncJob = null;
    logger.info('HuggingFace作者同步任务已停止');
  }
}

export function startAllHuggingFaceSchedulers() {
  startHuggingFaceSyncScheduler();
  startAuthorSyncScheduler();
}

export function stopAllHuggingFaceSchedulers() {
  stopHuggingFaceSyncScheduler();
  stopAuthorSyncScheduler();
}
