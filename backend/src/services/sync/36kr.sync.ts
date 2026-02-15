/**
 * 36kr新闻同步服务
 * 从36kr API获取并同步新闻数据
 * 支持多种数据源：
 * 1. 36kr官方API (推荐): https://36kr.com/pp/api/feed-stream (资讯) + https://36kr.com/api/newsflash (快讯)
 * 2. 36kr官方RSS: https://36kr.com/feed
 * 3. 第三方聚合API: https://api-hot.imsyy.top/36kr
 * 
 * API文档参考: https://github.com/shichunlei/-Api/blob/master/36Kr.md
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

const KR36_API_BASE = 'https://36kr.com';
const KR36_RSS_BASE = 'https://36kr.com';
const THIRD_PARTY_API = 'https://api-hot.imsyy.top/36kr';

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

// 36kr资讯分类ID（从feed API获取）
const FEED_ID_LATEST = 303; // 最新
const FEED_ID_RECOMMEND = 304; // 推荐

interface Kr36Article {
  id?: string;
  title: string;
  url: string;
  description?: string;
  publishedDate?: Date;
  author?: string;
  cover?: string;
}

// 资讯API响应格式
interface Kr36FeedStreamResponse {
  code: number;
  data: {
    items: Array<{
      id: number;
      title: string;
      summary?: string;
      published_at: string;
      entity_id: number;
      entity_type: string;
      extra?: {
        author_info?: {
          name: string;
        };
      };
      web_cover?: string;
      images?: string[];
    }>;
  };
}

// 快讯API响应格式
interface Kr36NewsflashResponse {
  code: number;
  data: {
    items: Array<{
      id: number;
      title: string;
      description: string;
      published_at: string;
      news_url?: string;
      user?: {
        name: string;
      };
    }>;
  };
}

interface RssItem {
  title: string[];
  link: string[];
  description?: string[];
  pubDate?: string[];
  author?: string[];
}

/**
 * 从36kr资讯API获取新闻 (feed-stream)
 */
async function fetchFromKr36FeedStream(feedId: number = FEED_ID_LATEST, perPage: number = 30, bId?: number): Promise<Kr36Article[]> {
  try {
    const params: any = {
      type: 'web_news',
      feed_id: feedId,
      per_page: perPage,
    };
    if (bId) {
      params.b_id = bId;
    }

    const response = await axios.get<any>(`${KR36_API_BASE}/pp/api/feed-stream`, {
      params,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://36kr.com/',
        'Accept': 'application/json',
      },
    });

    // 检查是否返回HTML（验证码页面）
    if (typeof response.data === 'string' && response.data.includes('TTGCaptcha')) {
      logger.warn('36kr API触发验证码，需要人工验证');
      throw new Error('36kr API触发验证码，无法自动获取数据');
    }

    // 检查API是否返回错误
    if (response.data && typeof response.data === 'object' && response.data.code !== undefined && response.data.code !== 0) {
      logger.warn(`36kr feed-stream API返回错误: code=${response.data.code}`);
      throw new Error(`36kr API错误: code=${response.data.code}`);
    }

    if (!response.data || typeof response.data !== 'object' || !response.data.data || !response.data.data.items) {
      logger.warn('36kr feed-stream API返回数据格式异常');
      logger.debug('响应数据类型:', typeof response.data);
      return [];
    }

    const articles: Kr36Article[] = response.data.data.items.map((item: any) => {
      let publishedDate: Date | undefined = undefined;
      if (item.published_at) {
        try {
          publishedDate = new Date(item.published_at);
          if (isNaN(publishedDate.getTime())) {
            publishedDate = undefined;
          }
        } catch (e) {
          publishedDate = undefined;
        }
      }

      // 构建文章URL - 使用entity_id构建，如果失败会fallback到RSS获取真实URL
      // 注意：36kr的文章URL格式可能因文章类型而异，这里使用标准格式
      const url = `https://36kr.com/p/${item.entity_id}`;

      return {
        id: item.id.toString(),
        title: item.title,
        url: url,
        description: item.summary,
        publishedDate: publishedDate,
        author: item.extra?.author_info?.name,
        cover: item.web_cover || (item.images && item.images[0]),
      };
    });

    return articles;
  } catch (error: any) {
    logger.error(`从36kr feed-stream API获取新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 从36kr快讯API获取新闻 (newsflash)
 */
async function fetchFromKr36Newsflash(perPage: number = 30, bId?: number): Promise<Kr36Article[]> {
  try {
    const params: any = {
      per_page: perPage,
    };
    if (bId) {
      params.b_id = bId;
    }

    const response = await axios.get<any>(`${KR36_API_BASE}/api/newsflash`, {
      params,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://36kr.com/',
        'Accept': 'application/json',
      },
    });

    // 检查是否返回HTML（验证码页面）
    if (typeof response.data === 'string' && response.data.includes('TTGCaptcha')) {
      logger.warn('36kr newsflash API触发验证码，需要人工验证');
      throw new Error('36kr API触发验证码，无法自动获取数据');
    }

    // 检查API是否返回错误
    if (response.data && typeof response.data === 'object' && response.data.code !== undefined && response.data.code !== 0) {
      logger.warn(`36kr newsflash API返回错误: code=${response.data.code}`);
      throw new Error(`36kr API错误: code=${response.data.code}`);
    }

    if (!response.data || typeof response.data !== 'object' || !response.data.data || !response.data.data.items) {
      logger.warn('36kr newsflash API返回数据格式异常');
      logger.debug('响应数据类型:', typeof response.data);
      return [];
    }

    const articles: Kr36Article[] = response.data.data.items.map((item: any) => {
      let publishedDate: Date | undefined = undefined;
      if (item.published_at) {
        try {
          publishedDate = new Date(item.published_at);
          if (isNaN(publishedDate.getTime())) {
            publishedDate = undefined;
          }
        } catch (e) {
          publishedDate = undefined;
        }
      }

      // 快讯的URL可能是news_url，如果没有则使用默认格式
      let url = item.news_url || `https://36kr.com/newsflashes/${item.id}`;
      if (url && !url.startsWith('http')) {
        url = `https://36kr.com${url}`;
      }

      return {
        id: item.id.toString(),
        title: item.title,
        url: url,
        description: item.description,
        publishedDate: publishedDate,
        author: item.user?.name,
      };
    });

    return articles;
  } catch (error: any) {
    logger.error(`从36kr newsflash API获取新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 从36kr API获取新闻（组合资讯和快讯）
 */
async function fetchFromKr36Api(maxResults: number = 100): Promise<Kr36Article[]> {
  try {
    const articles: Kr36Article[] = [];
    
    // 获取资讯（feed-stream）
    try {
      const feedArticles = await fetchFromKr36FeedStream(FEED_ID_LATEST, Math.min(50, maxResults));
      articles.push(...feedArticles);
      logger.info(`从36kr feed-stream获取到 ${feedArticles.length} 条资讯`);
    } catch (error: any) {
      logger.warn(`获取36kr资讯失败: ${error.message}`);
    }

    // 获取快讯（newsflash）
    try {
      const newsflashArticles = await fetchFromKr36Newsflash(Math.min(50, maxResults - articles.length));
      articles.push(...newsflashArticles);
      logger.info(`从36kr newsflash获取到 ${newsflashArticles.length} 条快讯`);
    } catch (error: any) {
      logger.warn(`获取36kr快讯失败: ${error.message}`);
    }

    // 按发布时间排序（最新的在前）
    articles.sort((a, b) => {
      const dateA = a.publishedDate?.getTime() || 0;
      const dateB = b.publishedDate?.getTime() || 0;
      return dateB - dateA;
    });

    // 限制数量
    return articles.slice(0, maxResults);
  } catch (error: any) {
    logger.error(`从36kr API获取新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 从36kr RSS获取新闻
 */
async function fetchFromKr36Rss(): Promise<Kr36Article[]> {
  try {
    const response = await axios.get(`${KR36_RSS_BASE}/feed`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      validateStatus: () => true, // 接受所有状态码以便检查
    });

    // 检查是否返回HTML（验证码页面）
    if (typeof response.data === 'string' && response.data.includes('TTGCaptcha')) {
      logger.warn('36kr RSS触发验证码，需要人工验证');
      throw new Error('36kr RSS触发验证码，无法自动获取数据');
    }

    // 检查响应类型
    if (typeof response.data !== 'string') {
      logger.warn('36kr RSS返回非字符串数据');
      throw new Error('36kr RSS返回数据格式异常');
    }

    const result = await parseStringPromise(response.data);

    if (!result || !result.rss || !result.rss.channel || !result.rss.channel[0] || !result.rss.channel[0].item) {
      logger.warn('36kr RSS返回数据格式异常');
      return [];
    }

    const items: RssItem[] = result.rss.channel[0].item;
    if (!Array.isArray(items)) {
      logger.warn('RSS items不是数组格式');
      return [];
    }
    
    const articles: Kr36Article[] = items.map((item) => {
      let publishedDate: Date | undefined = undefined;
      if (item.pubDate && item.pubDate[0]) {
        try {
          publishedDate = new Date(item.pubDate[0]);
          if (isNaN(publishedDate.getTime())) {
            publishedDate = undefined;
          }
        } catch (e) {
          publishedDate = undefined;
        }
      }

      return {
        title: item.title?.[0] || '',
        url: item.link?.[0] || '',
        description: item.description?.[0] || undefined,
        publishedDate: publishedDate,
        author: item.author?.[0] || undefined,
      };
    });

    return articles;
  } catch (error: any) {
    logger.error(`从36kr RSS获取新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 从第三方聚合API获取36kr新闻
 */
async function fetchFromThirdPartyApi(): Promise<Kr36Article[]> {
  try {
    const response = await axios.get(THIRD_PARTY_API, {
      timeout: 30000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    let newsItems: any[] = [];

    if (response.status >= 200 && response.status < 400) {
      if (Array.isArray(response.data)) {
        newsItems = response.data;
      } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
        newsItems = response.data.data;
      } else {
        logger.warn('第三方API返回数据格式异常');
        return [];
      }
    } else {
      logger.warn(`第三方API请求失败，HTTP状态: ${response.status}`);
      return [];
    }

    const articles: Kr36Article[] = newsItems.map((item) => {
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

      return {
        title: item.title || '',
        url: item.url || item.link || '',
        description: item.desc || item.description || undefined,
        publishedDate: publishedDate,
      };
    });

    return articles;
  } catch (error: any) {
    logger.error(`从第三方API获取36kr新闻失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步36kr新闻
 * @param maxResults 最大结果数
 * @param useApi 优先使用API（true）还是RSS（false）
 */
export async function sync36krNews(maxResults: number = 100, useApi: boolean = true) {
  try {
    logger.info(`开始同步36kr新闻，最大数量: ${maxResults}, 使用API: ${useApi}`);

    let articles: Kr36Article[] = [];

    // 优先尝试使用新的36kr API
    if (useApi) {
      try {
        articles = await fetchFromKr36Api(maxResults);
        if (articles.length > 0) {
          logger.info(`从36kr API获取到 ${articles.length} 条新闻`);
        } else {
          throw new Error('API返回数据为空');
        }
      } catch (apiError: any) {
        logger.warn(`36kr API获取失败: ${apiError.message}`);
        logger.info('尝试使用RSS作为备用方案...');
        // API失败，尝试RSS
        try {
          articles = await fetchFromKr36Rss();
          if (articles.length > 0) {
            logger.info(`从36kr RSS获取到 ${articles.length} 条新闻`);
          } else {
            throw new Error('RSS返回数据为空');
          }
        } catch (rssError: any) {
          logger.warn(`36kr RSS也失败: ${rssError.message}`);
          logger.info('尝试使用第三方API作为备用方案...');
          // RSS也失败，尝试第三方API
          try {
            articles = await fetchFromThirdPartyApi();
            if (articles.length > 0) {
              logger.info(`从第三方API获取到 ${articles.length} 条新闻`);
            } else {
              throw new Error('第三方API返回数据为空');
            }
          } catch (thirdPartyError: any) {
            logger.error(`所有36kr数据源都失败:`, {
              apiError: apiError.message,
              rssError: rssError.message,
              thirdPartyError: thirdPartyError.message,
            });
            // 返回友好的错误信息，而不是抛出异常
            return {
              success: false,
              synced: 0,
              errors: 0,
              total: 0,
              message: '36kr所有数据源都不可用。原因：\n' +
                '1. 官方API需要验证码\n' +
                '2. RSS也需要验证码\n' +
                '3. 第三方API不可用\n\n' +
                '建议：\n' +
                '- 等待36kr解除限制（可能是临时限制）\n' +
                '- 使用其他新闻源\n' +
                '- 通过管理端手动添加新闻',
            };
          }
        }
      }
    } else {
      // 优先使用RSS
      try {
        articles = await fetchFromKr36Rss();
        if (articles.length > 0) {
          logger.info(`从36kr RSS获取到 ${articles.length} 条新闻`);
        } else {
          throw new Error('RSS返回数据为空');
        }
      } catch (rssError: any) {
        logger.warn(`36kr RSS获取失败: ${rssError.message}`);
        logger.info('尝试使用API作为备用方案...');
        try {
          articles = await fetchFromKr36Api(maxResults);
          if (articles.length > 0) {
            logger.info(`从36kr API获取到 ${articles.length} 条新闻`);
          } else {
            throw new Error('API返回数据为空');
          }
        } catch (apiError: any) {
          logger.warn(`36kr API也失败: ${apiError.message}`);
          logger.info('尝试使用第三方API作为备用方案...');
          try {
            articles = await fetchFromThirdPartyApi();
            if (articles.length > 0) {
              logger.info(`从第三方API获取到 ${articles.length} 条新闻`);
            } else {
              throw new Error('第三方API返回数据为空');
            }
          } catch (thirdPartyError: any) {
            logger.error(`所有36kr数据源都失败:`, {
              rssError: rssError.message,
              apiError: apiError.message,
              thirdPartyError: thirdPartyError.message,
            });
            // 返回友好的错误信息，而不是抛出异常
            return {
              success: false,
              synced: 0,
              errors: 0,
              total: 0,
              message: '36kr所有数据源都不可用。原因：\n' +
                '1. RSS需要验证码\n' +
                '2. 官方API也需要验证码\n' +
                '3. 第三方API不可用\n\n' +
                '建议：\n' +
                '- 等待36kr解除限制（可能是临时限制）\n' +
                '- 使用其他新闻源\n' +
                '- 通过管理端手动添加新闻',
            };
          }
        }
      }
    }

    // 限制数量
    articles = articles.slice(0, maxResults);

    if (articles.length === 0) {
      const errorMessage = '未获取到任何36kr新闻数据。可能的原因：\n' +
        '1. 36kr官方API和RSS都需要验证码，无法自动获取\n' +
        '2. 第三方API不可用或网络问题\n' +
        '3. 建议：等待36kr解除限制，或使用其他新闻源';
      
      logger.warn(errorMessage);
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: errorMessage,
      };
    }

    logger.info(`准备同步 ${articles.length} 条36kr新闻`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const article of articles) {
      try {
        if (!article.title || !article.url) {
          logger.warn(`跳过无效的新闻数据:`, {
            title: article.title,
            url: article.url,
            hasTitle: !!article.title,
            hasUrl: !!article.url,
          });
          errorCount++;
          continue;
        }

        // 确保URL是完整的
        let finalUrl = article.url;
        if (finalUrl && !finalUrl.startsWith('http')) {
          finalUrl = `https://36kr.com${finalUrl}`;
        }

        await createOrUpdateNews({
          platform: '36kr',
          title: article.title,
          url: finalUrl,
          description: article.description || undefined,
          publishedDate: article.publishedDate || new Date(),
        });

        syncedCount++;
        if (syncedCount % 10 === 0) {
          logger.info(`已同步 ${syncedCount}/${articles.length} 条新闻`);
        }
      } catch (error: any) {
        errorCount++;
        logger.error(`同步新闻失败 (${article.title || '未知标题'}):`, {
          message: error.message,
          code: error.code,
          url: article.url,
        });
      }
    }

    logger.info(`36kr新闻同步完成: 成功 ${syncedCount} 条, 失败 ${errorCount} 条`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: articles.length,
    };
  } catch (error: any) {
    logger.error(`36kr新闻同步失败: ${error.message}`);
    throw error;
  }
}
