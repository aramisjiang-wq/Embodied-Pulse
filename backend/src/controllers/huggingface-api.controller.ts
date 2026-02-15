/**
 * HuggingFace API 控制器
 * 用于管理端获取HuggingFace模型信息
 */

import { Request, Response } from 'express';
import {
  listModels,
  listModelsByAuthor,
  getModelInfo,
  getModelFromUrl,
  parseHuggingFaceUrl,
  testConnection,
} from '../services/huggingface-api.service';
import { createHuggingFaceModel } from '../services/huggingface.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 获取HuggingFace模型列表
 */
export const getHuggingFaceModels = async (req: Request, res: Response) => {
  try {
    const { filter, author, search, limit } = req.query;

    const models = await listModels({
      filter: filter as string,
      author: author as string,
      search: search as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    sendSuccess(res, models);
  } catch (error: any) {
    sendError(res, 1001, error.message || '获取模型列表失败', 500);
  }
};

/**
 * 获取特定作者的模型列表
 */
export const getHuggingFaceModelsByAuthor = async (req: Request, res: Response) => {
  try {
    const { author } = req.params;
    const { limit } = req.query;

    if (!author) {
      return sendError(res, 1002, '请提供作者名称', 400);
    }

    const models = await listModelsByAuthor(author, limit ? parseInt(limit as string) : 100);

    sendSuccess(res, models);
  } catch (error: any) {
    sendError(res, 1003, error.message || '获取模型列表失败', 500);
  }
};

/**
 * 获取单个模型详情
 */
export const getHuggingFaceModelInfo = async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;

    if (!modelId) {
      return sendError(res, 1004, '请提供模型ID', 400);
    }

    const modelInfo = await getModelInfo(modelId);

    sendSuccess(res, modelInfo);
  } catch (error: any) {
    if (error.message === '模型不存在') {
      sendError(res, 1005, '模型不存在', 404);
    } else if (error.message === 'API访问受限，请检查HuggingFace Token配置') {
      sendError(res, 1006, 'API访问受限，请检查HuggingFace Token配置', 403);
    } else {
      sendError(res, 1007, error.message || '获取模型详情失败', 500);
    }
  }
};

/**
 * 从URL获取HuggingFace模型信息
 */
export const getHuggingFaceModelFromUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return sendError(res, 1008, '请提供有效的HuggingFace模型URL', 400);
    }

    const parsed = parseHuggingFaceUrl(url);
    if (!parsed) {
      return sendError(res, 1009, '无效的HuggingFace模型URL格式', 400);
    }

    const modelInfo = await getModelFromUrl(url);

    sendSuccess(res, modelInfo);
  } catch (error: any) {
    if (error.message === '模型不存在') {
      sendError(res, 1010, '模型不存在', 404);
    } else if (error.message === 'API访问受限，请检查HuggingFace Token配置') {
      sendError(res, 1011, 'API访问受限，请检查HuggingFace Token配置', 403);
    } else {
      sendError(res, 1012, error.message || '获取模型信息失败', 500);
    }
  }
};

/**
 * 测试HuggingFace API连接
 */
export const testHuggingFaceConnection = async (req: Request, res: Response) => {
  try {
    const isConnected = await testConnection();

    sendSuccess(res, { connected: isConnected });
  } catch (error: any) {
    sendError(res, 1013, error.message || '测试连接失败', 500);
  }
};

/**
 * 订阅HuggingFace作者（同步作者的所有模型）
 */
export const subscribeHuggingFaceAuthor = async (req: Request, res: Response) => {
  try {
    const { author } = req.params;
    const { limit } = req.query;

    if (!author) {
      return sendError(res, 1014, '请提供作者名称', 400);
    }

    logger.info(`订阅HuggingFace作者: ${author}`);

    const models = await listModelsByAuthor(author, limit ? parseInt(limit as string) : 100);

    let syncedCount = 0;
    let errorCount = 0;

    for (const model of models) {
      try {
        const [authorName, ...nameParts] = model.id.split('/');
        const name = nameParts.join('/');

        await createHuggingFaceModel({
          name: model.id, // name是唯一约束
          fullName: model.id, // fullName是唯一约束
          description: model.description || '',
          task: model.pipeline_tag || 'unknown',
          // tags字段在数据库表中不存在，所以不传递
          downloads: model.downloads || 0,
          likes: model.likes || 0,
          lastModified: new Date(model.lastModified),
        } as any);

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`同步模型失败 (${model.id}):`, error.message);
      }
    }

    logger.info(`HuggingFace作者 ${author} 订阅完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);

    sendSuccess(res, {
      author,
      total: models.length,
      synced: syncedCount,
      errors: errorCount,
    });
  } catch (error: any) {
    logger.error('订阅HuggingFace作者失败:', error.message);
    sendError(res, 1015, error.message || '订阅失败', 500);
  }
};
