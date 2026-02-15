/**
 * 新闻搜索关键词管理 API
 */

import apiClient from './client';

export interface NewsSearchKeyword {
  id: string;
  keyword: string;
  category?: string;
  sourceType: string;
  isActive: boolean;
  priority: number;
  description?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsSearchKeywordListResponse {
  items: NewsSearchKeyword[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface NewsSearchKeywordNewsResponse {
  items: unknown[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const newsSearchKeywordApi = {
  /**
   * 获取所有关键词
   */
  async getAllKeywords(params: { page?: number; size?: number; isActive?: boolean; category?: string; sourceType?: string; keyword?: string } = {}) {
    const queryParams: Record<string, unknown> = {};
    if (params.page) queryParams.page = params.page;
    if (params.size) queryParams.size = params.size;
    if (params.isActive !== undefined) queryParams.isActive = params.isActive;
    if (params.category) queryParams.category = params.category;
    if (params.sourceType) queryParams.sourceType = params.sourceType;
    if (params.keyword) queryParams.keyword = params.keyword;

    const response = await apiClient.get<NewsSearchKeywordListResponse>('/admin/news-search-keywords', { params: queryParams });
    return response;
  },

  /**
   * 根据ID获取关键词
   */
  async getKeywordById(id: string) {
    const response = await apiClient.get<NewsSearchKeyword>(`/admin/news-search-keywords/${id}`);
    return response;
  },

  /**
   * 创建关键词
   */
  async createKeyword(data: Partial<NewsSearchKeyword>) {
    const response = await apiClient.post<NewsSearchKeyword>('/admin/news-search-keywords', data);
    return response;
  },

  /**
   * 批量创建关键词
   */
  async createKeywords(data: Partial<NewsSearchKeyword>[]) {
    const response = await apiClient.post<NewsSearchKeyword[]>('/admin/news-search-keywords/batch', data);
    return response;
  },

  /**
   * 更新关键词
   */
  async updateKeyword(id: string, data: Partial<NewsSearchKeyword>) {
    const response = await apiClient.put<NewsSearchKeyword>(`/admin/news-search-keywords/${id}`, data);
    return response;
  },

  /**
   * 删除关键词
   */
  async deleteKeyword(id: string) {
    const response = await apiClient.delete<void>(`/admin/news-search-keywords/${id}`);
    return response;
  },

  /**
   * 批量删除关键词
   */
  async deleteKeywords(ids: string[]) {
    const response = await apiClient.delete<ApiResponse<void>>('/admin/news-search-keywords/batch', { data: { ids } });
    return response;
  },

  /**
   * 获取关键词相关的新闻
   */
  async getKeywordNews(id: string, params: { page?: number; size?: number } = {}) {
    const response = await apiClient.get<NewsSearchKeywordNewsResponse>(`/admin/news-search-keywords/${id}/news`, {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response;
  },

  /**
   * 获取关键词相关的新闻数量
   */
  async getKeywordNewsCount(id: string) {
    const response = await apiClient.get<number>(`/admin/news-search-keywords/${id}/news/count`);
    return response;
  },

  /**
   * 一键拉取近24小时内最新关键词相关新闻
   */
  async syncLatestNews(hours: number = 24) {
    const response = await apiClient.post<Record<string, unknown>>('/admin/news-search-keywords/sync-latest', {
      params: { hours },
    });
    return response;
  },

  /**
   * 根据关键词搜索并抓取新闻
   */
  async searchNewsByKeywords(keywords: string[], options?: {
    includeHotNews?: boolean;
    includeTechNews?: boolean;
    includeKr36?: boolean;
    hotNewsPlatforms?: string[];
    maxResultsPerSource?: number;
  }) {
    const response = await apiClient.post<Record<string, unknown>>('/admin/news-search-keywords/search', {
      keywords,
      ...options,
    });
    return response;
  },

  /**
   * 根据所有启用的关键词搜索并抓取新闻
   */
  async searchNewsByAllKeywords(params?: {
    includeHotNews?: boolean;
    includeTechNews?: boolean;
    includeKr36?: boolean;
    hotNewsPlatforms?: string;
    maxResultsPerSource?: number;
  }) {
    const response = await apiClient.get<Record<string, unknown>>('/admin/news-search-keywords/search-all', {
      params,
    });
    return response;
  },
};
