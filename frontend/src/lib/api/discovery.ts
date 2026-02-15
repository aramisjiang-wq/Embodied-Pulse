/**
 * 发现 API 客户端
 */

import { cachedGet } from './cached-client';
import { PaginatedResponse, FeedItem } from './types';

export const discoveryApi = {
  getDiscovery: async (params: {
    contentType?: 'all' | 'github' | 'huggingface' | 'video' | 'paper' | 'community' | 'news';
    sortType?: 'hot' | 'latest';
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<FeedItem>> => {
    const response = await cachedGet<PaginatedResponse<FeedItem>>('/discovery', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },
};
