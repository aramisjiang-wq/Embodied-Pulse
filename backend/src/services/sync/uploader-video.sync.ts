/**
 * UP主视频订阅同步服务
 * 使用 bilibili-api-wrapper 封装
 * 根据 UP主自动抓取最新视频
 */

import { BilibiliAPI, BilibiliAPIError } from '../bilibili';
import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

const prisma = userPrisma;

const bilibiliAPI = BilibiliAPI.fromEnv({
  timeout: 15000,
  retries: 3,
  retryDelay: 2000,
});

/**
 * 同步所有用户订阅的UP主视频
 */
export async function syncSubscribedUploaders() {
  try {
    logger.info('开始同步用户订阅的UP主视频...');
    
    // 获取所有激活的视频订阅
    const subscriptions = await prisma.subscription.findMany({
      where: {
        contentType: 'video',
        isActive: true,
        uploaders: { not: null },
      } as any, // SQLite可能不完全支持not null，使用类型断言
      include: {
        user: true,
      },
    });
    
    logger.info(`找到${subscriptions.length}个视频订阅`);
    
    let totalSynced = 0;
    
    for (const sub of subscriptions) {
      try {
        const subAny = sub as any; // 类型断言，因为Prisma类型可能不完整
        const uploaders = JSON.parse(subAny.uploaders || '[]');
        const platform = subAny.platform || 'bilibili';
        
        for (const uploader of uploaders) {
          const syncedCount = await syncUploaderVideos({
            userId: sub.userId,
            uploader,
            platform,
            maxResults: 5, // 每个UP主最新5个视频
          });
          
          totalSynced += syncedCount;
        }
        
        // 更新最后检查时间
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { lastChecked: new Date() } as any, // lastChecked可能不在Prisma类型中
        });
        
      } catch (error) {
        logger.error(`订阅${sub.id}同步失败:`, error);
      }
    }
    
    logger.info(`UP主视频同步完成: 总计${totalSynced}个视频`);
    return totalSynced;
    
  } catch (error) {
    logger.error('同步用户订阅UP主失败:', error);
    throw error;
  }
}

/**
 * 同步单个UP主的视频
 */
async function syncUploaderVideos(params: {
  userId: string;
  uploader: string;
  platform: string;
  maxResults: number;
}) {
  try {
    const { userId, uploader, platform, maxResults } = params;
    
    let videos: any[] = [];
    
    if (platform === 'bilibili') {
      videos = await fetchBilibiliUploaderVideos(uploader, maxResults);
    } else if (platform === 'youtube') {
      videos = await fetchYouTubeUploaderVideos(uploader, maxResults);
    }
    
    let syncedCount = 0;
    for (const video of videos) {
      try {
        const existing = await prisma.video.findFirst({
          where: {
            platform,
            videoId: video.videoId,
          },
        });
        
        if (!existing) {
          await prisma.video.create({
            data: {
              ...video,
              metadata: JSON.stringify({ subscribedBy: [userId] }),
            },
          });
          syncedCount++;
        } else {
          const metadata = existing.metadata ? JSON.parse(existing.metadata) : {};
          const subscribedBy = metadata.subscribedBy || [];
          if (!subscribedBy.includes(userId)) {
            subscribedBy.push(userId);
            await prisma.video.update({
              where: { id: existing.id },
              data: {
                metadata: JSON.stringify({ ...metadata, subscribedBy }),
              },
            });
          }
        }
      } catch (error) {
        logger.error(`视频入库失败: ${video.title}`, error);
      }
    }
    
    return syncedCount;
    
  } catch (error) {
    logger.error(`同步UP主${params.uploader}失败:`, error);
    return 0;
  }
}

async function fetchBilibiliUploaderVideos(uploader: string, maxResults: number) {
  try {
    logger.info(`获取B站UP主${uploader}的视频`);
    
    const mid = parseInt(uploader, 10);
    if (isNaN(mid)) {
      logger.warn(`UP主ID格式错误: ${uploader}`);
      return [];
    }

    const videos = await bilibiliAPI.user.getAllUserVideos(mid, maxResults);
    
    return videos.map((v) => ({
      platform: 'bilibili',
      videoId: v.bvid,
      bvid: v.bvid,
      title: v.title,
      description: v.description || '',
      coverUrl: v.pic,
      duration: parseDuration(v.length),
      uploader: '',
      uploaderId: uploader,
      publishedDate: new Date(v.pubdate * 1000),
      playCount: v.play || 0,
      viewCount: v.play || 0,
      favoriteCount: v.favorites || 0,
      likeCount: 0,
      commentCount: v.video_review || 0,
      shareCount: 0,
    }));
  } catch (error: any) {
    if (error instanceof BilibiliAPIError) {
      logger.error(`获取B站UP主${uploader}视频失败 (API错误): ${error.message}, code: ${error.code}`);
    } else {
      logger.error(`获取B站UP主${uploader}视频失败:`, error);
    }
    return [];
  }
}

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
 * 获取YouTube UP主视频（模拟实现）
 */
async function fetchYouTubeUploaderVideos(uploader: string, maxResults: number) {
  // 实际应该调用YouTube API
  // 这里返回模拟数据
  logger.info(`模拟获取YouTube UP主${uploader}的视频`);
  
  return [];
}
