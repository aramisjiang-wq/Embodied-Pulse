/**
 * 视频服务
 */

import { Video } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { queryCache } from './query-cache.service';

const prisma = userPrisma;

export interface GetVideosParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'play';
  platform?: string;
  keyword?: string;
  uploaderId?: string; // UP主ID（Bilibili的mid）
}

export async function getVideos(params: GetVideosParams): Promise<{ videos: Video[]; total: number }> {
  const cacheKey = queryCache.generateKey('videos', params);

  return queryCache.execute(
    cacheKey,
    async () => {
      try {
        const where: any = {};

        if (params.platform) {
          where.platform = params.platform;
        }

        // 按UP主筛选
        if (params.uploaderId) {
          where.uploaderId = params.uploaderId;
        }

        // 关键词搜索（SQLite不支持mode: 'insensitive'，使用contains即可）
        if (params.keyword) {
          where.OR = [
            { title: { contains: params.keyword } },
            { description: { contains: params.keyword } },
          ];
        }

        let orderBy: any = {};
        switch (params.sort) {
          case 'play':
            orderBy = { playCount: 'desc' };
            break;
          case 'hot':
            orderBy = { viewCount: 'desc' };
            break;
          case 'latest':
          default:
            orderBy = { publishedDate: 'desc' };
            break;
        }

        const [videos, total] = await Promise.all([
          prisma.video.findMany({ where, orderBy, skip: params.skip, take: params.take }),
          prisma.video.count({ where }),
        ]);

        return { videos, total };
      } catch (error: any) {
        logger.error('Get videos error:', {
          error: error.message,
          code: error.code,
          meta: error.meta,
          stack: error.stack,
        });
        
        // 如果是表不存在或字段不存在错误，返回空结果而不是抛出错误
        if (error.code === 'P2021' || 
            error.code === 'P2022' ||
            error.message?.includes('does not exist') || 
            error.message?.includes('no such table') ||
            error.message?.includes('column') && error.message?.includes('does not exist')) {
          logger.warn('Video表或字段可能不存在，返回空结果');
          return { videos: [], total: 0 };
        }
        
        throw new Error('VIDEOS_FETCH_FAILED');
      }
    },
    180 as any
  );
}

export async function getVideoById(videoId: string): Promise<Video | null> {
  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (video) {
      await prisma.video.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
      });
    }
    return video;
  } catch (error) {
    logger.error('Get video by ID error:', error);
    throw new Error('VIDEO_FETCH_FAILED');
  }
}

export async function createVideo(data: any): Promise<Video> {
  try {
    // 用户端数据库使用bvid字段，从videoId或bvid获取
    const bvid = data.bvid || data.videoId || '';
    const videoId = data.videoId || data.bvid || '';
    
    // 先检查是否已存在（基于bvid去重）
    const existing = bvid ? await prisma.video.findFirst({
      where: {
        OR: [
          { bvid: bvid },
          { videoId: videoId },
        ],
      },
    }) : null;
    
    if (existing) {
      // 更新现有记录
      const video = await prisma.video.update({
        where: { id: existing.id },
        data: {
          platform: data.platform || 'bilibili',
          videoId: videoId,
          bvid: bvid || null,
          title: data.title,
          description: data.description,
          coverUrl: data.coverUrl,
          duration: data.duration !== undefined && data.duration !== null ? Number(data.duration) : existing.duration,
          uploader: data.uploader,
          uploaderId: data.uploaderId,
          publishedDate: data.publishedDate,
          viewCount: data.viewCount !== undefined ? Number(data.viewCount) : existing.viewCount,
          playCount: data.playCount !== undefined ? Number(data.playCount) : existing.playCount,
          likeCount: data.likeCount !== undefined ? Number(data.likeCount) : existing.likeCount,
        },
      });
      logger.info(`Video updated: ${bvid}`);
      return video;
    } else {
      // 创建新记录（用户端数据库schema）
      const video = await prisma.video.create({
        data: {
          platform: data.platform || 'bilibili',
          videoId: videoId,
          bvid: bvid || null,
          title: data.title,
          description: data.description,
          coverUrl: data.coverUrl,
          duration: data.duration ? Number(data.duration) : null,
          uploader: data.uploader,
          uploaderId: data.uploaderId,
          publishedDate: data.publishedDate,
          playCount: data.playCount || 0,
          viewCount: data.viewCount || 0,
          favoriteCount: data.favoriteCount || 0,
        },
      });
      logger.info(`Video created: ${bvid}`);
      return video;
    }
  } catch (error) {
    logger.error('Create video error:', error);
    throw new Error('VIDEO_CREATION_FAILED');
  }
}

export async function updateVideo(videoId: string, data: Partial<Video>): Promise<Video> {
  try {
    return await prisma.video.update({ where: { id: videoId }, data });
  } catch (error) {
    logger.error('Update video error:', error);
    throw new Error('VIDEO_UPDATE_FAILED');
  }
}

export async function deleteVideo(videoId: string): Promise<void> {
  try {
    await prisma.video.delete({ where: { id: videoId } });
  } catch (error) {
    logger.error('Delete video error:', error);
    throw new Error('VIDEO_DELETION_FAILED');
  }
}
