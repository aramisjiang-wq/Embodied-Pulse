/**
 * 视频API客户端
 */

import { cachedGet } from './cached-client';
import apiClient from './client';
import { ApiResponse, PaginatedResponse, Video } from './types';

export const videoApi = {
  getVideos: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'play';
    platform?: string;
    keyword?: string;
    uploaderId?: string;
  }): Promise<PaginatedResponse<Video>> => {
    const response = await cachedGet<PaginatedResponse<Video>>('/videos', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  getVideo: async (videoId: string): Promise<Video | null> => {
    const response = await cachedGet<Video>(`/videos/${videoId}`);
    if (response && typeof response === 'object' && 'id' in response) {
      return response;
    }
    return null;
  },

  getUploaders: async (): Promise<Array<{
    id: string;
    mid: string;
    name: string;
    avatar?: string;
    description?: string;
    videoCount: number;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      mid: string;
      name: string;
      avatar?: string;
      description?: string;
      videoCount: number;
    }>>>('/videos/uploaders');
    
    if (!response || typeof response !== 'object' || response.code !== 0) {
      return [];
    }
    
    if ('data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  },
};
