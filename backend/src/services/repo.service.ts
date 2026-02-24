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
  category?: string;
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

/** 分类 id 与可能存在于 DB 中的值（id / 中文标签 / 清单标题变体）一致，与前端 REPO_CATEGORIES 及资源清单文档对应 */
const CATEGORY_ID_TO_DB_VALUES: Record<string, string[]> = {
  '1.1': ['1.1', '视觉-语言-动作 (VLA)', '视觉-语言-动作模型 (VLA)'],
  '1.2': ['1.2', '模仿学习与行为克隆'],
  '1.3': ['1.3', '强化学习框架与算法'],
  '1.4': ['1.4', '世界模型与预测'],
  '2.1': ['2.1', '核心数据集'],
  '2.2': ['2.2', '机器人仿真环境'],
  '3.1': ['3.1', '机器人操作与抓取'],
  '3.2': ['3.2', '灵巧手与精细操作'],
  '3.3': ['3.3', '运动规划与控制'],
  '4.1': ['4.1', '机器人导航与SLAM'],
  '4.2': ['4.2', '3D视觉与点云处理'],
  '4.3': ['4.3', '机器人视觉与感知'],
  '5.1': ['5.1', 'ROS与机器人操作系统'],
  '5.2': ['5.2', '人形机器人与四足机器人'],
  '5.3': ['5.3', '开源机器人硬件平台'],
  '5.4': ['5.4', '大语言模型与机器人结合'],
  '5.5': ['5.5', '遥操作与数据采集'],
  '5.6': ['5.6', 'Sim2Real与域适应'],
  '6.1': ['6.1', '机器人学习框架'],
  '6.2': ['6.2', '机器人工具与库'],
  '6.3': ['6.3', '综合资源清单'],
  '6.4': ['6.4', '自动驾驶与移动机器人'],
  '6.5': ['6.5', '触觉感知与传感器'],
  '6.6': ['6.6', '多机器人系统'],
  '6.7': ['6.7', '机器人安全与可靠性'],
};

/** 解析 category 筛选：若为 id（如 1.1）则匹配 id 及对应中文标签，否则精确匹配 */
function resolveCategoryWhere(category: string): { category: { in: string[] } } | { category: string } {
  const expanded = CATEGORY_ID_TO_DB_VALUES[category];
  if (expanded && expanded.length > 0) {
    return { category: { in: expanded } };
  }
  return { category };
}

/** DB 中的 category 值 -> 前端侧边栏用的 id（1.1, 1.2, ...），用于 getRepoCounts 归一化 */
const DB_CATEGORY_VALUE_TO_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [id, values] of Object.entries(CATEGORY_ID_TO_DB_VALUES)) {
    for (const v of values) {
      map[v] = id;
    }
  }
  return map;
})();

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

        const category = params.category?.trim();
        if (category && category !== 'undefined') {
          Object.assign(where, resolveCategoryWhere(category));
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

export interface RepoCountsResult {
  total: number;
  categoryCounts: Record<string, number>;
  languageCounts: Record<string, number>;
}

/** 获取各分类、各语言的仓库数量，用于侧边栏展示 */
export async function getRepoCounts(): Promise<RepoCountsResult> {
  const cacheKey = queryCache.generateKey('repo-counts', {});

  return queryCache.execute(
    cacheKey,
    async () => {
      const [total, categoryRows, languageRows] = await Promise.all([
        prisma.githubRepo.count(),
        prisma.githubRepo.groupBy({
          by: ['category'],
          _count: { id: true },
          where: { category: { not: null } },
        }),
        prisma.githubRepo.groupBy({
          by: ['language'],
          _count: { id: true },
          where: { language: { not: null } },
        }),
      ]);

      // 归一化为前端侧边栏使用的 id（1.1, 1.2, ...），同一 id 对应多种 DB 值（如 "1.1" 与 "视觉-语言-动作 (VLA)"）合并计数
      const categoryCounts: Record<string, number> = {};
      for (const row of categoryRows) {
        if (row.category != null) {
          const id = DB_CATEGORY_VALUE_TO_ID[row.category] ?? row.category;
          categoryCounts[id] = (categoryCounts[id] ?? 0) + row._count.id;
        }
      }

      const languageCounts: Record<string, number> = {};
      for (const row of languageRows) {
        if (row.language != null) {
          languageCounts[row.language] = row._count.id;
        }
      }

      return { total, categoryCounts, languageCounts };
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

    // 重复项目识别：用户提交时若 fullName 已存在则拒绝，避免重复收录
    const fullNameTrimmed = data.fullName.trim();
    const existingByFullName = await prisma.githubRepo.findUnique({
      where: { fullName: fullNameTrimmed },
    });
    if (existingByFullName) {
      throw new Error('REPO_ALREADY_EXISTS');
    }

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

    // 处理repoId：转换为String（schema.user.prisma中repoId现在是String类型）
    // repoId是必需的，如果没有提供，生成一个基于fullName的hash值
    let repoIdValue: string;
    if (data.repoId !== undefined && data.repoId !== null) {
      // 支持字符串、数字、BigInt类型，统一转换为String
      if (typeof data.repoId === 'bigint') {
        repoIdValue = data.repoId.toString();
      } else if (typeof data.repoId === 'string') {
        repoIdValue = data.repoId;
      } else if (typeof data.repoId === 'number') {
        repoIdValue = String(Math.floor(data.repoId));
      } else {
        repoIdValue = String(data.repoId);
      }
    } else {
      // 如果没有提供repoId，生成一个基于fullName的hash值
      // 使用简单的hash算法生成一个大整数
      if (!data.fullName) {
        throw new Error('REPO_MISSING_FULLNAME: 无法生成repoId，fullName是必需的');
      }
      const fullNameHash = data.fullName.split('').reduce((acc: number, char: string) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      // 转换为正数并确保足够大
      repoIdValue = String(Math.abs(fullNameHash) + 1000000000);
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
      notifyEnabled: data.notifyEnabled !== undefined ? (data.notifyEnabled ? 1 : 0) : 1,
      ...(data.category !== undefined && data.category !== null && data.category !== '' ? { category: String(data.category).trim() } : {}),
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
      ...(data.notifyEnabled !== undefined ? { notifyEnabled: data.notifyEnabled ? 1 : 0 } : {}),
      ...(data.category !== undefined ? { category: data.category === null || data.category === '' ? null : String(data.category).trim() } : {}),
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

    // 使用fullName作为唯一键进行upsert操作（fullName在WhereUniqueInput中）
    // repoId现在是String类型，可以正常存储大数值ID
    
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
          const conflictingRepo = allRepos.find(r => r.repoId === repoIdValue && r.fullName !== data.fullName);
          
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
    
    // 处理分类字段：空字符串视为清空（null）
    if (updateData.category !== undefined) {
      updateData.category = updateData.category === '' || updateData.category == null 
        ? null 
        : String(updateData.category).trim();
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
