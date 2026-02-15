import apiClient from './client';
import { PaginatedResponse } from './types';

export interface ContentSubscription {
  id: string;
  userId: string;
  contentType: string;
  contentId: string;
  notifyEnabled: boolean;
  lastNotified: Date | null;
  lastChecked: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const contentSubscriptionApi = {
  createSubscription: async (data: {
    contentType: string;
    contentId: string;
    notifyEnabled?: boolean;
  }): Promise<{ subscriptionId: string; pointsEarned: number }> => {
    const response = await apiClient.post<{ subscriptionId: string; pointsEarned: number }>('/content-subscriptions', data);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '创建订阅失败');
    }
  },

  deleteSubscription: async (contentType: string, contentId: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/content-subscriptions/${contentType}/${contentId}`);
    if (response.code !== 0) {
      throw new Error(response.message || '取消订阅失败');
    }
  },

  getSubscriptions: async (params: {
    page?: number;
    size?: number;
    contentType?: string;
  }): Promise<PaginatedResponse<ContentSubscription>> => {
    const response = await apiClient.get<PaginatedResponse<ContentSubscription>>('/content-subscriptions', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取订阅列表失败');
    }
  },

  checkSubscription: async (contentType: string, contentId: string): Promise<{ isSubscribed: boolean }> => {
    const response = await apiClient.get<{ isSubscribed: boolean }>(`/content-subscriptions/check/${contentType}/${contentId}`);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '检查订阅状态失败');
    }
  },

  updateSubscription: async (id: string, data: {
    notifyEnabled?: boolean;
  }): Promise<ContentSubscription> => {
    const response = await apiClient.put<ContentSubscription>(`/content-subscriptions/${id}`, data);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '更新订阅失败');
    }
  },
};
