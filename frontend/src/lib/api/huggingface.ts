/**
 * Hugging Face 模型API客户端
 */

import { cachedGet } from './cached-client';
import apiClient from './client';
import { ApiResponse, PaginatedResponse, HuggingFaceModel } from './types';

export interface HuggingFaceModelPreview {
  modelId: string;
  id: string;
  fullName: string;
  name: string;
  author: string;
  description?: string;
  license?: string;
  tags?: string[];
  pipeline_tag?: string;
  downloads: number;
  likes: number;
  lastModified: string;
  private: boolean;
  fromApi?: boolean;
  contentType?: 'model' | 'dataset' | 'space';
}

export const huggingfaceApi = {
  getModels: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'downloads' | 'likes';
    task?: string;
    license?: string;
    keyword?: string;
    contentType?: 'model' | 'dataset' | 'space';
    author?: string;
    category?: string;
  }): Promise<PaginatedResponse<HuggingFaceModel>> => {
    const response = await cachedGet<PaginatedResponse<HuggingFaceModel>>('/huggingface', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  getModel: async (modelId: string): Promise<HuggingFaceModel | null> => {
    const response = await cachedGet<HuggingFaceModel>(`/huggingface/${modelId}`);
    if (response && typeof response === 'object' && 'id' in response) {
      return response;
    }
    return null;
  },

  getMySubscriptions: async (): Promise<{
    papers: boolean;
    authors: Array<{
      id: string;
      author: string;
      authorUrl: string;
      isActive: boolean;
      createdAt: string;
    }>;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      papers: boolean;
      authors: Array<{
        id: string;
        author: string;
        authorUrl: string;
        isActive: boolean;
        createdAt: string;
      }>;
    }>>('/huggingface-subscriptions/my');
    if (response && response.code === 0 && response.data) {
      return response.data as unknown as {
        papers: boolean;
        authors: Array<{
          id: string;
          author: string;
          authorUrl: string;
          isActive: boolean;
          createdAt: string;
        }>;
      };
    }
    return { papers: false, authors: [] };
  },

  subscribePapers: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/huggingface-subscriptions/papers');
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return { message: '订阅成功' };
  },

  unsubscribePapers: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/huggingface-subscriptions/papers');
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return { message: '已取消订阅' };
  },

  subscribeAuthor: async (author: string, authorUrl?: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/huggingface-subscriptions/author', { author, authorUrl });
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return { message: '订阅成功' };
  },

  unsubscribeAuthor: async (subscriptionId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/huggingface-subscriptions/author/${subscriptionId}`);
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return { message: '已取消订阅' };
  },

  getModelInfoFromUrl: async (url: string): Promise<HuggingFaceModelPreview> => {
    const response = await apiClient.get<HuggingFaceModelPreview>('/huggingface/info/from-url', {
      params: { url },
    });
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    throw new Error(response?.message || '获取模型信息失败');
  },

  submitModel: async (data: {
    fullName: string;
    description?: string;
    task?: string;
    downloads?: number;
    likes?: number;
    lastModified?: string;
    hfId?: string;
    name?: string;
    author?: string;
    license?: string;
    tags?: string[];
    contentType?: 'model' | 'dataset' | 'space';
  }): Promise<{ model: HuggingFaceModel; alreadyExists: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ model: HuggingFaceModel; alreadyExists: boolean; message: string }>>('/huggingface', data);
    if (response && response.code === 0 && response.data) {
      return response.data as unknown as { model: HuggingFaceModel; alreadyExists: boolean; message: string };
    }
    throw new Error(response?.message || '提交失败');
  },

  getTaskTypeStats: async (): Promise<Record<string, number> & { latestUpdatedAt?: string }> => {
    // 使用直连请求，避免缓存导致统计不更新
    const response = await apiClient.get<ApiResponse<Record<string, number> & { latestUpdatedAt?: string }>>('/huggingface/stats/task-types');
    if (response && response.code === 0 && response.data) {
      return response.data as unknown as Record<string, number> & { latestUpdatedAt?: string };
    }
    return {};
  },

  getAuthorStats: async (author: string): Promise<{
    author: string;
    modelCount: number;
    datasetCount: number;
    totalCount: number;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      author: string;
      modelCount: number;
      datasetCount: number;
      totalCount: number;
    }>>(`/huggingface/author/${encodeURIComponent(author)}/stats`);
    if (response && response.code === 0 && response.data) {
      return response.data as unknown as {
        author: string;
        modelCount: number;
        datasetCount: number;
        totalCount: number;
      };
    }
    throw new Error(response?.message || '获取作者统计失败');
  },

  getSubscribedAuthorsContent: async (): Promise<{
    authors: Array<{
      author: string;
      authorUrl: string;
      items: HuggingFaceModel[];
      total: number;
    }>;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      authors: Array<{
        author: string;
        authorUrl: string;
        items: HuggingFaceModel[];
        total: number;
      }>;
    }>>('/huggingface-subscriptions/authors/content');
    if (response && response.code === 0 && response.data) {
      return response.data as unknown as {
        authors: Array<{
          author: string;
          authorUrl: string;
          items: HuggingFaceModel[];
          total: number;
        }>;
      };
    }
    return { authors: [] };
  },

  validateLinks: async (limit: number = 50): Promise<{
    validated: number;
    valid: number;
    invalid: number;
    errors: Array<{ fullName: string; error: string }>;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      validated: number;
      valid: number;
      invalid: number;
      errors: Array<{ fullName: string; error: string }>;
    }>>('/huggingface/admin/validate-links', null, { params: { limit } });
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    throw new Error(response?.message || '验证链接失败');
  },

  getInvalidLinks: async (skip: number = 0, take: number = 100): Promise<{
    items: Array<{
      id: string;
      fullName: string;
      contentType: string | null;
      linkCheckedAt: Date | null;
    }>;
    total: number;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      items: Array<{
        id: string;
        fullName: string;
        contentType: string | null;
        linkCheckedAt: Date | null;
      }>;
      total: number;
    }>>('/huggingface/admin/invalid-links', { params: { skip, take } });
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return { items: [], total: 0 };
  },

  deleteInvalidLinks: async (linkIds: string[]): Promise<{ deleted: number }> => {
    const response = await apiClient.delete<ApiResponse<{ deleted: number }>>('/huggingface/admin/invalid-links', { data: { linkIds } });
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    throw new Error(response?.message || '删除无效链接失败');
  },
};
