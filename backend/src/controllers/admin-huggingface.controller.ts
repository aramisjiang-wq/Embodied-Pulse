/**
 * Hugging Face 模型管理控制器（管理员专用）
 */

import { Request, Response, NextFunction } from 'express';
import {
  getHuggingFaceModels,
  getHuggingFaceById,
  createHuggingFaceModel,
  updateHuggingFaceModel,
  deleteHuggingFaceModel,
  deleteHuggingFaceModels,
} from '../services/huggingface.service';
import { sendSuccess, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { logger } from '../utils/logger';

/**
 * 获取所有HuggingFace模型（管理端）
 */
export async function getAllHuggingFaceModelsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, task, license, keyword } = req.query;

    const { models, total } = await getHuggingFaceModels({
      skip,
      take,
      sort: sort as any,
      task: task as string,
      license: license as string,
      keyword: keyword as string,
    });

    sendSuccess(res, {
      items: models,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error: any) {
    logger.error('[AdminHuggingFaceController] Error getting models:', error);
    sendError(res, 500, '获取HuggingFace模型失败', error.message);
  }
}

/**
 * 根据ID获取模型详情（管理端）
 */
export async function getHuggingFaceModelByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { modelId } = req.params;
    const model = await getHuggingFaceById(modelId);

    if (!model) {
      sendError(res, 404, '模型不存在');
      return;
    }

    sendSuccess(res, model);
  } catch (error: any) {
    logger.error('[AdminHuggingFaceController] Error getting model by id:', error);
    sendError(res, 500, '获取模型失败', error.message);
  }
}

/**
 * 创建HuggingFace模型（管理端）
 */
export async function createHuggingFaceModelHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, description, task, license, downloads, likes, lastModified } = req.body;

    const model = await createHuggingFaceModel({
      name: fullName,
      description,
      task,
      license,
      downloads,
      likes,
      lastModified: lastModified,
    } as any);

    sendSuccess(res, model, '创建成功');
  } catch (error: any) {
    logger.error('[AdminHuggingFaceController] Error creating model:', error);
    sendError(res, 500, '创建模型失败', error.message);
  }
}

/**
 * 更新HuggingFace模型（管理端）
 */
export async function updateHuggingFaceModelHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { modelId } = req.params;
    const { fullName, description, task, license, downloads, likes, lastModified } = req.body;

    const model = await updateHuggingFaceModel(modelId, {
      fullName,
      description,
      task,
      license,
      downloads,
      likes,
      lastModified,
    });

    sendSuccess(res, model, '更新成功');
  } catch (error: any) {
    logger.error('[AdminHuggingFaceController] Error updating model:', error);
    sendError(res, 500, '更新模型失败', error.message);
  }
}

/**
 * 删除HuggingFace模型（管理端）
 */
export async function deleteHuggingFaceModelHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { modelId } = req.params;

    await deleteHuggingFaceModel(modelId);

    sendSuccess(res, null, '删除成功');
  } catch (error: any) {
    logger.error('[AdminHuggingFaceController] Error deleting model:', error);
    sendError(res, 500, '删除模型失败', error.message);
  }
}

/**
 * 批量删除HuggingFace模型（管理端）
 */
export async function deleteHuggingFaceModelsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      sendError(res, 400, '请提供要删除的模型ID列表');
      return;
    }

    await deleteHuggingFaceModels(ids);

    sendSuccess(res, { deletedCount: ids.length }, `成功删除 ${ids.length} 个模型`);
  } catch (error: any) {
    logger.error('[AdminHuggingFaceController] Error deleting models:', error);
    sendError(res, 500, '批量删除模型失败', error.message);
  }
}