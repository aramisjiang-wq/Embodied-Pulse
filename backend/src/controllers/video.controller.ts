/**
 * 视频控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getVideos, getVideoById } from '../services/video.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { getAllActiveUploaders } from '../services/bilibili-uploader.service';
import { createUserAction } from '../services/user-action.service';

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
    next(error);
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
    next(error);
  }
}
