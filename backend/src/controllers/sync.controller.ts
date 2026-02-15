/**
 * 数据同步控制器 (管理员专用)
 */

import { Request, Response } from 'express';
import {
  syncAllData,
  syncEmbodiedAIData,
  syncArxivPapers,
  syncGithubRepos,
  syncHuggingFaceModels,
  syncHuggingFacePapersByDate,
  syncRecentHuggingFacePapers,
  syncBilibiliVideos,
  syncYouTubeVideos,
  syncJobsFromGithub,
  syncPapersByKeywords,
  syncVideosByKeywords,
} from '../services/sync';
import { syncHotNews as syncHotNewsService, syncHotNewsByPlatforms } from '../services/sync/hot-news.sync';
import { syncDailyHotApi as syncDailyHotApiService, syncDailyHotApiByPlatforms } from '../services/sync/dailyhot-api.sync';
import { sync36krNews } from '../services/sync/36kr.sync';
import { syncTechNews as syncTechNewsService, syncTechNewsBySource } from '../services/sync/tech-news.sync';
import { syncSemanticScholarPapers } from '../services/sync/semantic-scholar.sync';
import { dailySmartFilter } from '../services/sync/smart-news-filter.sync';
import { logger } from '../utils/logger';
import { createDataSourceLog, updateDataSourceSyncResult } from '../services/data-source.service';
import adminPrisma from '../config/database.admin';
import { sendSuccess, sendError } from '../utils/response';

/**
 * 同步所有数据
 */
export const syncAll = async (req: Request, res: Response) => {
  try {
    const results = await syncAllData();
    sendSuccess(res, results, '全量数据同步完成');
  } catch (error: any) {
    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步具身智能核心数据
 */
export const syncEmbodiedAI = async (req: Request, res: Response) => {
  try {
    const results = await syncEmbodiedAIData();
    sendSuccess(res, results, '具身智能数据同步完成');
  } catch (error: any) {
    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步arXiv论文
 */
export const syncArxiv = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { query, maxResults = 100, startDate, endDate } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发arXiv同步: ${query}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'arxiv' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncArxivPapers(query, maxResults, startDate, endDate);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `http://export.arxiv.org/api/query?search_query=all:${query}&max_results=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { query, maxResults, startDate, endDate },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, 'arXiv同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步GitHub项目
 */
export const syncGithub = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { query, maxResults = 100 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发GitHub同步: ${query}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'github' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncGithubRepos(query, maxResults);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { query, maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, 'GitHub同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步HuggingFace论文
 */
export const syncHuggingFacePapers = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { date, days, maxResults = 100 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发HuggingFace论文同步${date ? `, 日期: ${date}` : days ? `, 最近${days}天` : ''}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'huggingface' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    let result;
    if (date) {
      // 同步指定日期的论文
      result = await syncHuggingFacePapersByDate(date, maxResults);
    } else if (days) {
      // 同步最近几天的论文
      result = await syncRecentHuggingFacePapers(days, maxResults);
    } else {
      // 默认同步最近7天
      result = await syncRecentHuggingFacePapers(7, maxResults);
    }
    
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://huggingface.co/papers/date/${date || 'recent'}`,
        requestMethod: 'GET',
        requestBody: { date, days, maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, 'HuggingFace论文同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('HuggingFace论文同步失败:', {
      error: error.message,
      stack: error.stack,
      duration,
    });

    // 记录错误日志
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        requestUrl: `https://huggingface.co/papers/date/${req.body.date || 'recent'}`,
        requestMethod: 'GET',
        requestBody: req.body,
        responseCode: 500,
        duration,
        errorMessage: error.message,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步HuggingFace模型
 */
export const syncHuggingFace = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { task, maxResults = 100 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发HuggingFace同步${task ? `: ${task}` : ''}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'huggingface' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncHuggingFaceModels(task, maxResults);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://huggingface.co/api/models${task ? `?task=${task}` : ''}&limit=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { task, maxResults },
        responseCode: result.success ? 200 : 200, // 即使失败也返回200，因为result.success=false已经表示失败
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
        errorMessage: result.success ? undefined : (result as any).message,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    // 如果同步失败，返回200但包含错误信息，而不是500错误
    if (!result.success) {
      return sendSuccess(res, result, (result as any).message || 'HuggingFace同步失败');
    }

    sendSuccess(res, result, 'HuggingFace同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步Bilibili视频
 */
export const syncBilibili = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { query = '机器人 OR 具身智能', maxResults = 50 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发Bilibili同步: ${query}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'bilibili' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncBilibiliVideos(query, maxResults);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(query)}&max_results=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { query, maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, 'Bilibili同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步YouTube视频
 */
export const syncYouTube = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { query, maxResults = 50 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发YouTube同步: ${query}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'youtube' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncYouTubeVideos(query, maxResults);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { query, maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, 'YouTube同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步热点新闻
 */
export const syncHotNews = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { platform = 'baidu', maxResults = 50 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发热点新闻同步，平台: ${platform}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'hot_news' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncHotNewsService(platform, maxResults);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://orz.ai/api/v1/dailynews/?platform=${platform}&limit=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { platform, maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, '热点新闻同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步DailyHotApi新闻
 */
export const syncDailyHotApi = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { platform = 'baidu', maxResults = 50 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发DailyHotApi同步，平台: ${platform}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'dailyhot_api' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncDailyHotApiService(platform, maxResults);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://api-hot.imsyy.top/${platform}`,
        requestMethod: 'GET',
        requestBody: { platform, maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    sendSuccess(res, result, 'DailyHotApi同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步36kr新闻
 */
export const sync36kr = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { maxResults = 100, useApi = true } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发36kr新闻同步`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: '36kr' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await sync36krNews(maxResults, useApi);
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://36kr.com/api/search-column/mainsite`,
        requestMethod: 'GET',
        requestBody: { maxResults, useApi },
        responseCode: result.success ? 200 : 200, // 即使失败也返回200，因为result.success=false已经表示失败
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
        errorMessage: result.success ? undefined : (result as any).message,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    // 如果同步失败，返回200但包含错误信息，而不是500错误
    if (!result.success) {
      return sendSuccess(res, result, (result as any).message || '36kr新闻同步失败');
    }

    sendSuccess(res, result, '36kr新闻同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 智能筛选相关新闻
 */
export const smartFilterNews = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { platform, days = 7, minScore = 5 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发智能新闻筛选，平台: ${platform || '全部'}, 最近${days}天`);
    
    const result = await dailySmartFilter();
    const duration = Date.now() - startTime;

    logger.info(`智能筛选完成，耗时: ${duration}ms`);

    sendSuccess(res, result, '智能筛选完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`智能筛选失败: ${error.message}`, { duration });
    sendError(res, 500, error.message || '智能筛选失败', 500);
  }
};

/**
 * 根据论文搜索关键词同步论文
 */
export const syncPapersByKeywordsHandler = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { sourceType = 'all', days = 7, maxResultsPerKeyword = 20 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发论文关键词同步，来源: ${sourceType}, 天数: ${days}, 每个关键词最大结果: ${maxResultsPerKeyword}`);
    
    const result = await syncPapersByKeywords(sourceType, days, maxResultsPerKeyword);
    const duration = Date.now() - startTime;

    logger.info(`论文关键词同步完成，耗时: ${duration}ms`);

    sendSuccess(res, result, '论文关键词同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`论文关键词同步失败: ${error.message}`, { duration });
    sendError(res, 500, error.message || '论文关键词同步失败', 500);
  }
};

/**
 * 根据Bilibili搜索关键词同步视频
 */
export const syncVideosByKeywordsHandler = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { days = 7, maxResultsPerKeyword = 20 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发Bilibili关键词同步，天数: ${days}, 每个关键词最大结果: ${maxResultsPerKeyword}`);
    
    const result = await syncVideosByKeywords(days, maxResultsPerKeyword);
    const duration = Date.now() - startTime;

    logger.info(`Bilibili关键词同步完成，耗时: ${duration}ms`);

    sendSuccess(res, result, 'Bilibili关键词同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`Bilibili关键词同步失败: ${error.message}`, { duration });
    sendError(res, 500, error.message || 'Bilibili关键词同步失败', 500);
  }
};

/**
 * 同步GitHub岗位
 */
/**
 * 同步Semantic Scholar论文
 */
export const syncSemanticScholar = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { query = 'embodied AI OR robotics', maxResults = 100, year, fieldsOfStudy, skipOnRateLimit = false } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发Semantic Scholar同步: ${query}`);
    
    // 查找数据源（如果存在）
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'semantic_scholar' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncSemanticScholarPapers(query, maxResults, year, fieldsOfStudy, skipOnRateLimit);
    const duration = Date.now() - startTime;

    // 记录日志
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://api.semanticscholar.org/graph/v1/paper/search`,
        requestMethod: 'GET',
        requestBody: { query, maxResults, year, fieldsOfStudy },
        responseCode: result.success ? 200 : 200,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
        errorMessage: result.success ? undefined : result.message,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    if (!result.success) {
      return sendSuccess(res, result, result.message || 'Semantic Scholar同步失败');
    }
    sendSuccess(res, result, 'Semantic Scholar同步完成');
  } catch (error: any) {
    logger.error('Semantic Scholar同步失败:', error);
    sendError(res, 500, error.message || '同步失败', 500);
  }
};

/**
 * 同步科技新闻（TechCrunch等，作为36kr的替代）
 */
export const syncTechNews = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { maxResults = 50, sources } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发科技新闻同步${sources ? `: ${sources.join(', ')}` : ''}`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'tech_news' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    // 如果sources是空数组，则同步所有源；如果有值，则同步指定源
    const result = sources && Array.isArray(sources) && sources.length > 0
      ? await syncTechNewsService(maxResults, sources)
      : await syncTechNewsService(maxResults);
    
    const duration = Date.now() - startTime;

    // 记录日志
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: 'https://techcrunch.com/feed/',
        requestMethod: 'GET',
        requestBody: { maxResults, sources },
        responseCode: result.success ? 200 : 200,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
        errorMessage: result.success ? undefined : result.message,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    // 如果同步失败，返回200但包含错误信息
    if (!result.success) {
      return sendSuccess(res, result, result.message || '科技新闻同步失败');
    }

    sendSuccess(res, result, '科技新闻同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};

export const syncJobs = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { maxResults = 200 } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发GitHub岗位同步`);
    
    // 查找数据源
    if ('dataSource' in adminPrisma) {
      try {
        const dataSource = await (adminPrisma as any).dataSource.findUnique({
          where: { name: 'github-jobs' },
        });
        dataSourceId = dataSource?.id || null;
      } catch (error) {
        logger.warn('查找数据源失败，跳过日志记录:', error);
      }
    }
    
    const result = await syncJobsFromGithub({ maxResults });
    const duration = Date.now() - startTime;

    // 记录日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://github.com/StarCycle/Awesome-Embodied-AI-Job`,
        requestMethod: 'GET',
        requestBody: { maxResults },
        responseCode: result.success ? 200 : 500,
        duration,
        syncedCount: result.synced,
        errorCount: result.errors,
      }).catch(err => logger.debug('同步日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(
        dataSourceId,
        result.success ? 'success' : 'error',
        { synced: result.synced, errors: result.errors, total: result.total }
      ).catch(err => logger.debug('同步结果更新失败（不影响主流程）:', err));
    }

    // 如果同步失败，返回200但包含错误信息，而不是500错误
    if (!result.success) {
      return sendSuccess(res, result, (result as any).message || 'GitHub岗位同步失败');
    }

    sendSuccess(res, result, 'GitHub岗位同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // 记录错误日志（失败不影响主流程）
    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: 'error',
        errorMessage: error.message || '同步失败',
        duration,
      }).catch(err => logger.debug('错误日志记录失败（不影响主流程）:', err));

      updateDataSourceSyncResult(dataSourceId, 'error').catch(err => logger.debug('错误结果更新失败（不影响主流程）:', err));
    }

    sendError(res, 500, error.message || '同步失败', 500);
  }
};
