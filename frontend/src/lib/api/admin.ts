/**
 * 管理端API客户端
 */

import apiClient from './client';
import { PaginatedResponse, User } from './types';

export const adminApi = {
  /**
   * 获取用户端用户列表
   */
  getUsers: async (params: {
    page?: number;
    size?: number;
    keyword?: string;
    level?: number;
    status?: string;
    registerType?: string;
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return response.data;
  },

  /**
   * 获取管理员列表
   */
  getAdmins: async (params: {
    page?: number;
    size?: number;
    keyword?: string;
    role?: string;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await apiClient.get<PaginatedResponse<Record<string, unknown>>>('/admin/admins', { params });
    return response.data;
  },

  /**
   * 更新管理员权限
   */
  updateAdminPermissions: async (adminId: string, permissions: Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>): Promise<void> => {
    await apiClient.put(`/admin/admins/${adminId}/permissions`, { permissions });
  },

  /**
   * 禁用/解禁用户
   */
  banUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/ban`);
  },

  /**
   * 获取统计数据
   */
  getStats: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/admin/stats');
    return response.data;
  },

  /**
   * 市集帖子列表（管理端，与用户端同源数据，支持 status 筛选）
   */
  getCommunityPosts: async (params: {
    page?: number;
    size?: number;
    sort?: 'hot' | 'latest';
    status?: string;
  }): Promise<{ items: unknown[]; pagination: { page: number; size: number; total: number; totalPages?: number; hasNext?: boolean; hasPrev?: boolean } }> => {
    const response = await apiClient.get<{ items: unknown[]; pagination: Record<string, unknown> }>('/admin/posts', { params });
    const data = response?.data;
    if (!data) {
      return { items: [], pagination: { page: 1, size: params.size ?? 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
    const defaultPagination = { page: 1, size: params.size ?? 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
    return {
      items: data.items ?? [],
      pagination: (data.pagination as typeof defaultPagination | undefined) ?? defaultPagination,
    };
  },

  /**
   * 市集统计（管理端）
   */
  getCommunityStats: async (): Promise<{
    totalPosts: number;
    activePosts: number;
    deletedPosts: number;
    pinnedPosts: number;
    featuredPosts: number;
    todayNewPosts: number;
    totalComments: number;
  }> => {
    const response = await apiClient.get<{
      totalPosts: number;
      activePosts: number;
      deletedPosts: number;
      pinnedPosts: number;
      featuredPosts: number;
      todayNewPosts: number;
      totalComments: number;
    }>('/admin/community/stats');
    const data = response?.data;
    return {
      totalPosts: data?.totalPosts ?? 0,
      activePosts: data?.activePosts ?? 0,
      deletedPosts: data?.deletedPosts ?? 0,
      pinnedPosts: data?.pinnedPosts ?? 0,
      featuredPosts: data?.featuredPosts ?? 0,
      todayNewPosts: data?.todayNewPosts ?? 0,
      totalComments: data?.totalComments ?? 0,
    };
  },

  /**
   * 创建内容
   */
  createContent: async (type: string, data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<Record<string, unknown>>(`/admin/content/${type}`, data);
    return response.data;
  },

  /**
   * 更新内容
   */
  updateContent: async (type: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await apiClient.put<Record<string, unknown>>(`/admin/content/${type}/${id}`, data);
    return response.data;
  },

  /**
   * 删除内容
   */
  deleteContent: async (type: string, id: string): Promise<void> => {
    await apiClient.delete(`/admin/content/${type}/${id}`);
  },

  // ========== 订阅管理 API ==========  
  /**
   * 获取所有订阅
   */
  getSubscriptions: async (params: {
    page?: number;
    size?: number;
    contentType?: string;
    isPublic?: boolean;
    isActive?: boolean;
    syncEnabled?: boolean;
  }): Promise<PaginatedResponse<unknown>> => {
    const response = await apiClient.get<PaginatedResponse<unknown>>('/admin/subscriptions', { params });
    const fallback: PaginatedResponse<unknown> = { items: [], pagination: { page: 1, size: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    return (response?.code === 0 && response?.data ? response.data : fallback);
  },

  /**
   * 批量切换订阅开关
   */
  toggleSubscriptionsBatch: async (ids: string[], syncEnabled: boolean): Promise<{ updated: number }> => {
    const response = await apiClient.post<{ updated: number }>('/admin/subscriptions/toggle-batch', {
      ids,
      syncEnabled,
    });
    return response.data;
  },

  /**
   * 获取订阅统计
   */
  getSubscriptionStats: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<{ code?: number; data?: Record<string, unknown> }>('/admin/subscriptions/stats');
    return (response?.code === 0 && response?.data) ? response.data : {};
  },

  /**
   * 获取订阅趋势
   */
  getSubscriptionTrends: async (id: string, days: number = 7): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(`/admin/subscriptions/${id}/trends`, {
      params: { days },
    });
    return response.data;
  },

  /**
   * 获取订阅历史
   */
  getSubscriptionHistory: async (id: string, params: { page?: number; size?: number }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await apiClient.get<PaginatedResponse<Record<string, unknown>>>(`/admin/subscriptions/${id}/history`, { params });
    return response.data;
  },

  /**
   * 手动触发同步
   */
  triggerSubscriptionSync: async (id: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<Record<string, unknown>>(`/admin/subscriptions/${id}/sync`);
    return response.data;
  },

  /**
   * 获取数据流动监控
   */
  getDataFlowMonitor: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<{ code?: number; data?: Record<string, unknown> }>('/admin/subscriptions/monitor');
    return (response?.code === 0 && response?.data) ? response.data : {};
  },
};
