/**
 * Bilibili UP主管理控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  extractMidFromUrl,
  getMidFromVideoUrl,
  getUploaderInfo,
  createOrUpdateUploader,
  getAllActiveUploaders,
  syncUploaderVideos,
} from '../services/bilibili-uploader.service';
import { sendSuccess, sendError } from '../utils/response';
import userPrisma from '../config/database.user';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { logger } from '../utils/logger';

/**
 * 添加UP主（从链接自动提取信息）
 */
export async function addUploader(req: Request, res: Response, next: NextFunction) {
  try {
    logger.info('Add uploader request:', {
      body: req.body,
      hasUrl: !!req.body?.url,
      url: req.body?.url,
    });

    const { url } = req.body;

    if (!url) {
      logger.warn('Add uploader failed: missing url in request body');
      return sendError(res, 1001, '请提供UP主链接', 400);
    }

    let mid = extractMidFromUrl(url);

    if (!mid) {
      const videoMatch = url.match(/bilibili\.com\/video\/(BV\w+)/);
      if (videoMatch) {
        mid = await getMidFromVideoUrl(videoMatch[1]);
      }
    }

    if (!mid) {
      return sendError(res, 1002, '无法从链接提取UP主ID，请检查链接格式', 400);
    }

    let uploaderInfo;
    try {
      uploaderInfo = await getUploaderInfo(mid);
    } catch (error: any) {
      logger.error('获取UP主信息异常:', error);
      uploaderInfo = null;
    }

    if (!uploaderInfo) {
      logger.warn(`无法从API获取UP主信息 (${mid})，使用默认信息创建`);
      uploaderInfo = {
        mid,
        name: `UP主-${mid}`,
        avatar: undefined,
        description: undefined,
      };
    }

    const uploader = await createOrUpdateUploader(uploaderInfo);

    sendSuccess(res, uploader);
  } catch (error: any) {
    next(error);
  }
}

/**
 * 获取UP主列表
 */
export async function getUploaders(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    let uploaders: any[] = [];
    let total = 0;

    try {
      const result = await Promise.all([
        userPrisma.bilibili_uploaders.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: 'desc' },
        }).catch((error: any) => {
          if (error.code === 'P2021' || error.code === 'P2023' || error.message?.includes('does not exist') || error.message?.includes('DateTime') || error.message?.includes('Could not convert')) {
            logger.warn('Prisma查询失败，尝试使用raw SQL查询UP主列表:', error.message);
            return null;
          }
          throw error;
        }),
        userPrisma.bilibili_uploaders.count({ where }).catch(() => 0),
      ]);
      
      // 如果Prisma查询失败，使用raw SQL
      if (result[0] === null) {
        const whereClause = isActive !== undefined ? `WHERE is_active = ${isActive === 'true' ? 1 : 0}` : '';
        const uploadersRaw = await userPrisma.$queryRawUnsafe<Array<{
          id: string;
          mid: string;
          name: string;
          avatar: string | null;
          description: string | null;
          tags: string | null;
          is_active: number;
          video_count: number;
          last_sync_at: string | null;
          created_at: string | number;
          updated_at: string | number;
        }>>(
          `SELECT id, mid, name, avatar, description, tags, is_active, video_count, last_sync_at, created_at, updated_at 
           FROM bilibili_uploaders 
           ${whereClause}
           ORDER BY created_at DESC 
           LIMIT ${take} OFFSET ${skip}`
        );
        
        const totalRaw = await userPrisma.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT COUNT(*) as count FROM bilibili_uploaders ${whereClause}`
        );
        
        uploaders = uploadersRaw.map(u => {
          // 处理日期字段：可能是时间戳（数字或字符串）或日期字符串
          let createdAt: Date;
          let updatedAt: Date;
          let lastSyncAt: Date | null = null;
          
          // 处理created_at：可能是时间戳字符串或数字
          if (typeof u.created_at === 'number') {
            createdAt = new Date(u.created_at);
          } else if (typeof u.created_at === 'string') {
            // 检查是否是纯数字字符串（时间戳）
            if (/^\d+$/.test(u.created_at)) {
              // 是时间戳字符串，转换为数字后创建Date
              createdAt = new Date(parseInt(u.created_at, 10));
            } else {
              // 是日期字符串，尝试解析
              const parsed = Date.parse(u.created_at);
              createdAt = isNaN(parsed) ? new Date() : new Date(parsed);
            }
          } else {
            createdAt = new Date();
          }
          
          // 处理updated_at
          if (typeof u.updated_at === 'number') {
            updatedAt = new Date(u.updated_at);
          } else if (typeof u.updated_at === 'string') {
            // 检查是否是纯数字字符串（时间戳）
            if (/^\d+$/.test(u.updated_at)) {
              updatedAt = new Date(parseInt(u.updated_at, 10));
            } else {
              const parsed = Date.parse(u.updated_at);
              updatedAt = isNaN(parsed) ? new Date() : new Date(parsed);
            }
          } else {
            updatedAt = new Date();
          }
          
          // 处理last_sync_at
          if (u.last_sync_at) {
            if (typeof u.last_sync_at === 'number') {
              lastSyncAt = new Date(u.last_sync_at);
            } else if (typeof u.last_sync_at === 'string') {
              if (/^\d+$/.test(u.last_sync_at)) {
                lastSyncAt = new Date(parseInt(u.last_sync_at, 10));
              } else {
                const parsed = Date.parse(u.last_sync_at);
                lastSyncAt = isNaN(parsed) ? null : new Date(parsed);
              }
            }
          }
          
          // 处理tags字段（JSON格式）
          let tags: string[] = [];
          if (u.tags) {
            try {
              tags = typeof u.tags === 'string' ? JSON.parse(u.tags) : u.tags;
              if (!Array.isArray(tags)) {
                tags = [];
              }
            } catch (error) {
              tags = [];
            }
          }
          
          return {
            id: u.id,
            mid: u.mid,
            name: u.name,
            avatar: u.avatar,
            description: u.description,
            tags,
            isActive: Boolean(u.is_active),
            lastSyncAt,
            videoCount: u.video_count,
            createdAt,
            updatedAt,
          };
        });
        total = totalRaw[0]?.count || 0;
      } else {
        // Prisma查询成功，但需要处理时间戳
        uploaders = (result[0] || []).map((u: any) => {
          // 处理tags字段（JSON格式）
          let tags: string[] = [];
          if (u.tags) {
            try {
              tags = typeof u.tags === 'string' ? JSON.parse(u.tags) : u.tags;
              if (!Array.isArray(tags)) {
                tags = [];
              }
            } catch (error) {
              tags = [];
            }
          }
          
          // 处理时间戳：可能是整数或Date对象
          const createdAt = u.createdAt instanceof Date ? u.createdAt : 
                           (typeof u.createdAt === 'number' ? new Date(u.createdAt) : new Date());
          const updatedAt = u.updatedAt instanceof Date ? u.updatedAt : 
                           (typeof u.updatedAt === 'number' ? new Date(u.updatedAt) : new Date());
          const lastSyncAt = u.lastSyncAt ? (u.lastSyncAt instanceof Date ? u.lastSyncAt : 
                           (typeof u.lastSyncAt === 'number' ? new Date(u.lastSyncAt) : new Date())) : null;
          
          return {
            id: u.id,
            mid: u.mid,
            name: u.name,
            avatar: u.avatar,
            description: u.description,
            tags,
            isActive: u.isActive !== undefined ? u.isActive : true,
            lastSyncAt,
            videoCount: u.videoCount,
            createdAt,
            updatedAt,
          };
        });
        total = result[1] || 0;
      }
    } catch (error: any) {
      // 如果查询失败，返回空结果而不是抛出错误
      logger.error('Get uploaders error:', {
        error: error.message,
        code: error.code,
        meta: error.meta,
      });
      uploaders = [];
      total = 0;
    }

    sendSuccess(res, {
      items: uploaders,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error: any) {
    logger.error('Get uploaders controller error:', error);
    // 返回空结果而不是抛出错误，避免前端崩溃
    sendSuccess(res, {
      items: [],
      pagination: buildPaginationResponse(1, 20, 0),
    });
  }
}

/**
 * 同步UP主视频
 */
export async function syncUploader(req: Request, res: Response, next: NextFunction) {
  try {
    const { mid } = req.params;
    const { maxResults = 100 } = req.body;

    if (!mid) {
      return sendError(res, 1001, '请提供UP主ID', 400);
    }

    const result = await syncUploaderVideos(mid, maxResults);

    sendSuccess(res, result);
  } catch (error: any) {
    next(error);
  }
}

/**
 * 删除UP主
 */
export async function deleteUploader(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await userPrisma.bilibili_uploaders.delete({
      where: { id },
    });

    sendSuccess(res, { message: '删除成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 切换UP主状态
 */
export async function toggleUploaderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const uploader = await userPrisma.bilibili_uploaders.findUnique({
      where: { id },
    });

    if (!uploader) {
      return sendError(res, 1005, 'UP主不存在', 404);
    }

    const updated = await userPrisma.bilibili_uploaders.update({
      where: { id },
      data: { is_active: !uploader.is_active },
    });

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

/**
 * 更新UP主标签
 */
export async function updateUploaderTags(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    const uploader = await userPrisma.bilibili_uploaders.findUnique({
      where: { id },
    });

    if (!uploader) {
      return sendError(res, 1005, 'UP主不存在', 404);
    }

    const updated = await userPrisma.bilibili_uploaders.update({
      where: { id },
      data: { tags: Array.isArray(tags) ? JSON.stringify(tags) : null },
    });

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

/**
 * 更新UP主信息
 */
export async function updateUploaderInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, avatar, description } = req.body;

    const uploader = await userPrisma.bilibili_uploaders.findUnique({
      where: { id },
    });

    if (!uploader) {
      return sendError(res, 1005, 'UP主不存在', 404);
    }

    const updated = await userPrisma.bilibili_uploaders.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(description !== undefined && { description }),
      },
    });

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

/**
 * 刷新UP主信息（从API重新获取）
 */
export async function refreshUploaderInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const uploader = await userPrisma.bilibili_uploaders.findUnique({
      where: { id },
    });

    if (!uploader) {
      return sendError(res, 1005, 'UP主不存在', 404);
    }

    logger.info(`刷新UP主信息: ${uploader.mid}`);

    const uploaderInfo = await getUploaderInfo(uploader.mid);

    if (!uploaderInfo) {
      return sendError(res, 1006, '无法从Bilibili API获取UP主信息，可能需要配置Cookie', 400);
    }

    const updated = await userPrisma.bilibili_uploaders.update({
      where: { id },
      data: {
        name: uploaderInfo.name,
        avatar: uploaderInfo.avatar,
        description: uploaderInfo.description,
      },
    });

    sendSuccess(res, updated);
  } catch (error: any) {
    next(error);
  }
}
