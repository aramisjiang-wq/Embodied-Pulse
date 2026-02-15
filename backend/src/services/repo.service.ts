/**
 * GitHub仓库服务
 */

import { GithubRepo } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { queryCache } from './query-cache.service';

const prisma = userPrisma;

export interface GetReposParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'stars';
  language?: string;
  keyword?: string;
  domain?: string;
  scenario?: string;
}

// 解析topics字段：将JSON字符串转换为数组
function parseTopics(topics: string | null | undefined): string[] {
  if (!topics) return [];
  if (Array.isArray(topics)) return topics;
  try {
    const parsed = JSON.parse(topics);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getRepos(params: GetReposParams): Promise<{ repos: GithubRepo[]; total: number }> {
  const cacheKey = queryCache.generateKey('repos', params);

  return queryCache.execute(
    cacheKey,
    async () => {
      try {
        const where: any = {};

        if (params.language) {
          where.language = params.language;
        }

        // 关键词搜索（SQLite不支持mode: 'insensitive'，使用contains即可）
        if (params.keyword) {
          where.OR = [
            { name: { contains: params.keyword } },
            { description: { contains: params.keyword } },
          ];
        }

        // 领域筛选（通过topics字段）
        if (params.domain) {
          const domainKeywords: Record<string, string[]> = {
            'ai': ['ai', 'artificial-intelligence', 'machine-learning', 'ml'],
            'robotics': ['robotics', 'robot', 'embodied-ai', 'embodied'],
            'computer-vision': ['computer-vision', 'vision', 'cv', 'image'],
            'nlp': ['nlp', 'natural-language', 'text', 'llm'],
            'reinforcement-learning': ['reinforcement-learning', 'rl', 'policy'],
            'deep-learning': ['deep-learning', 'neural-network', 'deep'],
          };
          const keywords = domainKeywords[params.domain] || [params.domain];
          where.OR = where.OR || [];
          keywords.forEach(keyword => {
            where.OR.push({ topics: { contains: keyword } });
          });
        }

        // 应用场景筛选（通过topics字段）
        if (params.scenario) {
          const scenarioKeywords: Record<string, string[]> = {
            'simulation': ['simulation', 'sim', 'gym', 'environment'],
            'navigation': ['navigation', 'path-planning', 'slam', 'localization'],
            'manipulation': ['manipulation', 'grasp', 'arm', 'hand'],
            'perception': ['perception', 'detection', 'recognition', 'tracking'],
            'planning': ['planning', 'decision-making', 'policy'],
            'control': ['control', 'controller', 'actuator'],
          };
          const keywords = scenarioKeywords[params.scenario] || [params.scenario];
          where.OR = where.OR || [];
          keywords.forEach(keyword => {
            where.OR.push({ topics: { contains: keyword } });
          });
        }

        let orderBy: any = {};
        switch (params.sort) {
          case 'stars':
            orderBy = { starsCount: 'desc' };
            break;
          case 'hot':
            orderBy = { viewCount: 'desc' };
            break;
          case 'latest':
          default:
            orderBy = { updatedDate: 'desc' };
            break;
        }

        const [reposRaw, total] = await Promise.all([
          prisma.githubRepo.findMany({ where, orderBy, skip: params.skip, take: params.take }),
          prisma.githubRepo.count({ where }),
        ]);

        // 解析topics字段
        const repos = reposRaw.map(repo => ({
          ...repo,
          topics: parseTopics(repo.topics),
        })) as any; // 类型转换：topics从string转换为string[]

        return { repos, total };
      } catch (error) {
        logger.error('Get repos error:', error);
        throw new Error('REPOS_FETCH_FAILED');
      }
    },
    300 as any
  );
}

export async function getRepoById(repoId: string): Promise<GithubRepo | null> {
  try {
    const repo = await prisma.githubRepo.findUnique({ where: { id: repoId } });
    if (repo) {
      await prisma.githubRepo.update({
        where: { id: repoId },
        data: { viewCount: { increment: 1 } },
      });
      
      // 解析topics字段
      return {
        ...repo,
        topics: parseTopics(repo.topics),
      } as any; // 类型转换：topics从string转换为string[]
    }
    return null;
  } catch (error) {
    logger.error('Get repo by ID error:', error);
    throw new Error('REPO_FETCH_FAILED');
  }
}

export async function createRepo(data: any): Promise<any> {
  try {
    // 验证必填字段
    if (!data.name || !data.fullName) {
      logger.error('Missing required fields:', { name: data.name, fullName: data.fullName });
      throw new Error('REPO_MISSING_REQUIRED_FIELDS: name和fullName是必填字段');
    }

    logger.info('Creating repo with input data:', {
      name: data.name,
      fullName: data.fullName,
      repoId: data.repoId,
      owner: data.owner,
      topics: data.topics,
    });

    // 处理topics字段：如果是数组，转换为JSON字符串；如果是字符串，直接使用
    let topicsValue = '[]';
    if (data.topics !== undefined && data.topics !== null) {
      if (Array.isArray(data.topics)) {
        topicsValue = JSON.stringify(data.topics);
      } else if (typeof data.topics === 'string') {
        // 尝试解析JSON字符串
        try {
          const parsed = JSON.parse(data.topics);
          topicsValue = Array.isArray(parsed) ? JSON.stringify(parsed) : data.topics;
        } catch {
          // 如果不是有效的JSON，使用原值
          topicsValue = data.topics;
        }
      }
    }

    // 处理repoId：转换为number（schema.user.prisma中repoId是Int类型）
    // repoId是必需的，如果没有提供，生成一个基于fullName的hash值
    let repoIdValue: number;
    if (data.repoId !== undefined && data.repoId !== null) {
      // 支持字符串、数字、BigInt类型，统一转换为number
      if (typeof data.repoId === 'bigint') {
        repoIdValue = Number(data.repoId);
      } else if (typeof data.repoId === 'string') {
        repoIdValue = Number(data.repoId);
      } else {
        repoIdValue = Number(data.repoId);
      }
      
      // 验证number是否有效
      if (isNaN(repoIdValue) || !isFinite(repoIdValue)) {
        throw new Error('REPO_INVALID_REPOID: repoId必须是有效的数字');
      }
    } else {
      // 如果没有提供repoId，生成一个基于fullName的hash值
      // 使用简单的hash算法生成一个number值
      if (!data.fullName) {
        throw new Error('REPO_MISSING_FULLNAME: 无法生成repoId，fullName是必需的');
      }
      const fullNameHash = data.fullName.split('').reduce((acc: number, char: string) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      // 转换为正数并确保足够大
      repoIdValue = Math.abs(fullNameHash) + 1000000000;
      logger.warn(`RepoId not provided, generating hash for ${data.fullName}: ${repoIdValue}`);
    }

    // 处理日期字段
    const createdDate = data.createdDate ? new Date(data.createdDate) : null;
    const updatedDate = data.updatedDate ? new Date(data.updatedDate) : null;

    // 验证数据完整性
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('REPO_INVALID_NAME: name必须是字符串');
    }
    if (!data.fullName || typeof data.fullName !== 'string') {
      throw new Error('REPO_INVALID_FULLNAME: fullName必须是字符串');
    }

    const createData: any = {
      repoId: repoIdValue,
      name: data.name.trim(),
      fullName: data.fullName.trim(),
      description: data.description ? String(data.description).trim() : null,
      language: data.language ? String(data.language).trim() : null,
      starsCount: data.starsCount || 0,
      forksCount: data.forksCount || 0,
      issuesCount: data.issuesCount || 0,
      topics: topicsValue,
      createdDate: createdDate,
      updatedDate: updatedDate,
      viewCount: 0,
      favoriteCount: 0,
      addedBy: data.addedBy || 'admin',
      notifyEnabled: data.notifyEnabled !== undefined ? data.notifyEnabled : true,
    };

    const updateData: any = {
      repoId: repoIdValue,
      name: data.name.trim(),
      description: data.description ? String(data.description).trim() : null,
      language: data.language ? String(data.language).trim() : null,
      starsCount: data.starsCount || 0,
      forksCount: data.forksCount || 0,
      issuesCount: data.issuesCount || 0,
      topics: topicsValue,
      createdDate: createdDate,
      updatedDate: updatedDate,
      ...(data.addedBy !== undefined ? { addedBy: data.addedBy } : {}),
      ...(data.notifyEnabled !== undefined ? { notifyEnabled: data.notifyEnabled } : {}),
    }

    if (data.owner !== undefined && data.owner !== null) {
      createData.owner = data.owner;
      updateData.owner = data.owner;
    }

    logger.info('Creating/updating repo with data:', {
      fullName: data.fullName,
      repoId: repoIdValue,
      topics: topicsValue,
      createdDate: createdDate?.toISOString(),
      updatedDate: updatedDate?.toISOString(),
    });

    // 核心问题：Prisma生成的类型定义中，repoId (BigInt) 不能用于where查询条件
    // GithubRepoWhereInput 和 GithubRepoWhereUniqueInput 中都没有 repoId 字段
    // 这是因为SQLite对BigInt类型的限制
    // 解决方案：使用fullName作为唯一键进行upsert操作（fullName在WhereUniqueInput中）
    
    let repo;
    
    try {
      // 使用upsert基于fullName（唯一键）进行创建或更新
      repo = await prisma.githubRepo.upsert({
        where: { fullName: data.fullName },
        update: {
          // 更新时包含repoId，如果冲突Prisma会抛出P2002错误
          repoId: repoIdValue,
          name: data.name.trim(),
          description: data.description ? String(data.description).trim() : null,
          language: data.language ? String(data.language).trim() : null,
          starsCount: data.starsCount || 0,
          forksCount: data.forksCount || 0,
          issuesCount: data.issuesCount || 0,
          topics: topicsValue,
          createdDate: createdDate,
          updatedDate: updatedDate,
          ...(data.owner !== undefined && data.owner !== null ? { owner: data.owner } : {}),
        },
        create: createData,
      });
      logger.info(`Repo upserted successfully: ${repo.fullName}`);
    } catch (upsertError: any) {
      // 如果upsert失败，可能是repoId冲突（P2002）
      if (upsertError.code === 'P2002') {
        const target = upsertError.meta?.target || [];
        if (target.includes('repo_id')) {
          // repoId冲突：说明另一个fullName已经使用了这个repoId
          // 由于不能通过repoId查询，先查找所有记录检查冲突
          const allRepos = await prisma.githubRepo.findMany();
          const conflictingRepo = allRepos.find(r => r.repoId.toString() === repoIdValue.toString() && r.fullName !== data.fullName);
          
          if (conflictingRepo) {
            logger.error(`RepoId conflict: repoId ${repoIdValue} already used by ${conflictingRepo.fullName}`);
            throw new Error(`REPO_ID_CONFLICT: repoId ${repoIdValue} 已被仓库 ${conflictingRepo.fullName} 使用`);
          } else {
            // 同一条记录，直接更新（不更新repoId避免循环）
            repo = await prisma.githubRepo.update({
              where: { fullName: data.fullName },
              data: {
                name: data.name.trim(),
                description: data.description ? String(data.description).trim() : null,
                language: data.language ? String(data.language).trim() : null,
                starsCount: data.starsCount || 0,
                forksCount: data.forksCount || 0,
                issuesCount: data.issuesCount || 0,
                topics: topicsValue,
                createdDate: createdDate,
                updatedDate: updatedDate,
                ...(data.owner !== undefined && data.owner !== null ? { owner: data.owner } : {}),
              },
            });
            logger.info(`Repo updated after conflict check: ${repo.fullName}`);
          }
        } else {
          // 其他唯一性约束冲突
          logger.error('Upsert failed with unique constraint:', upsertError);
          throw upsertError;
        }
      } else {
        logger.error('Upsert failed with unexpected error:', upsertError);
        throw upsertError;
      }
    }
    
    // 解析topics字段后返回
    return {
      ...repo,
      topics: parseTopics(repo.topics),
    };
  } catch (error: any) {
    logger.error('Create repo error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      inputData: {
        name: data.name,
        fullName: data.fullName,
        repoId: data.repoId,
        owner: data.owner,
        topics: data.topics,
        starsCount: data.starsCount,
        forksCount: data.forksCount,
        issuesCount: data.issuesCount,
      },
    });
    
    // 如果是已知的错误，直接抛出
    if (error.message && (error.message.startsWith('REPO_') || error.message.startsWith('REPOS_'))) {
      throw error;
    }
    
    // 处理Prisma错误
    if (error.code === 'P2002') {
      // 唯一性约束冲突
      const target = error.meta?.target || [];
      if (target.includes('repo_id') || target.includes('repoId')) {
        throw new Error(`REPO_ID_CONFLICT: repoId ${data.repoId || '未知'} 已存在`);
      } else if (target.includes('full_name') || target.includes('fullName')) {
        throw new Error(`REPO_FULLNAME_CONFLICT: fullName ${data.fullName || '未知'} 已存在`);
      }
      throw new Error(`REPO_UNIQUE_CONSTRAINT_VIOLATION: ${target.join(', ')} 违反唯一性约束`);
    }
    
    // 处理Prisma验证错误
    if (error.code === 'P2003') {
      throw new Error(`REPO_FOREIGN_KEY_CONSTRAINT: ${error.meta?.field_name || '未知字段'} 违反外键约束`);
    }
    
    // 处理其他Prisma错误
    if (error.code && error.code.startsWith('P')) {
      throw new Error(`REPO_DATABASE_ERROR: ${error.message || '数据库操作失败'}`);
    }
    
    throw new Error(`REPO_CREATION_FAILED: ${error.message || '未知错误'}`);
  }
}

export async function updateRepo(repoId: string, data: Partial<GithubRepo>): Promise<GithubRepo> {
  try {
    // 处理topics字段
    const updateData: any = { ...data };
    if (updateData.topics !== undefined) {
      if (Array.isArray(updateData.topics)) {
        updateData.topics = JSON.stringify(updateData.topics);
      } else if (typeof updateData.topics === 'string') {
        // 尝试解析JSON字符串
        try {
          const parsed = JSON.parse(updateData.topics);
          updateData.topics = Array.isArray(parsed) ? JSON.stringify(parsed) : updateData.topics;
        } catch {
          // 如果不是有效的JSON，保持原值
        }
      }
    }
    
    const repo = await prisma.githubRepo.update({ where: { id: repoId }, data: updateData });
    
    // 解析topics字段后返回
    return {
      ...repo,
      topics: parseTopics(repo.topics),
    } as any; // 类型转换：topics从string转换为string[]
  } catch (error) {
    logger.error('Update repo error:', error);
    throw new Error('REPO_UPDATE_FAILED');
  }
}

export async function deleteRepo(repoId: string): Promise<void> {
  try {
    await prisma.githubRepo.delete({ where: { id: repoId } });
  } catch (error) {
    logger.error('Delete repo error:', error);
    throw new Error('REPO_DELETION_FAILED');
  }
}
