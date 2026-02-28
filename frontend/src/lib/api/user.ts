/**
 * 用户个人资料API客户端
 */

import apiClient from './client';
import { User, Favorite, PointRecord } from './types';

export interface UserSettings {
  emailNotification: boolean;
  pushNotification: boolean;
  weeklyDigest: boolean;
  language: string;
  pushSubscription?: string;
}

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
    githubUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    websiteUrl?: string;
    location?: string;
    skills?: string;
    interests?: string;
    identityType?: string | null;
    organizationName?: string | null;
    region?: string | null;
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

  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get<UserSettings>('/user/settings');
    return response.data;
  },

  updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.put<UserSettings>('/user/settings', data);
    return response.data;
  },
};
