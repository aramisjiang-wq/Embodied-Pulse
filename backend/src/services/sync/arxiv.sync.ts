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
    let searchQuery = `all:${query}`;
    
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
        // 如果没有指定开始日期，默认使用1年前
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        dateRange.push(formatArxivDate(oneYearAgo));
      }
      if (endDate) {
        dateRange.push(endDate);
      } else {
        // 如果没有指定结束日期，使用当前时间
        const now = new Date();
        dateRange.push(formatArxivDate(now));
      }
      searchQuery += ` AND submittedDate:[${dateRange[0]} TO ${dateRange[1]}]`;
    } else {
      // 如果没有指定日期范围，默认抓取近1年的论文
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const now = new Date();
      const startDateStr = formatArxivDate(oneYearAgo);
      const endDateStr = formatArxivDate(now);
      searchQuery += ` AND submittedDate:[${startDateStr} TO ${endDateStr}]`;
    }
    
    // 构建API请求
    const response = await axiosInstance.get(ARXIV_API_BASE, {
      params: {
        search_query: searchQuery,
        start: 0,
        max_results: maxResults,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      },
    });

    // 解析XML响应
    const result: any = await parseXML(response.data);
    const entries: ArxivEntry[] = result.feed?.entry || [];

    logger.info(`获取到 ${entries.length} 篇论文`);

    let syncedCount = 0;
    let errorCount = 0;

    // 处理每篇论文
    for (const entry of entries) {
      try {
        // 提取arXiv ID
        const arxivId = entry.id[0].split('/abs/')[1];
        
        // 提取作者
        const authors = entry.author?.map((a) => a.name[0]) || [];
        
        // 提取分类
        const categories = entry.category?.map((c) => c.$.term) || [];
        
        // 提取PDF链接
        const pdfLink = entry.link?.find((l) => l.$.title === 'pdf')?.$.href || '';
        
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
        logger.error(`处理论文失败: ${error.message}`);
      }
    }

    logger.info(`arXiv同步完成: 成功 ${syncedCount} 篇, 失败 ${errorCount} 篇`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: entries.length,
    };
  } catch (error: any) {
    logger.error(`arXiv同步失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步特定分类的论文
 */
export async function syncArxivByCategory(category: string, maxResults: number = 50) {
  const categoryMap: Record<string, string> = {
    'cs.AI': 'Artificial Intelligence',
    'cs.CV': 'Computer Vision',
    'cs.RO': 'Robotics',
    'cs.LG': 'Machine Learning',
    'cs.CL': 'Computation and Language',
  };

  const query = `cat:${category}`;
  logger.info(`同步分类: ${categoryMap[category] || category}`);
  
  return await syncArxivPapers(query, maxResults);
}
