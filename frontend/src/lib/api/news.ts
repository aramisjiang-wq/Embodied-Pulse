import { cachedGet } from './cached-client';
import { PaginatedResponse } from './types';

export const newsApi = {
  getNews: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot';
    category?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    try {
      const response = await cachedGet<PaginatedResponse<Record<string, unknown>>>('/news', { params });
      console.log('[newsApi.getNews] response:', response, 'isArray:', Array.isArray(response?.items));
      if (response && 'items' in response && Array.isArray(response.items)) {
        return response;
      }
      return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    } catch (error) {
      console.error('getNews error:', error);
      return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  },

  getNewsById: async (id: string): Promise<Record<string, unknown> | null> => {
    try {
      return await cachedGet<Record<string, unknown>>(`/news/${id}`);
    } catch {
      return null;
    }
  },

  searchNews: async (params: {
    keyword: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    try {
      const response = await cachedGet<PaginatedResponse<Record<string, unknown>>>('/news/search', { params });
      if (response && 'items' in response && Array.isArray(response.items)) {
        return response;
      }
      return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    } catch (error) {
      console.error('searchNews error:', error);
      return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  },

  getHotNews: async (params: {
    days?: number;
    limit?: number;
  }): Promise<Record<string, unknown>[]> => {
    try {
      const response = await cachedGet<Record<string, unknown>[]>('/news/hot', { params });
      console.log('[newsApi.getHotNews] response:', response, 'type:', typeof response, 'isArray:', Array.isArray(response));
      if (Array.isArray(response)) {
        return response;
      }
      console.warn('[newsApi.getHotNews] Response is not an array, returning empty array');
      return [];
    } catch (error) {
      console.error('getHotNews error:', error);
      return [];
    }
  },

  getRelatedNews: async (id: string, params?: {
    limit?: number;
  }): Promise<Record<string, unknown>[]> => {
    try {
      const response = await cachedGet<Record<string, unknown>[]>(`/news/${id}/related`, { params });
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch {
      return [];
    }
  },
};
