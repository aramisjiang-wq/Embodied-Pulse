import apiClient from './client';
import { PaginatedResponse } from './types';

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description?: string;
  contentType: 'paper' | 'video' | 'repo' | 'huggingface' | 'job' | 'post';
  keywords?: string;
  tags?: string;
  authors?: string;
  uploaders?: string;
  topics?: string;
  owners?: string;
  platform?: string;
  minStars?: number;
  minCitations?: number;
  isPublic: boolean;
  isActive: boolean;
  notifyEnabled: boolean;
  syncEnabled: boolean;
  newCount: number;
  totalMatched: number;
  lastNotified?: string;
  lastChecked?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const subscriptionApi = {
  getSubscriptions: async (params?: {
    page?: number;
    size?: number;
    contentType?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Subscription>> => {
    const response = await apiClient.get<PaginatedResponse<Subscription>>('/subscriptions', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取订阅列表失败');
    }
  },

  getSubscription: async (id: string): Promise<Subscription> => {
    const response = await apiClient.get<Subscription>(`/subscriptions/${id}`);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取订阅详情失败');
    }
  },

  createSubscription: async (data: Partial<Subscription>): Promise<Subscription> => {
    const response = await apiClient.post<Subscription>('/subscriptions', data);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '创建订阅失败');
    }
  },

  updateSubscription: async (id: string, data: Partial<Subscription>): Promise<Subscription> => {
    const response = await apiClient.put<Subscription>(`/subscriptions/${id}`, data);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '更新订阅失败');
    }
  },

  deleteSubscription: async (id: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/subscriptions/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '删除订阅失败');
    }
  },

  getSubscribedContent: async (params: {
    contentType: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await apiClient.get<PaginatedResponse<Record<string, unknown>>>('/subscriptions/content', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取订阅内容失败');
    }
  },

  syncSubscription: async (id: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<Record<string, unknown>>(`/subscriptions/${id}/sync`);
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '同步失败');
    }
  },

  getSubscriptionContent: async (id: string, params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await apiClient.get<PaginatedResponse<Record<string, unknown>>>(`/subscriptions/${id}/content`, { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取订阅内容失败');
    }
  },
};
