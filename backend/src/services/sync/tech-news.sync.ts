/**
 * 科技新闻同步服务
 * 从多个科技新闻RSS源获取并同步新闻数据
 * 作为36kr的替代方案
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

// 科技新闻RSS源列表
const TECH_NEWS_SOURCES = [
  { name: 'TechCrunch', rss: 'https://techcrunch.com/feed/', platform: 'techcrunch' },
  { name: 'The Verge', rss: 'https://www.theverge.com/rss/index.xml', platform: 'theverge' },
  { name: 'VentureBeat', rss: 'https://venturebeat.com/feed/', platform: 'venturebeat' },
  { name: 'Ars Technica', rss: 'https://feeds.arstechnica.com/arstechnica/index', platform: 'arstechnica' },
  { name: 'Engadget', rss: 'https://www.engadget.com/rss.xml', platform: 'engadget' },
];

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

interface TechArticle {
  title: string;
  url: string;
  description?: string;
  publishedDate?: Date;
  author?: string;
  source: string;
}

interface RssItem {
  title: string[];
  link: string[];
  description?: string[];
  pubDate?: string[];
  author?: string[];
  'dc:creator'?: string[];
}

/**
 * 从单个RSS源获取新闻
 */
async function fetchFromRssSource(source: typeof TECH_NEWS_SOURCES[0]): Promise<TechArticle[]> {
  try {
    logger.info(`[${source.name}] 开始获取RSS: ${source.rss}`);
    
    const response = await axios.get(source.rss, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      validateStatus: () => true,
    });

    logger.debug(`${source.name} RSS响应状态: ${response.status}, 数据类型: ${typeof response.data}, 长度: ${typeof response.data === 'string' ? response.data.length : 'N/A'}`);

    // 检查响应类型
    if (typeof response.data !== 'string') {
      logger.warn(`${source.name} RSS返回非字符串数据: ${typeof response.data}`);
      return [];
    }

    // 检查是否返回HTML错误页面
    if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html>')) {
      logger.warn(`${source.name} RSS返回HTML页面，可能不可用`);
      return [];
    }

    // 检查响应是否为空
    if (!response.data || response.data.trim().length === 0) {
      logger.warn(`${source.name} RSS返回空数据`);
      return [];
    }

    // 使用xml2js解析，配置选项确保正确处理命名空间和属性
    let result: any;
    try {
      result = await parseStringPromise(response.data, {
        explicitArray: true,
        mergeAttrs: false,
        explicitRoot: true,
        ignoreAttrs: false,
        trim: true,
      });
      logger.debug(`${source.name} XML解析成功，根元素: ${Object.keys(result || {})[0] || 'unknown'}`);
    } catch (parseError: any) {
      logger.error(`${source.name} XML解析失败:`, {
        message: parseError.message,
        stack: parseError.stack?.substring(0, 300),
      });
      return [];
    }

    let items: any[] = [];

    // 处理RSS 2.0格式
    if (result && result.rss && result.rss.channel) {
      const channels = Array.isArray(result.rss.channel) ? result.rss.channel : [result.rss.channel];
      if (channels.length > 0) {
        const channel = channels[0];
        if (channel.item) {
          if (Array.isArray(channel.item)) {
            items = channel.item;
            logger.debug(`${source.name} 解析到 ${items.length} 个RSS 2.0项目（数组）`);
          } else {
            // 如果只有一个item，xml2js可能不会转换为数组
            items = [channel.item];
            logger.debug(`${source.name} 解析到 1 个RSS 2.0项目（单项目）`);
          }
        } else {
          logger.warn(`${source.name} RSS channel中没有item字段`);
        }
      }
    }
    // 处理Atom格式（The Verge使用Atom）
    else if (result && result.feed) {
      if (result.feed.entry) {
        if (Array.isArray(result.feed.entry)) {
          items = result.feed.entry;
          logger.debug(`${source.name} 解析到 ${items.length} 个Atom条目（数组）`);
        } else {
          // 如果只有一个entry，xml2js可能不会转换为数组
          items = [result.feed.entry];
          logger.debug(`${source.name} 解析到 1 个Atom条目（单条目）`);
        }
      } else {
        logger.warn(`${source.name} Atom feed中没有entry字段`);
      }
    }
    else {
      logger.warn(`${source.name} RSS返回数据格式异常，既不是RSS 2.0也不是Atom格式`);
      logger.debug('解析结果根元素keys:', Object.keys(result || {}));
      if (result) {
        logger.debug('解析结果结构示例:', JSON.stringify(result, null, 2).substring(0, 1000));
      }
      logger.debug('响应数据前500字符:', response.data.substring(0, 500));
      return [];
    }

    if (!Array.isArray(items) || items.length === 0) {
      logger.warn(`${source.name} RSS items不是数组格式或为空`);
      return [];
    }

    const articles: TechArticle[] = items.map((item) => {
      let publishedDate: Date | undefined = undefined;
      let title = '';
      let url = '';
      let description: string | undefined = undefined;
      let author: string | undefined = undefined;

      // 判断是RSS 2.0还是Atom格式（通过检查是否有pubDate或published字段）
      const isRss20 = item.pubDate !== undefined;
      const isAtom = item.published !== undefined || item.updated !== undefined;

      // RSS 2.0格式
      if (isRss20) {
        // title处理 - xml2js解析后，title通常是字符串数组
        if (item.title) {
          if (Array.isArray(item.title)) {
            title = item.title[0] || '';
          } else if (typeof item.title === 'string') {
            title = item.title;
          } else if (item.title && typeof item.title === 'object') {
            // 如果是对象（CDATA），内容在_属性中
            title = item.title._ || item.title['#text'] || String(item.title);
          }
        }

        // link处理 - xml2js解析后，link通常是字符串数组
        if (item.link) {
          if (Array.isArray(item.link)) {
            url = item.link[0] || '';
          } else if (typeof item.link === 'string') {
            url = item.link;
          } else if (item.link && typeof item.link === 'object') {
            url = item.link._ || item.link['#text'] || String(item.link);
          }
        }

        // description处理 - xml2js解析后，description通常是字符串数组或对象（CDATA）
        if (item.description) {
          if (Array.isArray(item.description)) {
            const firstDesc = item.description[0];
            if (typeof firstDesc === 'string') {
              description = firstDesc;
            } else if (firstDesc && typeof firstDesc === 'object') {
              // CDATA内容在_属性中
              description = firstDesc._ || firstDesc['#text'] || undefined;
            }
          } else if (typeof item.description === 'string') {
            description = item.description;
          } else if (item.description && typeof item.description === 'object') {
            description = item.description._ || item.description['#text'] || undefined;
          }
        }

        // pubDate处理
        if (item.pubDate) {
          const dateStr = Array.isArray(item.pubDate) ? item.pubDate[0] : item.pubDate;
          if (dateStr) {
            try {
              publishedDate = new Date(dateStr);
              if (isNaN(publishedDate.getTime())) {
                publishedDate = undefined;
              }
            } catch (e) {
              publishedDate = undefined;
            }
          }
        }

        // author处理
        if (item.author) {
          if (Array.isArray(item.author)) {
            author = item.author[0] || undefined;
          } else if (typeof item.author === 'string') {
            author = item.author;
          }
        } else if (item['dc:creator']) {
          if (Array.isArray(item['dc:creator'])) {
            author = item['dc:creator'][0] || undefined;
          } else if (typeof item['dc:creator'] === 'string') {
            author = item['dc:creator'];
          }
        }
      }
      // Atom格式
      else if (isAtom || item.title || item.link) {
        // Atom的title处理
        if (item.title) {
          if (Array.isArray(item.title)) {
            const firstTitle = item.title[0];
            if (typeof firstTitle === 'string') {
              title = firstTitle;
            } else if (firstTitle && typeof firstTitle === 'object') {
              // Atom的title可能有type="html"属性，CDATA内容在_属性中
              title = firstTitle._ || firstTitle['#text'] || String(firstTitle);
            }
          } else if (typeof item.title === 'string') {
            title = item.title;
          } else if (item.title && typeof item.title === 'object') {
            title = item.title._ || item.title['#text'] || String(item.title);
          }
        }

        // Atom的link可能是数组或对象
        if (item.link) {
          if (Array.isArray(item.link)) {
            // 查找rel="alternate"的link，或者第一个link
            const alternateLink = item.link.find((l: any) => {
              if (l.$ && l.$.rel) {
                return l.$.rel === 'alternate' || l.$.rel === undefined;
              }
              return true;
            });
            if (alternateLink && alternateLink.$ && alternateLink.$.href) {
              url = alternateLink.$.href;
            } else if (item.link[0] && item.link[0].$ && item.link[0].$.href) {
              url = item.link[0].$.href;
            } else if (typeof item.link[0] === 'string') {
              url = item.link[0];
            }
          } else if (item.link.$ && item.link.$.href) {
            url = item.link.$.href;
          } else if (typeof item.link === 'string') {
            url = item.link;
          } else if (item.link.href) {
            url = item.link.href;
          }
        }

        // Atom的summary或content
        if (item.summary) {
          if (typeof item.summary === 'string') {
            description = item.summary;
          } else if (item.summary._) {
            description = item.summary._;
          } else if (Array.isArray(item.summary) && item.summary[0]) {
            description = typeof item.summary[0] === 'string' ? item.summary[0] : item.summary[0]._ || '';
          }
        } else if (item.content) {
          if (typeof item.content === 'string') {
            description = item.content;
          } else if (item.content._) {
            description = item.content._;
          } else if (Array.isArray(item.content) && item.content[0]) {
            description = typeof item.content[0] === 'string' ? item.content[0] : item.content[0]._ || '';
          }
        }

        // Atom的published或updated
        const dateStr = item.published || item.updated;
        if (dateStr) {
          try {
            publishedDate = new Date(Array.isArray(dateStr) ? dateStr[0] : dateStr);
            if (isNaN(publishedDate.getTime())) {
              publishedDate = undefined;
            }
          } catch (e) {
            publishedDate = undefined;
          }
        }

        // Atom的author
        if (item.author) {
          if (Array.isArray(item.author)) {
            author = item.author.map((a: any) => a.name || a.name?.[0] || '').filter(Boolean).join(', ');
          } else if (item.author.name) {
            author = Array.isArray(item.author.name) ? item.author.name[0] : item.author.name;
          }
        }
      }

      return {
        title: title || 'Untitled',
        url: url || '',
        description: description,
        publishedDate: publishedDate,
        author: author,
        source: source.name,
      };
    });

    // 过滤无效文章
    const validArticles = articles.filter(article => {
      // 必须有标题和URL
      if (!article.title || article.title.trim() === '' || article.title === 'Untitled') {
        logger.debug(`${source.name} 过滤无效文章（无标题）: url=${article.url}`);
        return false;
      }
      if (!article.url || article.url.trim() === '') {
        logger.debug(`${source.name} 过滤无效文章（无URL）: title=${article.title.substring(0, 50)}`);
        return false;
      }
      // 确保URL是有效的HTTP/HTTPS链接
      if (!article.url.startsWith('http://') && !article.url.startsWith('https://')) {
        logger.debug(`${source.name} 过滤无效URL: ${article.url}`);
        return false;
      }
      return true;
    });

    logger.info(`${source.name} 成功解析 ${validArticles.length} 条有效新闻（共 ${items.length} 条原始数据，过滤掉 ${articles.length - validArticles.length} 条无效数据）`);
    
    if (validArticles.length === 0 && articles.length > 0) {
      logger.warn(`${source.name} 所有文章都被过滤，可能的原因：`);
      logger.warn(`  - 标题或URL格式异常`);
      logger.warn(`  - URL不是有效的HTTP/HTTPS链接`);
      logger.debug(`示例文章（前3条）:`, articles.slice(0, 3).map(a => ({
        title: a.title?.substring(0, 50),
        url: a.url,
        hasTitle: !!a.title,
        hasUrl: !!a.url,
        urlValid: a.url?.startsWith('http'),
      })));
    }
    
    return validArticles;
  } catch (error: any) {
    logger.error(`从${source.name} RSS获取新闻失败: ${error.message}`);
    return [];
  }
}

/**
 * 同步科技新闻
 * @param maxResults 每个源的最大结果数
 * @param sources 要同步的源列表（如果为空，同步所有源）
 */
export async function syncTechNews(
  maxResults: number = 50,
  sources?: string[]
): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  total: number;
  message?: string;
}> {
  try {
    logger.info(`开始同步科技新闻，每个源最大数量: ${maxResults}`);

    // 如果sources为空数组或undefined，同步所有源；否则只同步指定的源
    const sourcesToSync = sources && sources.length > 0
      ? TECH_NEWS_SOURCES.filter(s => sources.includes(s.platform))
      : TECH_NEWS_SOURCES;

    if (sourcesToSync.length === 0) {
      const errorMessage = `没有找到要同步的新闻源。请求的源: ${sources?.join(', ') || '无'}, 可用的源: ${TECH_NEWS_SOURCES.map(s => s.platform).join(', ')}`;
      logger.warn(errorMessage);
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: errorMessage,
      };
    }

    logger.info(`将同步 ${sourcesToSync.length} 个新闻源: ${sourcesToSync.map(s => s.name).join(', ')}`);

    let allArticles: TechArticle[] = [];

    // 并行获取所有源的新闻
    const results = await Promise.allSettled(
      sourcesToSync.map(source => fetchFromRssSource(source))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const source = sourcesToSync[i];

      if (result.status === 'fulfilled') {
        const articles = result.value;
        if (articles.length > 0) {
          allArticles.push(...articles);
          logger.info(`从${source.name}获取到 ${articles.length} 条新闻`);
        } else {
          logger.warn(`${source.name}返回0条新闻，可能RSS格式不匹配或数据为空`);
        }
      } else {
        logger.warn(`${source.name}同步失败:`, {
          reason: result.reason,
          message: result.reason?.message || '未知错误',
        });
      }
    }

    logger.info(`总共从 ${sourcesToSync.length} 个源获取到 ${allArticles.length} 条新闻`);

    // 按发布时间排序（最新的在前）
    allArticles.sort((a, b) => {
      const dateA = a.publishedDate?.getTime() || 0;
      const dateB = b.publishedDate?.getTime() || 0;
      return dateB - dateA;
    });

    // 限制总数（每个源最多maxResults条，但总数不超过maxResults * sourcesToSync.length）
    const maxTotal = maxResults * sourcesToSync.length;
    allArticles = allArticles.slice(0, maxTotal);

    if (allArticles.length === 0) {
      const errorMessage = `未获取到任何科技新闻。可能的原因：\n` +
        `1. RSS源格式解析失败\n` +
        `2. 所有RSS源都返回空数据\n` +
        `3. 网络连接问题\n\n` +
        `建议：\n` +
        `- 查看后端日志获取详细信息\n` +
        `- 检查RSS源是否可访问\n` +
        `- 稍后重试`;
      
      logger.warn(errorMessage);
      logger.debug('各源同步结果:', results.map((r, i) => ({
        source: sourcesToSync[i].name,
        status: r.status,
        value: r.status === 'fulfilled' ? r.value.length : 0,
        reason: r.status === 'rejected' ? r.reason?.message : undefined,
      })));
      
      return {
        success: false,
        synced: 0,
        errors: 0,
        total: 0,
        message: errorMessage,
      };
    }

    logger.info(`准备同步 ${allArticles.length} 条科技新闻`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const article of allArticles) {
      try {
        if (!article.title || !article.url) {
          logger.warn(`跳过无效的新闻数据:`, {
            title: article.title,
            url: article.url,
          });
          errorCount++;
          continue;
        }

        await createOrUpdateNews({
          platform: article.source.toLowerCase(),
          title: article.title,
          url: article.url,
          description: article.description || undefined,
          publishedDate: article.publishedDate || new Date(),
        });

        syncedCount++;
        if (syncedCount % 10 === 0) {
          logger.info(`已同步 ${syncedCount}/${allArticles.length} 条新闻`);
        }
      } catch (error: any) {
        errorCount++;
        logger.error(`同步新闻失败 (${article.title || '未知标题'}):`, {
          message: error.message,
          source: article.source,
        });
      }
    }

    logger.info(`科技新闻同步完成: 成功 ${syncedCount} 条, 失败 ${errorCount} 条`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: allArticles.length,
    };
  } catch (error: any) {
    logger.error(`科技新闻同步失败: ${error.message}`);
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: `科技新闻同步失败: ${error.message}`,
    };
  }
}

/**
 * 同步特定源的新闻
 */
export async function syncTechNewsBySource(
  source: string,
  maxResults: number = 50
): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  total: number;
  message?: string;
}> {
  return await syncTechNews(maxResults, [source]);
}
