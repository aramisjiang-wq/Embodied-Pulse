/**
 * GitHub项目更新检查服务
 * 定期检查GitHub项目更新并发送通知
 */

import { logger } from '../utils/logger';
import mainPrisma from '../config/database';
import userPrismaAny from '../config/database.user';
import { createNotification } from './notification.service';

const mainDb = mainPrisma as any;
const userPrisma = userPrismaAny as any;
const userDb = userPrisma;

/**
 * 检查GitHub项目更新
 */
export async function checkGitHubRepoUpdates() {
  try {
    logger.info('Starting GitHub repo update check...');

    // 获取所有需要检查更新的GitHub项目
    const repos = await mainDb.githubRepo.findMany({
      where: {
        notify_enabled: 1,
      },
      select: {
        id: true,
        repoId: true,
        name: true,
        fullName: true,
        starsCount: true,
        forksCount: true,
        issuesCount: true,
        updatedDate: true,
        added_by: true,
      },
    });

    logger.info(`Found ${repos.length} repos to check`);

    let updateCount = 0;
    const notificationsToCreate = [];

    for (const repo of repos) {
      try {
        // 检查是否有更新（这里简化处理，实际应该调用GitHub API获取最新信息）
        const hasUpdate = await checkRepoUpdate(repo);

        if (hasUpdate) {
          // 获取需要通知的用户
          const usersToNotify = await getUsersToNotify(repo);

          for (const userId of usersToNotify) {
            notificationsToCreate.push({
              userId,
              type: 'repo_update' as const,
              title: `GitHub项目更新: ${repo.name}`,
              content: `项目 ${repo.fullName} 有新的更新`,
              contentType: 'repo' as const,
              contentId: repo.id,
              metadata: {
                repoName: repo.name,
                fullName: repo.fullName,
                starsCount: repo.starsCount,
                forksCount: repo.forksCount,
                issuesCount: repo.issuesCount,
                updatedDate: repo.updatedDate,
              },
            });
          }

          // 更新项目的最后通知时间
          await mainDb.githubRepo.update({
            where: { id: repo.id },
            data: { last_notified: new Date().toISOString() },
          });

          updateCount++;
        }
      } catch (error) {
        logger.error(`Error checking repo ${repo.fullName}:`, error);
      }
    }

    // 批量创建通知
    if (notificationsToCreate.length > 0) {
      await Promise.all(
        notificationsToCreate.map(n => createNotification(n))
      );
      logger.info(`Created ${notificationsToCreate.length} notifications for ${updateCount} updated repos`);
    } else {
      logger.info('No repo updates found');
    }

    return {
      totalRepos: repos.length,
      updatedRepos: updateCount,
      notificationsCreated: notificationsToCreate.length,
    };
  } catch (error) {
    logger.error('Check GitHub repo updates error:', error);
    throw error;
  }
}

/**
 * 检查单个项目是否有更新
 */
async function checkRepoUpdate(repo: any): Promise<boolean> {
  try {
    // 这里应该调用GitHub API获取最新的项目信息
    // 简化处理：如果最后通知时间早于更新时间，认为有更新
    if (!repo.lastNotified) {
      return true; // 从未通知过，需要通知
    }

    // 检查更新时间是否在最后通知时间之后
    const updatedDate = repo.updatedDate ? new Date(repo.updatedDate) : new Date();
    const lastNotified = new Date(repo.lastNotified);

    // 如果更新时间比最后通知时间新，认为有更新
    return updatedDate > lastNotified;
  } catch (error) {
    logger.error(`Error checking update for repo ${repo.fullName}:`, error);
    return false;
  }
}

/**
 * 获取需要通知的用户
 */
async function getUsersToNotify(repo: any): Promise<string[]> {
  try {
    const userIds = new Set<string>();

    // 如果是管理员添加的项目，通知所有订阅了该类型内容的用户
    if (repo.added_by === 'admin' || !repo.added_by) {
      // 查找所有订阅了GitHub项目的用户
      const subscriptions = await userDb.subscription.findMany({
        where: {
          contentType: 'repo',
          isActive: true,
          notifyEnabled: true,
        },
        select: {
          userId: true,
        },
      });

      subscriptions.forEach((sub: any) => userIds.add(sub.userId));
    } else if (repo.added_by.startsWith('user:')) {
      // 如果是用户添加的项目，只通知该用户
      const userId = repo.added_by.replace('user:', '');
      userIds.add(userId);
    }

    return Array.from(userIds);
  } catch (error) {
    logger.error(`Error getting users to notify for repo ${repo.fullName}:`, error);
    return [];
  }
}

/**
 * 手动触发GitHub项目更新检查
 */
export async function manualCheckGitHubRepoUpdates() {
  try {
    logger.info('Manual GitHub repo update check triggered');
    const result = await checkGitHubRepoUpdates();
    return result;
  } catch (error) {
    logger.error('Manual check GitHub repo updates error:', error);
    throw error;
  }
}

/**
 * 定时任务：每小时检查一次GitHub项目更新
 */
export function scheduleGitHubRepoUpdateCheck() {
  // 这里可以使用cron或node-cron库来实现定时任务
  // 示例：每小时执行一次
  logger.info('GitHub repo update check scheduled to run every hour');
  
  // 实际实现需要根据项目使用的定时任务库来调整
  // 例如使用node-cron:
  // import cron from 'node-cron';
  // cron.schedule('0 * * * *', async () => {
  //   await checkGitHubRepoUpdates();
  // });
}
