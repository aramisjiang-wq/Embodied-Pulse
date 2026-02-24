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
  syncPapersByKeywords,
  syncVideosByKeywords,
} from '../services/sync';
import { syncArxivByCategory } from '../services/sync/arxiv.sync';
import { syncSemanticScholarPapers } from '../services/sync/semantic-scholar.sync';
import { syncLimXJobs } from '../services/sync/limx-jobs.sync';
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
      result = await syncHuggingFacePapersByDate(date, maxResults);
    } else if (days) {
      result = await syncRecentHuggingFacePapers(days, maxResults);
    } else {
      result = await syncRecentHuggingFacePapers(7, maxResults);
    }
    
    const duration = Date.now() - startTime;

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

    if (dataSourceId) {
      createDataSourceLog({
        dataSourceId,
        type: 'sync',
        status: result.success ? 'success' : 'error',
        requestUrl: `https://huggingface.co/api/models${task ? `?task=${task}` : ''}&limit=${maxResults}`,
        requestMethod: 'GET',
        requestBody: { task, maxResults },
        responseCode: result.success ? 200 : 200,
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

    if (!result.success) {
      return sendSuccess(res, result, (result as any).message || 'HuggingFace同步失败');
    }

    sendSuccess(res, result, 'HuggingFace同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
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
 * 同步Semantic Scholar论文
 */
export const syncSemanticScholar = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dataSourceId: string | null = null;
  
  try {
    const { query = 'embodied AI OR robotics', maxResults = 100, year, fieldsOfStudy, skipOnRateLimit = false } = req.body;
    
    logger.info(`管理员 ${req.user?.email} 触发Semantic Scholar同步: ${query}`);
    
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
 * 全量拉取 ArXiv 指定分类的论文
 * 逻辑说明：按所选分类，拉取「最近 1 年」内提交的论文（按提交时间倒序），每分类最多 maxResultsPerCategory 篇。
 * 已存在的论文（同 arxivId）会 upsert 更新，不会重复入库。
 */
export const syncArxivCategoriesHandler = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      categories = ['cs.AI', 'cs.RO', 'cs.CV', 'cs.LG', 'cs.CL'],
      maxResultsPerCategory = 50,
    } = req.body;

    logger.info(`管理员 ${req.user?.email} 触发 ArXiv 分类全量拉取，分类: ${categories.join(', ')}, 每分类: ${maxResultsPerCategory}（时间范围: 最近1年）`);

    let totalSynced = 0;
    let totalErrors = 0;
    const categoryResults: Record<string, { synced: number; errors: number }> = {};

    for (const category of categories) {
      try {
        const result = await syncArxivByCategory(category, maxResultsPerCategory);
        totalSynced += result.synced;
        totalErrors += result.errors;
        categoryResults[category] = { synced: result.synced, errors: result.errors };
        logger.info(`分类 ${category} 同步完成: 成功 ${result.synced} 篇`);
      } catch (err: any) {
        logger.error(`分类 ${category} 同步失败: ${err.message}`);
        totalErrors++;
        categoryResults[category] = { synced: 0, errors: 1 };
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`ArXiv 分类全量拉取完成，耗时: ${duration}ms`);

    sendSuccess(res, {
      success: true,
      synced: totalSynced,
      errors: totalErrors,
      categories: categoryResults,
      duration,
    }, 'ArXiv 分类全量拉取完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errMsg = error.message || 'ArXiv 分类全量拉取失败';
    logger.error(`ArXiv 分类全量拉取失败: ${errMsg}`, { duration });
    sendError(res, 500, errMsg, 500);
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
 * 同步招聘岗位（仅逐际动力，不清空现有数据；其他岗位请后台手动添加或使用脚本）
 */
export const syncJobs = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    logger.info(`管理员 ${req.user?.email} 触发逐际动力岗位同步`);
    const result = await syncLimXJobs();
    const duration = Date.now() - startTime;
    sendSuccess(res, { ...result, duration }, '逐际动力岗位同步完成');
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('逐际动力岗位同步失败', { message: error.message });
    sendError(res, 500, error.message || '同步失败', 500);
  }
};
