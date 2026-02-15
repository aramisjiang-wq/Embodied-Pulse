/**
 * HuggingFace 论文数据同步服务
 * 从 https://huggingface.co/papers/date/YYYY-MM-DD 同步论文
 */

import axios from 'axios';
import { createPaper } from '../paper.service';
import { logger } from '../../utils/logger';
import dns from 'dns';
import * as cheerio from 'cheerio';

// 强制使用Google DNS（解决VPN环境DNS解析问题）
dns.setServers(['8.8.8.8', '8.8.4.4']);

const HUGGINGFACE_PAPERS_BASE = 'https://huggingface.co/papers';

interface HuggingFacePaper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  publishedDate: string;
  url: string;
  hfUrl: string;
  likes?: number;
  downloads?: number;
}

/**
 * 同步指定日期的 HuggingFace 论文
 * @param date 日期字符串，格式：YYYY-MM-DD，默认为今天
 * @param maxResults 最大结果数
 */
export async function syncHuggingFacePapersByDate(
  date?: string,
  maxResults: number = 50
) {
  const maxRetries = 3;
  let lastError: any = null;

  // 如果没有指定日期，使用今天
  const targetDate = date || new Date().toISOString().split('T')[0];

  logger.info(`开始同步HuggingFace论文，日期: ${targetDate}, 最大数量: ${maxResults}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        logger.info(`HuggingFace论文同步重试 (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 2)));
      }

      const url = `${HUGGINGFACE_PAPERS_BASE}/date/${targetDate}`;
      logger.info(`访问HuggingFace论文页面: ${url}`);

      const response = await axios.get(url, {
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const $ = cheerio.load(response.data);
      const papers: HuggingFacePaper[] = [];

      $('.papers-grid article').each((index, element) => {
        try {
          const $el = $(element);
          
          const titleEl = $el.find('h3 a');
          const title = titleEl.text().trim();
          const hfUrl = titleEl.attr('href');
          const paperId = hfUrl?.split('/').pop() || '';

          const authors: string[] = [];
          $el.find('.authors a').each((_, authorEl) => {
            const author = $(authorEl).text().trim();
            if (author) {
              authors.push(author);
            }
          });

          const abstract = $el.find('.abstract').text().trim();
          const publishedDate = $el.find('.date').text().trim();
          
          const likesText = $el.find('.likes').text().trim();
          const likes = likesText ? parseInt(likesText.replace(/,/g, '')) : 0;

          const downloadsText = $el.find('.downloads').text().trim();
          const downloads = downloadsText ? parseInt(downloadsText.replace(/,/g, '')) : 0;

          if (title && paperId) {
            papers.push({
              id: paperId,
              title,
              authors,
              abstract,
              publishedDate,
              url: `https://huggingface.co${hfUrl}`,
              hfUrl: hfUrl || '',
              likes,
              downloads,
            });
          }
        } catch (error) {
          logger.error(`解析论文卡片失败 (索引 ${index}):`, error);
        }
      });

      logger.info(`解析到 ${papers.length} 篇论文`);

      if (papers.length === 0) {
        logger.warn('HuggingFace论文页面没有找到论文');
        return {
          success: true,
          synced: 0,
          errors: 0,
          total: 0,
          message: '指定日期没有论文',
        };
      }

      let syncedCount = 0;
      let errorCount = 0;

      for (const paper of papers.slice(0, maxResults)) {
        try {
          const publishedDateObj = parseDate(paper.publishedDate);
          
          await createPaper({
            title: paper.title,
            authors: paper.authors.join(', '),
            abstract: paper.abstract || null,
            pdfUrl: paper.url || null,
            publishedDate: publishedDateObj,
            citationCount: paper.likes || 0,
            venue: 'HuggingFace',
            categories: 'AI',
          } as any);

          syncedCount++;

          if (syncedCount % 10 === 0) {
            logger.info(`已同步 ${syncedCount}/${Math.min(papers.length, maxResults)} 篇论文`);
          }
        } catch (error: any) {
          errorCount++;
          
          if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
            logger.debug(`论文已存在，跳过: ${paper.id}`);
            syncedCount++;
            errorCount--;
          } else {
            logger.error(`保存论文失败 (${paper.id}):`, {
              message: error.message,
              code: error.code,
            });
          }
        }
      }

      logger.info(`HuggingFace论文同步完成: 成功 ${syncedCount} 篇, 失败 ${errorCount} 篇`);

      return {
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: papers.length,
      };

    } catch (error: any) {
      lastError = error;
      
      if ((error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') && attempt < maxRetries) {
        logger.warn(`HuggingFace论文请求超时 (尝试 ${attempt}/${maxRetries})，将重试...`);
        continue;
      }
      
      if ((error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') && attempt < maxRetries) {
        logger.warn(`HuggingFace论文网络错误 (尝试 ${attempt}/${maxRetries})，将重试...`);
        continue;
      }
      
      break;
    }
  }

  const error = lastError;
  
  if (!error) {
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: 'HuggingFace论文同步失败: 未知错误',
    };
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    logger.error(`HuggingFace论文请求超时（已重试${maxRetries}次）:`, {
      message: error.message,
      code: error.code,
    });
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: `HuggingFace论文请求超时（已重试${maxRetries}次）\n\n建议：\n- 检查网络连接\n- 配置代理或VPN\n- 稍后重试`,
    };
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    logger.error(`HuggingFace论文网络错误（已重试${maxRetries}次）:`, {
      message: error.message,
      code: error.code,
    });
    return {
      success: false,
      synced: 0,
      errors: 0,
      total: 0,
      message: `无法连接到HuggingFace论文页面（已重试${maxRetries}次）\n\n建议：\n- 检查网络连接\n- 配置代理或VPN\n- 检查防火墙设置`,
    };
  }

  logger.error(`HuggingFace论文同步失败:`, {
    message: error.message,
    code: error.code,
    stack: error.stack?.substring(0, 300),
  });

  return {
    success: false,
    synced: 0,
    errors: 0,
    total: 0,
    message: `HuggingFace论文同步失败: ${error.message || '未知错误'}`,
  };
}

/**
 * 同步最近N天的HuggingFace论文
 * @param days 天数，默认为7天
 * @param maxResults 每天最大结果数
 */
export async function syncRecentHuggingFacePapers(days: number = 7, maxResults: number = 50) {
  logger.info(`开始同步最近 ${days} 天的HuggingFace论文`);

  let totalSynced = 0;
  let totalErrors = 0;
  const results = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const result = await syncHuggingFacePapersByDate(dateStr, maxResults);
    results.push({ date: dateStr, ...result });
    
    totalSynced += result.synced || 0;
    totalErrors += result.errors || 0;

    if (i < days - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  logger.info(`HuggingFace论文批量同步完成: 总成功 ${totalSynced} 篇, 总失败 ${totalErrors} 篇`);

  return {
    success: true,
    synced: totalSynced,
    errors: totalErrors,
    total: totalSynced + totalErrors,
    details: results,
  };
}

function parseDate(dateStr: string): Date {
  try {
    if (!dateStr) {
      return new Date();
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date();
    }

    return date;
  } catch (error) {
    logger.warn(`解析日期失败: ${dateStr}`);
    return new Date();
  }
}