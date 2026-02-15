/**
 * 论文搜索关键词管理服务
 */

import { logger } from '../utils/logger';
import adminPrisma, { ensureAdminDatabaseConnected } from '../config/database.admin';
import userPrisma, { ensureUserDatabaseConnected } from '../config/database.user';

const prisma = adminPrisma;
const userPrismaClient = userPrisma;

// 检查 Prisma Client 和模型是否可用
async function ensurePrismaModel() {
  // 确保数据库连接已建立
  await ensureAdminDatabaseConnected();
  
  if (!prisma) {
    throw new Error('Prisma Client 未初始化');
  }
  if (!prisma.paper_search_keywords) {
    logger.error('Prisma Client 模型检查:', {
      hasPrisma: !!prisma,
      models: prisma ? Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')) : [],
      hasPaperSearchKeyword: !!(prisma && prisma.paper_search_keywords),
    });
    throw new Error('paper_search_keywords 模型不存在，请检查 Prisma Client 是否正确生成');
  }
  return prisma.paper_search_keywords;
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

    return { keywords, total };
  } catch (error: any) {
    logger.error('获取论文搜索关键词失败:', error);
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
    if (error.message === 'KEYWORD_NOT_FOUND') {
      throw error;
    }
    logger.error('获取论文搜索关键词失败:', error);
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
        category: data.category,
        source_type: data.sourceType || 'admin',
        is_active: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority || 0,
        description: data.description,
        tags: data.tags,
      } as any,
    });
    
    logger.info('创建论文搜索关键词成功:', { keyword: data.keyword, id: keyword.id });
    return keyword;
  } catch (error: any) {
    if (error.message === 'KEYWORD_ALREADY_EXISTS') {
      throw error;
    }
    logger.error('创建论文搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 更新关键词
 */
export async function updateKeyword(id: string, data: UpdateKeywordData) {
  try {
    const model = await ensurePrismaModel();
    
    // 检查关键词是否存在
    const existing = await model.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new Error('KEYWORD_NOT_FOUND');
    }
    
    // 如果更新了keyword，检查新keyword是否已存在
    if (data.keyword && data.keyword !== existing.keyword) {
      const duplicate = await model.findUnique({
        where: { keyword: data.keyword },
      });
      
      if (duplicate) {
        throw new Error('KEYWORD_ALREADY_EXISTS');
      }
    }
    
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
    
    logger.info('更新论文搜索关键词成功:', { id, keyword: keyword.keyword });
    return keyword;
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND' || error.message === 'KEYWORD_ALREADY_EXISTS') {
      throw error;
    }
    logger.error('更新论文搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 删除关键词
 */
export async function deleteKeyword(id: string) {
  try {
    const model = await ensurePrismaModel();
    
    // 检查关键词是否存在
    const existing = await model.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new Error('KEYWORD_NOT_FOUND');
    }
    
    await model.delete({
      where: { id },
    });
    
    logger.info('删除论文搜索关键词成功:', { id, keyword: existing.keyword });
  } catch (error: any) {
    if (error.message === 'KEYWORD_NOT_FOUND') {
      throw error;
    }
    logger.error('删除论文搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 批量创建关键词
 */
export async function batchCreateKeywords(keywords: CreateKeywordData[]) {
  try {
    const model = await ensurePrismaModel();
    
    const results = [];
    const errors = [];
    
    for (const data of keywords) {
      try {
        const keyword = await createKeyword(data);
        results.push(keyword);
      } catch (error: any) {
        if (error.message === 'KEYWORD_ALREADY_EXISTS') {
          errors.push({ keyword: data.keyword, error: '关键词已存在' });
        } else {
          errors.push({ keyword: data.keyword, error: error.message });
        }
      }
    }
    
    logger.info('批量创建论文搜索关键词完成:', { 
      success: results.length, 
      failed: errors.length 
    });
    
    return { results, errors };
  } catch (error: any) {
    logger.error('批量创建论文搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 获取所有启用的关键词（用于同步）
 */
export async function getActiveKeywordsString(): Promise<string[]> {
  try {
    const model = await ensurePrismaModel();
    
    const keywords = await model.findMany({
      where: { is_active: true },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
      select: { keyword: true },
    });
    
    return keywords.map((k: any) => k.keyword);
  } catch (error: any) {
    logger.error('获取启用的论文搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 获取所有启用的管理员关键词（用于同步）
 */
export async function getActiveAdminKeywordsString(): Promise<string[]> {
  try {
    const model = await ensurePrismaModel();
    
    const keywords = await model.findMany({
      where: { 
        is_active: true,
        source_type: 'admin',
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
      select: { keyword: true },
    });
    
    return keywords.map((k: any) => k.keyword);
  } catch (error: any) {
    logger.error('获取启用的管理员论文搜索关键词失败:', error);
    throw error;
  }
}

/**
 * 获取所有启用的用户订阅关键词（用于同步）
 */
export async function getActiveUserKeywordsString(): Promise<string[]> {
  try {
    const model = await ensurePrismaModel();
    
    const keywords = await model.findMany({
      where: { 
        is_active: true,
        source_type: 'user',
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
      select: { keyword: true },
    });
    
    return keywords.map((k: any) => k.keyword);
  } catch (error: any) {
    logger.error('获取启用的用户订阅论文搜索关键词失败:', error);
    throw error;
  }
}

export async function getKeywordPapers(keywordId: string, params: { skip: number; take: number }) {
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
    
    const papers = await userPrismaClient.paper.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { abstract: { contains: searchTerm } },
        ],
      },
      orderBy: { publishedDate: 'desc' as const },
      skip: params.skip,
      take: params.take,
    });
    
    const total = await userPrismaClient.paper.count({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { abstract: { contains: searchTerm } },
        ],
      },
    });
    
    return {
      papers,
      total,
    };
  } catch (error: any) {
    logger.error('获取关键词相关论文失败:', error);
    throw error;
  }
}

export async function getKeywordPapersCount(keywordId: string): Promise<number> {
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
    
    const count = await userPrismaClient.paper.count({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { abstract: { contains: searchTerm } },
        ],
      },
    });
    
    return count;
  } catch (error: any) {
    logger.error('获取关键词相关论文数量失败:', error);
    throw error;
  }
}
