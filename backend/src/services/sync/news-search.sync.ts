/**
 * 根据关键词抓取新闻的服务
 * 从各个数据源搜索包含指定关键词的新闻
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';
import { syncHotNews } from './hot-news.sync';
import { syncTechNews } from './tech-news.sync';
import { sync36krNews } from './36kr.sync';

const HOT_NEWS_API_BASE = 'https://orz.ai/api/v1';

interface SearchResult {
  platform: string;
  source: string;
  title: string;
  url: string;
  score?: string;
  description?: string;
  publishedDate?: Date;
}

/**
 * 从热点新闻API搜索关键词
 */
async function searchHotNewsByKeyword(keyword: string, platforms: string[] = ['baidu', 'weibo', 'zhihu'], maxResults: number = 20): Promise<SearchResult[]> {
  try {
    logger.info(`从热点新闻API搜索关键词: ${keyword}, 平台: ${platforms.join(', ')}`);

    const results: SearchResult[] = [];

    for (const platform of platforms) {
      try {
        const response = await axios.get(`${HOT_NEWS_API_BASE}/dailynews/`, {
          params: {
            platform,
            limit: maxResults,
          },
          timeout: 30000,
        });

        if (!response.data || response.data.status !== '200') {
          logger.warn(`平台 ${platform} API返回错误`);
          continue;
        }

        const newsItems: any[] = response.data.data || [];

        for (const item of newsItems) {
          if (!item.title || !item.url) {
            continue;
          }

          const title = item.title.toLowerCase();
          const desc = (item.desc || item.content || '').toLowerCase();
          const searchTerm = keyword.toLowerCase();

          if (title.includes(searchTerm) || desc.includes(searchTerm)) {
            let publishedDate: Date | undefined = undefined;
            if (item.publish_time) {
              try {
                publishedDate = new Date(item.publish_time);
                if (isNaN(publishedDate.getTime())) {
                  publishedDate = undefined;
                }
              } catch (e) {
                publishedDate = undefined;
              }
            }

            results.push({
              platform,
              source: 'hot-news',
              title: item.title,
              url: item.url,
              score: item.score ? String(item.score) : undefined,
              description: item.desc || item.content || undefined,
              publishedDate: publishedDate || new Date(),
            });
          }
        }

        logger.info(`平台 ${platform} 找到 ${results.filter(r => r.platform === platform).length} 条匹配新闻`);
      } catch (error: any) {
        logger.error(`平台 ${platform} 搜索失败:`, error.message);
      }
    }

    return results;
  } catch (error: any) {
    logger.error(`从热点新闻API搜索失败: ${error.message}`);
    return [];
  }
}

/**
 * 从热点新闻API批量搜索关键词（优化版本）
 */
async function searchHotNewsByKeywords(keywords: string[], platforms: string[] = ['baidu', 'weibo', 'zhihu'], maxResults: number = 20): Promise<SearchResult[]> {
  try {
    logger.info(`从热点新闻API批量搜索关键词: ${keywords.join(', ')}, 平台: ${platforms.join(', ')}`);

    const allResults: SearchResult[] = [];

    for (const platform of platforms) {
      try {
        const response = await axios.get(`${HOT_NEWS_API_BASE}/dailynews/`, {
          params: {
            platform,
            limit: maxResults,
          },
          timeout: 30000,
        });

        if (!response.data || response.data.status !== '200') {
          logger.warn(`平台 ${platform} API返回错误`);
          continue;
        }

        const newsItems: any[] = response.data.data || [];

        for (const item of newsItems) {
          if (!item.title || !item.url) {
            continue;
          }

          const title = item.title.toLowerCase();
          const desc = (item.desc || item.content || '').toLowerCase();

          for (const keyword of keywords) {
            const searchTerm = keyword.toLowerCase();
            if (title.includes(searchTerm) || desc.includes(searchTerm)) {
              let publishedDate: Date | undefined = undefined;
              if (item.publish_time) {
                try {
                  publishedDate = new Date(item.publish_time);
                  if (isNaN(publishedDate.getTime())) {
                    publishedDate = undefined;
                  }
                } catch (e) {
                  publishedDate = undefined;
                }
              }

              allResults.push({
                platform,
                source: 'hot-news',
                title: item.title,
                url: item.url,
                score: item.score ? String(item.score) : undefined,
                description: item.desc || item.content || undefined,
                publishedDate: publishedDate || new Date(),
              });
              break;
            }
          }
        }

        logger.info(`平台 ${platform} 找到 ${allResults.filter(r => r.platform === platform).length} 条匹配新闻`);
      } catch (error: any) {
        logger.error(`平台 ${platform} 搜索失败:`, error.message);
      }
    }

    return allResults;
  } catch (error: any) {
    logger.error(`从热点新闻API批量搜索失败: ${error.message}`);
    return [];
  }
}

/**
 * 从科技新闻RSS搜索关键词
 */
async function searchTechNewsByKeyword(keyword: string, maxResults: number = 50): Promise<SearchResult[]> {
  try {
    logger.info(`从科技新闻RSS搜索关键词: ${keyword}`);

    const response = await syncTechNews(maxResults);
    
    if (!response.success) {
      logger.warn(`科技新闻同步失败: ${response.message}`);
      return [];
    }

    const searchTerm = keyword.toLowerCase();
    const news = await userPrisma.news.findMany({
      where: {
        platform: {
          in: ['techcrunch', 'theverge', 'venturebeat', 'arstechnica', 'engadget'],
        },
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      orderBy: { publishedDate: "desc" },
      take: maxResults,
    });

    const results: SearchResult[] = news.map(item => ({
      platform: item.platform,
      source: 'tech-news',
      title: item.title,
      url: item.url,
      description: item.description || undefined,
      publishedDate: item.publishedDate || undefined,
    }));

    logger.info(`从科技新闻RSS找到 ${results.length} 条匹配新闻`);
    return results;
  } catch (error: any) {
    logger.error(`从科技新闻RSS搜索失败: ${error.message}`);
    return [];
  }
}

/**
 * 从科技新闻RSS批量搜索关键词（优化版本）
 */
async function searchTechNewsByKeywords(keywords: string[], maxResults: number = 50): Promise<SearchResult[]> {
  try {
    logger.info(`从科技新闻RSS批量搜索关键词: ${keywords.join(', ')}`);

    const response = await syncTechNews(maxResults);
    
    if (!response.success) {
      logger.warn(`科技新闻同步失败: ${response.message}`);
      return [];
    }

    const searchTerms = keywords.map(k => k.toLowerCase());
    const news = await userPrisma.news.findMany({
      where: {
        platform: {
          in: ['techcrunch', 'theverge', 'venturebeat', 'arstechnica', 'engadget'],
        },
        OR: searchTerms.map(term => ({
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
          ],
        })),
      },
      orderBy: { publishedDate: "desc" },
      take: maxResults * keywords.length,
    });

    const results: SearchResult[] = news.map(item => ({
      platform: item.platform,
      source: 'tech-news',
      title: item.title,
      url: item.url,
      
      description: item.description || undefined,
      publishedDate: item.publishedDate || undefined,
    }));

    logger.info(`从科技新闻RSS找到 ${results.length} 条匹配新闻`);
    return results;
  } catch (error: any) {
    logger.error(`从科技新闻RSS批量搜索失败: ${error.message}`);
    return [];
  }
}

/**
 * 从36kr搜索关键词
 */
async function searchKr36NewsByKeyword(keyword: string, maxResults: number = 50): Promise<SearchResult[]> {
  try {
    logger.info(`从36kr搜索关键词: ${keyword}`);

    const response = await sync36krNews(maxResults, true);
    
    if (!response.success) {
      logger.warn(`36kr同步失败: ${response.message}`);
      return [];
    }

    const searchTerm = keyword.toLowerCase();
    const news = await userPrisma.news.findMany({
      where: {
        platform: 'kr36',
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      orderBy: { publishedDate: "desc" },
      take: maxResults,
    });

    const results: SearchResult[] = news.map(item => ({
      platform: item.platform,
      source: 'kr36',
      title: item.title,
      url: item.url,
      description: item.description || undefined,
      publishedDate: item.publishedDate || undefined,
    }));

    logger.info(`从36kr找到 ${results.length} 条匹配新闻`);
    return results;
  } catch (error: any) {
    logger.error(`从36kr搜索失败: ${error.message}`);
    return [];
  }
}

/**
 * 从36kr批量搜索关键词（优化版本）
 */
async function searchKr36NewsByKeywords(keywords: string[], maxResults: number = 50): Promise<SearchResult[]> {
  try {
    logger.info(`从36kr批量搜索关键词: ${keywords.join(', ')}`);

    const response = await sync36krNews(maxResults, true);
    
    if (!response.success) {
      logger.warn(`36kr同步失败: ${response.message}`);
      return [];
    }

    const searchTerms = keywords.map(k => k.toLowerCase());
    const news = await userPrisma.news.findMany({
      where: {
        platform: 'kr36',
        OR: searchTerms.map(term => ({
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
          ],
        })),
      },
      orderBy: { publishedDate: "desc" },
      take: maxResults * keywords.length,
    });

    const results: SearchResult[] = news.map(item => ({
      platform: item.platform,
      source: 'kr36',
      title: item.title,
      url: item.url,
      description: item.description || undefined,
      publishedDate: item.publishedDate || undefined,
    }));

    logger.info(`从36kr找到 ${results.length} 条匹配新闻`);
    return results;
  } catch (error: any) {
    logger.error(`从36kr批量搜索失败: ${error.message}`);
    return [];
  }
}

/**
 * 保存搜索结果到数据库
 */
async function saveSearchResults(results: SearchResult[]): Promise<{ synced: number; errors: number }> {
  let syncedCount = 0;
  let errorCount = 0;

  for (const result of results) {
    try {
      await userPrisma.news.upsert({
        where: { url: result.url },
        update: {
          title: result.title,
          description: result.description,
          publishedDate: result.publishedDate,
          updatedAt: new Date(),
        },
        create: {
          platform: result.platform,
          title: result.title,
          url: result.url,
          description: result.description,
          publishedDate: result.publishedDate || new Date(),
        } as any,
      });
      syncedCount++;
    } catch (error: any) {
      errorCount++;
      logger.error(`保存新闻失败 (${result.title}):`, error.message);
    }
  }

  return { synced: syncedCount, errors: errorCount };
}

/**
 * 根据关键词从所有数据源搜索新闻
 */
export async function searchNewsByKeywords(
  keywords: string[],
  options?: {
    includeHotNews?: boolean;
    includeTechNews?: boolean;
    includeKr36?: boolean;
    hotNewsPlatforms?: string[];
    maxResultsPerSource?: number;
  }
): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  total: number;
  results: Record<string, { synced: number; errors: number; total: number }>;
}> {
  try {
    const {
      includeHotNews = true,
      includeTechNews = true,
      includeKr36 = true,
      hotNewsPlatforms = ['baidu', 'weibo', 'zhihu'],
      maxResultsPerSource = 50,
    } = options || {};

    logger.info(`开始根据关键词搜索新闻，关键词: ${keywords.join(', ')}`);

    const allResults: SearchResult[] = [];
    const results: Record<string, { synced: number; errors: number; total: number }> = {};

    if (includeHotNews) {
      logger.info(`从热点新闻API搜索所有关键词`);
      const hotNewsResults = await searchHotNewsByKeywords(keywords, hotNewsPlatforms, maxResultsPerSource);
      allResults.push(...hotNewsResults);
      logger.info(`热点新闻找到 ${hotNewsResults.length} 条匹配新闻`);
    }

    if (includeTechNews) {
      logger.info(`从科技新闻RSS搜索所有关键词`);
      const techNewsResults = await searchTechNewsByKeywords(keywords, maxResultsPerSource);
      allResults.push(...techNewsResults);
      logger.info(`科技新闻找到 ${techNewsResults.length} 条匹配新闻`);
    }

    if (includeKr36) {
      logger.info(`从36kr搜索所有关键词`);
      const kr36Results = await searchKr36NewsByKeywords(keywords, maxResultsPerSource);
      allResults.push(...kr36Results);
      logger.info(`36kr找到 ${kr36Results.length} 条匹配新闻`);
    }

    if (allResults.length === 0) {
      logger.warn(`未找到任何匹配的新闻`);
      return {
        success: true,
        synced: 0,
        errors: 0,
        total: 0,
        results: {
          hotNews: { synced: 0, errors: 0, total: 0 },
          techNews: { synced: 0, errors: 0, total: 0 },
          kr36: { synced: 0, errors: 0, total: 0 },
        },
      };
    }

    const { synced, errors } = await saveSearchResults(allResults);

    results.hotNews = {
      synced: allResults.filter(r => r.source === 'hot-news').length,
      errors: 0,
      total: allResults.filter(r => r.source === 'hot-news').length,
    };
    results.techNews = {
      synced: allResults.filter(r => r.source === 'tech-news').length,
      errors: 0,
      total: allResults.filter(r => r.source === 'tech-news').length,
    };
    results.kr36 = {
      synced: allResults.filter(r => r.source === 'kr36').length,
      errors: 0,
      total: allResults.filter(r => r.source === 'kr36').length,
    };

    logger.info(`关键词搜索完成: 成功 ${synced} 条, 失败 ${errors} 条, 总共 ${allResults.length} 条`);

    return {
      success: true,
      synced,
      errors,
      total: allResults.length,
      results,
    };
  } catch (error: any) {
    logger.error(`根据关键词搜索新闻失败: ${error.message}`);
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      results: {
        hotNews: { synced: 0, errors: 0, total: 0 },
        techNews: { synced: 0, errors: 0, total: 0 },
        kr36: { synced: 0, errors: 0, total: 0 },
      },
    };
  }
}

/**
 * 根据单个关键词搜索新闻
 */
export async function searchNewsByKeyword(
  keyword: string,
  options?: {
    includeHotNews?: boolean;
    includeTechNews?: boolean;
    includeKr36?: boolean;
    hotNewsPlatforms?: string[];
    maxResultsPerSource?: number;
  }
) {
  return await searchNewsByKeywords([keyword], options);
}
