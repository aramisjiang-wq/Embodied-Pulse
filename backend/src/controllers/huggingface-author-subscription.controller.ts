/**
 * HuggingFace作者订阅控制器
 * 用于管理端管理HuggingFace作者订阅
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllAuthorSubscriptions,
  addAuthorSubscription,
  removeAuthorSubscription,
  syncAuthorModels,
  toggleSubscriptionStatus,
  updateSubscriptionTags,
} from '../services/huggingface-author-subscription.service';
import { parseHuggingFaceUrl } from '../services/huggingface-api.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 获取所有作者订阅
 */
export const getAuthorSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptions = await getAllAuthorSubscriptions();
    sendSuccess(res, subscriptions);
  } catch (error: any) {
    logger.error('获取作者订阅列表失败:', error);
    sendError(res, 6001, error.message || '获取失败', 500);
  }
};

/**
 * 添加作者订阅
 */
export const addAuthorSubscriptionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { author, authorUrl } = req.body;

    if (!author) {
      return sendError(res, 6002, '请提供作者名称', 400);
    }

    // 如果提供了URL，尝试解析作者名
    let authorName = author;
    if (authorUrl) {
      const parsed = parseHuggingFaceUrl(authorUrl);
      if (parsed) {
        authorName = parsed.author;
      }
    }

    const subscription = await addAuthorSubscription(authorName, authorUrl || `https://huggingface.co/${authorName}`);
    sendSuccess(res, subscription, '订阅添加成功');
  } catch (error: any) {
    if (error.message === 'AUTHOR_ALREADY_SUBSCRIBED') {
      return sendError(res, 6003, '该作者已订阅', 400);
    }
    logger.error('添加作者订阅失败:', error);
    sendError(res, 6004, error.message || '添加失败', 500);
  }
};

/**
 * 删除作者订阅
 */
export const removeAuthorSubscriptionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await removeAuthorSubscription(id);
    sendSuccess(res, null, '订阅删除成功');
  } catch (error: any) {
    logger.error('删除作者订阅失败:', error);
    sendError(res, 6005, error.message || '删除失败', 500);
  }
};

/**
 * 同步作者模型
 */
export const syncAuthorModelsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;

    logger.info(`开始同步订阅 ${id}，limit: ${limit}`);

    // 先获取订阅信息
    const subscriptions = await getAllAuthorSubscriptions();
    const subscription = subscriptions.find(s => s.id === id);

    if (!subscription) {
      logger.error(`订阅不存在: ${id}`);
      return sendError(res, 6006, '订阅不存在', 404);
    }

    logger.info(`找到订阅: ${subscription.author}，开始同步`);

    const result = await syncAuthorModels(subscription.author, Number(limit));
    
    logger.info(`同步完成: ${subscription.author}，成功 ${result.synced} 个，失败 ${result.errors} 个，总计 ${result.total} 个`);
    
    sendSuccess(res, {
      ...result,
      author: subscription.author,
    }, `同步完成：成功 ${result.synced} 个，失败 ${result.errors} 个`);
  } catch (error: any) {
    logger.error('同步作者模型失败:', {
      error: error.message,
      stack: error.stack,
      id: req.params.id,
    });
    sendError(res, 6007, error.message || '同步失败', 500);
  }
};

/**
 * 切换订阅状态
 */
export const toggleSubscriptionStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, 6008, 'isActive必须是布尔值', 400);
    }

    await toggleSubscriptionStatus(id, isActive);
    sendSuccess(res, null, '状态更新成功');
  } catch (error: any) {
    logger.error('切换订阅状态失败:', error);
    sendError(res, 6009, error.message || '更新失败', 500);
  }
};

/**
 * 更新订阅标签
 */
export const updateSubscriptionTagsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return sendError(res, 6010, 'tags必须是数组', 400);
    }

    await updateSubscriptionTags(id, tags);
    sendSuccess(res, { tags }, '标签更新成功');
  } catch (error: any) {
    logger.error('更新订阅标签失败:', error);
    sendError(res, 6011, error.message || '更新失败', 500);
  }
};
