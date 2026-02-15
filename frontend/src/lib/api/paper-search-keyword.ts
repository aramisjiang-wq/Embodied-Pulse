/**
 * 论文搜索关键词API
 */

import apiClient from './client';

export interface PaperSearchKeyword {
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
  paperCount?: number;
}

export interface CreateKeywordData {
  keyword: string;
  category?: string;
  sourceType?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
  tags?: string;
}

export interface UpdateKeywordData {
  keyword?: string;
  category?: string;
  sourceType?: string;
  isActive?: boolean;
  priority?: number;
  description?: string;
  tags?: string;
}

export interface GetKeywordsParams {
  page?: number;
  size?: number;
  isActive?: boolean;
  category?: string;
  sourceType?: string;
  keyword?: string;
}

type KeywordListResponse = {
  items: PaperSearchKeyword[];
  pagination: { total: number };
};

type KeywordPapersResponse = {
  items: unknown[];
  pagination: { total: number };
};

export const paperSearchKeywordApi = {
  /**
   * 获取关键词列表
   */
  async getKeywords(params: GetKeywordsParams = {}) {
    const response = await apiClient.get<KeywordListResponse>('/admin/paper-search-keywords', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        isActive: params.isActive,
        category: params.category,
        sourceType: params.sourceType,
        keyword: params.keyword,
      },
    });
    return response;
  },

  /**
   * 获取单个关键词
   */
  async getKeyword(id: string) {
    const response = await apiClient.get<PaperSearchKeyword>(`/admin/paper-search-keywords/${id}`);
    return response;
  },

  /**
   * 创建关键词
   */
  async createKeyword(data: CreateKeywordData) {
    const response = await apiClient.post<PaperSearchKeyword>('/admin/paper-search-keywords', data);
    return response;
  },

  /**
   * 更新关键词
   */
  async updateKeyword(id: string, data: UpdateKeywordData) {
    const response = await apiClient.put<PaperSearchKeyword>(`/admin/paper-search-keywords/${id}`, data);
    return response;
  },

  /**
   * 删除关键词
   */
  async deleteKeyword(id: string) {
    const response = await apiClient.delete<void>(`/admin/paper-search-keywords/${id}`);
    return response;
  },

  /**
   * 获取所有启用的关键词
   */
  async getActiveKeywords() {
    const response = await apiClient.get<PaperSearchKeyword[]>('/admin/paper-search-keywords/active');
    return response;
  },

  /**
   * 获取所有启用的管理员关键词
   */
  async getActiveAdminKeywords() {
    const response = await apiClient.get<PaperSearchKeyword[]>('/admin/paper-search-keywords/active/admin');
    return response;
  },

  /**
   * 获取所有启用的用户订阅关键词
   */
  async getActiveUserKeywords() {
    const response = await apiClient.get<PaperSearchKeyword[]>('/admin/paper-search-keywords/active/user');
    return response;
  },

  /**
   * 批量创建关键词
   */
  async batchCreateKeywords(keywords: CreateKeywordData[]) {
    const response = await apiClient.post<PaperSearchKeyword[]>('/admin/paper-search-keywords/batch', { keywords });
    return response;
  },

  /**
   * 获取关键词相关的论文
   */
  async getKeywordPapers(id: string, params: { page?: number; size?: number } = {}) {
    const response = await apiClient.get<KeywordPapersResponse>(`/admin/paper-search-keywords/${id}/papers`, {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response;
  },

  /**
   * 获取关键词相关的论文数量
   */
  async getKeywordPapersCount(id: string) {
    const response = await apiClient.get<{ count: number }>(`/admin/paper-search-keywords/${id}/papers/count`);
    return response;
  },
};
