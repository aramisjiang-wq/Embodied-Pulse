/**
 * 订阅控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import { sendSuccess, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';

/**
 * 创建订阅
 */
export async function createSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { contentType, keywords, tags, authors, notifyEnabled } = req.body;

    // 输入验证
    if (!contentType) {
      return sendError(res, 1001, '内容类型不能为空', 400);
    }
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return sendError(res, 1001, '关键词不能为空', 400);
    }

    const subscription = await subscriptionService.createSubscription({
      userId,
      contentType,
      keywords: Array.isArray(keywords) ? keywords : [],
      tags: Array.isArray(tags) ? tags : undefined,
      authors: Array.isArray(authors) ? authors : undefined,
      notifyEnabled,
    });

    sendSuccess(res, subscription, '订阅创建成功');
  } catch (error: any) {
    if (error.message === 'USER_ID_REQUIRED' || 
        error.message === 'CONTENT_TYPE_REQUIRED' || 
        error.message === 'KEYWORDS_REQUIRED' ||
        error.message === 'USER_NOT_FOUND') {
      return sendError(res, 1001, error.message === 'USER_NOT_FOUND' ? '用户不存在' : '参数错误', 400);
    }
    next(error);
  }
}

/**
 * 获取用户的所有订阅
 */
export async function getUserSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { contentType } = req.query;

    const result = await subscriptionService.getUserSubscriptions({
      userId,
      skip,
      take,
      contentType: contentType as string | undefined,
    });

    sendSuccess(res, {
      items: result.items,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新订阅
 */
export async function updateSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { keywords, tags, authors, isActive, notifyEnabled } = req.body;

    // 输入验证
    if (!id) {
      return sendError(res, 1001, '订阅ID不能为空', 400);
    }

    // 如果提供了keywords/tags/authors，确保它们是数组
    const processedKeywords = keywords !== undefined 
      ? (Array.isArray(keywords) ? keywords : []) 
      : undefined;
    const processedTags = tags !== undefined 
      ? (Array.isArray(tags) ? tags : []) 
      : undefined;
    const processedAuthors = authors !== undefined 
      ? (Array.isArray(authors) ? authors : []) 
      : undefined;

    const subscription = await subscriptionService.updateSubscription({
      id,
      userId,
      keywords: processedKeywords,
      tags: processedTags,
      authors: processedAuthors,
      isActive,
      notifyEnabled,
    });

    sendSuccess(res, subscription, '订阅更新成功');
  } catch (error: any) {
    if (error.message === 'SUBSCRIPTION_NOT_FOUND') {
      return sendError(res, 1005, '订阅不存在', 404);
    }
    if (error.message === 'SUBSCRIPTION_ACCESS_DENIED') {
      return sendError(res, 1003, '无权访问该订阅', 403);
    }
    if (error.message === 'KEYWORDS_MUST_BE_ARRAY' || 
        error.message === 'TAGS_MUST_BE_ARRAY' || 
        error.message === 'AUTHORS_MUST_BE_ARRAY') {
      return sendError(res, 1001, '参数格式错误', 400);
    }
    next(error);
  }
}

/**
 * 删除订阅
 */
export async function deleteSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return sendError(res, 1001, '订阅ID不能为空', 400);
    }

    await subscriptionService.deleteSubscription(id, userId);

    sendSuccess(res, null, '订阅删除成功');
  } catch (error: any) {
    if (error.message === 'SUBSCRIPTION_NOT_FOUND') {
      return sendError(res, 1005, '订阅不存在', 404);
    }
    if (error.message === 'SUBSCRIPTION_ACCESS_DENIED') {
      return sendError(res, 1003, '无权访问该订阅', 403);
    }
    next(error);
  }
}

/**
 * 获取订阅内容（根据用户订阅筛选）
 */
export async function getSubscribedContent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { contentType } = req.query;

    const result = await subscriptionService.getSubscribedContent({
      userId,
      skip,
      take,
      contentType: contentType as string | undefined,
    });

    sendSuccess(res, {
      items: result.items,
      pagination: buildPaginationResponse(page, size, result.total),
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 手动触发订阅同步
 */
export async function syncSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return sendError(res, 1001, '订阅ID不能为空', 400);
    }

    // 验证订阅属于该用户
    const subscription = await subscriptionService.getSubscriptionById(id);
    if (!subscription) {
      return sendError(res, 1005, '订阅不存在', 404);
    }
    if (subscription.userId !== userId) {
      return sendError(res, 1003, '无权访问该订阅', 403);
    }

    const result = await subscriptionService.syncSubscription(id);
    sendSuccess(res, result, '同步成功');
  } catch (error: any) {
    if (error.message === 'SUBSCRIPTION_NOT_FOUND') {
      return sendError(res, 1005, '订阅不存在', 404);
    }
    next(error);
  }
}

/**
 * 获取单个订阅的匹配内容
 */
export async function getSubscriptionContentById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);

    if (!id) {
      return sendError(res, 1001, '订阅ID不能为空', 400);
    }

    const subscription = await subscriptionService.getSubscriptionById(id);
    if (!subscription) {
      return sendError(res, 1005, '订阅不存在', 404);
    }
    if (subscription.userId !== userId) {
      return sendError(res, 1003, '无权访问该订阅', 403);
    }

    const result = await subscriptionService.getSubscriptionContentById(id, skip, take);
    sendSuccess(res, {
      items: result.items,
      pagination: buildPaginationResponse(page, size, result.total),
      contentType: result.contentType,
    });
  } catch (error: any) {
    if (error.message === 'SUBSCRIPTION_NOT_FOUND') {
      return sendError(res, 1005, '订阅不存在', 404);
    }
    next(error);
  }
}
