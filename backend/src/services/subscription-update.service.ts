/**
 * 订阅更新检查服务
 * 定期检查用户订阅的内容是否有更新，并创建通知
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { getUserContentSubscriptions } from './content-subscription.service';
import { createNotification } from './notification.service';
import axios from 'axios';

const prisma = userPrisma as any;

interface GitHubRepoUpdate {
  id: string;
  updated_at: string;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
}

interface PaperUpdate {
  id: string;
  updated: string;
  title: string;
  authors: string;
  published: string;
}

interface HuggingFaceModelUpdate {
  id: string;
  lastModified: string;
  modelId: string;
  description: string;
  downloads: number;
  likes: number;
}

/**
 * 检查GitHub仓库更新
 */
async function checkGitHubRepoUpdates(subscription: any, githubToken?: string): Promise<boolean> {
  try {
    const repo = await prisma.githubRepo.findUnique({
      where: { id: subscription.contentId },
    });

    if (!repo) {
      logger.warn(`GitHub repo not found: ${subscription.contentId}`);
      return false;
    }

    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const response = await axios.get<GitHubRepoUpdate>(
      `https://api.github.com/repos/${repo.fullName}`,
      { headers, timeout: 10000 }
    );

    const latestUpdate = response.data.updated_at;
    const lastChecked = subscription.lastChecked || new Date(0);

    if (new Date(latestUpdate) > lastChecked) {
      logger.info(`GitHub repo updated: ${repo.fullName}, last: ${repo.updatedDate}, new: ${latestUpdate}`);

      // 更新数据库中的仓库信息
      await prisma.githubRepo.update({
        where: { id: repo.id },
        data: {
          updatedDate: new Date(latestUpdate),
          starsCount: response.data.stargazers_count,
          forksCount: response.data.forks_count,
        },
      });

      // 创建通知
      await createNotification({
        userId: subscription.userId,
        type: 'repo_update',
        title: `GitHub仓库更新：${response.data.name}`,
        content: `你订阅的GitHub仓库 "${response.data.full_name}" 有新更新`,
        contentType: 'repo',
        contentId: repo.id,
        metadata: JSON.stringify({
          fullName: response.data.full_name,
          starsCount: response.data.stargazers_count,
          forksCount: response.data.forks_count,
        }),
      });

      return true;
    }

    return false;
  } catch (error: any) {
    logger.error('Check GitHub repo update error:', {
      subscriptionId: subscription.id,
      contentId: subscription.contentId,
      error: error.message,
      response: error.response?.data,
    });
    return false;
  }
}

/**
 * 检查论文更新
 */
async function checkPaperUpdates(subscription: any): Promise<boolean> {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: subscription.contentId },
    });

    if (!paper) {
      logger.warn(`Paper not found: ${subscription.contentId}`);
      return false;
    }

    const lastChecked = subscription.lastChecked || new Date(0);

    if (paper.publishedDate && paper.publishedDate > lastChecked) {
      logger.info(`Paper updated: ${paper.arxivId}, published: ${paper.publishedDate}`);

      // 创建通知
      await createNotification({
        userId: subscription.userId,
        type: 'paper_new',
        title: `新论文：${paper.title}`,
        content: `你订阅的论文 "${paper.title}" 已发布`,
        contentType: 'paper',
        contentId: paper.id,
        metadata: JSON.stringify({
          arxivId: paper.arxivId,
          authors: paper.authors,
          publishedDate: paper.publishedDate,
        }),
      });

      return true;
    }

    return false;
  } catch (error: any) {
    logger.error('Check paper update error:', {
      subscriptionId: subscription.id,
      contentId: subscription.contentId,
      error: error.message,
    });
    return false;
  }
}

/**
 * 检查HuggingFace模型更新
 */
async function checkHuggingFaceUpdates(subscription: any): Promise<boolean> {
  try {
    const model = await prisma.huggingFaceModel.findUnique({
      where: { id: subscription.contentId },
    });

    if (!model) {
      logger.warn(`HuggingFace model not found: ${subscription.contentId}`);
      return false;
    }

    const lastChecked = subscription.lastChecked || new Date(0);

    if (model.lastModified && model.lastModified > lastChecked) {
      logger.info(`HuggingFace model updated: ${model.fullName}, last: ${model.lastModified}`);

      // 创建通知
      await createNotification({
        userId: subscription.userId,
        type: 'repo_update',
        title: `HuggingFace模型更新：${model.fullName}`,
        content: `你订阅的HuggingFace模型 "${model.fullName}" 有新更新`,
        contentType: 'huggingface',
        contentId: model.id,
        metadata: JSON.stringify({
          fullName: model.fullName,
          downloads: model.downloads,
          likes: model.likes,
        }),
      });

      return true;
    }

    return false;
  } catch (error: any) {
    logger.error('Check HuggingFace update error:', {
      subscriptionId: subscription.id,
      contentId: subscription.contentId,
      error: error.message,
    });
    return false;
  }
}

/**
 * 检查所有订阅的更新
 */
export async function checkAllSubscriptionUpdates(): Promise<{
  totalChecked: number;
  totalUpdated: number;
  errors: number;
}> {
  const startTime = Date.now();
  let totalChecked = 0;
  let totalUpdated = 0;
  let errors = 0;

  try {
    const githubToken = process.env.GITHUB_TOKEN;

    // 获取所有启用的订阅
    const { subscriptions } = await getUserContentSubscriptions({
      userId: '', // 获取所有订阅
      skip: 0,
      take: 1000, // 限制数量，避免一次处理太多
    });

    logger.info(`开始检查订阅更新，共 ${subscriptions.length} 个订阅`);

    for (const subscription of subscriptions) {
      if (!subscription.notifyEnabled) {
        continue; // 跳过未开启通知的订阅
      }

      totalChecked++;

      try {
        let hasUpdate = false;

        switch (subscription.contentType) {
          case 'repo':
            hasUpdate = await checkGitHubRepoUpdates(subscription, githubToken);
            break;
          case 'paper':
            hasUpdate = await checkPaperUpdates(subscription);
            break;
          case 'huggingface':
            hasUpdate = await checkHuggingFaceUpdates(subscription);
            break;
          default:
            logger.warn(`Unknown subscription type: ${subscription.contentType}`);
        }

        if (hasUpdate) {
          totalUpdated++;

          // 更新订阅的最后通知时间
          await prisma.contentSubscription.update({
            where: { id: subscription.id },
            data: {
              lastNotified: new Date(),
            },
          });
        }

        // 更新订阅的最后检查时间
        await prisma.contentSubscription.update({
          where: { id: subscription.id },
          data: {
            lastChecked: new Date(),
          },
        });

      } catch (error) {
        errors++;
        logger.error(`检查订阅更新失败: ${subscription.id}`, error);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`订阅更新检查完成: 检查 ${totalChecked} 个，更新 ${totalUpdated} 个，错误 ${errors} 个，耗时 ${duration}ms`);

    return {
      totalChecked,
      totalUpdated,
      errors,
    };
  } catch (error) {
    logger.error('Check all subscription updates error:', error);
    throw error;
  }
}

/**
 * 检查指定用户的订阅更新
 */
export async function checkUserSubscriptionUpdates(userId: string): Promise<{
  totalChecked: number;
  totalUpdated: number;
  errors: number;
}> {
  const startTime = Date.now();
  let totalChecked = 0;
  let totalUpdated = 0;
  let errors = 0;

  try {
    const githubToken = process.env.GITHUB_TOKEN;

    const { subscriptions } = await getUserContentSubscriptions({
      userId,
      skip: 0,
      take: 100,
    });

    logger.info(`开始检查用户 ${userId} 的订阅更新，共 ${subscriptions.length} 个订阅`);

    for (const subscription of subscriptions) {
      if (!subscription.notifyEnabled) {
        continue;
      }

      totalChecked++;

      try {
        let hasUpdate = false;

        switch (subscription.contentType) {
          case 'repo':
            hasUpdate = await checkGitHubRepoUpdates(subscription, githubToken);
            break;
          case 'paper':
            hasUpdate = await checkPaperUpdates(subscription);
            break;
          case 'huggingface':
            hasUpdate = await checkHuggingFaceUpdates(subscription);
            break;
          default:
            logger.warn(`Unknown subscription type: ${subscription.contentType}`);
        }

        if (hasUpdate) {
          totalUpdated++;

          await prisma.contentSubscription.update({
            where: { id: subscription.id },
            data: {
              lastNotified: new Date(),
            },
          });
        }

        await prisma.contentSubscription.update({
          where: { id: subscription.id },
          data: {
            lastChecked: new Date(),
          },
        });

      } catch (error) {
        errors++;
        logger.error(`检查订阅更新失败: ${subscription.id}`, error);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`用户 ${userId} 订阅更新检查完成: 检查 ${totalChecked} 个，更新 ${totalUpdated} 个，错误 ${errors} 个，耗时 ${duration}ms`);

    return {
      totalChecked,
      totalUpdated,
      errors,
    };
  } catch (error) {
    logger.error('Check user subscription updates error:', error);
    throw error;
  }
}
