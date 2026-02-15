import apiClient from './client';
import { PaginatedResponse, Announcement } from './types';

export const announcementApi = {
  getAnnouncements: async (params?: { page?: number; size?: number; isActive?: boolean }): Promise<PaginatedResponse<Announcement>> => {
    const response = await apiClient.get<PaginatedResponse<Announcement>>('/announcements', { params });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取公告列表失败');
  },

  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>('/announcements/active');
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取活跃公告失败');
  },

  createAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
    const response = await apiClient.post<Announcement>('/announcements', data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '创建公告失败');
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
    const response = await apiClient.put<Announcement>(`/announcements/${id}`, data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '更新公告失败');
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/announcements/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '删除公告失败');
    }
  },
};
