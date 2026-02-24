import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { websocketService } from './websocket.service';

const prisma = userPrisma as any;

export interface CreateNotificationParams {
  userId: string;
  type: 'repo_update' | 'paper_new' | 'video_new' | 'job_new' | 'system';
  title: string;
  content?: string;
  contentType?: 'paper' | 'video' | 'repo' | 'huggingface' | 'job';
  contentId?: string;
  metadata?: any;
}

export interface NotificationQueryParams {
  userId: string;
  type?: string;
  isRead?: boolean;
  page?: number;
  size?: number;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notifications.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        content_type: params.contentType,
        content_id: params.contentId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        is_read: 0,
      },
    });

    logger.info(`Notification created for user ${params.userId}: ${params.title}`);

    websocketService.sendToUser(params.userId, {
      id: notification.id,
      type: params.type,
      title: params.title,
      content: params.content,
      metadata: params.metadata,
      createdAt: notification.created_at || new Date().toISOString(),
    });

    return notification;
  } catch (error) {
    logger.error('Create notification error:', error);
    throw error;
  }
}

export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
  try {
    const result = await prisma.notifications.createMany({
      data: notifications.map(n => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        content: n.content,
        content_type: n.contentType,
        content_id: n.contentId,
        metadata: n.metadata ? JSON.stringify(n.metadata) : null,
        is_read: 0,
      })),
    });

    logger.info(`Created ${result.count} notifications`);
    return result;
  } catch (error) {
    logger.error('Create bulk notifications error:', error);
    throw error;
  }
}

export async function getUserNotifications(params: NotificationQueryParams) {
  try {
    const { userId, type, isRead, page = 1, size = 20 } = params;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.is_read = isRead ? 1 : 0;

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' as const },
        skip,
        take: size,
      }),
      prisma.notifications.count({ where }),
    ]);

    return {
      items: notifications.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        content: n.content,
        contentType: n.content_type,
        contentId: n.content_id,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
        isRead: n.is_read === 1,
        readAt: n.read_at,
        createdAt: n.created_at,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  } catch (error) {
    logger.error('Get user notifications error:', error);
    throw error;
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const result = await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: 0,
      },
    });

    return Number(result) || 0;
  } catch (error) {
    logger.error('Get unread count error:', error);
    return 0;
  }
}

export async function markAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notifications.updateMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: {
        is_read: 1,
        read_at: new Date().toISOString(),
      },
    });

    logger.info(`Notification ${notificationId} marked as read`);
    return notification;
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    throw error;
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: 0,
      },
      data: {
        is_read: 1,
        read_at: new Date().toISOString(),
      },
    });

    logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notifications.deleteMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    logger.info(`Notification ${notificationId} deleted`);
    return notification;
  } catch (error) {
    logger.error('Delete notification error:', error);
    throw error;
  }
}

export async function cleanupOldNotifications(days: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString();

    const result = await prisma.notifications.deleteMany({
      where: {
        created_at: {
          lt: cutoffStr,
        },
        is_read: 1,
      },
    });

    logger.info(`Cleaned up ${result.count} old notifications`);
    return result;
  } catch (error) {
    logger.error('Cleanup old notifications error:', error);
    throw error;
  }
}
