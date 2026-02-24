/**
 * 论文搜索关键词管理控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllKeywords,
  getKeywordById,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  getActiveKeywordsString,
  getActiveAdminKeywordsString,
  getActiveUserKeywordsString,
  batchCreateKeywords,
  getKeywordPapers,
  getKeywordPapersCount,
} from '../services/paper-search-keyword.service';
import { sendSuccess, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { logger } from '../utils/logger';

/**
 * 获取关键词列表
 */
export async function getKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { isActive, category, sourceType, keyword, withPaperCount } = req.query;

    const result = await getAllKeywords({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      category: category as string | undefined,
      sourceType: sourceType as string | undefined,
      keyword: keyword as string | undefined,
      skip,
      take,
    });

    let items: any[] = result.keywords;

    if (withPaperCount === 'true' && items.length > 0) {
      const counts = await Promise.all(
        items.map((k: any) =>
          getKeywordPapersCount(k.id).catch(() => 0)
        )
      );
      items = items.map((k: any, i: number) => ({ ...k, paperCount: counts[i] }));
    }

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error: any) {
    logger.error('获取论文搜索关键词列表失败:', error);
    sendError(res, 6001, error.message || '获取关键词列表失败', 500);
  }
}

/**
 * 获取单个关键词
 */
export async function getKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const keyword = await getKeywordById(id);
    sendSuccess(res, keyword);
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6002, '关键词不存在', 404);
    } else {
      logger.error('获取论文搜索关键词失败:', error);
      sendError(res, 6003, error.message || '获取关键词失败', 500);
    }
  }
}

/**
 * 创建关键词
 */
export async function createKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword, category, sourceType, isActive, priority, description, tags } = req.body;

    if (!keyword || !keyword.trim()) {
      return sendError(res, 6004, '关键词不能为空', 400);
    }

    const keywordData = await createKeyword({
      keyword: keyword.trim(),
      category: category || undefined,
      sourceType: sourceType || 'admin',
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0,
      description: description || undefined,
      tags: tags || undefined,
    });

    sendSuccess(res, keywordData, '创建成功');
  } catch (error: any) {
    if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      sendError(res, 6005, '关键词已存在', 400);
    } else {
      logger.error('创建论文搜索关键词失败:', error);
      sendError(res, 6006, error.message || '创建关键词失败', 500);
    }
  }
}

/**
 * 更新关键词
 */
export async function updateKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { keyword, category, sourceType, isActive, priority, description, tags } = req.body;

    const keywordData = await updateKeyword(id, {
      keyword: keyword !== undefined ? keyword.trim() : undefined,
      category,
      sourceType,
      isActive,
      priority,
      description,
      tags,
    });

    sendSuccess(res, keywordData, '更新成功');
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6007, '关键词不存在', 404);
    } else if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      sendError(res, 6008, '关键词已存在', 400);
    } else {
      logger.error('更新论文搜索关键词失败:', error);
      sendError(res, 6009, error.message || '更新关键词失败', 500);
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
    sendSuccess(res, null, '删除成功');
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6010, '关键词不存在', 404);
    } else {
      logger.error('删除论文搜索关键词失败:', error);
      sendError(res, 6011, error.message || '删除关键词失败', 500);
    }
  }
}

/**
 * 批量创建关键词
 */
export async function batchCreateKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keywords } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return sendError(res, 6012, '关键词列表不能为空', 400);
    }

    const result = await batchCreateKeywords(keywords);
    
    sendSuccess(res, {
      success: result.results.length,
      failed: result.errors.length,
      results: result.results,
      errors: result.errors,
    }, '批量创建完成');
  } catch (error: any) {
    logger.error('批量创建论文搜索关键词失败:', error);
    sendError(res, 6013, error.message || '批量创建关键词失败', 500);
  }
}

/**
 * 获取所有启用的关键词（用于同步）
 */
export async function getActiveKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const keywords = await getActiveKeywordsString();
    sendSuccess(res, { keywords, count: keywords.length });
  } catch (error: any) {
    logger.error('获取启用的论文搜索关键词失败:', error);
    sendError(res, 6014, error.message || '获取关键词失败', 500);
  }
}

/**
 * 获取所有启用的管理员关键词（用于同步）
 */
export async function getActiveAdminKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const keywords = await getActiveAdminKeywordsString();
    sendSuccess(res, { keywords, count: keywords.length });
  } catch (error: any) {
    logger.error('获取启用的管理员论文搜索关键词失败:', error);
    sendError(res, 6015, error.message || '获取关键词失败', 500);
  }
}

/**
 * 获取所有启用的用户订阅关键词（用于同步）
 */
export async function getActiveUserKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const keywords = await getActiveUserKeywordsString();
    sendSuccess(res, { keywords, count: keywords.length });
  } catch (error: any) {
    logger.error('获取启用的用户订阅论文搜索关键词失败:', error);
    sendError(res, 6016, error.message || '获取关键词失败', 500);
  }
}

/**
 * 获取关键词相关的论文
 */
export async function getKeywordPapersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);

    const result = await getKeywordPapers(id, { skip, take });

    sendSuccess(res, {
      items: result.papers,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6017, '关键词不存在', 404);
    } else {
      logger.error('获取关键词相关论文失败:', error);
      sendError(res, 6018, error.message || '获取论文失败', 500);
    }
  }
}

/**
 * 获取关键词相关的论文数量
 */
export async function getKeywordPapersCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const count = await getKeywordPapersCount(id);
    sendSuccess(res, { count });
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 6019, '关键词不存在', 404);
    } else {
      logger.error('获取关键词相关论文数量失败:', error);
      sendError(res, 6020, error.message || '获取论文数量失败', 500);
    }
  }
}
