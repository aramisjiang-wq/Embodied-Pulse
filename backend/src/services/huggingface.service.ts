/**
 * Hugging Face 模型服务
 */

import { HuggingFaceModel } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface GetHuggingFaceParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'downloads' | 'likes';
  task?: string;
  license?: string;
  keyword?: string;
}

export async function getHuggingFaceModels(
  params: GetHuggingFaceParams
): Promise<{ models: HuggingFaceModel[]; total: number }> {
  try {
    const where: any = {};

    if (params.task) {
      where.task = params.task;
    }
    if (params.license) {
      where.license = params.license;
    }
    // 关键词搜索（SQLite不支持mode: 'insensitive'，使用contains即可）
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { fullName: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    let orderBy: any = {};
    switch (params.sort) {
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      case 'likes':
        orderBy = { likes: 'desc' };
        break;
      case 'hot':
        orderBy = { viewCount: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { lastModified: 'desc' };
        break;
    }

    const [models, total] = await Promise.all([
      prisma.huggingFaceModel.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
      }),
      prisma.huggingFaceModel.count({ where }),
    ]);

    return { models, total };
  } catch (error) {
    logger.error('Get HuggingFace models error:', error);
    throw new Error('HUGGINGFACE_FETCH_FAILED');
  }
}

export async function getHuggingFaceById(modelId: string): Promise<HuggingFaceModel | null> {
  try {
    const model = await prisma.huggingFaceModel.findUnique({ where: { id: modelId } });
    if (model) {
      await prisma.huggingFaceModel.update({
        where: { id: modelId },
        data: { viewCount: { increment: 1 } },
      });
    }
    return model;
  } catch (error) {
    logger.error('Get HuggingFace model by ID error:', error);
    throw new Error('HUGGINGFACE_FETCH_FAILED');
  }
}

export async function createHuggingFaceModel(
  data: Omit<HuggingFaceModel, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount' | 'shareCount'>
): Promise<HuggingFaceModel> {
  try {
    // 处理日期字段
    const lastModified = data.lastModified ? new Date(data.lastModified) : null;

    // 注意：userPrisma的HuggingFaceModel只有以下字段：
    // - fullName (唯一约束)
    // - description, task, downloads, likes, lastModified
    // 没有tags、hfId、name、author字段（数据库表结构中没有tags字段）
    const createData: any = {
      fullName: data.fullName,
      description: data.description || null,
      task: data.task || null,
      // tags字段在数据库表中不存在，所以不包含
      downloads: data.downloads || 0,
      likes: data.likes || 0,
      lastModified: lastModified,
    };

    logger.info('Creating HuggingFace model with data:', {
      fullName: createData.fullName,
      task: createData.task,
      lastModified: createData.lastModified?.toISOString(),
    });

    return await prisma.huggingFaceModel.create({ data: createData });
  } catch (error: any) {
    logger.error('Create HuggingFace model error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      data: {
        fullName: data.fullName,
        task: data.task,
      },
    });
    throw new Error('HUGGINGFACE_CREATION_FAILED');
  }
}

export async function updateHuggingFaceModel(
  modelId: string,
  data: Partial<HuggingFaceModel>
): Promise<HuggingFaceModel> {
  try {
    return await prisma.huggingFaceModel.update({ where: { id: modelId }, data });
  } catch (error) {
    logger.error('Update HuggingFace model error:', error);
    throw new Error('HUGGINGFACE_UPDATE_FAILED');
  }
}

export async function deleteHuggingFaceModel(modelId: string): Promise<void> {
  try {
    await prisma.huggingFaceModel.delete({ where: { id: modelId } });
  } catch (error) {
    logger.error('Delete HuggingFace model error:', error);
    throw new Error('HUGGINGFACE_DELETE_FAILED');
  }
}

export async function deleteHuggingFaceModels(modelIds: string[]): Promise<void> {
  try {
    await prisma.huggingFaceModel.deleteMany({
      where: { id: { in: modelIds } },
    });
  } catch (error) {
    logger.error('Delete HuggingFace models error:', error);
    throw new Error('HUGGINGFACE_DELETE_FAILED');
  }
}
