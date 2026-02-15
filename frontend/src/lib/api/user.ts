/**
 * 用户个人资料API客户端
 */

import apiClient from './client';
import { User, Favorite, PointRecord } from './types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/user/profile');
    return response.data;
  },

  updateProfile: async (data: {
    username?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<User> => {
    const response = await apiClient.put<User>('/user/profile', data);
    return response.data;
  },

  getFavorites: async (): Promise<Favorite[]> => {
    const response = await apiClient.get<{ items: Favorite[]; pagination: Record<string, unknown> }>('/favorites');
    if (response.code === 0) {
      return Array.isArray(response.data?.items) ? response.data.items : [];
    } else {
      throw new Error(response.message || '获取收藏列表失败');
    }
  },

  getPointRecords: async (): Promise<PointRecord[]> => {
    const response = await apiClient.get<PointRecord[]>('/user/points');
    return response.data;
  },

  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.put('/user/password', data);
  },

  updateSettings: async (data: {
    emailNotification?: boolean;
    pushNotification?: boolean;
  }): Promise<void> => {
    await apiClient.put('/user/settings', data);
  },
};
