/**
 * 热点新闻API同步服务
 * 从热点新闻API获取并同步新闻数据
 * API文档: https://github.com/orz-ai/hot_news
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

const HOT_NEWS_API_BASE = 'https://orz.ai/api/v1';

interface HotNewsItem {
  title: string;
  url: string;
  score?: string;
  desc?: string;
  content?: string;
  source?: string;
  publish_time?: string;
}

async function createOrUpdateNews(data: {
  platform: string;
  title: string;
  url: string;
  score?: string;
  description?: string;
  publishedDate?: Date;
}) {
  return await userPrisma.news.upsert({
    where: { url: data.url },
    update: {
      title: data.title,
      score: data.score,
      description: data.description,
      publishedDate: data.publishedDate,
      updatedAt: new Date(),
    },
    create: {
      platform: data.platform,
      title: data.title,
      url: data.url,
      score: data.score,
      description: data.description,
      publishedDate: data.publishedDate || new Date(),
    },
  } as any);
}

/**
 * 同步热点新闻
 * @param platform 平台代码 (baidu, weibo, zhihu, bilibili等)
 * @param maxResults 最大结果数
 */
export async function syncHotNews(platform: string = 'baidu', maxResults: number = 50) {
  try {
    logger.info(`开始同步热点新闻，平台: ${platform}, 最大数量: ${maxResults}`);

    const response = await axios.get(`${HOT_NEWS_API_BASE}/dailynews/`, {
      params: {
        platform,
        limit: Math.min(maxResults, 100), // API限制
      },
      timeout: 30000,
    });

    if (!response.data || response.data.status !== '200') {
      throw new Error(`API返回错误: ${response.data?.msg || '未知错误'}`);
    }

    const newsItems: HotNewsItem[] = response.data.data || [];
    logger.info(`获取到 ${newsItems.length} 条新闻`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const item of newsItems) {
      try {
        if (!item.title || !item.url) {
          logger.warn(`跳过无效的新闻数据:`, item);
          continue;
        }

        // 解析发布时间（如果提供）
        let publishedDate: Date | undefined = undefined;
        if (item.publish_time) {
          try {
            // 尝试解析时间格式: "2026-01-20 20:17:49"
            publishedDate = new Date(item.publish_time);
            if (isNaN(publishedDate.getTime())) {
              publishedDate = undefined;
            }
          } catch (e) {
            // 解析失败，使用当前时间
            publishedDate = undefined;
          }
        }

        await createOrUpdateNews({
          platform,
          title: item.title,
          url: item.url,
          score: item.score ? String(item.score) : undefined,
          description: item.desc || item.content || undefined,
          publishedDate: publishedDate || new Date(), // 使用API提供的发布时间，否则使用当前时间
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`同步新闻失败 (${item.title}):`, error.message);
      }
    }

    logger.info(`热点新闻同步完成: 成功 ${syncedCount} 条, 失败 ${errorCount} 条`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: newsItems.length,
    };
  } catch (error: any) {
    logger.error(`热点新闻同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步多个平台的热点新闻
 */
export async function syncHotNewsByPlatforms(platforms: string[] = ['baidu', 'weibo', 'zhihu'], maxResults: number = 50) {
  const results: Record<string, { synced: number; errors: number; total: number }> = {};

  for (const platform of platforms) {
    try {
      const result = await syncHotNews(platform, maxResults);
      results[platform] = {
        synced: result.synced,
        errors: result.errors,
        total: result.total,
      };
    } catch (error: any) {
      logger.error(`平台 ${platform} 同步失败:`, error.message);
      results[platform] = {
        synced: 0,
        errors: 0,
        total: 0,
      };
    }
  }

  return results;
}
