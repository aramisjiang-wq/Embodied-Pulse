/**
 * 发现服务
 * 提供最热/最新排序的数据支撑
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface DiscoveryParams {
  contentType?: 'all' | 'github' | 'huggingface' | 'video' | 'paper' | 'community' | 'news';
  sortType: 'hot' | 'latest';
  skip: number;
  take: number;
}

/**
 * 获取发现内容
 */
export async function getDiscoveryContent(params: DiscoveryParams) {
  try {
    // 验证参数
    if (!params || typeof params.skip !== 'number' || typeof params.take !== 'number') {
      throw new Error('Invalid parameters');
    }

    // 确保 skip 和 take 是有效的非负数
    const skip = Math.max(0, params.skip);
    const take = Math.max(1, Math.min(100, params.take)); // 限制最大值为 100
    const sortType = params.sortType || 'hot';

    const validatedParams = {
      ...params,
      skip,
      take,
      sortType,
    };

    if (params.contentType === 'community') {
      return await getCommunityPosts(validatedParams);
    }

    // 根据内容类型和排序类型获取数据
    switch (params.contentType) {
      case 'github':
        return await getGitHubRepos(validatedParams);
      case 'huggingface':
        return await getHuggingFaceModels(validatedParams);
      case 'video':
        return await getVideos(validatedParams);
      case 'paper':
        return await getPapersContent(validatedParams);
      case 'news':
        return await getNews(validatedParams);
      default:
        return await getAllContent(validatedParams);
    }
  } catch (error) {
    logger.error('Get discovery content error:', error);
    // 返回空结果而不是抛出错误，避免前端崩溃
    return {
      items: [],
      total: 0,
    };
  }
}

/**
 * 获取GitHub仓库（最热/最新）
 */
async function getGitHubRepos(params: DiscoveryParams) {
  try {
    let repos;
    const total = await prisma.githubRepo.count().catch(() => 0);

    if (params.sortType === 'hot') {
      // 最热：综合考虑stars、forks、更新时间衰减
      repos = await prisma.githubRepo.findMany({
        skip: params.skip,
        take: params.take * 2, // 多取一些，用于计算热度分数后排序
      }).catch(() => []);
      
      // 计算热度分数并排序
      repos = (repos || [])
        .map(r => ({
          ...r,
          hotScore: calculateRepoHotScore(r),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, params.take);
    } else {
      // 最新：按更新时间降序
      repos = await prisma.githubRepo.findMany({
        orderBy: { updatedDate: 'desc' as const },
        skip: params.skip,
        take: params.take,
      }).catch(() => []);
    }

    return {
      items: (repos || []).map(r => ({
        id: r.id || '',
        type: 'repo' as const,
        title: r.name || '',
        description: r.description || '',
        viewCount: r.viewCount || 0,
        favoriteCount: r.favoriteCount || 0,
        language: r.language || '',
        starsCount: r.starsCount || 0,
        forksCount: r.forksCount || 0,
        publishedDate: r.updatedDate || new Date(),
        // 添加外部链接所需字段
        htmlUrl: (r as any).htmlUrl || null,
        fullName: r.fullName || '',
      })),
      total,
    };
  } catch (error) {
    logger.error('Get GitHub repos error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * 获取HuggingFace模型（最热/最新）
 */
async function getHuggingFaceModels(params: DiscoveryParams) {
  try {
    let models;
    const total = await prisma.huggingFaceModel.count().catch(() => 0);

    if (params.sortType === 'hot') {
      // 最热：综合考虑downloads、likes、更新时间衰减
      models = await prisma.huggingFaceModel.findMany({
        skip: params.skip,
        take: params.take * 2, // 多取一些，用于计算热度分数后排序
      }).catch(() => []);
      
      // 计算热度分数并排序
      models = (models || [])
        .map(m => ({
          ...m,
          hotScore: calculateModelHotScore(m),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, params.take);
    } else {
      // 最新：按最后修改时间降序
      models = await prisma.huggingFaceModel.findMany({
        orderBy: { lastModified: 'desc' as const },
        skip: params.skip,
        take: params.take,
      }).catch(() => []);
    }

    return {
      items: (models || []).map(m => ({
        id: m.id || '',
        type: 'huggingface' as const,
        title: m.fullName || '',
        description: m.description || '',
        viewCount: m.viewCount || 0,
        favoriteCount: m.favoriteCount || 0,
        downloads: m.downloads || 0,
        likes: m.likes || 0,
        task: m.task || '',
        publishedDate: m.lastModified || new Date(),
        // 添加外部链接所需字段
        fullName: m.fullName || '',
        hfId: m.fullName || '', // HuggingFace使用fullName作为ID
      })),
      total,
    };
  } catch (error) {
    logger.error('Get HuggingFace models error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * 获取视频（最热/最新）
 */
async function getVideos(params: DiscoveryParams) {
  try {
    let videos;
    const total = await prisma.video.count().catch(() => 0);

    if (params.sortType === 'hot') {
      // 最热：综合考虑播放数、浏览量、收藏数、时间衰减
      videos = await prisma.video.findMany({
        skip: params.skip,
        take: params.take * 2, // 多取一些，用于计算热度分数后排序
      }).catch(() => []);
      
      // 计算热度分数并排序
      videos = (videos || [])
        .map(v => ({
          ...v,
          hotScore: calculateVideoHotScore(v),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, params.take);
    } else {
      // 最新：按发布日期降序
      videos = await prisma.video.findMany({
        orderBy: { publishedDate: 'desc' as const },
        skip: params.skip,
        take: params.take,
      }).catch(() => []);
    }

    return {
      items: (videos || []).map(v => ({
        id: v.id || '',
        type: 'video' as const,
        title: v.title || '',
        coverUrl: v.coverUrl || '',
        viewCount: v.viewCount || 0,
        favoriteCount: v.favoriteCount || 0,
        playCount: v.playCount || 0,
        uploader: v.uploader || '',
        duration: v.duration || 0,
        publishedDate: v.publishedDate || new Date(),
        // 添加外部链接所需字段
        platform: v.platform || 'bilibili',
        videoId: v.videoId || '',
        bvid: (v as any).bvid || v.videoId || '',
      })),
      total,
    };
  } catch (error) {
    logger.error('Get videos error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * 获取市集帖子（最热/最新）
 */
async function getCommunityPosts(params: DiscoveryParams) {
  try {
    let posts;
    const total = await prisma.post.count({ where: { status: 'active' } }).catch(() => 0);

    if (params.sortType === 'hot') {
      // 最热：综合考虑浏览量、点赞数、评论数、时间衰减
      posts = await prisma.post.findMany({
        where: { status: 'active' },
        skip: params.skip,
        take: params.take * 3, // 多取一些，用于计算热度分数后排序
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      }).catch(() => []);
      
      // 计算热度分数并排序
      posts = (posts || [])
        .map(post => ({
          ...post,
          hotScore: calculatePostHotScore(post),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, params.take);
    } else {
      // 最新：按创建时间降序
      posts = await prisma.post.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' as const },
        skip: params.skip,
        take: params.take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      }).catch(() => []);
    }

    return {
      items: posts || [],
      total,
    };
  } catch (error) {
    logger.error('Get community posts error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * 计算帖子热度分数（与post.service.ts保持一致）
 */
function calculatePostHotScore(post: any): number {
  const viewScore = (post.viewCount || 0) * 0.3;
  const likeScore = (post.likeCount || 0) * 0.4; // 点赞数权重最高
  const commentScore = (post.commentCount || 0) * 0.2;
  
  // 时间衰减因子（市集帖子时效性很重要，使用较短的衰减周期）
  const timeDecay = calculateTimeDecay(post.createdAt, 7); // 7天衰减周期
  
  const baseScore = viewScore + likeScore + commentScore;
  return baseScore * timeDecay;
}

/**
 * 获取所有内容（混合）
 */
async function getAllContent(params: DiscoveryParams) {
  const fetchCount = params.skip + params.take;
  const splitCount = Math.max(1, Math.ceil(fetchCount / 5));
  
  // 优化：根据分页位置调整获取的数据量
  const isEarlyPage = params.skip < 100;
  const multiplier = isEarlyPage ? 2 : 1.5;
  
  // 计算每个数据源应该获取的数量
  const perSourceTake = Math.ceil(splitCount * multiplier);
  
  // 根据当前页码计算每个数据源应该跳过的数量
  const perSourceSkip = Math.floor(params.skip / 5);
  
  // 使用 Promise.allSettled 确保某个数据源失败不会导致整个请求失败
  const results = await Promise.allSettled([
    getPapersWithPagination(params.sortType, perSourceTake, perSourceSkip),
    getVideosWithPagination(params.sortType, perSourceTake, perSourceSkip),
    getGitHubReposWithPagination(params.sortType, perSourceTake, perSourceSkip),
    getHuggingFaceModelsWithPagination(params.sortType, perSourceTake, perSourceSkip),
    getJobsWithPagination(params.sortType, perSourceTake, perSourceSkip),
    getNewsWithPagination(params.sortType, perSourceTake, perSourceSkip),
  ]);

  // 安全地提取 items，如果某个请求失败则使用空数组
  const papers = results[0].status === 'fulfilled' ? results[0].value : { items: [] };
  const videos = results[1].status === 'fulfilled' ? results[1].value : { items: [] };
  const repos = results[2].status === 'fulfilled' ? results[2].value : { items: [] };
  const models = results[3].status === 'fulfilled' ? results[3].value : { items: [] };
  const jobs = results[4].status === 'fulfilled' ? results[4].value : { items: [] };
  const news = results[5].status === 'fulfilled' ? results[5].value : { items: [] };

  // 合并所有内容，确保 items 是数组
  const allItems = [
    ...(Array.isArray(papers.items) ? papers.items : []),
    ...(Array.isArray(videos.items) ? videos.items : []),
    ...(Array.isArray(repos.items) ? repos.items : []),
    ...(Array.isArray(models.items) ? models.items : []),
    ...(Array.isArray(jobs.items) ? jobs.items : []),
    ...(Array.isArray(news.items) ? news.items : []),
  ];

  // 根据排序类型重新排序
  if (params.sortType === 'hot') {
    allItems.sort((a, b) => {
      try {
        const scoreA = calculateHotScore(a);
        const scoreB = calculateHotScore(b);
        return scoreB - scoreA;
      } catch (error) {
        logger.error('Error calculating hot score:', error);
        return 0;
      }
    });
  } else {
    allItems.sort((a: any, b: any) => {
      try {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        logger.error('Error sorting by date:', error);
        return 0;
      }
    });
  }

  // 计算总数
  const totalResults = await Promise.allSettled([
    prisma.paper.count(),
    prisma.video.count(),
    prisma.githubRepo.count(),
    prisma.huggingFaceModel.count(),
    prisma.job.count({ where: { status: 'open' } }),
    prisma.news.count(),
  ]);

  const papersTotal = totalResults[0].status === 'fulfilled' ? totalResults[0].value : 0;
  const videosTotal = totalResults[1].status === 'fulfilled' ? totalResults[1].value : 0;
  const reposTotal = totalResults[2].status === 'fulfilled' ? totalResults[2].value : 0;
  const modelsTotal = totalResults[3].status === 'fulfilled' ? totalResults[3].value : 0;
  const jobsTotal = totalResults[4].status === 'fulfilled' ? totalResults[4].value : 0;
  const newsTotal = totalResults[5].status === 'fulfilled' ? totalResults[5].value : 0;
  const total = papersTotal + videosTotal + reposTotal + modelsTotal + jobsTotal + newsTotal;

  // 安全地切片，确保不会越界
  const start = Math.max(0, params.skip);
  const end = Math.min(allItems.length, start + params.take);

  return {
    items: allItems.slice(start, end),
    total,
  };
}

/**
 * 获取论文（带分页，用于getAllContent）
 */
async function getPapersWithPagination(sortType: 'hot' | 'latest', take: number, skip: number) {
  try {
    let papers;

    if (sortType === 'hot') {
      papers = await prisma.paper.findMany({
        skip: skip,
        take: take * 2,
      }).catch(() => []);
      
      papers = (papers || [])
        .map(p => ({
          ...p,
          hotScore: calculatePaperHotScore(p),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      papers = await prisma.paper.findMany({
        orderBy: { publishedDate: 'desc' as const },
        skip: skip,
        take,
      }).catch(() => []);
    }

    return {
      items: (papers || []).map(p => ({
        id: p.id || '',
        type: 'paper' as const,
        title: p.title || '',
        abstract: p.abstract || '',
        viewCount: p.viewCount || 0,
        favoriteCount: p.favoriteCount || 0,
        citationCount: p.citationCount || 0,
        authors: Array.isArray(p.authors) ? p.authors : [],
        publishedDate: p.publishedDate || new Date(),
      })),
    };
  } catch (error) {
    logger.error('Get papers error:', error);
    return { items: [] };
  }
}

/**
 * 获取视频（带分页，用于getAllContent）
 */
async function getVideosWithPagination(sortType: 'hot' | 'latest', take: number, skip: number) {
  try {
    let videos;

    if (sortType === 'hot') {
      videos = await prisma.video.findMany({
        skip: skip,
        take: take * 2,
      }).catch(() => []);
      
      videos = (videos || [])
        .map(v => ({
          ...v,
          hotScore: calculateVideoHotScore(v),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      videos = await prisma.video.findMany({
        orderBy: { publishedDate: 'desc' as const },
        skip: skip,
        take,
      }).catch(() => []);
    }

    return {
      items: (videos || []).map(v => ({
        id: v.id || '',
        type: 'video' as const,
        title: v.title || '',
        coverUrl: v.coverUrl || '',
        viewCount: v.viewCount || 0,
        favoriteCount: v.favoriteCount || 0,
        playCount: v.playCount || 0,
        uploader: v.uploader || '',
        duration: v.duration || 0,
        publishedDate: v.publishedDate || new Date(),
      })),
    };
  } catch (error) {
    logger.error('Get videos error:', error);
    return { items: [] };
  }
}

/**
 * 获取GitHub仓库（带分页，用于getAllContent）
 */
async function getGitHubReposWithPagination(sortType: 'hot' | 'latest', take: number, skip: number) {
  try {
    let repos;

    if (sortType === 'hot') {
      repos = await prisma.githubRepo.findMany({
        skip: skip,
        take: take * 2,
      }).catch(() => []);
      
      repos = (repos || [])
        .map(r => ({
          ...r,
          hotScore: calculateRepoHotScore(r),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      repos = await prisma.githubRepo.findMany({
        orderBy: { updatedDate: 'desc' as const },
        skip: skip,
        take,
      }).catch(() => []);
    }

    return {
      items: (repos || []).map(r => ({
        id: r.id || '',
        type: 'repo' as const,
        title: r.name || '',
        description: r.description || '',
        viewCount: r.viewCount || 0,
        favoriteCount: r.favoriteCount || 0,
        language: r.language || '',
        starsCount: r.starsCount || 0,
        forksCount: r.forksCount || 0,
        publishedDate: r.updatedDate || new Date(),
      })),
    };
  } catch (error) {
    logger.error('Get GitHub repos error:', error);
    return { items: [] };
  }
}

/**
 * 获取HuggingFace模型（带分页，用于getAllContent）
 */
async function getHuggingFaceModelsWithPagination(sortType: 'hot' | 'latest', take: number, skip: number) {
  try {
    let models;

    if (sortType === 'hot') {
      models = await prisma.huggingFaceModel.findMany({
        skip: skip,
        take: take * 2,
      }).catch(() => []);
      
      models = (models || [])
        .map(m => ({
          ...m,
          hotScore: calculateModelHotScore(m),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      models = await prisma.huggingFaceModel.findMany({
        orderBy: { lastModified: 'desc' as const },
        skip: skip,
        take,
      }).catch(() => []);
    }

    return {
      items: (models || []).map(m => ({
        id: m.id || '',
        type: 'huggingface' as const,
        title: m.fullName || '',
        description: m.description || '',
        viewCount: m.viewCount || 0,
        favoriteCount: m.favoriteCount || 0,
        downloads: m.downloads || 0,
        likes: m.likes || 0,
        task: m.task || '',
        publishedDate: m.lastModified || new Date(),
      })),
    };
  } catch (error) {
    logger.error('Get HuggingFace models error:', error);
    return { items: [] };
  }
}

/**
 * 获取岗位（带分页，用于getAllContent）
 */
async function getJobsWithPagination(sortType: 'hot' | 'latest', take: number, skip: number) {
  try {
    let jobs;

    if (sortType === 'hot') {
      jobs = await prisma.job.findMany({
        where: { status: 'open' },
        skip: skip,
        take: take * 2,
      }).catch(() => []);
      
      jobs = (jobs || [])
        .map(j => ({
          ...j,
          hotScore: calculateJobHotScore(j),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      jobs = await prisma.job.findMany({
        where: { status: 'open' },
        orderBy: { createdAt: 'desc' as const },
        skip: skip,
        take,
      }).catch(() => []);
    }

    return {
      items: (jobs || []).map(j => ({
        id: j.id || '',
        type: 'job' as const,
        title: j.title || '',
        company: j.company || '',
        location: j.location || '',
        salaryMin: j.salaryMin || 0,
        salaryMax: j.salaryMax || 0,
        viewCount: j.viewCount || 0,
        favoriteCount: j.favoriteCount || 0,
        publishedDate: j.createdAt || new Date(),
      })),
    };
  } catch (error) {
    logger.error('Get jobs error:', error);
    return { items: [] };
  }
}

/**
 * 获取新闻（带分页，用于getAllContent）
 */
async function getNewsWithPagination(sortType: 'hot' | 'latest', take: number, skip: number) {
  try {
    let newsItems;

    if (sortType === 'hot') {
      newsItems = await prisma.news.findMany({
        skip: skip,
        take: take * 2,
      }).catch(() => []);
      
      newsItems = (newsItems || [])
        .map(n => ({
          ...n,
          hotScore: calculateNewsHotScore(n),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      newsItems = await prisma.news.findMany({
        orderBy: { publishedDate: 'desc' as const },
        skip: skip,
        take,
      }).catch(() => []);
    }

    return {
      items: (newsItems || []).map(n => ({
        id: n.id || '',
        type: 'news' as const,
        title: n.title || '',
        description: n.summary || '',
        viewCount: n.viewCount || 0,
        favoriteCount: n.likeCount || 0,
        publishedDate: n.publishedDate || new Date(),
      })),
    };
  } catch (error) {
    logger.error('Get news error:', error);
    return { items: [] };
  }
}

/**
 * 获取论文（最热/最新）
 */
async function getPapersContent(params: DiscoveryParams) {
  try {
    let papers;
    const total = await prisma.paper.count().catch(() => 0);

    if (params.sortType === 'hot') {
      // 最热：综合考虑浏览量、收藏数、引用数、时间衰减
      papers = await prisma.paper.findMany({
        skip: params.skip,
        take: params.take * 2, // 多取一些，用于计算热度分数后排序
      }).catch(() => []);
      
      // 计算热度分数并排序
      papers = (papers || [])
        .map(p => ({
          ...p,
          hotScore: calculatePaperHotScore(p),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, params.take);
    } else {
      // 最新：按发布日期降序
      papers = await prisma.paper.findMany({
        orderBy: { publishedDate: 'desc' as const },
        skip: params.skip,
        take: params.take,
      }).catch(() => []);
    }

    return {
      items: (papers || []).map(p => ({
        id: p.id || '',
        type: 'paper' as const,
        title: p.title || '',
        abstract: p.abstract || '',
        viewCount: p.viewCount || 0,
        favoriteCount: p.favoriteCount || 0,
        citationCount: p.citationCount || 0,
        authors: Array.isArray(p.authors) ? p.authors : [],
        publishedDate: p.publishedDate || new Date(),
        // 添加外部链接所需字段
        arxivId: p.arxivId || null,
        pdfUrl: p.pdfUrl || null,
      })),
      total,
    };
  } catch (error) {
    logger.error('Get papers content error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * 获取论文（用于getAllContent）
 */
async function getPapers(sortType: 'hot' | 'latest', take: number) {
  try {
    let papers;

    if (sortType === 'hot') {
      // 最热：综合考虑浏览量、收藏数、引用数、时间衰减
      papers = await prisma.paper.findMany({
        take: take * 2, // 多取一些，用于计算热度分数后排序
      }).catch(() => []);
      
      // 计算热度分数并排序
      papers = (papers || [])
        .map(p => ({
          ...p,
          hotScore: calculatePaperHotScore(p),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      // 最新：按发布日期降序
      papers = await prisma.paper.findMany({
        orderBy: { publishedDate: 'desc' as const },
        take,
      }).catch(() => []);
    }

    return {
      items: (papers || []).map(p => ({
        id: p.id || '',
        type: 'paper' as const,
        title: p.title || '',
        abstract: p.abstract || '',
        viewCount: p.viewCount || 0,
        favoriteCount: p.favoriteCount || 0,
        citationCount: p.citationCount || 0,
        authors: Array.isArray(p.authors) ? p.authors : [],
        publishedDate: p.publishedDate || new Date(),
        // 添加外部链接所需字段
        arxivId: p.arxivId || null,
        pdfUrl: p.pdfUrl || null,
      })),
    };
  } catch (error) {
    logger.error('Get papers error:', error);
    return { items: [] };
  }
}

/**
 * 获取岗位
 */
async function getJobs(sortType: 'hot' | 'latest', take: number) {
  try {
    let jobs;

    if (sortType === 'hot') {
      // 最热：综合考虑浏览量、收藏数、时间衰减
      jobs = await prisma.job.findMany({
        where: { status: 'open' },
        take: take * 2, // 多取一些，用于计算热度分数后排序
      }).catch(() => []);
      
      // 计算热度分数并排序
      jobs = (jobs || [])
        .map(j => ({
          ...j,
          hotScore: calculateJobHotScore(j),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, take);
    } else {
      // 最新：按创建时间降序
      jobs = await prisma.job.findMany({
        where: { status: 'open' },
        orderBy: { createdAt: 'desc' as const },
        take,
      }).catch(() => []);
    }

    return {
      items: (jobs || []).map(j => ({
        id: j.id || '',
        type: 'job' as const,
        title: j.title || '',
        company: j.company || '',
        location: j.location || '',
        salaryMin: j.salaryMin || 0,
        salaryMax: j.salaryMax || 0,
        viewCount: j.viewCount || 0,
        favoriteCount: j.favoriteCount || 0,
        publishedDate: j.createdAt || new Date(),
        // 添加外部链接所需字段（如果数据库有applyUrl字段）
        applyUrl: (j as any).applyUrl || null,
      })),
    };
  } catch (error) {
    logger.error('Get jobs error:', error);
    return { items: [] };
  }
}

/**
 * 计算热度分数（通用，用于混合内容）
 * 综合浏览量、点赞数、评论数、分享数、收藏数，加入时间衰减因子
 */
function calculateHotScore(item: any): number {
  const viewScore = (item.viewCount || 0) * 0.25;
  const likeScore = (item.likeCount || item.favoriteCount || 0) * 0.25;
  const commentScore = (item.commentCount || 0) * 0.15;
  const shareScore = (item.shareCount || 0) * 0.1;
  const favoriteScore = (item.favoriteCount || 0) * 0.1;
  
  // 特殊处理：GitHub用stars，HuggingFace用downloads，论文用citationCount
  const specialScore = 
    (item.starsCount || 0) * 0.3 + 
    (item.downloads || 0) * 0.2 + 
    (item.citationCount || 0) * 0.15;
  
  // 时间衰减因子：越新的内容分数越高
  const timeDecay = calculateTimeDecay(item.publishedDate || item.createdAt || item.updatedDate);
  
  const baseScore = viewScore + likeScore + commentScore + shareScore + favoriteScore + specialScore;
  return baseScore * timeDecay;
}

/**
 * 计算论文热度分数
 * 综合考虑浏览量、收藏数、引用数、时间衰减
 */
function calculatePaperHotScore(paper: any): number {
  const viewScore = (paper.viewCount || 0) * 0.2;
  const favoriteScore = (paper.favoriteCount || 0) * 0.2;
  const citationScore = (paper.citationCount || 0) * 0.4; // 引用数权重最高
  
  // 时间衰减因子
  const timeDecay = calculateTimeDecay(paper.publishedDate);
  
  const baseScore = viewScore + favoriteScore + citationScore;
  return baseScore * timeDecay;
}

/**
 * 计算视频热度分数
 * 综合考虑播放数、浏览量、收藏数、时间衰减
 */
function calculateVideoHotScore(video: any): number {
  const playScore = (video.playCount || 0) * 0.4; // 播放数权重最高
  const viewScore = (video.viewCount || 0) * 0.2;
  const favoriteScore = (video.favoriteCount || 0) * 0.2;
  
  // 时间衰减因子
  const timeDecay = calculateTimeDecay(video.publishedDate);
  
  const baseScore = playScore + viewScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算岗位热度分数
 * 综合考虑浏览量、收藏数、时间衰减
 */
function calculateJobHotScore(job: any): number {
  const viewScore = (job.viewCount || 0) * 0.4;
  const favoriteScore = (job.favoriteCount || 0) * 0.3;
  
  // 时间衰减因子（岗位时效性更重要）
  const timeDecay = calculateTimeDecay(job.createdAt, 7); // 7天衰减周期
  
  const baseScore = viewScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算GitHub仓库热度分数
 * 综合考虑stars、forks、更新时间衰减
 */
function calculateRepoHotScore(repo: any): number {
  const starsScore = (repo.starsCount || 0) * 0.5; // stars权重最高
  const forksScore = (repo.forksCount || 0) * 0.2;
  const favoriteScore = (repo.favoriteCount || 0) * 0.1;
  
  // 时间衰减因子（GitHub项目活跃度更重要，使用更长的衰减周期）
  const timeDecay = calculateTimeDecay(repo.updatedDate, 60); // 60天衰减周期
  
  const baseScore = starsScore + forksScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算HuggingFace模型热度分数
 * 综合考虑downloads、likes、更新时间衰减
 */
function calculateModelHotScore(model: any): number {
  const downloadsScore = (model.downloads || 0) * 0.5; // downloads权重最高
  const likesScore = (model.likes || 0) * 0.2;
  const favoriteScore = (model.favoriteCount || 0) * 0.1;
  
  // 时间衰减因子
  const timeDecay = calculateTimeDecay(model.lastModified, 45); // 45天衰减周期
  
  const baseScore = downloadsScore + likesScore + favoriteScore;
  return baseScore * timeDecay;
}

/**
 * 计算时间衰减因子
 * 使用指数衰减：新内容分数更高，老内容分数逐渐降低
 * @param date 发布日期
 * @param halfLifeDays 半衰期（天数），默认30天
 * @returns 衰减因子（0-1之间）
 */
function calculateTimeDecay(date: Date | string | null, halfLifeDays: number = 30): number {
  if (!date) return 0.1; // 没有日期的内容分数很低
  
  const now = new Date();
  const publishDate = typeof date === 'string' ? new Date(date) : date;
  
  // 处理无效日期
  if (isNaN(publishDate.getTime())) return 0.1;
  
  const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSincePublish < 0) return 1.0; // 未来日期，不衰减
  if (daysSincePublish === 0) return 1.0; // 今天发布，不衰减
  
  // 指数衰减公式：decay = 2^(-days/halfLife)
  // 30天后分数减半，60天后分数为1/4，以此类推
  const decay = Math.pow(2, -daysSincePublish / halfLifeDays);
  
  // 确保最小值为0.1，避免完全消失
  return Math.max(decay, 0.1);
}

/**
 * 获取新闻（最热/最新）
 * 只返回与具身智能、机器人、AI相关的新闻
 */
async function getNews(params: DiscoveryParams) {
  try {
    // 导入智能筛选函数
    const { calculateRelevanceScore } = await import('./sync/smart-news-filter.sync');
    
    let allNews;
    const allNewsCount = await userPrisma.news.count().catch(() => 0);

    if (params.sortType === 'hot') {
      // 最热：综合考虑浏览量、收藏数、热度评分、时间衰减
      // 多取一些数据，用于筛选和计算热度分数
      allNews = await userPrisma.news.findMany({
        skip: params.skip,
        take: params.take * 5, // 多取5倍数据，因为筛选后会减少
      }).catch(() => []);
    } else {
      // 最新：按发布日期降序
      // 多取一些数据，用于筛选
      allNews = await userPrisma.news.findMany({
        orderBy: { publishedDate: 'desc' as const },
        skip: params.skip,
        take: params.take * 5, // 多取5倍数据，因为筛选后会减少
      }).catch(() => []);
    }

    // 筛选出相关新闻（具身智能、机器人、AI相关）
    // 最低匹配分数设为5，确保只显示真正相关的新闻
    const relevantNews = allNews.filter(news => {
      // 检查是否已标记为相关
      const description = news.description || '';
      const isMarked = description.includes('[AI相关]');
      
      // 如果已标记，直接返回
      if (isMarked) {
        return true;
      }
      
      // 否则实时计算相关性分数
      const score = calculateRelevanceScore(news);
      return score >= 8; // 提高最低分数到8，确保只显示真正相关的新闻
    });

    let news;
    if (params.sortType === 'hot') {
      // 计算热度分数并排序
      news = relevantNews
        .map(n => ({
          ...n,
          hotScore: calculateNewsHotScore(n),
        }))
        .sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0))
        .slice(0, params.take);
    } else {
      // 最新：按发布日期降序（已经是降序，直接切片）
      news = relevantNews.slice(0, params.take);
    }

    // 计算相关新闻的总数（用于分页）
    // 这里我们使用一个近似值：相关新闻数量 = 筛选后的数量
    // 如果需要精确值，需要查询所有新闻并筛选，但这样性能较差
    const total = relevantNews.length;

    return {
      items: (news || []).map((n: any) => ({
        id: n.id || '',
        type: 'news' as const,
        title: n.title || '',
        description: n.description || '',
        platform: n.platform || '',
        url: n.url || '',
        score: n.score || '',
        view_count: n.view_count || n.viewCount || 0,
        favorite_count: n.favorite_count || n.favoriteCount || 0,
        published_date: n.published_date || n.publishedDate || n.created_at || n.createdAt || new Date(),
      })),
      total,
    };
  } catch (error) {
    logger.error('Get news error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * 计算新闻热度分数
 * 综合考虑浏览量、收藏数、热度评分、时间衰减
 */
function calculateNewsHotScore(news: any): number {
  const viewScore = (news.viewCount || 0) * 0.3;
  const favoriteScore = (news.favoriteCount || 0) * 0.2;
  // 热度评分（score字段可能是字符串，需要转换）
  const scoreValue = news.score ? parseFloat(String(news.score)) || 0 : 0;
  const scoreWeight = scoreValue * 0.3;
  
  // 时间衰减因子（新闻时效性很重要，使用较短的衰减周期）
  const timeDecay = calculateTimeDecay(news.publishedDate || news.createdAt, 3); // 3天衰减周期
  
  const baseScore = viewScore + favoriteScore + scoreWeight;
  return baseScore * timeDecay;
}
