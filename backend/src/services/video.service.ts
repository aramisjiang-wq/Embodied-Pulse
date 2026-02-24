/**
 * 视频服务
 */

import { Video } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { queryCache } from './query-cache.service';
import { Prisma } from '../../node_modules/.prisma/client-user';

const prisma = userPrisma;

export interface GetVideosParams {
  skip: number;
  take: number;
  sort?: 'latest' | 'hot' | 'play';
  platform?: string;
  keyword?: string;
  uploaderId?: string;
}

export async function getVideos(params: GetVideosParams): Promise<{ videos: Video[]; total: number }> {
  const cacheKey = queryCache.generateKey('videos', params);

  return queryCache.execute(
    cacheKey,
    async () => {
      try {
        const where: Prisma.VideoWhereInput = {};

        if (params.platform) {
          where.platform = params.platform;
        }

        if (params.uploaderId) {
          where.uploaderId = params.uploaderId;
        }

        if (params.keyword) {
          where.OR = [
            { title: { contains: params.keyword } },
            { description: { contains: params.keyword } },
          ];
        }

        let orderBy: Prisma.VideoOrderByWithRelationInput = {};
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
      } catch (error: unknown) {
        const err = error as Error & { code?: string; meta?: unknown };
        logger.error('Get videos error:', {
          error: err.message,
          code: err.code,
          meta: err.meta,
          stack: err.stack,
        });
        // 任何数据库/缓存异常都返回空结果，避免 500
        return { videos: [], total: 0 };
      }
    },
    { ttl: 180 }
  );
}

export interface CreateVideoInput {
  platform?: string;
  videoId?: string;
  bvid?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number | null;
  uploader?: string;
  uploaderId?: string;
  publishedDate?: Date;
  viewCount?: number;
  playCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  tags?: string | string[];
  category?: string;
  platformId?: string;
}

export async function createVideo(data: CreateVideoInput): Promise<Video> {
  try {
    const bvid = data.bvid || data.videoId || data.platformId || '';
    const videoId = data.videoId || data.bvid || data.platformId || '';
    
    const existing = bvid ? await prisma.video.findFirst({
      where: {
        OR: [
          { bvid: bvid },
          { videoId: videoId },
        ],
      },
    }) : null;
    
    const tagsValue = data.tags 
      ? (Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags)
      : null;
    
    if (existing) {
      const video = await prisma.video.update({
        where: { id: existing.id },
        data: {
          platform: data.platform || existing.platform,
          videoId: videoId,
          bvid: bvid || null,
          title: data.title,
          description: data.description,
          coverUrl: data.coverUrl || data.thumbnailUrl,
          duration: data.duration !== undefined && data.duration !== null ? Number(data.duration) : existing.duration,
          uploader: data.uploader,
          uploaderId: data.uploaderId,
          publishedDate: data.publishedDate,
          viewCount: data.viewCount !== undefined ? Number(data.viewCount) : existing.viewCount,
          playCount: data.playCount !== undefined ? Number(data.playCount) : existing.playCount,
          likeCount: data.likeCount !== undefined ? Number(data.likeCount) : existing.likeCount,
          favoriteCount: data.favoriteCount !== undefined ? Number(data.favoriteCount) : existing.favoriteCount,
          tags: tagsValue,
        },
      });
      logger.info(`Video updated: ${bvid}`);
      return video;
    } else {
      const video = await prisma.video.create({
        data: {
          platform: data.platform || 'bilibili',
          videoId: videoId,
          bvid: bvid || null,
          title: data.title,
          description: data.description,
          coverUrl: data.coverUrl || data.thumbnailUrl,
          duration: data.duration ? Number(data.duration) : null,
          uploader: data.uploader,
          uploaderId: data.uploaderId,
          publishedDate: data.publishedDate,
          playCount: data.playCount || 0,
          viewCount: data.viewCount || 0,
          likeCount: data.likeCount || 0,
          favoriteCount: data.favoriteCount || 0,
          tags: tagsValue,
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

export async function getVideoById(videoId: string): Promise<Video | null> {
  try {
    return await prisma.video.findUnique({
      where: { id: videoId },
    });
  } catch (error) {
    logger.error('Get video by id error:', error);
    return null;
  }
}
