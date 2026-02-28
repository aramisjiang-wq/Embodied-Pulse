/**
 * HuggingFace 链接验证服务
 * 用于验证模型和数据集链接的有效性
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { getModelInfo, getDatasetInfo } from './huggingface-api.service';

const prisma = userPrisma;

export interface LinkValidationResult {
  isValid: boolean;
  lastChecked: Date;
  error?: string;
}

/**
 * 验证单个HuggingFace链接的有效性
 */
export async function validateHuggingFaceLink(
  fullName: string,
  contentType: string = 'model'
): Promise<LinkValidationResult> {
  try {
    logger.info(`验证HuggingFace链接: ${fullName} (${contentType})`);

    if (contentType === 'dataset') {
      await getDatasetInfo(fullName);
    } else {
      await getModelInfo(fullName);
    }

    logger.info(`链接验证成功: ${fullName}`);
    return {
      isValid: true,
      lastChecked: new Date(),
    };
  } catch (error: any) {
    logger.warn(`链接验证失败: ${fullName}`, {
      message: error.message,
      status: error.response?.status,
    });

    return {
      isValid: false,
      lastChecked: new Date(),
      error: error.message,
    };
  }
}

/**
 * 批量验证链接
 */
export async function validateHuggingFaceLinks(
  limit: number = 50
): Promise<{
  validated: number;
  valid: number;
  invalid: number;
  errors: Array<{ fullName: string; error: string }>;
}> {
  try {
    logger.info(`开始批量验证HuggingFace链接，限制: ${limit}`);

    const models = await prisma.huggingFaceModel.findMany({
      where: {
        OR: [
          { linkValid: null },
          { linkCheckedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      take: limit,
      orderBy: { linkCheckedAt: { sort: 'asc', nulls: 'first' } },
    });

    logger.info(`找到 ${models.length} 个需要验证的链接`);

    let valid = 0;
    let invalid = 0;
    const errors: Array<{ fullName: string; error: string }> = [];

    for (const model of models) {
      const result = await validateHuggingFaceLink(
        model.fullName,
        model.contentType || 'model'
      );

      await prisma.huggingFaceModel.update({
        where: { id: model.id },
        data: {
          linkValid: result.isValid,
          linkCheckedAt: result.lastChecked,
        },
      });

      if (result.isValid) {
        valid++;
      } else {
        invalid++;
        if (result.error) {
          errors.push({ fullName: model.fullName, error: result.error });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`批量验证完成: 验证 ${models.length} 个, 有效 ${valid} 个, 无效 ${invalid} 个`);

    return {
      validated: models.length,
      valid,
      invalid,
      errors,
    };
  } catch (error: any) {
    logger.error('批量验证链接失败:', error);
    throw error;
  }
}

/**
 * 获取无效链接列表
 */
export async function getInvalidLinks(
  skip: number = 0,
  take: number = 100
): Promise<{
  items: Array<{
    id: string;
    fullName: string;
    contentType: string | null;
    linkCheckedAt: Date | null;
  }>;
  total: number;
}> {
  try {
    const [items, total] = await Promise.all([
      prisma.huggingFaceModel.findMany({
        where: { linkValid: false },
        select: {
          id: true,
          fullName: true,
          contentType: true,
          linkCheckedAt: true,
        },
        skip,
        take,
        orderBy: { linkCheckedAt: 'desc' },
      }),
      prisma.huggingFaceModel.count({ where: { linkValid: false } }),
    ]);

    return { items, total };
  } catch (error: any) {
    logger.error('获取无效链接列表失败:', error);
    throw error;
  }
}

/**
 * 删除无效链接
 */
export async function deleteInvalidLinks(
  linkIds: string[]
): Promise<{ deleted: number }> {
  try {
    logger.info(`删除无效链接: ${linkIds.length} 个`);

    const result = await prisma.huggingFaceModel.deleteMany({
      where: { id: { in: linkIds }, linkValid: false },
    });

    logger.info(`成功删除 ${result.count} 个无效链接`);
    return { deleted: result.count };
  } catch (error: any) {
    logger.error('删除无效链接失败:', error);
    throw error;
  }
}
