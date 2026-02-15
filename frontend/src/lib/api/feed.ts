/**
 * 信息流API客户端
 */

import { cachedGet } from './cached-client';
import { PaginatedResponse, FeedItem } from './types';

export const feedApi = {
  getFeed: async (params: {
    page?: number;
    size?: number;
    tab?: 'recommend' | 'paper' | 'video' | 'code' | 'huggingface' | 'job' | 'latest';
  }): Promise<PaginatedResponse<FeedItem>> => {
    const response = await cachedGet<PaginatedResponse<FeedItem>>('/feed', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },
};
