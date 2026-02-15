/**
 * 通知控制器
 * 处理通知相关的API请求
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
} from '../services/notification.service';
import { manualCheckGitHubRepoUpdates } from '../services/github-repo-update.service';

/**
 * 获取用户通知列表
 */
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, isRead, page, size } = req.query;

    const result = await getUserNotifications({
      userId,
      type: type as string,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 20,
    });

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    next(error);
  }
}

/**
 * 获取未读通知数量
 */
export async function getUnreadNotificationsCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await getUnreadCount(userId);

    res.json({
      code: 0,
      message: 'success',
      data: { count },
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    next(error);
  }
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notificationId } = req.params;

    await markAsRead(notificationId, userId);

    res.json({
      code: 0,
      message: 'success',
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    next(error);
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await markAllAsRead(userId);

    res.json({
      code: 0,
      message: 'success',
      data: { count: result.count },
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    next(error);
  }
}

/**
 * 删除通知
 */
export async function deleteNotificationById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notificationId } = req.params;

    await deleteNotification(notificationId, userId);

    res.json({
      code: 0,
      message: 'success',
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    next(error);
  }
}

/**
 * 手动触发GitHub项目更新检查（管理员功能）
 */
export async function triggerGitHubRepoUpdateCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await manualCheckGitHubRepoUpdates();

    res.json({
      code: 0,
      message: 'success',
      data: result,
    });
  } catch (error) {
    logger.error('Trigger GitHub repo update check error:', error);
    next(error);
  }
}

/**
 * 清理旧通知（管理员功能）
 */
export async function cleanupOldNotificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { days } = req.query;
    const daysToKeep = days ? parseInt(days as string) : 30;

    const result = await cleanupOldNotifications(daysToKeep);

    res.json({
      code: 0,
      message: 'success',
      data: { count: result.count },
    });
  } catch (error) {
    logger.error('Cleanup old notifications error:', error);
    next(error);
  }
}
