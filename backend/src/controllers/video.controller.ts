/**
 * 视频控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getVideos, getVideoById, deleteVideo } from '../services/video.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { getAllActiveUploaders } from '../services/bilibili-uploader.service';
import { createUserAction } from '../services/user-action.service';
import { logger } from '../utils/logger';

export async function getVideoList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { sort, platform, keyword, uploaderId } = req.query;

    const { videos, total } = await getVideos({
      skip,
      take,
      sort: sort as any,
      platform: platform as string,
      keyword: keyword as string,
      uploaderId: uploaderId as string,
    });

    sendSuccess(res, {
      items: videos,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    logger.error('getVideoList 异常，返回空数据:', error);
    // 兜底：任何未捕获异常也返回 200 + 空数据，避免 500 白屏
    const { page = 1, size = 20 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const s = Math.min(100, Math.max(1, Number(size) || 20));
    sendSuccess(res, {
      items: [],
      pagination: buildPaginationResponse(p, s, 0),
    });
  }
}

export async function getVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { videoId } = req.params;
    const video = await getVideoById(videoId);

    if (!video) {
      return sendError(res, 1005, '视频不存在', 404);
    }

    // 记录用户查看行为（如果已登录）
    if (req.user?.id) {
      createUserAction({
        userId: req.user.id,
        actionType: 'view',
        contentType: 'video',
        contentId: videoId,
        metadata: {
          title: video.title,
          platform: video.platform,
        },
      }).catch(err => {
        // 行为记录失败不影响主流程
      });
    }

    sendSuccess(res, video);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取UP主列表（用户端）
 */
export async function getUploaders(req: Request, res: Response, next: NextFunction) {
  try {
    const uploaders = await getAllActiveUploaders();
    sendSuccess(res, uploaders);
  } catch (error) {
    logger.error('getUploaders 异常，返回空列表:', error);
    sendSuccess(res, []);
  }
}

export async function deleteVideoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { videoId } = req.params;
    const video = await getVideoById(videoId);

    if (!video) {
      return sendError(res, 1005, '视频不存在', 404);
    }

    await deleteVideo(videoId);
    sendSuccess(res, { message: '删除成功' });
  } catch (error: any) {
    logger.error('删除视频失败:', error);
    if (error.message === 'VIDEO_DELETION_FAILED') {
      return sendError(res, 500, '删除视频失败');
    }
    next(error);
  }
}
