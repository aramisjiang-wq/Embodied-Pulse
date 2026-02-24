/**
 * arXiv API 数据同步服务
 * 文档: https://arxiv.org/help/api
 */

import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { createPaper } from '../paper.service';
import { logger } from '../../utils/logger';
import https from 'https';

const parseXML = promisify(parseString);

const ARXIV_API_BASE = 'https://arxiv.org/api/query';

/** 全量拉取时默认时间范围：最近 N 年（未传 startDate/endDate 时使用） */
const DEFAULT_ARXIV_YEARS = 1;

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: Array<{ name: string[] }>;
  published: string[];
  updated: string[];
  category: Array<{ $: { term: string } }>;
  link: Array<{ $: { href: string; title?: string } }>;
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const axiosInstance = axios.create({
  httpsAgent,
  timeout: 60000,
});

/**
 * 同步arXiv论文数据
 * @param query 搜索关键词 (如: "embodied AI", "robotics", "computer vision")
 * @param maxResults 最大结果数
 * @param startDate 开始日期（可选，格式：YYYYMMDDHHMMSS）
 * @param endDate 结束日期（可选，格式：YYYYMMDDHHMMSS）
 */
export async function syncArxivPapers(
  query: string = 'embodied AI OR robotics', 
  maxResults: number = 100,
  startDate?: string,
  endDate?: string
) {
  try {
    logger.info(`开始同步arXiv论文，关键词: ${query}, 最大数量: ${maxResults}`);
    
    // 构建搜索查询（支持日期范围）
    // 如果查询已经是分类查询（以 cat: 开头），则不需要添加 all: 前缀
    let searchQuery = query.startsWith('cat:') ? query : `all:${query}`;
    
    // 格式化日期为arXiv API格式 (YYYYMMDDHHMMSS)
    const formatArxivDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    // 如果指定了日期范围，添加到查询中
    if (startDate || endDate) {
      const dateRange = [];
      if (startDate) {
        dateRange.push(startDate);
      } else {
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - DEFAULT_ARXIV_YEARS);
        dateRange.push(formatArxivDate(fromDate));
      }
      if (endDate) {
        dateRange.push(endDate);
      } else {
        const now = new Date();
        dateRange.push(formatArxivDate(now));
      }
      searchQuery += ` AND submittedDate:[${dateRange[0]} TO ${dateRange[1]}]`;
    } else {
      // 全量拉取默认：最近 DEFAULT_ARXIV_YEARS 年
      const fromDate = new Date();
      fromDate.setFullYear(fromDate.getFullYear() - DEFAULT_ARXIV_YEARS);
      const now = new Date();
      const startDateStr = formatArxivDate(fromDate);
      const endDateStr = formatArxivDate(now);
      searchQuery += ` AND submittedDate:[${startDateStr} TO ${endDateStr}]`;
    }
    
    // 构建API请求
    let response: { data: string; status?: number };
    try {
      response = await axiosInstance.get(ARXIV_API_BASE, {
        params: {
          search_query: searchQuery,
          start: 0,
          max_results: maxResults,
          sortBy: 'submittedDate',
          sortOrder: 'descending',
        },
      });
    } catch (reqErr: any) {
      const msg = reqErr.code === 'ECONNABORTED'
        ? '请求 arXiv 超时，请确认后端可访问 https://arxiv.org'
        : `请求 arXiv 失败: ${reqErr.message || '网络错误'}，请确认后端可访问 https://arxiv.org`;
      logger.error(msg, { code: reqErr.code, message: reqErr.message });
      throw new Error(msg);
    }

    // 检查响应状态
    if (!response.data) {
      logger.warn(`arXiv API 返回空响应，查询: ${searchQuery}`);
      return {
        success: true,
        synced: 0,
        errors: 0,
        total: 0,
      };
    }

    // 解析XML响应（若返回非 XML 如 HTML 错误页会在此失败）
    let result: any;
    try {
      result = await parseXML(response.data);
    } catch (parseError: any) {
      const preview = typeof response.data === 'string' ? response.data.substring(0, 200) : '';
      logger.error(`arXiv 响应解析失败: ${parseError.message}`, { searchQuery, preview });
      throw new Error(`arXiv 响应解析失败（可能为网络或 API 异常）: ${parseError.message}。请确认后端可访问 https://arxiv.org`);
    }

    const entries: ArxivEntry[] = result.feed?.entry || [];
    
    // 处理单个entry的情况（XML解析可能返回单个对象而不是数组）
    const normalizedEntries = Array.isArray(entries) ? entries : entries ? [entries] : [];

    logger.info(`获取到 ${normalizedEntries.length} 篇论文，查询: ${searchQuery}`);

    let syncedCount = 0;
    let errorCount = 0;

    // 处理每篇论文
    for (const entry of normalizedEntries) {
      try {
        // 验证必需字段
        if (!entry.id || !Array.isArray(entry.id) || !entry.id[0]) {
          logger.warn('论文条目缺少ID字段，跳过');
          errorCount++;
          continue;
        }

        // 提取arXiv ID
        const arxivId = entry.id[0].split('/abs/')[1] || entry.id[0].split('/').pop();
        if (!arxivId) {
          logger.warn(`无法提取arXiv ID，原始ID: ${entry.id[0]}`);
          errorCount++;
          continue;
        }
        
        // 提取作者
        const authors = entry.author?.map((a) => a.name?.[0] || a.name || '').filter(Boolean) || [];
        
        // 提取分类
        const categories = entry.category?.map((c: any) => c?.$?.term || c?.term || '').filter(Boolean) || [];
        
        // 提取PDF链接
        const pdfLink = entry.link?.find((l: any) => l?.$?.title === 'pdf' || l?.$?.type === 'application/pdf')?.$.href || '';
        
        // 验证必需字段
        if (!entry.title || !Array.isArray(entry.title) || !entry.title[0]) {
          logger.warn(`论文 ${arxivId} 缺少标题字段，跳过`);
          errorCount++;
          continue;
        }

        if (!entry.summary || !Array.isArray(entry.summary) || !entry.summary[0]) {
          logger.warn(`论文 ${arxivId} 缺少摘要字段，跳过`);
          errorCount++;
          continue;
        }

        if (!entry.published || !Array.isArray(entry.published) || !entry.published[0]) {
          logger.warn(`论文 ${arxivId} 缺少发布日期字段，跳过`);
          errorCount++;
          continue;
        }
        
        // 创建论文记录（只传schema中存在的字段）
        await createPaper({
          arxivId,
          title: entry.title[0].trim().replace(/\n/g, ' '),
          abstract: entry.summary[0].trim().replace(/\n/g, ' '),
          authors: JSON.stringify(authors), // 转换为JSON字符串
          categories: JSON.stringify(categories), // 转换为JSON字符串
          pdfUrl: pdfLink,
          publishedDate: new Date(entry.published[0]),
          citationCount: 0,
          venue: null,
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理论文失败: ${error.message}`, { error: error.stack, entryId: entry.id?.[0] });
      }
    }

    logger.info(`arXiv同步完成: 成功 ${syncedCount} 篇, 失败 ${errorCount} 篇, 总计 ${normalizedEntries.length} 篇`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: normalizedEntries.length,
    };
  } catch (error: any) {
    logger.error(`arXiv同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步特定分类的论文（用于管理端「全量拉取」）
 * 时间范围：最近 DEFAULT_ARXIV_YEARS 年；按提交时间倒序，最多 maxResults 篇。
 */
export async function syncArxivByCategory(category: string, maxResults: number = 50) {
  const categoryMap: Record<string, string> = {
    'cs.AI': 'Artificial Intelligence',
    'cs.CV': 'Computer Vision',
    'cs.RO': 'Robotics',
    'cs.LG': 'Machine Learning',
    'cs.CL': 'Computation and Language',
    'cs.NE': 'Neural and Evolutionary Computing',
    'cs.MA': 'Multiagent Systems',
    'eess.SY': 'Systems and Control',
  };

  const query = `cat:${category}`;
  logger.info(`同步分类: ${categoryMap[category] || category}`);
  
  return await syncArxivPapers(query, maxResults);
}
