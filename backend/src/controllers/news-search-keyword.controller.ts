/**
 * 新闻搜索关键词管理控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllKeywords,
  getKeywordById,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  deleteKeywords,
  getKeywordNews,
  getKeywordNewsCount,
  createKeywords,
} from '../services/news-search-keyword.service';
import { syncHotNewsByPlatforms } from '../services/sync/hot-news.sync';
import { syncTechNews } from '../services/sync/tech-news.sync';
import { sync36krNews } from '../services/sync/36kr.sync';
import { searchNewsByKeywords } from '../services/sync/news-search.sync';
import { sendSuccess, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { logger } from '../utils/logger';

/**
 * 获取所有新闻搜索关键词
 */
export async function getAllKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);

    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const category = req.query.category as string;
    const sourceType = req.query.sourceType as string;
    const keyword = req.query.keyword as string;

    const result = await getAllKeywords({
      skip,
      take,
      isActive,
      category,
      sourceType,
      keyword,
    });

    sendSuccess(res, {
      items: result.keywords,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error: any) {
    logger.error('[NewsSearchKeywordController] Error getting keywords:', error);
    sendError(res, 500, '获取新闻搜索关键词失败', error.message);
  }
}

/**
 * 根据ID获取关键词
 */
export async function getKeywordByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const keyword = await getKeywordById(id);

    sendSuccess(res, keyword);
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6001, '关键词不存在', 404);
    } else {
      logger.error('[NewsSearchKeywordController] Error getting keyword by id:', error);
      sendError(res, 500, '获取关键词失败', error.message);
    }
  }
}

/**
 * 一键拉取近24小时内最新关键词相关新闻
 */
export async function syncLatestNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { hours = 24 } = req.query;
    const hoursNum = Number(hours) || 24;

    logger.info(`开始一键拉取最新新闻，时间范围: ${hoursNum} 小时`);

    const result = await getAllKeywords({
      isActive: true,
      skip: 0,
      take: 1000,
    });

    const keywords = result.keywords.map((k: any) => k.keyword);

    if (keywords.length === 0) {
      sendSuccess(res, {
        message: '没有启用的关键词，请先添加关键词',
        results: {
          hotNews: { synced: 0, errors: 0, total: 0 },
          techNews: { synced: 0, errors: 0, total: 0 },
          kr36: { synced: 0, errors: 0, total: 0 },
        },
        total: 0,
      });
      return;
    }

    logger.info(`开始根据 ${keywords.length} 个关键词搜索新闻: ${keywords.join(', ')}`);

    const searchResult = await searchNewsByKeywords(keywords, {
      includeHotNews: true,
      includeTechNews: true,
      includeKr36: true,
      hotNewsPlatforms: ['baidu', 'weibo', 'zhihu'],
      maxResultsPerSource: 50,
    });

    logger.info(`一键拉取最新新闻完成: 成功 ${searchResult.synced} 条, 失败 ${searchResult.errors} 条`);

    sendSuccess(res, {
      message: `成功从 ${keywords.length} 个关键词同步 ${searchResult.synced} 条新闻`,
      keywords: keywords,
      results: searchResult.results,
      total: searchResult.total,
    });
  } catch (error: any) {
    logger.error('[NewsSearchKeywordController] Error syncing latest news:', error);
    sendError(res, 500, '同步最新新闻失败', error.message);
  }
}

/**
 * 创建关键词
 */
export async function createKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const keyword = await createKeyword(data);

    sendSuccess(res, keyword, '创建关键词成功');
  } catch (error: any) {
    if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      sendError(res, 6002, '关键词已存在', 400);
    } else {
      logger.error('[NewsSearchKeywordController] Error creating keyword:', error);
      sendError(res, 500, '创建关键词失败', error.message);
    }
  }
}

/**
 * 批量创建关键词
 */
export async function createKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const keywords = await createKeywords(data);

    sendSuccess(res, keywords, '批量创建关键词成功');
  } catch (error: any) {
    logger.error('[NewsSearchKeywordController] Error creating keywords:', error);
    sendError(res, 500, '批量创建关键词失败', error.message);
  }
}

/**
 * 更新关键词
 */
export async function updateKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;
    const keyword = await updateKeyword(id, data);

    sendSuccess(res, keyword);
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6001, '关键词不存在', 404);
    } else if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      sendError(res, 6002, '关键词已存在', 400);
    } else {
      logger.error('[NewsSearchKeywordController] Error updating keyword:', error);
      sendError(res, 500, '更新关键词失败', error.message);
    }
  }
}

/**
 * 删除关键词
 */
export async function deleteKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deleteKeyword(id);

    sendSuccess(res, { message: '删除成功' });
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6001, '关键词不存在', 404);
    } else {
      logger.error('[NewsSearchKeywordController] Error deleting keyword:', error);
      sendError(res, 500, '删除关键词失败', error.message);
    }
  }
}

/**
 * 批量删除关键词
 */
export async function deleteKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    await deleteKeywords(ids);

    sendSuccess(res, { message: `成功删除 ${ids.length} 个关键词` });
  } catch (error: any) {
    logger.error('[NewsSearchKeywordController] Error deleting keywords:', error);
    sendError(res, 500, '批量删除关键词失败', error.message);
  }
}

/**
 * 获取关键词相关的新闻
 */
export async function getKeywordNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);

    const result = await getKeywordNews(id, { skip, take });

    sendSuccess(res, {
      items: result.news,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6001, '关键词不存在', 404);
    } else {
      logger.error('[NewsSearchKeywordController] Error getting keyword news:', error);
      sendError(res, 500, '获取新闻失败', error.message);
    }
  }
}

/**
 * 获取关键词相关的新闻数量
 */
export async function getKeywordNewsCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const count = await getKeywordNewsCount(id);

    sendSuccess(res, { count });
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6001, '关键词不存在', 404);
    } else {
      logger.error('[NewsSearchKeywordController] Error getting keyword news count:', error);
      sendError(res, 500, '获取新闻数量失败', error.message);
    }
  }
}

/**
 * 根据关键词搜索并抓取新闻
 */
export async function searchNewsByKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keywords } = req.body;
    const includeHotNews = req.body.includeHotNews !== false;
    const includeTechNews = req.body.includeTechNews !== false;
    const includeKr36 = req.body.includeKr36 !== false;
    const hotNewsPlatforms = req.body.hotNewsPlatforms || ['baidu', 'weibo', 'zhihu'];
    const maxResultsPerSource = req.body.maxResultsPerSource || 50;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      sendError(res, 400, '请提供关键词列表');
      return;
    }

    logger.info(`开始根据关键词搜索新闻，关键词: ${keywords.join(', ')}`);

    const result = await searchNewsByKeywords(keywords, {
      includeHotNews,
      includeTechNews,
      includeKr36,
      hotNewsPlatforms,
      maxResultsPerSource,
    });

    sendSuccess(res, {
      message: `成功同步 ${result.synced} 条新闻`,
      results: result.results,
      total: result.total,
    });
  } catch (error: any) {
    logger.error('[NewsSearchKeywordController] Error searching news by keywords:', error);
    sendError(res, 500, '搜索新闻失败', error.message);
  }
}

/**
 * 根据所有启用的关键词搜索并抓取新闻
 */
export async function searchNewsByAllKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const includeHotNews = req.query.includeHotNews !== 'false';
    const includeTechNews = req.query.includeTechNews !== 'false';
    const includeKr36 = req.query.includeKr36 !== 'false';
    const hotNewsPlatforms = (req.query.hotNewsPlatforms as string)?.split(',') || ['baidu', 'weibo', 'zhihu'];
    const maxResultsPerSource = Number(req.query.maxResultsPerSource) || 50;

    const result = await getAllKeywords({
      isActive: true,
      skip: 0,
      take: 1000,
    });

    const keywords = result.keywords.map((k: any) => k.keyword);

    if (keywords.length === 0) {
      sendSuccess(res, {
        message: '没有启用的关键词',
        results: {
          hotNews: { synced: 0, errors: 0, total: 0 },
          techNews: { synced: 0, errors: 0, total: 0 },
          kr36: { synced: 0, errors: 0, total: 0 },
        },
        total: 0,
      });
      return;
    }

    logger.info(`开始根据所有启用的关键词搜索新闻，共 ${keywords.length} 个关键词`);

    const searchResult = await searchNewsByKeywords(keywords, {
      includeHotNews,
      includeTechNews,
      includeKr36,
      hotNewsPlatforms,
      maxResultsPerSource,
    });

    sendSuccess(res, {
      message: `成功从 ${keywords.length} 个关键词同步 ${searchResult.synced} 条新闻`,
      keywords: keywords,
      results: searchResult.results,
      total: searchResult.total,
    });
  } catch (error: any) {
    logger.error('[NewsSearchKeywordController] Error searching news by all keywords:', error);
    sendError(res, 500, '搜索新闻失败', error.message);
  }
}
