/**
 * 新闻搜索关键词管理服务
 */

import { logger } from '../utils/logger';
import adminPrisma, { ensureAdminDatabaseConnected } from '../config/database.admin';
import userPrisma, { ensureUserDatabaseConnected } from '../config/database.user';

const prisma = adminPrisma;
const userPrismaClient = userPrisma;

async function ensurePrismaModel() {
  await ensureAdminDatabaseConnected();
  
  if (!prisma) {
    throw new Error('Prisma Client 未初始化');
  }
  if (!prisma.news_search_keywords) {
    logger.error('Prisma Client 模型检查:', {
      hasPrisma: !!prisma,
      models: prisma ? Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')) : [],
      hasNewsSearchKeyword: !!(prisma && prisma.news_search_keywords),
    });
    throw new Error('news_search_keywords 模型不存在，请检查 Prisma Client 是否正确生成');
  }
  return prisma.news_search_keywords;
}

export interface CreateKeywordData {
  keyword: string;
  category?: string;
  sourceType?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
  tags?: string;
}

export interface UpdateKeywordData {
  keyword?: string;
  category?: string;
  sourceType?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
  tags?: string;
}

export interface GetKeywordsParams {
  isActive?: boolean;
  category?: string;
  sourceType?: string;
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

    if (params.sourceType) {
      where.source_type = params.sourceType;
    }

    if (params.keyword) {
      where.keyword = {
        contains: params.keyword,
      };
    }
    
    const [keywords, total] = await Promise.all([
      model.findMany({
        where,
        orderBy: [
          { priority: 'desc' as const },
          { created_at: 'desc' as const },
        ],
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      model.count({ where }),
    ]);
    
    const keywordsWithNewsCount = await Promise.all(
      keywords.map(async (keyword) => {
        const searchTerm = keyword.keyword.toLowerCase();
        const newsCount = await userPrismaClient.news.count({
          where: {
            OR: [
              { title: { contains: searchTerm } },
              { description: { contains: searchTerm } },
            ],
          },
        });
        
        return {
          ...keyword,
          newsCount,
        };
      })
    );
    
    return {
      keywords: keywordsWithNewsCount,
      total,
    };
  } catch (error: any) {
    logger.error('获取新闻搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取关键词
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
    logger.error('获取新闻搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 创建关键词
 */
export async function createKeyword(data: CreateKeywordData) {
  try {
    const model = await ensurePrismaModel();
    
    const keyword = await model.create({
      data: {
        keyword: data.keyword,
        category: data.category,
        source_type: data.sourceType || 'admin',
        is_active: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority || 0,
        description: data.description,
        tags: data.tags,
      } as any,
    });
    
    logger.info(`创建新闻搜索关键词: ${data.keyword}`);
    return keyword;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('KEYWORD_ALREADY_EXISTS');
    }
    logger.error('创建新闻搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 更新关键词
 */
export async function updateKeyword(id: string, data: UpdateKeywordData) {
  try {
    const model = await ensurePrismaModel();
    
    const keyword = await model.update({
      where: { id },
      data: {
        ...(data.keyword !== undefined && { keyword: data.keyword }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.sourceType !== undefined && { source_type: data.sourceType }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });
    
    logger.info(`更新新闻搜索关键词: ${id}`);
    return keyword;
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error('KEYWORD_NOT_FOUND');
    }
    if (error.code === 'P2002') {
      throw new Error('KEYWORD_ALREADY_EXISTS');
    }
    logger.error('更新新闻搜索关键词失败:', error);
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
    
    logger.info(`删除新闻搜索关键词: ${id}`);
    return true;
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error('KEYWORD_NOT_FOUND');
    }
    logger.error('删除新闻搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 批量删除关键词
 */
export async function deleteKeywords(ids: string[]) {
  try {
    const model = await ensurePrismaModel();
    
    await model.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    
    logger.info(`批量删除新闻搜索关键词: ${ids.length} 个`);
    return true;
  } catch (error: any) {
    logger.error('批量删除新闻搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 获取关键词相关的新闻
 */
export async function getKeywordNews(keywordId: string, params: { skip: number; take: number }) {
  try {
    await ensureUserDatabaseConnected();
    
    const model = await ensurePrismaModel();
    const keyword = await model.findUnique({
      where: { id: keywordId },
      select: { keyword: true },
    });
    
    if (!keyword) {
      throw new Error('KEYWORD_NOT_FOUND');
    }
    
    const searchTerm = keyword.keyword.toLowerCase();
    
    const news = await userPrismaClient.news.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      orderBy: { published_date: 'desc' as const },
      skip: params.skip,
      take: params.take,
    });
    
    const total = await userPrismaClient.news.count({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
    });
    
    return {
      news,
      total,
    };
  } catch (error: any) {
    logger.error('获取关键词相关新闻失败:', error);
    throw error;
  }
}

/**
 * 获取关键词相关的新闻数量
 */
export async function getKeywordNewsCount(keywordId: string): Promise<number> {
  try {
    await ensureUserDatabaseConnected();
    
    const model = await ensurePrismaModel();
    const keyword = await model.findUnique({
      where: { id: keywordId },
      select: { keyword: true },
    });
    
    if (!keyword) {
      throw new Error('KEYWORD_NOT_FOUND');
    }
    
    const searchTerm = keyword.keyword.toLowerCase();
    
    const count = await userPrismaClient.news.count({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
    });
    
    return count;
  } catch (error: any) {
    logger.error('获取关键词相关新闻数量失败:', error);
    throw error;
  }
}

/**
 * 批量创建关键词
 */
export async function createKeywords(data: CreateKeywordData[]) {
  try {
    const model = await ensurePrismaModel();
    
    const keywords = await Promise.all(
      data.map(item => model.create({
        data: {
          keyword: item.keyword,
          category: item.category,
          source_type: item.sourceType || 'admin',
          is_active: item.isActive !== undefined ? item.isActive : true,
          priority: item.priority || 0,
          description: item.description,
          tags: item.tags,
        } as any,
      }))
    );
    
    logger.info(`批量创建新闻搜索关键词: ${keywords.length} 个`);
    return keywords;
  } catch (error: any) {
    logger.error('批量创建新闻搜索关键词失败:', error);
    throw error;
  }
}
