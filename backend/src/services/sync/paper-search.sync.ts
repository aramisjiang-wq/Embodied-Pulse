/**
 * 论文搜索关键词同步服务
 * 根据数据库中的关键词同步arXiv论文
 */

import { syncArxivPapers } from './arxiv.sync';
import { getActiveKeywordsString, getActiveAdminKeywordsString, getActiveUserKeywordsString } from '../paper-search-keyword.service';
import { logger } from '../../utils/logger';

/**
 * 根据论文搜索关键词同步论文
 * @param sourceType 关键词来源类型：'all' | 'admin' | 'user'
 * @param days 同步最近几天的论文
 * @param maxResultsPerKeyword 每个关键词最多同步多少篇论文
 */
export async function syncPapersByKeywords(
  sourceType: 'all' | 'admin' | 'user' = 'all',
  days: number = 7,
  maxResultsPerKeyword: number = 20
) {
  try {
    logger.info(`开始根据关键词同步论文，来源: ${sourceType}, 天数: ${days}, 每个关键词最大结果: ${maxResultsPerKeyword}`);
    
    // 获取关键词
    let keywords: string[] = [];
    if (sourceType === 'admin') {
      keywords = await getActiveAdminKeywordsString();
    } else if (sourceType === 'user') {
      keywords = await getActiveUserKeywordsString();
    } else {
      keywords = await getActiveKeywordsString();
    }
    
    if (keywords.length === 0) {
      logger.warn('没有找到启用的关键词');
      return {
        success: true,
        synced: 0,
        errors: 0,
        keywords: 0,
      };
    }
    
    logger.info(`找到 ${keywords.length} 个关键词: ${keywords.join(', ')}`);
    
    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatArxivDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };
    
    const startDateStr = formatArxivDate(startDate);
    const endDateStr = formatArxivDate(endDate);
    
    let totalSynced = 0;
    let totalErrors = 0;
    
    // 逐个关键词同步
    for (const keyword of keywords) {
      try {
        logger.info(`同步关键词: ${keyword}`);
        const result = await syncArxivPapers(keyword, maxResultsPerKeyword, startDateStr, endDateStr);
        totalSynced += result.synced;
        totalErrors += result.errors;
        logger.info(`关键词 ${keyword} 同步完成: 成功 ${result.synced} 篇, 失败 ${result.errors} 篇`);
      } catch (error: any) {
        logger.error(`同步关键词 ${keyword} 失败:`, error.message);
        totalErrors++;
      }
    }
    
    logger.info(`论文同步完成: 总共 ${keywords.length} 个关键词, 成功 ${totalSynced} 篇, 失败 ${totalErrors} 篇`);
    
    return {
      success: true,
      synced: totalSynced,
      errors: totalErrors,
      keywords: keywords.length,
    };
  } catch (error: any) {
    logger.error(`根据关键词同步论文失败: ${error.message}`);
    throw error;
  }
}

/**
 * 同步管理员关键词的论文
 */
export async function syncAdminKeywordPapers(days: number = 7, maxResultsPerKeyword: number = 20) {
  return await syncPapersByKeywords('admin', days, maxResultsPerKeyword);
}

/**
 * 同步用户订阅关键词的论文
 */
export async function syncUserKeywordPapers(days: number = 7, maxResultsPerKeyword: number = 20) {
  return await syncPapersByKeywords('user', days, maxResultsPerKeyword);
}

/**
 * 同步所有关键词的论文
 */
export async function syncAllKeywordPapers(days: number = 7, maxResultsPerKeyword: number = 20) {
  return await syncPapersByKeywords('all', days, maxResultsPerKeyword);
}
