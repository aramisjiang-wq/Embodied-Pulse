/**
 * DailyHotApi 同步服务
 * 从 DailyHotApi 获取并同步新闻数据
 * API文档: https://github.com/imsyy/DailyHotApi
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

const DAILYHOT_API_BASE = 'https://api-hot.imsyy.top';

interface DailyHotItem {
  title: string;
  url: string;
  desc?: string;
  mobileUrl?: string;
  pic?: string;
  hot?: string;
  time?: string;
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
 * 同步DailyHotApi新闻
 * @param platform 平台代码 (baidu, weibo, zhihu, bilibili等)
 * @param maxResults 最大结果数
 */
export async function syncDailyHotApi(platform: string = 'baidu', maxResults: number = 50) {
  try {
    logger.info(`开始同步DailyHotApi新闻，平台: ${platform}, 最大数量: ${maxResults}`);

    const response = await axios.get(`${DAILYHOT_API_BASE}/${platform}`, {
      timeout: 30000,
      validateStatus: () => true, // 接受所有状态码
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // DailyHotApi返回格式可能是：
    // 1. 直接数组: [{ title, url, ... }]
    // 2. 对象格式: { code: 200, data: [...], message: "success" }
    let newsItems: DailyHotItem[] = [];
    
    logger.debug(`DailyHotApi响应状态: ${response.status}, 数据类型: ${typeof response.data}`);
    
    if (response.status >= 200 && response.status < 400) {
      if (Array.isArray(response.data)) {
        // 直接返回数组
        newsItems = response.data;
        logger.debug(`直接数组格式，获取到 ${newsItems.length} 条新闻`);
      } else if (response.data && typeof response.data === 'object') {
        // 对象格式，尝试从data字段获取
        if (Array.isArray(response.data.data)) {
          newsItems = response.data.data;
          logger.debug(`对象格式(data字段)，获取到 ${newsItems.length} 条新闻`);
        } else if (response.data.code === 200 && Array.isArray(response.data.data)) {
          newsItems = response.data.data;
          logger.debug(`对象格式(code=200)，获取到 ${newsItems.length} 条新闻`);
        } else {
          // 记录完整的响应数据用于调试
          logger.error(`API返回格式不正确，响应数据:`, JSON.stringify(response.data).substring(0, 500));
          throw new Error(`API返回格式不正确: ${JSON.stringify(response.data).substring(0, 200)}`);
        }
      } else {
        logger.error(`API返回数据为空或格式异常，状态: ${response.status}, 数据类型: ${typeof response.data}`);
        throw new Error('API返回数据为空');
      }
    } else {
      logger.error(`API请求失败，HTTP状态: ${response.status}`);
      throw new Error(`API请求失败: HTTP ${response.status}`);
    }

    logger.info(`获取到 ${newsItems.length} 条新闻`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const item of newsItems.slice(0, maxResults)) {
      try {
        if (!item.title || !item.url) {
          logger.warn(`跳过无效的新闻数据:`, item);
          continue;
        }

        // 解析发布时间（如果提供）
        let publishedDate: Date | undefined = undefined;
        if (item.time) {
          try {
            publishedDate = new Date(item.time);
            if (isNaN(publishedDate.getTime())) {
              publishedDate = undefined;
            }
          } catch (e) {
            publishedDate = undefined;
          }
        }

        await createOrUpdateNews({
          platform,
          title: item.title,
          url: item.url,
          score: item.hot || undefined,
          description: item.desc || undefined,
          publishedDate: publishedDate || new Date(),
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`同步新闻失败 (${item.title}):`, error.message);
      }
    }

    logger.info(`DailyHotApi同步完成: 成功 ${syncedCount} 条, 失败 ${errorCount} 条`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: newsItems.length,
    };
  } catch (error: any) {
    // 提供更详细的错误信息
    let errorMessage = error.message || '同步失败';
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = `无法连接到DailyHotApi服务器 (${DAILYHOT_API_BASE}): ${error.message}`;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = `请求超时: ${error.message}`;
    } else if (error.response) {
      errorMessage = `API返回错误: HTTP ${error.response.status} - ${error.response.statusText || error.message}`;
    }
    
    logger.error(`DailyHotApi同步失败: ${errorMessage}`, {
      code: error.code,
      status: error.response?.status,
      url: `${DAILYHOT_API_BASE}/${platform}`,
    });
    throw new Error(errorMessage);
  }
}

/**
 * 同步多个平台的DailyHotApi新闻
 */
export async function syncDailyHotApiByPlatforms(platforms: string[] = ['baidu', 'weibo', 'zhihu'], maxResults: number = 50) {
  const results: Record<string, { synced: number; errors: number; total: number }> = {};

  for (const platform of platforms) {
    try {
      const result = await syncDailyHotApi(platform, maxResults);
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
