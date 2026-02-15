/**
 * 信息流服务
 * 实现推荐算法和混合内容展示
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { queryCache } from './query-cache.service';

const prisma = userPrisma;

export interface FeedItem {
  id: string;
  type: 'paper' | 'video' | 'repo' | 'job' | 'huggingface';
  title: string;
  coverUrl?: string;
  publishedDate?: Date;
  viewCount: number;
  favoriteCount: number;
  shareCount?: number;
  // 论文特有字段
  authors?: any;
  abstract?: string;
  citationCount?: number;
  // 视频特有字段
  duration?: number;
  uploader?: string;
  playCount?: number;
  // GitHub特有字段
  language?: string;
  starsCount?: number;
  // Hugging Face 特有字段
  task?: string;
  downloads?: number;
  likes?: number;
  // 岗位特有字段
  company?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface GetFeedParams {
  skip: number;
  take: number;
  tab?: 'recommend' | 'paper' | 'video' | 'code' | 'job' | 'huggingface' | 'latest';
  userId?: string;
}

/**
 * 获取信息流
 */
export async function getFeed(params: GetFeedParams): Promise<{ items: FeedItem[]; total: number }> {
  const cacheKey = queryCache.generateKey('feed', params);

  return queryCache.execute(
    cacheKey,
    async () => {
      try {
        // 根据tab类型获取内容
        if (params.tab && params.tab !== 'recommend' && params.tab !== 'latest') {
          return await getFeedByType(params);
        }

        // 混合推荐
        return await getMixedFeed(params);
      } catch (error: any) {
        logger.error('Get feed error:', error);
        // 保留原始错误信息以便调试
        const errorMessage = error?.message || 'FEED_FETCH_FAILED';
        logger.error('Feed error details:', {
          message: errorMessage,
          stack: error?.stack,
          params,
        });
        throw new Error(`FEED_FETCH_FAILED: ${errorMessage}`);
      }
    },
    180 as any
  );
}

/**
 * 按类型获取信息流
 */
async function getFeedByType(params: GetFeedParams): Promise<{ items: FeedItem[]; total: number }> {
  let items: FeedItem[] = [];
  let total = 0;

  try {

  switch (params.tab) {
    case 'paper':
      const papers = await prisma.paper.findMany({
        orderBy: { publishedDate: 'desc' },
        skip: params.skip,
        take: params.take,
      });
      total = await prisma.paper.count();
      items = papers.map(p => ({
        id: p.id,
        type: 'paper' as const,
        title: p.title,
        publishedDate: p.publishedDate || undefined,
        viewCount: p.viewCount,
        favoriteCount: p.favoriteCount,
        shareCount: p.shareCount,
        authors: p.authors,
        abstract: p.abstract || undefined,
        citationCount: p.citationCount,
        // 添加外部链接所需字段
        arxivId: p.arxivId || null,
        pdfUrl: p.pdfUrl || null,
      }));
      break;

    case 'video':
      const videos = await prisma.video.findMany({
        orderBy: { publishedDate: 'desc' },
        skip: params.skip,
        take: params.take,
      });
      total = await prisma.video.count();
      items = videos.map(v => ({
        id: v.id,
        type: 'video' as const,
        title: v.title,
        coverUrl: v.coverUrl || undefined,
        publishedDate: v.publishedDate || undefined,
        viewCount: v.viewCount,
        favoriteCount: v.favoriteCount,
        duration: v.duration || undefined,
        uploader: v.uploader || undefined,
        playCount: v.playCount,
        // 添加外部链接所需字段
        platform: v.platform || 'bilibili',
        videoId: v.videoId || '',
        bvid: (v as any).bvid || v.videoId || '',
      }));
      break;

    case 'code':
      const repos = await prisma.githubRepo.findMany({
        orderBy: { updatedDate: 'desc' },
        skip: params.skip,
        take: params.take,
      });
      total = await prisma.githubRepo.count();
      items = repos.map(r => ({
        id: r.id,
        type: 'repo' as const,
        title: r.name,
        viewCount: r.viewCount,
        favoriteCount: r.favoriteCount,
        language: r.language || undefined,
        starsCount: r.starsCount,
        // 添加外部链接所需字段
        htmlUrl: (r as any).htmlUrl || null,
        fullName: r.fullName || '',
      }));
      break;

    case 'job':
      const jobs = await prisma.job.findMany({
        where: { status: 'open' },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      });
      total = await prisma.job.count({ where: { status: 'open' } });
      items = jobs.map(j => ({
        id: j.id,
        type: 'job' as const,
        title: j.title,
        viewCount: j.viewCount,
        favoriteCount: j.favoriteCount,
        company: j.company,
        location: j.location || undefined,
        salaryMin: j.salaryMin || undefined,
        salaryMax: j.salaryMax || undefined,
      }));
      break;
    case 'huggingface':
      const models = await prisma.huggingFaceModel.findMany({
        orderBy: { lastModified: 'desc' },
        skip: params.skip,
        take: params.take,
      });
      total = await prisma.huggingFaceModel.count();
      items = models.map(m => ({
        id: m.id,
        type: 'huggingface' as const,
        title: m.fullName,
        viewCount: m.viewCount,
        favoriteCount: m.favoriteCount,
        shareCount: m.shareCount,
        task: m.task || undefined,
        downloads: m.downloads,
        likes: m.likes,
        // 添加外部链接所需字段
        fullName: m.fullName || '',
        hfId: m.fullName || '', // HuggingFace使用fullName作为ID
      }));
      break;
    default:
      // 如果tab类型不匹配，返回空列表
      logger.warn(`Unknown feed tab type: ${params.tab}`);
      return { items: [], total: 0 };
  }

  return { items, total };
  } catch (error: any) {
    logger.error(`Get feed by type error (tab: ${params.tab}):`, error);
    throw error;
  }
}

/**
 * 混合推荐算法
 * 热度推荐(40%) + 时效性推荐(30%) + 个性化推荐(30%)
 */
async function getMixedFeed(params: GetFeedParams): Promise<{ items: FeedItem[]; total: number }> {
  const { take } = params;

  // 计算各类型数量
  const hotCount = Math.floor(take * 0.4);
  const latestCount = Math.floor(take * 0.3);
  const personalCount = params.userId ? Math.floor(take * 0.3) : 0;

  // 并行获取各类内容
  const [hotItems, latestItems, personalItems] = await Promise.all([
    getHotItems(hotCount),
    getLatestItems(latestCount),
    params.userId ? getPersonalizedItems(params.userId, personalCount) : Promise.resolve([]),
  ]);

  // 合并去重
  const allItems = [...hotItems, ...latestItems, ...personalItems];
  const uniqueItems = deduplicateItems(allItems);

  // 打乱顺序
  const shuffledItems = shuffleArray(uniqueItems);

  // 分页
  const paginatedItems = shuffledItems.slice(params.skip, params.skip + params.take);

  return {
    items: paginatedItems,
    total: shuffledItems.length,
  };
}

/**
 * 获取热门内容
 * 使用与discovery.service.ts相同的热度计算逻辑
 */
async function getHotItems(count: number): Promise<FeedItem[]> {
  const splitCount = Math.max(1, Math.floor(count / 4));
  
  // 获取更多数据用于计算热度分数
  const [papers, videos, repos, models] = await Promise.all([
    prisma.paper.findMany({
      take: splitCount * 2,
    }),
    prisma.video.findMany({
      take: splitCount * 2,
    }),
    prisma.githubRepo.findMany({
      take: splitCount * 2,
    }),
    prisma.huggingFaceModel.findMany({
      take: splitCount * 2,
    }),
  ]);

  // 计算热度分数并排序
  const papersWithScore = papers
    .map(p => ({ 
      ...p, 
      type: 'paper' as const, 
      hotScore: calculatePaperHotScore(p),
      // 添加外部链接所需字段
      arxivId: p.arxivId || null,
      pdfUrl: p.pdfUrl || null,
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, splitCount);
  
  const videosWithScore = videos
    .map(v => ({ 
      ...v, 
      type: 'video' as const, 
      hotScore: calculateVideoHotScore(v),
      // 添加外部链接所需字段
      platform: v.platform || 'bilibili',
      videoId: v.videoId || '',
      bvid: (v as any).bvid || v.videoId || '',
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, splitCount);
  
  const reposWithScore = repos
    .map(r => ({ 
      ...r, 
      type: 'repo' as const, 
      title: r.name, 
      hotScore: calculateRepoHotScore(r),
      // 添加外部链接所需字段
      htmlUrl: (r as any).htmlUrl || null,
      fullName: r.fullName || '',
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, splitCount);
  
  const modelsWithScore = models
    .map(m => ({ 
      ...m, 
      type: 'huggingface' as const, 
      title: m.fullName, 
      hotScore: calculateModelHotScore(m),
      // 添加外部链接所需字段
      fullName: m.fullName || '',
      hfId: m.fullName || '', // HuggingFace使用fullName作为ID
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, splitCount);

  return [
    ...papersWithScore,
    ...videosWithScore,
    ...reposWithScore,
    ...modelsWithScore,
  ] as FeedItem[];
}

/**
 * 计算论文热度分数（与discovery.service.ts保持一致）
 */
function calculatePaperHotScore(paper: any): number {
  const viewScore = (paper.viewCount || 0) * 0.2;
  const favoriteScore = (paper.favoriteCount || 0) * 0.2;
  const citationScore = (paper.citationCount || 0) * 0.4;
  const timeDecay = calculateTimeDecay(paper.publishedDate);
  const baseScore = viewScore + favoriteScore + citationScore;
  return baseScore * timeDecay;
}

/**
 * 计算视频热度分数（与discovery.service.ts保持一致）
 */
function calculateVideoHotScore(video: any): number {
  const playScore = (video.playCount || 0) * 0.4;
  const viewScore = (video.viewCount || 0) * 0.2;
  const favoriteScore = (video.favoriteCount || 0) * 0.2;
  const timeDecay = calculateTimeDecay(video.publishedDate);
  const baseScore = playScore + viewScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算GitHub仓库热度分数（与discovery.service.ts保持一致）
 */
function calculateRepoHotScore(repo: any): number {
  const starsScore = (repo.starsCount || 0) * 0.5;
  const forksScore = (repo.forksCount || 0) * 0.2;
  const favoriteScore = (repo.favoriteCount || 0) * 0.1;
  const timeDecay = calculateTimeDecay(repo.updatedDate, 60);
  const baseScore = starsScore + forksScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算HuggingFace模型热度分数（与discovery.service.ts保持一致）
 */
function calculateModelHotScore(model: any): number {
  const downloadsScore = (model.downloads || 0) * 0.5;
  const likesScore = (model.likes || 0) * 0.2;
  const favoriteScore = (model.favoriteCount || 0) * 0.1;
  const timeDecay = calculateTimeDecay(model.lastModified, 45);
  const baseScore = downloadsScore + likesScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算时间衰减因子（与discovery.service.ts保持一致）
 */
function calculateTimeDecay(date: Date | string | null, halfLifeDays: number = 30): number {
  if (!date) return 0.1;
  const now = new Date();
  const publishDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(publishDate.getTime())) return 0.1;
  const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublish < 0) return 1.0;
  if (daysSincePublish === 0) return 1.0;
  const decay = Math.pow(2, -daysSincePublish / halfLifeDays);
  return Math.max(decay, 0.1);
}

/**
 * 获取最新内容
 */
async function getLatestItems(count: number): Promise<FeedItem[]> {
  const latestSplit = Math.max(1, Math.floor(count / 5));
  const [papers, videos, repos, jobs, models] = await Promise.all([
    prisma.paper.findMany({
      orderBy: { publishedDate: 'desc' },
      take: latestSplit,
    }),
    prisma.video.findMany({
      orderBy: { publishedDate: 'desc' },
      take: latestSplit,
    }),
    prisma.githubRepo.findMany({
      orderBy: { updatedDate: 'desc' },
      take: latestSplit,
    }),
    prisma.job.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: latestSplit,
    }),
    prisma.huggingFaceModel.findMany({
      orderBy: { lastModified: 'desc' },
      take: latestSplit,
    }),
  ]);

  return [
    ...papers.map(p => ({ 
      ...p, 
      type: 'paper' as const,
      // 添加外部链接所需字段
      arxivId: p.arxivId || null,
      pdfUrl: p.pdfUrl || null,
    })),
    ...videos.map(v => ({ 
      ...v, 
      type: 'video' as const,
      // 添加外部链接所需字段
      platform: v.platform || 'bilibili',
      videoId: v.videoId || '',
      bvid: (v as any).bvid || v.videoId || '',
    })),
    ...repos.map(r => ({ 
      ...r, 
      type: 'repo' as const, 
      title: r.name,
      // 添加外部链接所需字段
      htmlUrl: (r as any).htmlUrl || null,
      fullName: r.fullName || '',
    })),
    ...jobs.map(j => ({ 
      ...j, 
      type: 'job' as const,
      // 添加外部链接所需字段
      applyUrl: (j as any).applyUrl || null,
    })),
    ...models.map(m => ({ 
      ...m, 
      type: 'huggingface' as const, 
      title: m.fullName,
      // 添加外部链接所需字段
      fullName: m.fullName || '',
      hfId: m.fullName || '', // HuggingFace使用fullName作为ID
    })),
  ] as FeedItem[];
}

/**
 * 获取个性化推荐内容
 * 基于用户行为、收藏、浏览历史等进行推荐
 */
async function getPersonalizedItems(userId: string, count: number): Promise<FeedItem[]> {
  try {
    // 1. 获取用户的行为偏好
    const userPreferences = await getUserPreferences(userId);
    
    // 2. 获取用户收藏的内容类型和标签
    const favoriteContentTypes = await getUserFavoriteContentTypes(userId);
    const favoriteTags = await getUserFavoriteTags(userId);
    const favoriteAuthors = await getUserFavoriteAuthors(userId);
    
    // 3. 获取用户浏览历史（最近30天）
    const recentViews = await getUserRecentViews(userId, 30);
    
    // 4. 基于偏好获取推荐内容
    const recommendedItems: FeedItem[] = [];
    
    // 优先推荐用户喜欢的内容类型
    for (const contentType of favoriteContentTypes.slice(0, 3)) {
      const items = await getRecommendedByContentType(
        contentType,
        userId,
        Math.ceil(count / favoriteContentTypes.length),
        favoriteTags,
        favoriteAuthors
      );
      recommendedItems.push(...items);
    }
    
    // 如果推荐内容不足，补充基于浏览历史的推荐
    if (recommendedItems.length < count) {
      const historyBasedItems = await getRecommendedByHistory(
        userId,
        recentViews,
        count - recommendedItems.length
      );
      recommendedItems.push(...historyBasedItems);
    }
    
    // 5. 去重并按相关性排序
    const uniqueItems = deduplicateItems(recommendedItems);
    const scoredItems = uniqueItems.map(item => ({
      item,
      score: calculatePersonalizationScore(item, userPreferences, favoriteTags, favoriteAuthors),
    }));
    
    scoredItems.sort((a, b) => b.score - a.score);
    
    // 返回前count个
    return scoredItems.slice(0, count).map(s => s.item);
  } catch (error) {
    logger.error('Get personalized items error:', error);
    // 如果个性化推荐失败，返回最新内容作为降级方案
    return getLatestItems(count);
  }
}

/**
 * 获取用户偏好（基于行为统计）
 */
async function getUserPreferences(userId: string): Promise<{
  favoriteTypes: string[];
  favoriteTags: string[];
  favoriteAuthors: string[];
}> {
  try {
    // 获取用户最近的行为记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const actions = await prisma.userAction.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        actionType: { in: ['view', 'favorite', 'comment'] },
      },
      take: 1000,
    });
    
    // 统计内容类型偏好
    const typeCount: Record<string, number> = {};
    actions.forEach(action => {
      typeCount[action.contentType] = (typeCount[action.contentType] || 0) + 1;
    });
    
    const favoriteTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);
    
    return {
      favoriteTypes,
      favoriteTags: [],
      favoriteAuthors: [],
    };
  } catch (error) {
    logger.error('Get user preferences error:', error);
    return { favoriteTypes: [], favoriteTags: [], favoriteAuthors: [] };
  }
}

/**
 * 获取用户收藏的内容类型
 */
async function getUserFavoriteContentTypes(userId: string): Promise<string[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { contentType: true },
      distinct: ['contentType'],
      take: 10,
    });
    
    return favorites.map(f => f.contentType);
  } catch (error) {
    logger.error('Get user favorite content types error:', error);
    return [];
  }
}

/**
 * 获取用户收藏的标签
 */
async function getUserFavoriteTags(userId: string): Promise<string[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      take: 50,
    });
    
    const tagCount: Record<string, number> = {};
    
    for (const fav of favorites) {
      // 根据内容类型获取标签
      let tags: string[] = [];
      try {
        switch (fav.contentType) {
          case 'paper':
            const paper = await prisma.paper.findUnique({ where: { id: fav.contentId } });
            if (paper?.categories) {
              tags = JSON.parse(paper.categories);
            }
            break;
          case 'repo':
            const repo = await prisma.githubRepo.findUnique({ where: { id: fav.contentId } });
            if (repo?.topics) {
              tags = JSON.parse(repo.topics);
            }
            break;
          case 'job':
            const job = await prisma.job.findUnique({ where: { id: fav.contentId } });
            if (job?.tags) {
              tags = JSON.parse(job.tags);
            }
            break;
        }
        
        tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  } catch (error) {
    logger.error('Get user favorite tags error:', error);
    return [];
  }
}

/**
 * 获取用户收藏的作者
 */
async function getUserFavoriteAuthors(userId: string): Promise<string[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        contentType: 'paper',
      },
      take: 50,
    });
    
    const authorCount: Record<string, number> = {};
    
    for (const fav of favorites) {
      try {
        const paper = await prisma.paper.findUnique({ where: { id: fav.contentId } });
        if (paper?.authors) {
          const authors = JSON.parse(paper.authors);
          authors.forEach((author: string) => {
            authorCount[author] = (authorCount[author] || 0) + 1;
          });
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    return Object.entries(authorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([author]) => author);
  } catch (error) {
    logger.error('Get user favorite authors error:', error);
    return [];
  }
}

/**
 * 获取用户最近浏览记录
 */
async function getUserRecentViews(userId: string, days: number): Promise<Array<{ contentType: string; contentId: string }>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const views = await prisma.userAction.findMany({
      where: {
        userId,
        actionType: 'view',
        createdAt: { gte: startDate },
      },
      select: {
        contentType: true,
        contentId: true,
      },
      distinct: ['contentType', 'contentId'],
      take: 100,
    });
    
    return views;
  } catch (error) {
    logger.error('Get user recent views error:', error);
    return [];
  }
}

/**
 * 根据内容类型获取推荐
 */
async function getRecommendedByContentType(
  contentType: string,
  userId: string,
  count: number,
  favoriteTags: string[],
  favoriteAuthors: string[]
): Promise<FeedItem[]> {
  try {
    let items: FeedItem[] = [];
    
    switch (contentType) {
      case 'paper':
        const papers = await prisma.paper.findMany({
          take: count * 2,
          orderBy: { publishedDate: 'desc' },
        });
        items = papers.map(p => ({
          id: p.id,
          type: 'paper' as const,
          title: p.title,
          coverUrl: undefined,
          publishedDate: p.publishedDate || undefined,
          viewCount: p.viewCount,
          favoriteCount: p.favoriteCount,
          shareCount: p.shareCount || 0,
          authors: p.authors,
          abstract: p.abstract || undefined,
          citationCount: p.citationCount || undefined,
        }));
        break;
      case 'video':
        const videos = await prisma.video.findMany({
          take: count * 2,
          orderBy: { publishedDate: 'desc' },
        });
        items = videos.map(v => ({
          id: v.id,
          type: 'video' as const,
          title: v.title,
          coverUrl: v.coverUrl || undefined,
          publishedDate: v.publishedDate || undefined,
          viewCount: v.viewCount,
          favoriteCount: v.favoriteCount,
          shareCount: 0,
          duration: v.duration || undefined,
          uploader: v.uploader || undefined,
          playCount: v.playCount || undefined,
        }));
        break;
      case 'repo':
        const repos = await prisma.githubRepo.findMany({
          take: count * 2,
          orderBy: { updatedDate: 'desc' },
        });
        items = repos.map(r => ({
          id: r.id,
          type: 'repo' as const,
          title: r.name,
          coverUrl: undefined,
          publishedDate: r.updatedDate || undefined,
          viewCount: r.viewCount,
          favoriteCount: r.favoriteCount,
          shareCount: 0,
          language: r.language || undefined,
          starsCount: r.starsCount || undefined,
        }));
        break;
      case 'job':
        const jobs = await prisma.job.findMany({
          where: { status: 'open' },
          take: count * 2,
          orderBy: { createdAt: 'desc' },
        });
        items = jobs.map(j => ({
          id: j.id,
          type: 'job' as const,
          title: j.title,
          coverUrl: undefined,
          publishedDate: j.createdAt || undefined,
          viewCount: j.viewCount,
          favoriteCount: j.favoriteCount,
          shareCount: 0,
          company: j.company || undefined,
          location: j.location || undefined,
          salaryMin: j.salaryMin || undefined,
          salaryMax: j.salaryMax || undefined,
        }));
        break;
      case 'huggingface':
        const models = await prisma.huggingFaceModel.findMany({
          take: count * 2,
          orderBy: { lastModified: 'desc' },
        });
        items = models.map(m => ({
          id: m.id,
          type: 'huggingface' as const,
          title: m.fullName,
          coverUrl: undefined,
          publishedDate: m.lastModified || undefined,
          viewCount: m.viewCount,
          favoriteCount: m.favoriteCount,
          shareCount: 0,
          task: m.task || undefined,
          downloads: m.downloads || undefined,
          likes: m.likes || undefined,
        }));
        break;
    }
    
    // 排除用户已收藏的内容
    const favoriteIds = await prisma.favorite.findMany({
      where: { userId, contentType },
      select: { contentId: true },
    });
    const favoriteIdSet = new Set(favoriteIds.map(f => f.contentId));
    
    return items
      .filter(item => !favoriteIdSet.has(item.id))
      .slice(0, count);
  } catch (error) {
    logger.error(`Get recommended by content type error (${contentType}):`, error);
    return [];
  }
}

/**
 * 基于浏览历史获取推荐
 */
async function getRecommendedByHistory(
  userId: string,
  recentViews: Array<{ contentType: string; contentId: string }>,
  count: number
): Promise<FeedItem[]> {
  // 简化实现：基于最近浏览的内容类型推荐相似内容
  if (recentViews.length === 0) {
    return [];
  }
  
  const contentTypeCount: Record<string, number> = {};
  recentViews.forEach(view => {
    contentTypeCount[view.contentType] = (contentTypeCount[view.contentType] || 0) + 1;
  });
  
  const mostViewedType = Object.entries(contentTypeCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  if (!mostViewedType) {
    return [];
  }
  
  return getRecommendedByContentType(mostViewedType, userId, count, [], []);
}

/**
 * 计算个性化推荐分数
 */
function calculatePersonalizationScore(
  item: FeedItem,
  preferences: { favoriteTypes: string[]; favoriteTags: string[]; favoriteAuthors: string[] },
  favoriteTags: string[],
  favoriteAuthors: string[]
): number {
  let score = 0;
  
  // 内容类型匹配
  if (preferences.favoriteTypes.includes(item.type)) {
    score += 10;
  }
  
  // 标签匹配
  if (item.type === 'paper' && item.authors) {
    const authors = Array.isArray(item.authors) ? item.authors : JSON.parse(item.authors as any);
    authors.forEach((author: string) => {
      if (favoriteAuthors.includes(author)) {
        score += 5;
      }
    });
  }
  
  // 热度加分
  score += Math.log(item.viewCount + 1) * 2;
  score += Math.log(item.favoriteCount + 1) * 3;
  
  // 时效性加分
  if (item.publishedDate) {
    const daysSincePublished = (Date.now() - new Date(item.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 7) {
      score += 5;
    } else if (daysSincePublished < 30) {
      score += 2;
    }
  }
  
  return score;
}

/**
 * 去重
 */
function deduplicateItems(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 打乱数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
