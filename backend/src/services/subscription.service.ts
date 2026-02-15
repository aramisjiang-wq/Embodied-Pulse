/**
 * 订阅服务
 * 处理用户订阅逻辑
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

const prisma = userPrisma as any;

export interface CreateSubscriptionParams {
  userId: string;
  contentType: string;
  keywords: string[];
  tags?: string[];
  authors?: string[];
  notifyEnabled?: boolean;
}

export interface UpdateSubscriptionParams {
  id: string;
  userId: string;
  keywords?: string[];
  tags?: string[];
  authors?: string[];
  isActive?: boolean;
  notifyEnabled?: boolean;
}

export interface GetUserSubscriptionsParams {
  userId: string;
  skip: number;
  take: number;
  contentType?: string;
}

export interface GetSubscribedContentParams {
  userId: string;
  skip: number;
  take: number;
  contentType?: string;
}

/**
 * 创建订阅
 */
export async function createSubscription(params: CreateSubscriptionParams) {
  try {
    // 输入验证
    if (!params.userId) {
      throw new Error('USER_ID_REQUIRED');
    }
    if (!params.contentType) {
      throw new Error('CONTENT_TYPE_REQUIRED');
    }
    if (!params.keywords || !Array.isArray(params.keywords) || params.keywords.length === 0) {
      throw new Error('KEYWORDS_REQUIRED');
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: params.userId,
        contentType: params.contentType,
        keywords: JSON.stringify(params.keywords || []),
        tags: params.tags ? JSON.stringify(params.tags) : null,
        authors: params.authors ? JSON.stringify(params.authors) : null,
        notifyEnabled: params.notifyEnabled ?? true,
        isActive: true,
        syncEnabled: true,
      } as any, // Prisma类型定义可能不完整，使用类型断言
    });

    logger.info(`订阅创建成功: ${subscription.id} (用户: ${params.userId}, 类型: ${params.contentType})`);

    // 自动触发订阅同步（异步，不阻塞订阅创建）
    syncSubscription(subscription.id).then(() => {
      logger.info(`订阅同步成功: ${subscription.id}`);
    }).catch((syncError: any) => {
      logger.warn(`订阅同步失败: ${subscription.id}, 错误: ${syncError.message}`);
    });

    return subscription;
  } catch (error: any) {
    logger.error('Create subscription error:', {
      error: error.message,
      stack: error.stack,
      userId: params.userId,
      contentType: params.contentType,
    });
    
    // 如果是已知错误，直接抛出
    if (error.message === 'USER_ID_REQUIRED' || 
        error.message === 'CONTENT_TYPE_REQUIRED' || 
        error.message === 'KEYWORDS_REQUIRED' ||
        error.message === 'USER_NOT_FOUND') {
      throw error;
    }
    
    throw new Error('SUBSCRIPTION_CREATE_FAILED');
  }
}

/**
 * 获取用户的所有订阅
 */
export async function getUserSubscriptions(params: GetUserSubscriptionsParams) {
  try {
    const where: any = {
      userId: params.userId,
    };

    if (params.contentType) {
      where.contentType = params.contentType;
    }

    const [items, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ]);

    return { items, total };
  } catch (error: any) {
    logger.error('Get user subscriptions error:', {
      error: error.message,
      stack: error.stack,
      userId: params.userId,
      contentType: params.contentType,
    });
    throw new Error('SUBSCRIPTION_FETCH_FAILED');
  }
}

/**
 * 根据ID获取订阅
 */
export async function getSubscriptionById(id: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new Error('SUBSCRIPTION_NOT_FOUND');
    }

    return subscription;
  } catch (error: any) {
    if (error.message === 'SUBSCRIPTION_NOT_FOUND') {
      throw error;
    }
    logger.error('Get subscription by id error:', {
      error: error.message,
      stack: error.stack,
      subscriptionId: id,
    });
    throw new Error('SUBSCRIPTION_FETCH_FAILED');
  }
}

/**
 * 更新订阅
 */
export async function updateSubscription(params: UpdateSubscriptionParams) {
  try {
    // 输入验证
    if (!params.id) {
      throw new Error('SUBSCRIPTION_ID_REQUIRED');
    }
    if (!params.userId) {
      throw new Error('USER_ID_REQUIRED');
    }

    // 验证订阅属于该用户
    const existing = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      throw new Error('SUBSCRIPTION_NOT_FOUND');
    }

    if (existing.userId !== params.userId) {
      throw new Error('SUBSCRIPTION_ACCESS_DENIED');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (params.keywords !== undefined) {
      if (Array.isArray(params.keywords)) {
        updateData.keywords = JSON.stringify(params.keywords);
      } else {
        throw new Error('KEYWORDS_MUST_BE_ARRAY');
      }
    }
    if (params.tags !== undefined) {
      if (Array.isArray(params.tags)) {
        updateData.tags = JSON.stringify(params.tags);
      } else {
        throw new Error('TAGS_MUST_BE_ARRAY');
      }
    }
    if (params.authors !== undefined) {
      if (Array.isArray(params.authors)) {
        updateData.authors = JSON.stringify(params.authors);
      } else {
        throw new Error('AUTHORS_MUST_BE_ARRAY');
      }
    }
    if (params.isActive !== undefined) {
      updateData.isActive = params.isActive;
    }
    if (params.notifyEnabled !== undefined) {
      updateData.notifyEnabled = params.notifyEnabled;
    }

    const subscription = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
    });

    logger.info(`订阅更新成功: ${subscription.id} (用户: ${params.userId})`);
    return subscription;
  } catch (error: any) {
    logger.error('Update subscription error:', {
      error: error.message,
      stack: error.stack,
      subscriptionId: params.id,
      userId: params.userId,
    });
    throw error;
  }
}

/**
 * 删除订阅
 */
export async function deleteSubscription(id: string, userId: string) {
  try {
    // 输入验证
    if (!id) {
      throw new Error('SUBSCRIPTION_ID_REQUIRED');
    }
    if (!userId) {
      throw new Error('USER_ID_REQUIRED');
    }

    // 验证订阅属于该用户
    const existing = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('SUBSCRIPTION_NOT_FOUND');
    }

    if (existing.userId !== userId) {
      throw new Error('SUBSCRIPTION_ACCESS_DENIED');
    }

    await prisma.subscription.delete({
      where: { id },
    });

    logger.info(`订阅删除成功: ${id} (用户: ${userId})`);
  } catch (error: any) {
    logger.error('Delete subscription error:', {
      error: error.message,
      stack: error.stack,
      subscriptionId: id,
      userId,
    });
    throw error;
  }
}

/**
 * 获取订阅内容（根据用户订阅筛选内容）
 */
export async function getSubscribedContent(params: GetSubscribedContentParams) {
  try {
    // 获取用户的订阅
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: params.userId,
        isActive: true,
        contentType: params.contentType,
      },
    });

    if (subscriptions.length === 0) {
      return { items: [], total: 0, subscriptionId: null };
    }

    // 使用第一个订阅进行筛选（未来可以支持多个订阅合并）
    const subscription = subscriptions[0] as any; // Prisma类型定义可能不完整，使用类型断言
    const keywords = subscription.keywords ? JSON.parse(subscription.keywords) : [];
    const tags = subscription.tags ? JSON.parse(subscription.tags) : [];
    const authors = subscription.authors ? JSON.parse(subscription.authors) : [];

    let items: any[] = [];
    let total = 0;

    // 根据内容类型筛选
    switch (subscription.contentType) {
      case 'paper':
        const paperResult = await filterPapers(keywords, tags, authors, params.skip, params.take);
        items = paperResult.items;
        total = paperResult.total;
        break;

      case 'video':
        const videoResult = await filterVideos(keywords, tags, [], params.skip, params.take);
        items = videoResult.items;
        total = videoResult.total;
        break;

      case 'repo':
        const repoResult = await filterRepos(keywords, tags, [], params.skip, params.take);
        items = repoResult.items;
        total = repoResult.total;
        break;

      case 'huggingface':
        const modelResult = await filterModels(keywords, tags, params.skip, params.take);
        items = modelResult.items;
        total = modelResult.total;
        break;

      case 'job':
        const jobResult = await filterJobs(keywords, tags, params.skip, params.take);
        items = jobResult.items;
        total = jobResult.total;
        break;
    }

    return {
      items,
      total,
      subscriptionId: subscription.id,
    };
  } catch (error: any) {
    logger.error('Get subscribed content error:', {
      error: error.message,
      stack: error.stack,
      userId: params.userId,
      contentType: params.contentType,
    });
    throw new Error('SUBSCRIBED_CONTENT_FETCH_FAILED');
  }
}

/**
 * 获取单个订阅的匹配内容
 */
export async function getSubscriptionContentById(subscriptionId: string, skip: number = 0, take: number = 20) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('SUBSCRIPTION_NOT_FOUND');
    }

    const keywords = subscription.keywords ? JSON.parse(subscription.keywords) : [];
    const tags = subscription.tags ? JSON.parse(subscription.tags) : [];
    const authors = subscription.authors ? JSON.parse(subscription.authors) : [];
    const uploaders = subscription.uploaders ? JSON.parse(subscription.uploaders) : [];
    const owners = subscription.owners ? JSON.parse(subscription.owners) : [];

    let items: any[] = [];
    let total = 0;

    switch (subscription.contentType) {
      case 'paper':
        const paperResult = await filterPapers(keywords, tags, authors, skip, take);
        items = paperResult.items;
        total = paperResult.total;
        break;

      case 'video':
        const videoResult = await filterVideos(keywords, tags, uploaders, skip, take);
        items = videoResult.items;
        total = videoResult.total;
        break;

      case 'repo':
        const repoResult = await filterRepos(keywords, tags, owners, skip, take);
        items = repoResult.items;
        total = repoResult.total;
        break;

      case 'huggingface':
        const modelResult = await filterModels(keywords, tags, skip, take);
        items = modelResult.items;
        total = modelResult.total;
        break;

      case 'job':
        const jobResult = await filterJobs(keywords, tags, skip, take);
        items = jobResult.items;
        total = jobResult.total;
        break;
    }

    return {
      items,
      total,
      subscriptionId: subscription.id,
      contentType: subscription.contentType,
    };
  } catch (error: any) {
    if (error.message === 'SUBSCRIPTION_NOT_FOUND') {
      throw error;
    }
    logger.error('Get subscription content by id error:', {
      error: error.message,
      stack: error.stack,
      subscriptionId,
    });
    throw new Error('SUBSCRIPTION_CONTENT_FETCH_FAILED');
  }
}

/**
 * 筛选论文（支持关键词、标签、作者）
 */
async function filterPapers(keywords: string[], tags: string[], authors: string[], skip: number, take: number) {
  // 构建SQL查询条件
  const whereConditions: any[] = [];

  // 关键词匹配（标题或摘要）
  if (keywords.length > 0) {
    // 将包含空格的关键词拆分成多个独立的关键词
    const expandedKeywords = keywords.flatMap(kw => 
      kw.split(/\s+/).filter(k => k.trim().length > 0)
    );
    
    const keywordConditions = expandedKeywords.map(kw => ({
      OR: [
        { title: { contains: kw } },
        { abstract: { contains: kw } },
      ],
    }));
    whereConditions.push({ OR: keywordConditions });
  }

  // 标签匹配（categories字段包含）
  if (tags.length > 0) {
    const tagConditions = tags.map(tag => ({
      categories: { contains: tag },
    }));
    whereConditions.push({ OR: tagConditions });
  }

  // 作者匹配
  if (authors.length > 0) {
    const authorConditions = authors.map(author => ({
      authors: { contains: author },
    }));
    whereConditions.push({ OR: authorConditions });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [itemsRaw, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      skip,
      take,
      orderBy: { publishedDate: 'desc' },
    }),
    prisma.paper.count({ where }),
  ]);

  // 添加外部链接所需字段
  const items = itemsRaw.map((p: any) =>({
    ...p,
    arxivId: p.arxivId || null,
    pdfUrl: p.pdfUrl || null,
  }));

  return { items, total };
}

/**
 * 筛选视频
 */
async function filterVideos(keywords: string[], tags: string[], uploaders: string[] = [], skip: number, take: number) {
  const whereConditions: any[] = [];

  if (keywords.length > 0) {
    // 将包含空格的关键词拆分成多个独立的关键词
    const expandedKeywords = keywords.flatMap(kw => 
      kw.split(/\s+/).filter(k => k.trim().length > 0)
    );
    
    const keywordConditions = expandedKeywords.map(kw => ({
      title: { contains: kw },
    }));
    whereConditions.push({ OR: keywordConditions });
  }

  if (tags.length > 0) {
    const tagConditions = tags.map(tag => ({
      tags: { contains: tag },
    }));
    whereConditions.push({ OR: tagConditions });
  }

  if (uploaders.length > 0) {
    const uploaderConditions = uploaders.map(uploader => ({
      uploader: { contains: uploader },
    }));
    whereConditions.push({ OR: uploaderConditions });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [itemsRaw, total] = await Promise.all([
    prisma.video.findMany({
      where,
      skip,
      take,
      orderBy: { publishedDate: 'desc' },
    }),
    prisma.video.count({ where }),
  ]);

  // 添加外部链接所需字段
  const items = itemsRaw.map((v: any) =>({
    ...v,
    platform: v.platform || 'bilibili',
    videoId: v.videoId || '',
    bvid: (v as any).bvid || v.videoId || '',
  }));

  return { items, total };
}

/**
 * 筛选GitHub项目
 */
async function filterRepos(keywords: string[], tags: string[], owners: string[] = [], skip: number, take: number) {
  const whereConditions: any[] = [];

  if (keywords.length > 0) {
    // 将包含空格的关键词拆分成多个独立的关键词
    const expandedKeywords = keywords.flatMap(kw => 
      kw.split(/\s+/).filter(k => k.trim().length > 0)
    );
    
    const keywordConditions = expandedKeywords.map(kw => ({
      OR: [
        { name: { contains: kw } },
        { description: { contains: kw } },
      ],
    }));
    whereConditions.push({ OR: keywordConditions });
  }

  if (tags.length > 0) {
    const tagConditions = tags.map(tag => ({
      topics: { contains: tag },
    }));
    whereConditions.push({ OR: tagConditions });
  }

  if (owners.length > 0) {
    const ownerConditions = owners.map(owner => ({
      owner: { contains: owner },
    }));
    whereConditions.push({ OR: ownerConditions });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [itemsRaw, total] = await Promise.all([
    prisma.githubRepo.findMany({
      where,
      skip,
      take,
      orderBy: { updatedDate: 'desc' },
    }),
    prisma.githubRepo.count({ where }),
  ]);

  // 添加外部链接所需字段
  const items = itemsRaw.map((r: any) =>({
    ...r,
    htmlUrl: (r as any).htmlUrl || null,
    fullName: r.fullName || '',
  }));

  return { items, total };
}

/**
 * 筛选HuggingFace模型
 */
async function filterModels(keywords: string[], tags: string[], skip: number, take: number) {
  const whereConditions: any[] = [];

  if (keywords.length > 0) {
    // 将包含空格的关键词拆分成多个独立的关键词
    const expandedKeywords = keywords.flatMap(kw => 
      kw.split(/\s+/).filter(k => k.trim().length > 0)
    );
    
    const keywordConditions = expandedKeywords.map(kw => ({
      fullName: { contains: kw },
    }));
    whereConditions.push({ OR: keywordConditions });
  }

  if (tags.length > 0) {
    const tagConditions = tags.map(tag => ({
      tags: { contains: tag },
    }));
    whereConditions.push({ OR: tagConditions });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [itemsRaw, total] = await Promise.all([
    prisma.huggingFaceModel.findMany({
      where,
      skip,
      take,
      orderBy: { lastModified: 'desc' },
    }),
    prisma.huggingFaceModel.count({ where }),
  ]);

  // 添加外部链接所需字段
  const items = itemsRaw.map((m: any) =>({
    ...m,
    fullName: m.fullName || '',
    hfId: m.fullName || '', // HuggingFace使用fullName作为ID
  }));

  return { items, total };
}

/**
 * 筛选岗位
 */
async function filterJobs(keywords: string[], tags: string[], skip: number, take: number) {
  const whereConditions: any[] = [{
    status: 'open', // 只返回开放的岗位
  }];

  if (keywords.length > 0) {
    // 将包含空格的关键词拆分成多个独立的关键词
    const expandedKeywords = keywords.flatMap(kw => 
      kw.split(/\s+/).filter(k => k.trim().length > 0)
    );
    
    const keywordConditions = expandedKeywords.map(kw => ({
      OR: [
        { title: { contains: kw } },
        { description: { contains: kw } },
        { company: { contains: kw } },
      ],
    }));
    whereConditions.push({ OR: keywordConditions });
  }

  if (tags.length > 0) {
    const tagConditions = tags.map(tag => ({
      tags: { contains: tag },
    }));
    whereConditions.push({ OR: tagConditions });
  }

  const where = { AND: whereConditions };

  const [itemsRaw, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.job.count({ where }),
  ]);

  // 添加外部链接所需字段
  const items = itemsRaw.map((j: any) =>({
    ...j,
    applyUrl: (j as any).applyUrl || null,
  }));

  return { items, total };
}

/**
 * 同步订阅（自动触发）
 */
export async function syncSubscription(subscriptionId: string) {
  try {
    // 获取订阅信息
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('SUBSCRIPTION_NOT_FOUND');
    }

    // 记录同步开始
    const startTime = Date.now();

    // 获取订阅匹配的内容（最多100条用于统计）
    const contentResult = await getSubscribedContent({
      userId: subscription.userId,
      contentType: subscription.contentType,
      skip: 0,
      take: 100,
    });

    // 计算匹配数量和新增数量
    // 新增数量：最近24小时内发布的内容
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    let newCount = 0;
    if (contentResult.items && Array.isArray(contentResult.items)) {
      newCount = contentResult.items.filter((item: any) => {
        const publishDate = item.publishedDate || item.createdAt || item.updatedDate;
        if (!publishDate) return false;
        const itemDate = new Date(publishDate);
        return itemDate >= oneDayAgo;
      }).length;
    }

    const syncResult = {
      matchedCount: contentResult.total || 0,
      newCount: Math.min(newCount, 20), // 最多20条新内容
    };

    const duration = Date.now() - startTime;

    // 记录同步历史
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscriptionId,
        syncType: 'auto',
        matchedCount: syncResult.matchedCount,
        newCount: syncResult.newCount,
        status: 'success',
        duration,
        createdAt: new Date(), // 明确设置日期
      } as any, // Prisma类型定义可能不完整，使用类型断言
    });

    // 更新订阅信息
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        lastSyncAt: new Date(),
        lastChecked: new Date(),
        totalMatched: syncResult.matchedCount,
        newCount: syncResult.newCount,
      } as any, // Prisma类型定义可能不完整，使用类型断言
    });

    logger.info(`自动同步订阅成功: ${subscriptionId}, 匹配${syncResult.matchedCount}条, 新增${syncResult.newCount}条`);

    return syncResult;
  } catch (error: any) {
    logger.error('Sync subscription error:', {
      error: error.message,
      stack: error.stack,
      subscriptionId,
    });

    // 记录同步失败
    try {
      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscriptionId,
          syncType: 'auto',
          status: 'failed',
          errorMessage: error.message,
          duration: Date.now() - Date.now(),
          createdAt: new Date(), // 明确设置日期
        } as any, // Prisma类型定义可能不完整，使用类型断言
      });
    } catch (historyError: any) {
      logger.error('Failed to record subscription history:', historyError);
    }

    throw error;
  }
}
