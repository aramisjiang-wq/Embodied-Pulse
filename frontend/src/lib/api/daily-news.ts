/**
 * 每日新闻 API 客户端
 */

import { cachedGet } from './cached-client';
import apiClient from './client';
import {
  DailyNews,
  DailyNewsListResponse,
  CreateDailyNewsRequest,
  UpdateDailyNewsRequest,
} from './types';

export const dailyNewsApi = {
  async getNewsList(params?: {
    page?: number;
    size?: number;
    isPinned?: boolean;
  }): Promise<DailyNewsListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.size) query.set('size', params.size.toString());
    if (params?.isPinned !== undefined)
      query.set('isPinned', params.isPinned.toString());

    const response = await cachedGet<DailyNewsListResponse>(`/news?${query.toString()}`);
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], total: 0 };
  },

  async getNewsById(id: string): Promise<DailyNews | null> {
    const response = await cachedGet<DailyNews>(`/news/${id}`);
    if (response && typeof response === 'object' && 'id' in response) {
      return response;
    }
    return null;
  },

  async getPinnedNews(): Promise<DailyNews[]> {
    const response = await cachedGet<DailyNews[]>('/news/pinned');
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  },

  async createNews(data: CreateDailyNewsRequest): Promise<DailyNews> {
    const result = await apiClient.post<DailyNews>('/admin/content/news', data);
    return result.data;
  },

  async updateNews(id: string, data: UpdateDailyNewsRequest): Promise<DailyNews> {
    const result = await apiClient.put<DailyNews>(`/admin/content/news/${id}`, data);
    return result.data;
  },

  async deleteNews(id: string): Promise<void> {
    await apiClient.delete(`/admin/content/news/${id}`);
  },

  async togglePin(id: string): Promise<DailyNews> {
    const result = await apiClient.put<DailyNews>(`/admin/content/news/${id}/pin`, {});
    return result.data;
  },

  async toggleContentPin(type: string, id: string): Promise<any> {
    const result = await apiClient.put(`/admin/content/${type}/${id}/pin`, {});
    return result.data;
  },
};
