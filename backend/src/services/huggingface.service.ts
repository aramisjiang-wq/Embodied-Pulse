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
  contentType?: string; // model | dataset | space
  author?: string; // 按作者筛选
  category?: string; // 具身智能资源大全分类 id
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
    if (params.contentType) {
      where.contentType = params.contentType;
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.author) {
      where.author = params.author;
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

    // 处理tags字段（如果是数组，转换为字符串）
    const tagsValue = data.tags 
      ? (Array.isArray(data.tags) ? data.tags.join(',') : data.tags)
      : null;

    const createData: any = {
      fullName: data.fullName,
      description: data.description || null,
      task: data.task || null,
      contentType: (data as any).contentType || 'model',
      category: (data as any).category || null,
      downloads: data.downloads || 0,
      likes: data.likes || 0,
      lastModified: lastModified,
      hf_id: (data as any).hf_id || (data as any).hfId || null,
      name: (data as any).name || data.fullName.split('/').pop() || null,
      author: (data as any).author || data.fullName.split('/')[0] || null,
      license: (data as any).license || null,
      tags: tagsValue,
    };

    logger.info('Creating HuggingFace model with data:', {
      fullName: createData.fullName,
      task: createData.task,
      lastModified: createData.lastModified?.toISOString(),
      author: createData.author,
      name: createData.name,
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

/**
 * 获取各任务类型、内容类型、分类的模型数量统计，以及最新更新时间
 */
export async function getTaskTypeStats(): Promise<
  Record<string, number> & { latestUpdatedAt?: string }
> {
  try {
    const [models, latest] = await Promise.all([
      prisma.huggingFaceModel.findMany({
        select: { task: true, contentType: true, category: true },
      }),
      prisma.huggingFaceModel.findFirst({
        select: { lastModified: true },
        orderBy: { lastModified: 'desc' },
      }),
    ]);

    const stats: Record<string, number> & {
      latestUpdatedAt?: string;
    } = {};

    stats['all'] = models.length;
    stats['model'] = 0;
    stats['dataset'] = 0;
    stats['space'] = 0;

    models.forEach((model) => {
      if (model.contentType === 'model') {
        stats['model'] = (stats['model'] || 0) + 1;
      } else if (model.contentType === 'dataset') {
        stats['dataset'] = (stats['dataset'] || 0) + 1;
      } else if (model.contentType === 'space') {
        stats['space'] = (stats['space'] || 0) + 1;
      }
      
      if (model.task) {
        stats[model.task] = (stats[model.task] || 0) + 1;
      }
      
      if (model.category) {
        stats[model.category] = (stats[model.category] || 0) + 1;
      }
    });

    if (latest?.lastModified) {
      stats.latestUpdatedAt = latest.lastModified.toISOString();
    }

    return stats;
  } catch (error) {
    logger.error('Get task type stats error:', error);
    return { all: 0 };
  }
}
