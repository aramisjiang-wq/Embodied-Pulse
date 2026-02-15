/**
 * 排行榜控制器
 */

import { Request, Response } from 'express';
import contentPrisma from '../config/database';
import userPrismaAny from '../config/database.user';
import { ApiError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';

const contentDb = contentPrisma;
const userPrisma = userPrismaAny as any;
const userDb = userPrisma;

/**
 * 获取热门帖子排行榜
 */
export const getHotPosts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const posts = await contentDb.post.findMany({
      where: { status: 'published' },
      orderBy: [
        { likeCount: 'desc' },
        { commentCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        contentType: true,
        contentId: true,
        userId: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const user = await userDb.user.findUnique({
          where: { id: post.userId },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        });

        return {
          ...post,
          user,
        };
      })
    );

    sendSuccess(res, enrichedPosts, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

/**
 * 获取活跃用户排行榜
 */
export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const users = await userDb.user.findMany({
      orderBy: [
        { points: 'desc' },
        { level: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        level: true,
        points: true,
        isVip: true,
        createdAt: true,
      },
    });

    const enrichedUsers = await Promise.all(
      users.map(async (user: any) => {
        const postCount = await contentDb.post.count({
          where: { userId: user.id, status: 'published' },
        });

        const commentCount = await contentDb.comment.count({
          where: { userId: user.id },
        });

        return {
          ...user,
          postCount,
          commentCount,
        };
      })
    );

    sendSuccess(res, enrichedUsers, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

/**
 * 获取热门论文排行榜
 */
export const getHotPapers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const papers = await contentDb.paper.findMany({
      orderBy: [
        { viewCount: 'desc' },
        { favoriteCount: 'desc' },
        { publishedDate: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        arxivId: true,
        title: true,
        authors: true,
        abstract: true,
        publishedDate: true,
        viewCount: true,
        favoriteCount: true,
        pdfUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, papers, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

/**
 * 获取热门视频排行榜
 */
export const getHotVideos = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const videos = await contentDb.video.findMany({
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { publishedDate: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        videoId: true,
        title: true,
        uploader: true,
        description: true,
        duration: true,
        viewCount: true,
        likeCount: true,
        publishedDate: true,
        coverUrl: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, videos, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

/**
 * 获取热门仓库排行榜
 */
export const getHotRepos = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const repos = await contentDb.githubRepo.findMany({
      orderBy: [
        { starsCount: 'desc' },
        { forksCount: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        repoId: true,
        fullName: true,
        name: true,
        owner: true,
        description: true,
        language: true,
        starsCount: true,
        forksCount: true,
        issuesCount: true,
        topics: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    sendSuccess(res, repos, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

/**
 * 获取综合排行榜
 */
export const getOverallRanking = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const [hotPosts, activeUsers, hotPapers, hotVideos, hotRepos] = await Promise.all([
      getHotPostsList(limit),
      getActiveUsersList(limit),
      getHotPapersList(limit),
      getHotVideosList(limit),
      getHotReposList(limit),
    ]);

    sendSuccess(res, {
      hotPosts,
      activeUsers,
      hotPapers,
      hotVideos,
      hotRepos,
    }, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

async function getHotPostsList(limit: number) {
  const posts = await contentDb.post.findMany({
    where: { status: 'published' },
    orderBy: [
      { likeCount: 'desc' },
      { commentCount: 'desc' },
      { viewCount: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      contentType: true,
      contentId: true,
      userId: true,
      likeCount: true,
      commentCount: true,
      viewCount: true,
      createdAt: true,
    },
  });

  return Promise.all(
    posts.map(async (post: any) => {
      const user = await userDb.user.findUnique({
        where: { id: post.userId },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      return { ...post, user };
    })
  );
}

async function getActiveUsersList(limit: number) {
  const users = await userDb.user.findMany({
    orderBy: [
      { points: 'desc' },
      { level: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      level: true,
      points: true,
      isVip: true,
      createdAt: true,
    },
  });

  return Promise.all(
    users.map(async (user: any) => {
      const postCount = await contentDb.post.count({
        where: { userId: user.id, status: 'published' },
      });

      const commentCount = await contentDb.comment.count({
        where: { userId: user.id },
      });

      return { ...user, postCount, commentCount };
    })
  );
}

async function getHotPapersList(limit: number) {
  return contentDb.paper.findMany({
    orderBy: [
      { viewCount: 'desc' },
      { favoriteCount: 'desc' },
      { publishedDate: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      arxivId: true,
      title: true,
      authors: true,
      abstract: true,
      publishedDate: true,
      viewCount: true,
      favoriteCount: true,
      pdfUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getHotVideosList(limit: number) {
  return contentDb.video.findMany({
    orderBy: [
      { viewCount: 'desc' },
      { likeCount: 'desc' },
      { publishedDate: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      videoId: true,
      title: true,
      uploader: true,
      description: true,
      duration: true,
      viewCount: true,
      likeCount: true,
      publishedDate: true,
      coverUrl: true,
      platform: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getHotReposList(limit: number) {
  return contentDb.githubRepo.findMany({
    orderBy: [
      { starsCount: 'desc' },
      { forksCount: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      repoId: true,
      fullName: true,
      name: true,
      owner: true,
      description: true,
      language: true,
      starsCount: true,
      forksCount: true,
      issuesCount: true,
      topics: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}
