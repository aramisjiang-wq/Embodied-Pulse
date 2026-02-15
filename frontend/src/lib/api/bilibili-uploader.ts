/**
 * Bilibili UP主管理API客户端
 */

import apiClient from './client';
import { PaginatedResponse } from './types';

export interface BilibiliUploader {
  id: string;
  mid: string;
  name: string;
  avatar?: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  lastSyncAt?: string;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

export const bilibiliUploaderApi = {
  /**
   * 添加UP主（从链接自动提取）
   */
  addUploader: async (url: string): Promise<BilibiliUploader> => {
    const response = await apiClient.post<BilibiliUploader>('/admin/bilibili-uploaders', { url });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '添加UP主失败');
  },

  /**
   * 获取UP主列表
   */
  getUploaders: async (params: {
    page?: number;
    size?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<BilibiliUploader>> => {
    const response = await apiClient.get<PaginatedResponse<BilibiliUploader>>('/admin/bilibili-uploaders', { params });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取UP主列表失败');
  },

  /**
   * 同步UP主视频
   */
  syncUploader: async (mid: string, maxResults: number = 100): Promise<{
    success: boolean;
    synced: number;
    errors: number;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      synced: number;
      errors: number;
    }>(`/admin/bilibili-uploaders/${mid}/sync`, { maxResults });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '同步失败');
  },

  /**
   * 删除UP主
   */
  deleteUploader: async (id: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/admin/bilibili-uploaders/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '删除失败');
    }
  },

  /**
   * 切换UP主状态
   */
  toggleUploaderStatus: async (id: string): Promise<BilibiliUploader> => {
    const response = await apiClient.put<BilibiliUploader>(`/admin/bilibili-uploaders/${id}/toggle`);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '切换状态失败');
  },

  /**
   * 更新UP主标签
   */
  updateTags: async (id: string, tags: string[]): Promise<BilibiliUploader> => {
    const response = await apiClient.put<BilibiliUploader>(`/admin/bilibili-uploaders/${id}/tags`, { tags });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '更新标签失败');
  },

  /**
   * 更新UP主信息
   */
  updateInfo: async (id: string, data: {
    name?: string;
    avatar?: string;
    description?: string;
  }): Promise<BilibiliUploader> => {
    const response = await apiClient.put<BilibiliUploader>(`/admin/bilibili-uploaders/${id}/info`, data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '更新UP主信息失败');
  },

  /**
   * 刷新UP主信息（从API重新获取）
   */
  refreshInfo: async (id: string): Promise<BilibiliUploader> => {
    const response = await apiClient.post<BilibiliUploader>(`/admin/bilibili-uploaders/${id}/refresh`);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '刷新UP主信息失败');
  },

  /**
   * 一键同步所有UP主
   */
  syncAll: async (maxResults: number = 100, smart: boolean = true): Promise<{
    success: boolean;
    totalSynced: number;
    totalErrors: number;
    tasks: Array<{
      mid: string;
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      synced: number;
      errors: number;
      startTime?: string;
      endTime?: string;
      error?: string;
    }>;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      totalSynced: number;
      totalErrors: number;
      tasks: Array<{
        mid: string;
        name: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        synced: number;
        errors: number;
        startTime?: string;
        endTime?: string;
        error?: string;
      }>;
    }>('/admin/sync-queue/sync-all', { maxResults, smart });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '一键同步失败');
  },

  /**
   * 获取同步状态
   */
  getSyncStatus: async (): Promise<{
    isRunning: boolean;
    currentIndex: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalSynced: number;
    totalErrors: number;
    tasks: Array<{
      mid: string;
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      synced: number;
      errors: number;
      startTime?: string;
      endTime?: string;
      error?: string;
    }>;
  }> => {
    const response = await apiClient.get<{
      isRunning: boolean;
      currentIndex: number;
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
      totalSynced: number;
      totalErrors: number;
      tasks: Array<{
        mid: string;
        name: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        synced: number;
        errors: number;
        startTime?: string;
        endTime?: string;
        error?: string;
      }>;
    }>('/admin/sync-queue/status');
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取同步状态失败');
  },

  /**
   * 取消同步
   */
  cancelSync: async (): Promise<void> => {
    const response = await apiClient.post<void>('/admin/sync-queue/cancel');
    if (response.code !== 0) {
      throw new Error(response.message || '取消同步失败');
    }
  },

  /**
   * 启动定时同步任务
   */
  startScheduler: async (): Promise<{
    isRunning: boolean;
    schedule: string;
    nextRun?: string;
  }> => {
    const response = await apiClient.post<{
      isRunning: boolean;
      schedule: string;
      nextRun?: string;
    }>('/admin/scheduler/start');
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '启动定时任务失败');
  },

  /**
   * 停止定时同步任务
   */
  stopScheduler: async (): Promise<void> => {
    const response = await apiClient.post<void>('/admin/scheduler/stop');
    if (response.code !== 0) {
      throw new Error(response.message || '停止定时任务失败');
    }
  },

  /**
   * 获取定时任务状态
   */
  getSchedulerStatus: async (): Promise<{
    isRunning: boolean;
    schedule: string;
    nextRun?: string;
  }> => {
    const response = await apiClient.get<{
      isRunning: boolean;
      schedule: string;
      nextRun?: string;
    }>('/admin/scheduler/status');
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取定时任务状态失败');
  },
};
