/**
 * Bilibili搜索关键词API
 */

import apiClient from './client';

export interface BilibiliSearchKeyword {
  id: string;
  keyword: string;
  category?: string;
  isActive: boolean;
  priority: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  videoCount?: number;
}

export interface CreateKeywordData {
  keyword: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
}

export interface UpdateKeywordData {
  keyword?: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
}

export interface GetKeywordsParams {
  page?: number;
  size?: number;
  isActive?: boolean;
  category?: string;
  keyword?: string;
}

type KeywordListResponse = {
  items: BilibiliSearchKeyword[];
  pagination: { total: number };
};

export const bilibiliSearchKeywordApi = {
  /**
   * 获取关键词列表
   */
  async getKeywords(params: GetKeywordsParams = {}) {
    const response = await apiClient.get<KeywordListResponse>('/admin/bilibili-search-keywords', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        isActive: params.isActive,
        category: params.category,
        keyword: params.keyword,
      },
    });
    return response;
  },

  /**
   * 获取单个关键词
   */
  async getKeyword(id: string) {
    const response = await apiClient.get(`/admin/bilibili-search-keywords/${id}`);
    return response;
  },

  /**
   * 创建关键词
   */
  async createKeyword(data: CreateKeywordData) {
    const response = await apiClient.post('/admin/bilibili-search-keywords', data);
    return response;
  },

  /**
   * 更新关键词
   */
  async updateKeyword(id: string, data: UpdateKeywordData) {
    const response = await apiClient.put(`/admin/bilibili-search-keywords/${id}`, data);
    return response;
  },

  /**
   * 删除关键词
   */
  async deleteKeyword(id: string) {
    const response = await apiClient.delete(`/admin/bilibili-search-keywords/${id}`);
    return response;
  },

  /**
   * 获取启用的关键词字符串
   */
  async getActiveKeywordsString() {
    const response = await apiClient.get('/admin/bilibili-search-keywords/active/string');
    return response;
  },

  /**
   * 批量创建关键词
   */
  async batchCreateKeywords(keywords: CreateKeywordData[]) {
    const response = await apiClient.post('/admin/bilibili-search-keywords/batch', { keywords });
    return response;
  },
};
