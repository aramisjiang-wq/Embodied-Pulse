/**
 * HuggingFace作者订阅服务
 * 用于管理端订阅HuggingFace作者，自动同步作者的新模型
 */

import adminPrisma from '../config/database.admin';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { listModelsByAuthor } from './huggingface-api.service';
import { createHuggingFaceModel } from './huggingface.service';

export interface HuggingFaceAuthorSubscription {
  id: string;
  author: string;
  authorUrl: string;
  isActive: boolean;
  modelCount: number;
  tags?: string[];
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 获取所有作者订阅
 */
export async function getAllAuthorSubscriptions(): Promise<HuggingFaceAuthorSubscription[]> {
  try {
    const subscriptions = await adminPrisma.$queryRawUnsafe<Array<{
      id: string;
      author: string;
      author_url: string;
      is_active: number;
      model_count: number;
      tags: string | null;
      last_sync_at: string | null;
      created_at: string;
      updated_at: string;
    }>>(`
      SELECT * FROM huggingface_author_subscriptions 
      ORDER BY created_at DESC
    `);

    return subscriptions.map((sub: any) =>({
      id: sub.id,
      author: sub.author,
      authorUrl: sub.author_url,
      isActive: Boolean(sub.is_active),
      modelCount: sub.model_count || 0,
      tags: sub.tags ? JSON.parse(sub.tags) : [],
      lastSyncAt: sub.last_sync_at ? new Date(sub.last_sync_at) : null,
      createdAt: new Date(sub.created_at),
      updatedAt: new Date(sub.updated_at),
    }));
  } catch (error: any) {
    logger.error('获取作者订阅列表失败:', error);
    return [];
  }
}

/**
 * 添加作者订阅
 */
export async function addAuthorSubscription(author: string, authorUrl?: string): Promise<HuggingFaceAuthorSubscription> {
  try {
    // 检查是否已存在
    const existing = await adminPrisma.$queryRawUnsafe<Array<{
      id: string;
    }>>(
      `SELECT id FROM huggingface_author_subscriptions WHERE author = ?`,
      author
    );

    if (existing && existing.length > 0) {
      throw new Error('AUTHOR_ALREADY_SUBSCRIBED');
    }

    // 如果没有提供URL，构建默认URL
    const url = authorUrl || `https://huggingface.co/${author}`;

    // 插入新订阅
    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();
    
    await adminPrisma.$executeRawUnsafe(
      `INSERT INTO huggingface_author_subscriptions 
       (id, author, author_url, is_active, model_count, last_sync_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      author,
      url,
      1, // is_active = true
      0, // model_count = 0
      null, // last_sync_at = null
      now,
      now
    );

    logger.info(`添加HuggingFace作者订阅: ${author}`);

    return {
      id,
      author,
      authorUrl: url,
      isActive: true,
      modelCount: 0,
      lastSyncAt: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  } catch (error: any) {
    if (error.message === 'AUTHOR_ALREADY_SUBSCRIBED') {
      throw error;
    }
    logger.error('添加作者订阅失败:', error);
    throw new Error('ADD_SUBSCRIPTION_FAILED');
  }
}

/**
 * 删除作者订阅
 */
export async function removeAuthorSubscription(id: string): Promise<void> {
  try {
    await adminPrisma.$executeRawUnsafe(
      `DELETE FROM huggingface_author_subscriptions WHERE id = ?`,
      id
    );
    logger.info(`删除HuggingFace作者订阅: ${id}`);
  } catch (error: any) {
    logger.error('删除作者订阅失败:', error);
    throw new Error('REMOVE_SUBSCRIPTION_FAILED');
  }
}

/**
 * 同步作者的所有模型
 */
export async function syncAuthorModels(author: string, limit: number = 100): Promise<{
  synced: number;
  errors: number;
  total: number;
}> {
  try {
    logger.info(`开始同步作者 ${author} 的模型，限制: ${limit}`);

    let models: any[] = [];
    try {
      models = await listModelsByAuthor(author, limit);
      logger.info(`从API获取到 ${models.length} 个模型`);
      
      // 记录前几个模型的ID用于调试
      if (models.length > 0) {
        logger.debug(`前3个模型ID: ${models.slice(0, 3).map(m => m.id || 'N/A').join(', ')}`);
      }
    } catch (apiError: any) {
      logger.error(`获取作者 ${author} 的模型列表失败:`, {
        message: apiError.message,
        code: apiError.code,
        response: apiError.response?.data,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        url: apiError.config?.url,
      });
      throw new Error(`获取模型列表失败: ${apiError.message || apiError.code || '未知错误'}`);
    }

    if (!Array.isArray(models)) {
      logger.error(`API返回的数据格式不正确，期望数组，实际: ${typeof models}`);
      throw new Error('API返回的数据格式不正确');
    }

    if (models.length === 0) {
      logger.warn(`作者 ${author} 没有找到任何模型`);
      // 即使没有模型，也更新同步时间
      await adminPrisma.$executeRawUnsafe(
        `UPDATE huggingface_author_subscriptions 
         SET last_sync_at = ?, updated_at = ?
         WHERE author = ?`,
        new Date().toISOString(),
        new Date().toISOString(),
        author
      );
      return {
        synced: 0,
        errors: 0,
        total: 0,
      };
    }

    let syncedCount = 0;
    let errorCount = 0;

    // 检查已存在的模型（通过fullName，因为userPrisma的模型使用fullName作为唯一约束）
    // 注意：userPrisma的HuggingFaceModel没有author字段，所以我们需要通过fullName的前缀来匹配
    // 或者直接查询所有模型，然后过滤
    const allModels = await userPrisma.huggingFaceModel.findMany({
      select: {
        fullName: true,
      },
    });
    const existingFullNames = new Set(allModels.map(m => m.fullName));
    
    // 过滤出属于该作者的模型（fullName以"author/"开头）
    const authorPrefix = `${author}/`;
    const authorModels = allModels.filter(m => m.fullName.startsWith(authorPrefix));
    logger.info(`作者 ${author} 已存在的模型数: ${authorModels.length}`);

    logger.info(`开始处理 ${models.length} 个模型，已存在 ${existingFullNames.size} 个`);

    for (const model of models) {
      try {
        // 验证模型数据
        if (!model || !model.id) {
          logger.warn(`跳过无效的模型数据:`, model);
          continue;
        }

        // 只同步公开模型
        if (model.private) {
          logger.debug(`跳过私有模型: ${model.id}`);
          continue;
        }

        const [authorName, ...nameParts] = model.id.split('/');
        const name = nameParts.join('/');

        if (!authorName) {
          logger.warn(`模型ID格式不正确: ${model.id}`);
          continue;
        }

        // 检查模型是否已存在（使用fullName，因为这是唯一约束）
        const isNew = !existingFullNames.has(model.id);

        if (isNew) {
          // 新模型，创建
          logger.debug(`创建新模型: ${model.id}`);
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
          logger.debug(`成功创建模型: ${model.id}`);
        } else {
          // 已存在，更新信息（可选，如果需要保持数据最新）
          try {
            const existing = await userPrisma.huggingFaceModel.findUnique({
              where: { fullName: model.id },
            });
            if (existing) {
              await userPrisma.huggingFaceModel.update({
                where: { fullName: model.id },
                data: {
                  downloads: model.downloads || existing.downloads,
                  likes: model.likes || existing.likes,
                  lastModified: new Date(model.lastModified),
                  // tags字段在数据库表中不存在，所以不更新
                },
              });
              logger.debug(`更新已存在模型: ${model.id}`);
            }
          } catch (updateError: any) {
            logger.warn(`更新模型信息失败 (${model.id}):`, updateError.message);
          }
        }
      } catch (error: any) {
        // 如果是唯一约束冲突（模型已存在），不算错误
        if (error.code === 'P2002' || error.message?.includes('unique')) {
          // 模型已存在，跳过
          continue;
        }
        errorCount++;
        logger.error(`同步模型失败 (${model.id}):`, error.message);
      }
    }

    // 更新订阅记录 - 使用该作者在数据库中的实际模型总数
    const totalModelsInDb = await userPrisma.huggingFaceModel.count({
      where: {
        fullName: {
          startsWith: authorPrefix,
        },
      },
    });

    await adminPrisma.$executeRawUnsafe(
      `UPDATE huggingface_author_subscriptions 
       SET model_count = ?, last_sync_at = ?, updated_at = ?
       WHERE author = ?`,
      totalModelsInDb,
      new Date().toISOString(),
      new Date().toISOString(),
      author
    );

    logger.info(`作者 ${author} 同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个, 总计 ${totalModelsInDb} 个`);

    return {
      synced: syncedCount,
      errors: errorCount,
      total: models.length,
    };
  } catch (error: any) {
    logger.error(`同步作者 ${author} 的模型失败:`, error.message);
    throw error;
  }
}

/**
 * 切换订阅状态
 */
export async function toggleSubscriptionStatus(id: string, isActive: boolean): Promise<void> {
  try {
    await adminPrisma.$executeRawUnsafe(
      `UPDATE huggingface_author_subscriptions 
       SET is_active = ?, updated_at = ?
       WHERE id = ?`,
      isActive ? 1 : 0,
      new Date().toISOString(),
      id
    );
    logger.info(`切换订阅状态: ${id}, isActive: ${isActive}`);
  } catch (error: any) {
    logger.error('切换订阅状态失败:', error);
    throw new Error('TOGGLE_SUBSCRIPTION_FAILED');
  }
}

export async function updateSubscriptionTags(id: string, tags: string[]): Promise<void> {
  try {
    await adminPrisma.$executeRawUnsafe(
      `UPDATE huggingface_author_subscriptions 
       SET tags = ?, updated_at = ?
       WHERE id = ?`,
      JSON.stringify(tags),
      new Date().toISOString(),
      id
    );
    logger.info(`更新订阅标签: ${id}, tags: ${tags.join(', ')}`);
  } catch (error: any) {
    logger.error('更新订阅标签失败:', error);
    throw new Error('UPDATE_TAGS_FAILED');
  }
}
