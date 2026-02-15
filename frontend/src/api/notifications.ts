/**
 * 通知API
 */

import apiClient from '@/lib/api/client';

export interface Notification {
  id: string;
  userId: string;
  type: 'repo_update' | 'paper_new' | 'video_new' | 'job_new' | 'system';
  title: string;
  content?: string;
  contentType?: 'paper' | 'video' | 'repo' | 'huggingface' | 'job';
  contentId?: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/**
 * 获取用户通知列表
 */
export async function getNotifications(params?: {
  type?: string;
  isRead?: boolean;
  page?: number;
  size?: number;
}): Promise<NotificationListResponse> {
  const response = await apiClient.get<NotificationListResponse>('/notifications', { params });
  if (response.code === 0 && response.data) {
    return response.data;
  }
  return { items: [], total: 0, page: 1, size: 20, totalPages: 0 };
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  try {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    if (response.code === 0 && response.data) {
      return response.data;
    }
    return { count: 0 };
  } catch {
    return { count: 0 };
  }
}

/**
 * 标记通知为已读
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.put(`/notifications/${notificationId}/read`);
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await apiClient.put<{ count: number }>('/notifications/read-all');
  if (response.code === 0 && response.data) {
    return response.data;
  }
  return { count: 0 };
}

/**
 * 删除通知
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}
