/**
 * 岗位API客户端
 */

import { cachedGet } from './cached-client';
import apiClient from './client';
import { ApiResponse, PaginatedResponse, Job } from './types';

export const jobApi = {
  getJobs: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'salary';
    location?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Job>> => {
    const response = await cachedGet<PaginatedResponse<Job>>('/jobs', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  getJob: async (jobId: string): Promise<Job | null> => {
    const response = await cachedGet<Job>(`/jobs/${jobId}`);
    if (response && typeof response === 'object' && 'id' in response) {
      return response;
    }
    return null;
  },

  getJobSeekingPosts: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'salary';
    location?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await cachedGet<PaginatedResponse<Record<string, unknown>>>('/jobs/job-seeking-posts', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  createJob: async (data: Record<string, unknown>): Promise<Job | null> => {
    const response = await apiClient.post<ApiResponse<Job>>('/jobs', data);
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  },

  createJobSeekingPost: async (data: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    const response = await apiClient.post<ApiResponse<Record<string, unknown>>>('/jobs/job-seeking-posts', data);
    if (response && response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  },

  getMyPosts: async (): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await cachedGet<PaginatedResponse<Record<string, unknown>>>('/jobs/my-posts');
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  deleteJob: async (jobId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/jobs/${jobId}`);
      return true;
    } catch {
      return false;
    }
  },

  deleteJobSeekingPost: async (postId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/jobs/job-seeking-posts/${postId}`);
      return true;
    } catch {
      return false;
    }
  },
};
