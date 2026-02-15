/**
 * 公告控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAnnouncements,
  getActiveAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../services/announcement.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess } from '../utils/response';

/**
 * 获取公告列表
 */
export async function getAnnouncementList(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { isActive } = req.query;

    const { announcements, total } = await getAnnouncements({
      skip,
      take,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    sendSuccess(res, {
      items: announcements,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取活跃公告（首页显示）
 */
export async function getActiveAnnouncementList(req: Request, res: Response, next: NextFunction) {
  try {
    const announcements = await getActiveAnnouncements();
    sendSuccess(res, announcements);
  } catch (error) {
    next(error);
  }
}

/**
 * 创建公告（管理端）
 */
export async function createAnnouncementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const announcement = await createAnnouncement(req.body);
    sendSuccess(res, announcement, '公告创建成功');
  } catch (error) {
    next(error);
  }
}

/**
 * 更新公告（管理端）
 */
export async function updateAnnouncementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const announcement = await updateAnnouncement(id, req.body);
    sendSuccess(res, announcement, '公告更新成功');
  } catch (error) {
    next(error);
  }
}

/**
 * 删除公告（管理端）
 */
export async function deleteAnnouncementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deleteAnnouncement(id);
    sendSuccess(res, null, '公告删除成功');
  } catch (error) {
    next(error);
  }
}
