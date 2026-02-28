/**
 * Bilibili搜索关键词管理服务
 */

import { logger } from '../utils/logger';
import adminPrisma, { ensureAdminDatabaseConnected } from '../config/database.admin';
import userPrisma from '../config/database.user';

const prisma = adminPrisma as any;

// 检查 Prisma Client 和模型是否可用
async function ensurePrismaModel() {
  // 确保数据库连接已建立
  await ensureAdminDatabaseConnected();
  
  if (!prisma) {
    throw new Error('Prisma Client 未初始化');
  }
  if (!prisma.bilibili_search_keywords) {
    logger.error('Prisma Client 模型检查:', {
      hasPrisma: !!prisma,
      models: prisma ? Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')) : [],
      hasBilibiliSearchKeyword: !!(prisma && prisma.bilibili_search_keywords),
    });
    throw new Error('bilibili_search_keywords 模型不存在，请检查 Prisma Client 是否正确生成');
  }
  return prisma.bilibili_search_keywords;
}

export interface CreateKeywordData {
  keyword: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
}

export interface UpdateKeywordData {
  keyword?: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
}

export interface GetKeywordsParams {
  isActive?: boolean;
  category?: string;
  keyword?: string;
  skip?: number;
  take?: number;
}

/**
 * 获取所有关键词
 */
export async function getAllKeywords(params: GetKeywordsParams) {
  try {
    const model = await ensurePrismaModel();
    
    const where: any = {};
    
    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }
    
    if (params.category) {
      where.category = params.category;
    }

    if (params.keyword) {
      where.OR = [
        { keyword: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    const [keywords, total] = await Promise.all([
      model.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' },
        ],
      }),
      model.count({ where }),
    ]);

    // 视频数据存储在用户库（userPrisma），按关键词同步时由 video.service 写入
    const keywordsWithVideoCount = await Promise.all(
      keywords.map(async (keyword: any) => {
        try {
          const videoCount = await userPrisma.video.count({
            where: {
              platform: 'bilibili',
              OR: [
                { title: { contains: keyword.keyword } },
                { description: { contains: keyword.keyword } },
              ],
            },
          });
          return {
            ...keyword,
            videoCount,
          };
        } catch (error) {
          logger.warn(`统计关键词 ${keyword.keyword} 的视频数量失败:`, error);
          return {
            ...keyword,
            videoCount: 0,
          };
        }
      })
    );

    return { keywords: keywordsWithVideoCount, total };
  } catch (error: any) {
    logger.error('获取关键词列表失败:', error);
    if (error.message?.includes('模型不存在') || error.message?.includes('未初始化')) {
      logger.error('Prisma Client 初始化问题，请检查数据库连接和 Prisma Client 生成');
    }
    throw error;
  }
}

/**
 * 获取单个关键词
 */
export async function getKeywordById(id: string) {
  try {
    const model = await ensurePrismaModel();
    
    const keyword = await model.findUnique({
      where: { id },
    });

    if (!keyword) {
      throw new Error('KEYWORD_NOT_FOUND');
    }

    return keyword;
  } catch (error: any) {
    logger.error('获取关键词失败:', error);
    throw error;
  }
}

/**
 * 创建关键词
 */
export async function createKeyword(data: CreateKeywordData) {
  try {
    const model = await ensurePrismaModel();
    
    // 检查关键词是否已存在
    const existing = await model.findUnique({
      where: { keyword: data.keyword },
    });

    if (existing) {
      throw new Error('KEYWORD_ALREADY_EXISTS');
    }

    const keyword = await model.create({
      data: {
        keyword: data.keyword,
        category: data.category || null,
        is_active: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority || 0,
        description: data.description || null,
      },
    });

    logger.info(`创建关键词成功: ${data.keyword}`);
    return keyword;
  } catch (error: any) {
    logger.error('创建关键词失败:', error);
    throw error;
  }
}

/**
 * 更新关键词
 */
export async function updateKeyword(id: string, data: UpdateKeywordData) {
  try {
    const model = await ensurePrismaModel();
    
    // 如果更新关键词名称，检查是否与其他关键词冲突
    if (data.keyword) {
      const existing = await model.findFirst({
        where: {
          keyword: data.keyword,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('KEYWORD_ALREADY_EXISTS');
      }
    }

    const keyword = await model.update({
      where: { id },
      data: {
        ...(data.keyword && { keyword: data.keyword }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    logger.info(`更新关键词成功: ${id}`);
    return keyword;
  } catch (error: any) {
    logger.error('更新关键词失败:', error);
    throw error;
  }
}

/**
 * 删除关键词
 */
export async function deleteKeyword(id: string) {
  try {
    const model = await ensurePrismaModel();
    
    await model.delete({
      where: { id },
    });

    logger.info(`删除关键词成功: ${id}`);
  } catch (error: any) {
    logger.error('删除关键词失败:', error);
    throw error;
  }
}

/**
 * 获取所有启用的关键词（用于视频搜索）
 * 返回格式：keyword1 OR keyword2 OR keyword3
 */
export async function getActiveKeywordsString(): Promise<string> {
  try {
    const model = await ensurePrismaModel();
    
    const keywords = await model.findMany({
      where: { is_active: true },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });

    if (keywords.length === 0) {
      // 如果没有关键词，返回默认关键词
      return '具身智能 OR 机器人 OR 人工智能 OR AI';
    }

    // 使用 OR 连接所有关键词
    return keywords.map((k: any) => k.keyword).join(' OR ');
  } catch (error: any) {
    logger.error('获取启用关键词失败:', error);
    // 出错时返回默认关键词
    return '具身智能 OR 机器人 OR 人工智能 OR AI';
  }
}

/**
 * 获取所有启用的关键词（用于视频搜索）
 * 返回格式：keyword数组
 */
export async function getActiveKeywordsArray(): Promise<string[]> {
  try {
    const model = await ensurePrismaModel();
    
    const keywords = await model.findMany({
      where: { is_active: true },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });

    if (keywords.length === 0) {
      // 如果没有关键词，返回默认关键词
      return ['具身智能', '机器人', '人工智能', 'AI'];
    }

    // 返回关键词数组
    return keywords.map((k: any) => k.keyword);
  } catch (error: any) {
    logger.error('获取启用关键词失败:', error);
    // 出错时返回默认关键词
    return ['具身智能', '机器人', '人工智能', 'AI'];
  }
}

/**
 * 批量创建关键词（用于初始化）
 */
export async function batchCreateKeywords(keywords: CreateKeywordData[]) {
  try {
    const model = await ensurePrismaModel();
    
    const results = [];
    const errors = [];

    for (const keywordData of keywords) {
      try {
        // 检查是否已存在
        const existing = await model.findUnique({
          where: { keyword: keywordData.keyword },
        });

        if (existing) {
          logger.info(`关键词已存在，跳过: ${keywordData.keyword}`);
          continue;
        }

        const keyword = await model.create({
          data: {
            keyword: keywordData.keyword,
            category: keywordData.category || null,
            is_active: keywordData.isActive !== undefined ? keywordData.isActive : true,
            priority: keywordData.priority || 0,
            description: keywordData.description || null,
          },
        });

        results.push(keyword);
      } catch (error: any) {
        errors.push({ keyword: keywordData.keyword, error: error.message });
        logger.error(`创建关键词失败: ${keywordData.keyword}`, error);
      }
    }

    logger.info(`批量创建关键词完成: 成功 ${results.length} 个, 失败 ${errors.length} 个`);
    return { success: results, errors };
  } catch (error: any) {
    logger.error('批量创建关键词失败:', error);
    throw error;
  }
}

/**
 * 获取关键词统计数据
 */
export async function getKeywordStats() {
  try {
    const model = await ensurePrismaModel();
    
    const [total, active, inactive] = await Promise.all([
      model.count(),
      model.count({ where: { is_active: true } }),
      model.count({ where: { is_active: false } }),
    ]);

    let totalVideos = 0;
    try {
      totalVideos = await userPrisma.video.count({
        where: { platform: 'bilibili' },
      });
    } catch (error) {
      logger.warn('统计视频数量失败:', error);
    }

    return {
      total,
      active,
      inactive,
      totalVideos,
    };
  } catch (error: any) {
    logger.error('获取关键词统计数据失败:', error);
    throw error;
  }
}

export interface GetKeywordVideosParams {
  keywordId: string;
  skip?: number;
  take?: number;
}

export async function getVideosByKeyword(params: GetKeywordVideosParams) {
  try {
    const { keywordId, skip = 0, take = 20 } = params;

    const keyword = await adminPrisma.bilibili_search_keywords.findUnique({
      where: { id: keywordId },
    });

    if (!keyword) {
      throw new Error('关键词不存在');
    }

    const keywordStr = keyword.keyword;

    const where: any = {
      platform: 'bilibili',
      OR: [
        { title: { contains: keywordStr } },
        { description: { contains: keywordStr } },
      ],
    };

    const [videos, total] = await Promise.all([
      userPrisma.video.findMany({
        where,
        orderBy: { publishedDate: 'desc' },
        skip,
        take,
      }),
      userPrisma.video.count({ where }),
    ]);

    return { videos, total };
  } catch (error: any) {
    logger.error('获取关键词相关视频失败:', error);
    throw error;
  }
}
