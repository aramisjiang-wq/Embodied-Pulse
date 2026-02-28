/**
 * Bilibili搜索关键词管理控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllKeywords,
  getKeywordById,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  getActiveKeywordsString,
  batchCreateKeywords,
  getKeywordStats,
  getVideosByKeyword,
} from '../services/bilibili-search-keyword.service';
import { sendSuccess, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { logger } from '../utils/logger';

/**
 * 获取关键词列表
 */
export async function getKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { isActive, category, keyword } = req.query;

    const result = await getAllKeywords({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      category: category as string | undefined,
      keyword: keyword as string | undefined,
      skip,
      take,
    });

    const items = result.keywords.map(k => ({
      id: k.id,
      keyword: k.keyword,
      category: k.category,
      isActive: k.is_active,
      priority: k.priority,
      description: k.description,
      createdAt: k.created_at,
      updatedAt: k.updated_at,
      lastSyncedAt: k.last_synced_at,
      videoCount: k.videoCount,
    }));

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error: any) {
    logger.error('获取关键词列表失败:', error);
    sendError(res, 5001, error.message || '获取关键词列表失败', 500);
  }
}

/**
 * 获取单个关键词
 */
export async function getKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const keyword = await getKeywordById(id);
    
    const item = {
      id: keyword.id,
      keyword: keyword.keyword,
      category: keyword.category,
      isActive: keyword.is_active,
      priority: keyword.priority,
      description: keyword.description,
      createdAt: keyword.created_at,
      updatedAt: keyword.updated_at,
    };
    
    sendSuccess(res, item);
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 5002, '关键词不存在', 404);
    } else {
      logger.error('获取关键词失败:', error);
      sendError(res, 5003, error.message || '获取关键词失败', 500);
    }
  }
}

/**
 * 创建关键词
 */
export async function createKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword, category, isActive, priority, description } = req.body;

    if (!keyword || !keyword.trim()) {
      return sendError(res, 5004, '关键词不能为空', 400);
    }

    const keywordData = await createKeyword({
      keyword: keyword.trim(),
      category: category || undefined,
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0,
      description: description || undefined,
    });

    const item = {
      id: keywordData.id,
      keyword: keywordData.keyword,
      category: keywordData.category,
      isActive: keywordData.is_active,
      priority: keywordData.priority,
      description: keywordData.description,
      createdAt: keywordData.created_at,
      updatedAt: keywordData.updated_at,
    };

    sendSuccess(res, item, '创建成功');
  } catch (error: any) {
    if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      sendError(res, 5005, '关键词已存在', 400);
    } else {
      logger.error('创建关键词失败:', error);
      sendError(res, 5006, error.message || '创建关键词失败', 500);
    }
  }
}

/**
 * 更新关键词
 */
export async function updateKeywordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { keyword, category, isActive, priority, description } = req.body;

    const keywordData = await updateKeyword(id, {
      keyword: keyword ? keyword.trim() : undefined,
      category: category !== undefined ? category : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      priority: priority !== undefined ? priority : undefined,
      description: description !== undefined ? description : undefined,
    });

    const item = {
      id: keywordData.id,
      keyword: keywordData.keyword,
      category: keywordData.category,
      isActive: keywordData.is_active,
      priority: keywordData.priority,
      description: keywordData.description,
      createdAt: keywordData.created_at,
      updatedAt: keywordData.updated_at,
    };

    sendSuccess(res, item, '更新成功');
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      sendError(res, 5002, '关键词不存在', 404);
    } else if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      sendError(res, 5005, '关键词已存在', 400);
    } else {
      logger.error('更新关键词失败:', error);
      sendError(res, 5007, error.message || '更新关键词失败', 500);
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
    logger.error('删除关键词失败:', error);
    sendError(res, 5008, error.message || '删除关键词失败', 500);
  }
}

/**
 * 获取启用的关键词字符串（用于视频搜索）
 */
export async function getActiveKeywordsStringHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const keywordsString = await getActiveKeywordsString();
    sendSuccess(res, { keywords: keywordsString });
  } catch (error: any) {
    logger.error('获取启用关键词失败:', error);
    sendError(res, 5009, error.message || '获取启用关键词失败', 500);
  }
}

/**
 * 批量创建关键词（用于初始化）
 */
export async function batchCreateKeywordsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keywords } = req.body;

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return sendError(res, 5010, '请提供关键词数组', 400);
    }

    const result = await batchCreateKeywords(keywords);
    sendSuccess(res, result, `批量创建完成: 成功 ${result.success.length} 个, 失败 ${result.errors.length} 个`);
  } catch (error: any) {
    logger.error('批量创建关键词失败:', error);
    sendError(res, 5011, error.message || '批量创建关键词失败', 500);
  }
}

/**
 * 获取关键词统计数据
 */
export async function getKeywordStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getKeywordStats();
    sendSuccess(res, stats);
  } catch (error: any) {
    logger.error('获取关键词统计数据失败:', error);
    sendError(res, 5012, error.message || '获取关键词统计数据失败', 500);
  }
}

/**
 * 获取关键词相关视频
 */
export async function getKeywordVideosHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);

    const result = await getVideosByKeyword({
      keywordId: id,
      skip,
      take,
    });

    const items = result.videos.map(v => ({
      id: v.id,
      videoId: v.videoId,
      bvid: v.bvid,
      title: v.title,
      description: v.description,
      coverUrl: v.coverUrl,
      duration: v.duration,
      uploader: v.uploader,
      publishedDate: v.publishedDate,
      viewCount: v.viewCount,
      playCount: v.playCount,
      likeCount: v.likeCount,
    }));

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error: any) {
    logger.error('获取关键词相关视频失败:', error);
    sendError(res, 5013, error.message || '获取关键词相关视频失败', 500);
  }
}
