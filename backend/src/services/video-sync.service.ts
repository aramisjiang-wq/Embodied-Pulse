/**
 * 视频数据同步服务
 * 从B站API同步视频数据到用户端数据库
 */

import { BilibiliAPI, BilibiliAPIError } from './bilibili';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma as any;

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

interface VideoSyncResult {
  success: boolean;
  syncedVideos: number;
  updatedVideos: number;
  skippedVideos: number;
  errors: number;
  duration: number;
  uploaderId: string;
  uploaderName: string;
}

interface VideoSyncStats {
  total: number;
  synced: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * 同步单个UP主的视频数据
 */
export async function syncVideosForUploader(
  uploaderId: string,
  maxResults: number = 100
): Promise<VideoSyncResult> {
  const startTime = Date.now();
  const stats: VideoSyncStats = {
    total: 0,
    synced: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    const uploader = await prisma.bilibili_uploaders.findUnique({
      where: { id: uploaderId }
    });

    if (!uploader) {
      throw new Error(`UP主不存在: ${uploaderId}`);
    }

    if (!uploader.isActive) {
      logger.warn(`UP主未激活，跳过同步: ${uploader.name} (mid: ${uploader.mid})`);
      return {
        success: true,
        syncedVideos: 0,
        updatedVideos: 0,
        skippedVideos: 0,
        errors: 0,
        duration: Date.now() - startTime,
        uploaderId,
        uploaderName: uploader.name
      };
    }

    logger.info(`开始同步UP主视频: ${uploader.name} (mid: ${uploader.mid})`);

    const videos = await fetchUploaderVideosFromBilibili(
      uploader.mid,
      maxResults
    );

    stats.total = videos.length;
    logger.info(`从B站获取到 ${videos.length} 个视频`);

    for (const video of videos) {
      try {
        const result = await syncSingleVideo(video, uploader);
        
        if (result.status === 'created') {
          stats.synced++;
          logger.debug(`✅ 新增视频: ${video.title} (bvid: ${video.bvid})`);
        } else if (result.status === 'updated') {
          stats.updated++;
          logger.debug(`🔄 更新视频: ${video.title} (bvid: ${video.bvid})`);
        } else {
          stats.skipped++;
          logger.debug(`⏭️ 跳过视频: ${video.title} (bvid: ${video.bvid}) - 无变化`);
        }
      } catch (error: any) {
        stats.errors++;
        logger.error(`同步视频失败: ${video.title} (bvid: ${video.bvid}) - ${error.message}`);
      }
    }

    await prisma.bilibili_uploaders.update({
      where: { id: uploaderId },
      data: {
        videoCount: stats.synced + stats.updated,
        lastSyncAt: new Date()
      }
    });

    const duration = Date.now() - startTime;
    
    const result: VideoSyncResult = {
      success: stats.errors === 0,
      syncedVideos: stats.synced,
      updatedVideos: stats.updated,
      skippedVideos: stats.skipped,
      errors: stats.errors,
      duration,
      uploaderId,
      uploaderName: uploader.name
    };

    logger.info(`UP主 ${uploader.name} 视频同步完成: 新增 ${stats.synced} | 更新 ${stats.updated} | 跳过 ${stats.skipped} | 错误 ${stats.errors}`);
    logger.info(`耗时: ${duration}ms`);

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`同步UP主视频失败 (${uploaderId}):`, error);
    
    return {
      success: false,
      syncedVideos: stats.synced,
      updatedVideos: stats.updated,
      skippedVideos: stats.skipped,
      errors: stats.errors + 1,
      duration,
      uploaderId,
      uploaderName: 'Unknown'
    };
  }
}

/**
 * 从B站API获取UP主的视频列表
 */
async function fetchUploaderVideosFromBilibili(
  mid: string,
  maxResults: number
): Promise<Array<{
  bvid: string;
  aid: number;
  title: string;
  description: string;
  pic: string;
  duration: number;
  pubdate: number;
  stat: {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
  };
}>> {
  const maxRetries = 3;
  const baseDelay = 3000;
  const pageSize = 50;
  let allVideos: any[] = [];
  let page = 1;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`获取UP主视频列表: mid=${mid}, 页码=${page}, 尝试=${attempt}/${maxRetries}`);
      
      const result = await bilibiliAPI.user.getUserVideos(parseInt(mid, 10), page, pageSize);
      
      if (!result || !result.list) {
        logger.warn(`UP主 ${mid} 第${page}页: 响应格式异常`);
        break;
      }
      
      const videos = (result.list.vlist || []).map((v: any) => ({
        bvid: v.bvid,
        aid: v.aid,
        title: v.title,
        description: v.description || '',
        pic: v.pic,
        duration: parseDuration(v.length),
        pubdate: v.created,
        stat: {
          view: v.play || 0,
          danmaku: v.video_review || 0,
          reply: v.comment || 0,
          favorite: v.favorites || 0,
          coin: 0,
          share: 0,
          like: 0,
        },
      }));

      allVideos = allVideos.concat(videos);
      
      if (allVideos.length >= maxResults || videos.length < pageSize) {
        break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      if (error instanceof BilibiliAPIError) {
        if (error.code === -401 || error.code === -799) {
          logger.warn(`B站API认证失败或限流 (mid: ${mid}): ${error.message}`);
          throw new Error(`B站API认证失败或限流: ${error.message}`);
        }
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * attempt;
        logger.info(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`获取UP主视频失败: ${error.message || '未知错误'}`);
      }
    }
  }

  return allVideos.slice(0, maxResults);
}

/**
 * 解析时长字符串（格式：MM:SS 或 HH:MM:SS）
 */
function parseDuration(length: string): number {
  if (!length) return 0;
  
  const parts = length.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  } else if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  }
  
  return 0;
}

/**
 * 同步单个视频到数据库
 */
async function syncSingleVideo(
  video: any,
  uploader: any
): Promise<{ status: 'created' | 'updated' | 'skipped' }> {
  try {
    const existingVideo = await userPrisma.video.findFirst({
      where: {
        OR: [
          { bvid: video.bvid },
          { videoId: video.bvid }
        ]
      }
    });

    const videoData = {
      platform: 'bilibili',
      videoId: video.bvid,
      bvid: video.bvid,
      title: video.title,
      description: video.description,
      coverUrl: video.pic,
      duration: video.duration,
      uploader: uploader.name,
      uploaderId: uploader.mid,
      publishedDate: new Date(video.pubdate * 1000),
      viewCount: video.stat.view,
      playCount: video.stat.view,
      likeCount: video.stat.like || 0,
      favoriteCount: video.stat.favorite || 0,
    };

    if (!existingVideo) {
      await userPrisma.video.create({
        data: videoData
      });
      return { status: 'created' };
    }

    if (shouldUpdateVideo(existingVideo, videoData)) {
      await userPrisma.video.update({
        where: { id: existingVideo.id },
        data: videoData
      });
      return { status: 'updated' };
    }

    return { status: 'skipped' };

  } catch (error: any) {
    logger.error(`同步视频失败 (${video.bvid}):`, error);
    throw error;
  }
}

/**
 * 判断是否需要更新视频数据
 */
function shouldUpdateVideo(
  existing: any,
  newData: any
): boolean {
  if (existing.title !== newData.title) return true;
  if (existing.description !== newData.description) return true;
  if (existing.coverUrl !== newData.coverUrl) return true;
  if (existing.duration !== newData.duration) return true;
  if (existing.viewCount !== newData.viewCount) return true;
  if (existing.playCount !== newData.playCount) return true;
  if (existing.likeCount !== newData.likeCount) return true;
  if (existing.favoriteCount !== newData.favoriteCount) return true;

  return false;
}

/**
 * 同步所有激活UP主的视频数据
 */
export async function syncAllUploadersVideos(
  maxResultsPerUploader: number = 100
): Promise<{
  success: boolean;
  totalUploaders: number;
  syncedUploaders: number;
  totalVideos: number;
  errors: string[];
  duration: number;
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let syncedUploaders = 0;
  let totalVideos = 0;

  try {
    logger.info('========== 开始同步所有UP主的视频数据 ==========');

    const uploaders = await prisma.bilibili_uploaders.findMany({
      where: { isActive: true },
      select: { id: true, name: true, mid: true }
    });

    logger.info(`找到 ${uploaders.length} 个激活的UP主`);

    for (const uploader of uploaders) {
      try {
        const result = await syncVideosForUploader(uploader.id, maxResultsPerUploader);
        
        if (result.success) {
          syncedUploaders++;
          totalVideos += result.syncedVideos + result.updatedVideos;
        } else {
          errors.push(`UP主 ${uploader.name} (mid: ${uploader.mid}) 同步失败`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error: any) {
        const errorMsg = `同步UP主 ${uploader.name} (mid: ${uploader.mid}) 失败: ${error.message}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    const duration = Date.now() - startTime;
    
    const result = {
      success: errors.length === 0,
      totalUploaders: uploaders.length,
      syncedUploaders,
      totalVideos,
      errors,
      duration
    };

    logger.info('========== 所有UP主视频同步完成 ==========');
    logger.info(`总计UP主: ${uploaders.length} | 已同步: ${syncedUploaders} | 总视频: ${totalVideos} | 错误: ${errors.length}`);
    logger.info(`耗时: ${duration}ms`);

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMsg = `同步所有UP主视频失败: ${error.message}`;
    logger.error(errorMsg, error);
    
    return {
      success: false,
      totalUploaders: 0,
      syncedUploaders,
      totalVideos,
      errors: [errorMsg, ...errors],
      duration
    };
  }
}

/**
 * 快速同步：只同步最近更新的UP主视频
 */
export async function quickSyncRecentUploaders(
  days: number = 7,
  maxResultsPerUploader: number = 20
): Promise<{
  success: boolean;
  syncedUploaders: number;
  totalVideos: number;
  errors: string[];
  duration: number;
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let syncedUploaders = 0;
  let totalVideos = 0;

  try {
    logger.info(`========== 开始快速同步最近 ${days} 天更新的UP主 ==========`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const uploaders = await prisma.bilibili_uploaders.findMany({
      where: {
        isActive: true,
        lastSyncAt: {
          lt: cutoffDate
        }
      },
      select: { id: true, name: true, mid: true },
      orderBy: { lastSyncAt: 'asc' }
    });

    logger.info(`找到 ${uploaders.length} 个需要同步的UP主`);

    for (const uploader of uploaders) {
      try {
        const result = await syncVideosForUploader(uploader.id, maxResultsPerUploader);
        
        if (result.success) {
          syncedUploaders++;
          totalVideos += result.syncedVideos + result.updatedVideos;
        } else {
          errors.push(`UP主 ${uploader.name} (mid: ${uploader.mid}) 同步失败`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        const errorMsg = `同步UP主 ${uploader.name} (mid: ${uploader.mid}) 失败: ${error.message}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    const duration = Date.now() - startTime;
    
    const result = {
      success: errors.length === 0,
      syncedUploaders,
      totalVideos,
      errors,
      duration
    };

    logger.info('========== 快速同步完成 ==========');
    logger.info(`已同步: ${syncedUploaders} 个UP主 | 总视频: ${totalVideos} | 错误: ${errors.length}`);
    logger.info(`耗时: ${duration}ms`);

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMsg = `快速同步失败: ${error.message}`;
    logger.error(errorMsg, error);
    
    return {
      success: false,
      syncedUploaders,
      totalVideos,
      errors: [errorMsg, ...errors],
      duration
    };
  }
}
