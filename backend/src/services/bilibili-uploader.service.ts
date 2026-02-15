/**
 * Bilibili UP主管理服务
 * 使用 bilibili-api-wrapper 封装
 * 参考: https://github.com/nemo2011/bilibili-api
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

/**
 * 从UP主链接提取mid（用户ID）
 * 支持格式：
 * - https://space.bilibili.com/{mid}?xxx (带查询参数)
 * - https://space.bilibili.com/{mid}
 * - https://www.bilibili.com/video/{bvid} (需要额外获取mid)
 * - {mid} (直接是mid)
 */
export function extractMidFromUrl(url: string): string | null {
  try {
    const trimmedUrl = url.trim();
    
    if (/^\d+$/.test(trimmedUrl)) {
      return trimmedUrl;
    }

    const spaceMatch = trimmedUrl.match(/space\.bilibili\.com\/(\d+)(?:\?|$)/);
    if (spaceMatch) {
      return spaceMatch[1];
    }

    const spaceMatch2 = trimmedUrl.match(/bilibili\.com\/space\/(\d+)(?:\?|$)/);
    if (spaceMatch2) {
      return spaceMatch2[1];
    }

    const videoMatch = trimmedUrl.match(/bilibili\.com\/video\/(BV\w+)/);
    if (videoMatch) {
      return null;
    }

    return null;
  } catch (error) {
    logger.error('提取mid失败:', error);
    return null;
  }
}

/**
 * 从视频链接获取UP主mid
 */
export async function getMidFromVideoUrl(bvid: string): Promise<string | null> {
  try {
    const videoInfo = await bilibiliAPI.video.getVideoInfo(bvid);
    if (videoInfo.mid || videoInfo.owner?.mid) {
      return String(videoInfo.mid || videoInfo.owner?.mid);
    }
    return null;
  } catch (error) {
    logger.error(`从视频获取mid失败 (${bvid}):`, error);
    return null;
  }
}

/**
 * 获取UP主信息
 * 注意：此API需要Bilibili Cookie认证，如果没有配置会失败
 * 失败时会返回null，由调用方决定是否使用默认信息
 */
export async function getUploaderInfo(mid: string): Promise<{
  mid: string;
  name: string;
  avatar?: string;
  description?: string;
} | null> {
  try {
    logger.info(`获取UP主信息: ${mid}`);
    
    const userInfo = await bilibiliAPI.user.getUserInfo(parseInt(mid, 10));
    
    return {
      mid: String(userInfo.mid),
      name: userInfo.name || '',
      avatar: userInfo.face || undefined,
      description: userInfo.sign || undefined,
    };
  } catch (error: any) {
    logger.error(`获取UP主信息失败 (${mid}):`, error.message);
    
    // 如果是认证错误或限流错误，返回null（由调用方决定是否使用默认信息）
    if (error instanceof BilibiliAPIError) {
      if (error.code === -401 || error.code === -799) {
        logger.warn(`Bilibili API需要认证或限流 (${mid})`);
        return null;
      }
    }
    
    // 其他错误也返回null
    return null;
  }
}

/**
 * 获取UP主的视频列表
 */
export async function getUploaderVideos(mid: string, page: number = 1, pageSize: number = 30): Promise<{
  videos: Array<{
    bvid: string;
    aid: number;
    title: string;
    description: string;
    pic: string;
    author: string;
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
  }>;
  total: number;
}> {
  const maxRetries = 3;
  const baseDelay = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`获取UP主视频列表: ${mid}, 页码: ${page}, 尝试: ${attempt}/${maxRetries}`);
      
      const result = await bilibiliAPI.user.getUserVideos(parseInt(mid, 10), page, pageSize);
      
      logger.debug(`Bilibili API响应:`, JSON.stringify(result, null, 2));
      
      // 检查响应格式
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
        author: '',
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
      
      logger.info(`UP主 ${mid} 第${page}页: 获取到 ${videos.length} 个视频，总数: ${result.page?.count || 0}`);
      
      // 如果没有视频，尝试获取下一页
      if (videos.length === 0) {
        logger.warn(`UP主 ${mid} 第${page}页: 无视频数据`);
        break;
      }
      
      return {
        videos,
        total: result.page?.count || 0,
      };
    } catch (error: any) {
      logger.error(`获取UP主视频失败 (${mid}), 尝试: ${attempt}/${maxRetries}:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * attempt;
        logger.info(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`获取UP主视频失败: ${error.message || '未知错误'}`);
      }
    }
  }
  
  throw new Error('获取UP主视频失败: 未知错误');
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
 * 创建或更新UP主
 */
export async function createOrUpdateUploader(data: {
  mid: string;
  name: string;
  avatar?: string;
  description?: string;
}): Promise<any> {
  try {
    const uploader = await prisma.bilibili_uploaders.upsert({
      where: { mid: data.mid },
      update: {
        name: data.name,
        avatar: data.avatar,
        description: data.description,
      },
      create: {
        mid: data.mid,
        name: data.name,
        avatar: data.avatar,
        description: data.description,
        isActive: true,
      },
    });
    return uploader;
  } catch (error: any) {
    logger.error('创建/更新UP主失败 (Prisma):', {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    if (error.code === 'P2021' || error.code === 'P2023' || error.message?.includes('does not exist') || error.message?.includes('DateTime')) {
      logger.warn('Prisma查询失败，尝试使用raw SQL创建UP主');
      try {
        const existing = await userPrisma.$queryRawUnsafe<Array<{
          id: string;
          mid: string;
          name: string;
          avatar: string | null;
          description: string | null;
          is_active: number;
          video_count: number;
          created_at: string;
          updated_at: string;
        }>>(
          `SELECT id, mid, name, avatar, description, is_active, video_count, created_at, updated_at FROM bilibili_uploaders WHERE mid = ?`,
          data.mid
        );
        
        if (existing && existing.length > 0) {
          const now = new Date().toISOString();
          await userPrisma.$executeRawUnsafe(
            `UPDATE bilibili_uploaders SET name = ?, avatar = ?, description = ?, updated_at = ? WHERE mid = ?`,
            data.name,
            data.avatar || null,
            data.description || null,
            now,
            data.mid
          );
          
          const updated = await userPrisma.$queryRawUnsafe<Array<{
            id: string;
            mid: string;
            name: string;
            avatar: string | null;
            description: string | null;
            is_active: number;
            video_count: number;
            created_at: string;
            updated_at: string;
          }>>(
            `SELECT id, mid, name, avatar, description, is_active, video_count, created_at, updated_at FROM bilibili_uploaders WHERE mid = ?`,
            data.mid
          );
          
          if (updated && updated.length > 0) {
            const u = updated[0];
            return {
              id: u.id,
              mid: u.mid,
              name: u.name,
              avatar: u.avatar,
              description: u.description,
              isActive: Boolean(u.is_active),
              videoCount: u.video_count,
              createdAt: new Date(u.created_at),
              updatedAt: new Date(u.updated_at),
            };
          }
          
          return {
            id: existing[0].id,
            mid: data.mid,
            name: data.name,
            avatar: data.avatar,
            description: data.description,
            isActive: true,
            videoCount: existing[0].video_count || 0,
            createdAt: new Date(existing[0].created_at),
            updatedAt: new Date(),
          };
        } else {
          const id = require('crypto').randomUUID();
          const now = new Date().toISOString();
          await userPrisma.$executeRawUnsafe(
            `INSERT INTO bilibili_uploaders (id, mid, name, avatar, description, is_active, video_count, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
            id,
            data.mid,
            data.name,
            data.avatar || null,
            data.description || null,
            now,
            now
          );
          
          const inserted = await userPrisma.$queryRawUnsafe<Array<{
            id: string;
            mid: string;
            name: string;
            avatar: string | null;
            description: string | null;
            is_active: number;
            video_count: number;
            created_at: string;
            updated_at: string;
          }>>(
            `SELECT id, mid, name, avatar, description, is_active, video_count, created_at, updated_at FROM bilibili_uploaders WHERE id = ?`,
            id
          );
          
          if (inserted && inserted.length > 0) {
            const u = inserted[0];
            return {
              id: u.id,
              mid: u.mid,
              name: u.name,
              avatar: u.avatar,
              description: u.description,
              isActive: Boolean(u.is_active),
              videoCount: u.video_count,
              createdAt: new Date(u.created_at),
              updatedAt: new Date(u.updated_at),
            };
          }
          
          return {
            id,
            mid: data.mid,
            name: data.name,
            avatar: data.avatar,
            description: data.description,
            isActive: true,
            videoCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      } catch (sqlError: any) {
        logger.error('Raw SQL也失败:', sqlError);
        throw new Error(`创建UP主失败: ${sqlError.message || '数据库错误'}`);
      }
    }
    
    throw error;
  }
}

/**
 * 获取所有激活的UP主
 */
export async function getAllActiveUploaders(): Promise<any[]> {
  try {
    return await prisma.bilibili_uploaders.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: any) {
    logger.error('获取UP主列表失败 (Prisma):', {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    if (error.code === 'P2021' || 
        error.message?.includes('does not exist') || 
        error.message?.includes('no such table')) {
      logger.warn('Prisma查询失败，尝试使用raw SQL查询UP主列表');
      try {
        const uploaders = await userPrisma.$queryRawUnsafe<Array<{
          id: string;
          mid: string;
          name: string;
          avatar: string | null;
          description: string | null;
          is_active: number;
          video_count: number;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        }>>(
          `SELECT id, mid, name, avatar, description, is_active, video_count, last_sync_at, created_at, updated_at 
           FROM bilibili_uploaders 
           WHERE is_active = 1 
           ORDER BY created_at DESC`
        );
        
        logger.info(`通过SQL查询到 ${uploaders.length} 个UP主`);
        return uploaders.map(u => ({
          id: u.id,
          mid: u.mid,
          name: u.name,
          avatar: u.avatar,
          description: u.description,
          isActive: Boolean(u.is_active),
          videoCount: u.video_count,
          lastSyncAt: u.last_sync_at ? new Date(u.last_sync_at) : null,
          createdAt: new Date(u.created_at),
          updatedAt: new Date(u.updated_at),
        }));
      } catch (sqlError: any) {
        logger.error('Raw SQL查询也失败:', sqlError);
        return [];
      }
    }
    
    throw error;
  }
}

/**
 * 同步UP主的视频
 */
export async function syncUploaderVideos(mid: string, maxResults: number = 100): Promise<{
  success: boolean;
  synced: number;
  errors: number;
}> {
  try {
    const uploader = await prisma.bilibili_uploaders.findUnique({
      where: { mid },
    });

    if (!uploader || !uploader.isActive) {
      throw new Error('UP主不存在或未激活');
    }

    let syncedCount = 0;
    let errorCount = 0;
    let page = 1;
    const pageSize = 50;

    const { createVideo } = await import('./video.service');
    const uploaderName = uploader.name || '未知UP主';

    while (syncedCount < maxResults) {
      try {
        const { videos, total } = await getUploaderVideos(mid, page, pageSize);

        if (videos.length === 0) {
          break;
        }

        for (const video of videos) {
          if (syncedCount >= maxResults) {
            break;
          }

          try {
            await createVideo({
              platform: 'bilibili',
              videoId: video.bvid,
              bvid: video.bvid,
              title: video.title,
              description: video.description,
              coverUrl: video.pic,
              duration: video.duration,
              uploader: uploaderName,
              uploaderId: mid,
              publishedDate: new Date(video.pubdate * 1000),
              viewCount: video.stat.view,
              playCount: video.stat.view,
            });

            syncedCount++;
            logger.debug(`视频同步成功: ${video.bvid}`);
          } catch (error: any) {
            // 检查是否是数据库约束错误（视频已存在但更新失败）
            const errorMsg = error.message || '';
            if (errorMsg.includes('Unique constraint') || 
                errorMsg.includes('duplicate') ||
                errorMsg.includes('already exists')) {
              // 视频已存在，尝试更新
              try {
                const existingVideo = await userPrisma.video.findFirst({
                  where: {
                    OR: [
                      { bvid: video.bvid },
                      { videoId: video.bvid },
                    ],
                  },
                });
                
                if (existingVideo) {
                  await userPrisma.video.update({
                    where: { id: existingVideo.id },
                    data: {
                      title: video.title,
                      description: video.description,
                      coverUrl: video.pic,
                      duration: video.duration ? Number(video.duration) : null,
                      uploader: uploaderName,
                      uploaderId: mid,
                      publishedDate: new Date(video.pubdate * 1000),
                      viewCount: video.stat.view,
                      playCount: video.stat.view,
                    },
                  });
                  syncedCount++;
                  logger.debug(`视频更新成功: ${video.bvid}`);
                } else {
                  errorCount++;
                  logger.warn(`视频已存在但无法更新 (${video.bvid}): ${errorMsg}`);
                }
              } catch (updateError: any) {
                errorCount++;
                logger.error(`更新视频失败 (${video.bvid}):`, updateError.message);
              }
            } else {
              errorCount++;
              logger.error(`处理视频失败 (${video.bvid}):`, error.message);
              logger.error(`错误详情:`, error);
            }
          }
        }

        await prisma.bilibili_uploaders.update({
          where: { mid },
          data: {
            videoCount: syncedCount,
            lastSyncAt: new Date(),
          },
        });
        
        logger.info(`UP主 ${mid} 第${page}页: 已更新videoCount为 ${syncedCount}`);

        if (videos.length < pageSize) {
          break;
        }

        page++;
        // 在页面之间添加延迟，避免限流
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        const errorMsg = error.message || '';
        if (errorMsg.includes('412') || errorMsg.includes('rate limit') || errorMsg.includes('请求过于频繁')) {
          logger.warn(`遇到限流错误，等待后重试第${page}页`);
          // 等待更长时间后重试
          await new Promise(resolve => setTimeout(resolve, 10000));
          // 不增加page，重试当前页
          continue;
        }
        // 如果是其他错误，记录并继续下一页
        logger.error(`同步第${page}页失败:`, error.message);
        // 等待后继续下一页，而不是直接退出
        await new Promise(resolve => setTimeout(resolve, 3000));
        page++;
        // 如果连续失败太多页，才退出
        if (errorCount > 10) {
          logger.error('错误过多，停止同步');
          break;
        }
      }
    }

    logger.info(`UP主 ${mid} 同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);
    
    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
    };
  } catch (error: any) {
    logger.error(`同步UP主视频失败 (${mid}):`, error.message);
    throw error;
  }
}
