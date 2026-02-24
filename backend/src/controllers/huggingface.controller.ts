/**
 * Hugging Face 模型控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getHuggingFaceModels,
  getHuggingFaceById,
  createHuggingFaceModel,
  getTaskTypeStats as getTaskTypeStatsService,
} from '../services/huggingface.service';
import { getModelFromUrl, parseHuggingFaceUrl } from '../services/huggingface-api.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { createUserAction } from '../services/user-action.service';
import userPrisma from '../config/database.user';

/**
 * 获取模型列表
 */
export async function getHuggingFaceList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, task, license, keyword, contentType, author, category } = req.query;

    const { models, total } = await getHuggingFaceModels({
      skip,
      take,
      sort: sort as any,
      task: task as string,
      license: license as string,
      keyword: keyword as string,
      contentType: contentType as string,
      author: author as string,
      category: category as string,
    });

    sendSuccess(res, {
      items: models,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 从 URL 获取 HuggingFace 模型信息（供普通用户使用，无需管理员权限）
 * 先返回从 URL 解析的基础信息，同时尝试调用 HF API 丰富数据（8s 超时）
 */
export async function getHuggingFaceInfoFromUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return sendError(res, 1008, '请提供有效的 HuggingFace URL', 400);
    }
    const parsed = parseHuggingFaceUrl(url);
    if (!parsed) {
      return sendError(res, 1009, '无效的 HuggingFace URL 格式，支持格式：https://huggingface.co/author/model-name 或 https://huggingface.co/datasets/author/dataset-name', 400);
    }

    const fullName = `${parsed.author}/${parsed.model}`;
    const contentType = parsed.contentType || 'model';

    // 基础信息（从URL直接解析，无需外部API）
    const basicInfo = {
      id: fullName,
      modelId: fullName,
      fullName,
      name: parsed.model,
      author: parsed.author,
      description: '',
      license: '',
      tags: [] as string[],
      pipeline_tag: '',
      downloads: 0,
      likes: 0,
      lastModified: new Date().toISOString(),
      private: false,
      fromApi: false,
      contentType,
    };

    // 尝试用 8s 超时从 HF API 获取详细信息
    try {
      const apiResult = await Promise.race([
        getModelFromUrl(url),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API_TIMEOUT')), 8000)
        ),
      ]);
      return sendSuccess(res, { ...basicInfo, ...apiResult, fullName, fromApi: true });
    } catch {
      // API 超时或失败，返回基础信息，前端仍可提交
      return sendSuccess(res, basicInfo);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 用户提交 HuggingFace 模型
 */
export async function submitHuggingFaceModel(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 401, '请先登录', 401);
    }

    const { fullName, description, task, downloads, likes, lastModified, hfId, name, author, license, tags, contentType } = req.body;
    if (!fullName) {
      return sendError(res, 1020, '缺少必要字段：fullName', 400);
    }

    // 检查是否已存在
    const existing = await userPrisma.huggingFaceModel.findUnique({ where: { fullName } });
    if (existing) {
      const contentTypeLabel = contentType === 'dataset' ? '数据集' : contentType === 'space' ? '空间' : '模型';
      return sendSuccess(res, { model: existing, alreadyExists: true, message: `该${contentTypeLabel}已收录，感谢您的关注！` });
    }

    const model = await createHuggingFaceModel({
      fullName,
      description: description || null,
      task: task || null,
      downloads: downloads || 0,
      likes: likes || 0,
      lastModified: lastModified ? new Date(lastModified) : null,
      hf_id: hfId || null,
      name: name || fullName.split('/').pop() || fullName,
      author: author || fullName.split('/')[0] || null,
      license: license || null,
      tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags) : null,
      contentType: contentType || 'model',
    } as any);

    // 记录用户提交行为
    createUserAction({
      userId,
      actionType: 'submit',
      contentType: 'huggingface',
      contentId: model.id,
      metadata: { fullName },
    }).catch(() => {});

    const contentTypeLabel = contentType === 'dataset' ? '数据集' : contentType === 'space' ? '空间' : '模型';
    sendSuccess(res, { model, alreadyExists: false, message: `${contentTypeLabel}提交成功！感谢您的贡献 🎉` });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取模型详情
 */
export async function getHuggingFaceDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { modelId } = req.params;
    const model = await getHuggingFaceById(modelId);

    // 记录用户查看行为（如果已登录）
    if (req.user?.id && model) {
      createUserAction({
        userId: req.user.id,
        actionType: 'view',
        contentType: 'huggingface',
        contentId: modelId,
        metadata: {
          fullName: model.fullName,
          name: (model as any).name || model.fullName.split('/').pop() || '',
        },
      }).catch(err => {
        // 行为记录失败不影响主流程
      });
    }

    sendSuccess(res, model);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取任务类型统计
 */
export async function getTaskTypeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getTaskTypeStatsService();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取作者统计信息（models/datasets数量）
 */
export async function getAuthorStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { author } = req.params;
    if (!author) {
      return sendError(res, 1001, '请提供作者名称', 400);
    }

    const [modelCount, datasetCount] = await Promise.all([
      userPrisma.huggingFaceModel.count({
        where: { author },
      }),
      userPrisma.huggingFaceModel.count({
        where: { author },
      }),
    ]);

    sendSuccess(res, {
      author,
      modelCount,
      datasetCount,
      totalCount: modelCount + datasetCount,
    });
  } catch (error) {
    next(error);
  }
}
