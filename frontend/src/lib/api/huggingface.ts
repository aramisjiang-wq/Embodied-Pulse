/**
 * Hugging Face 模型API客户端
 */

import { cachedGet } from './cached-client';
import apiClient from './client';
import { ApiResponse, PaginatedResponse, HuggingFaceModel } from './types';

export const huggingfaceApi = {
  getModels: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'downloads' | 'likes';
    task?: string;
    license?: string;
    keyword?: string;
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
      return response.data;
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
};
