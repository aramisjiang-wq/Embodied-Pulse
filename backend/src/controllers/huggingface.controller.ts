/**
 * Hugging Face 模型控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getHuggingFaceModels,
  getHuggingFaceById,
} from '../services/huggingface.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess } from '../utils/response';
import { createUserAction } from '../services/user-action.service';

/**
 * 获取模型列表
 */
export async function getHuggingFaceList(req: Request, res: Response, next: NextFunction) {
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
