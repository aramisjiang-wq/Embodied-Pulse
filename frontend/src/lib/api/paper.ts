/**
 * 论文API客户端
 */

import { cachedGet } from './cached-client';
import { PaginatedResponse, Paper } from './types';

export const paperApi = {
  getPapers: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'citation';
    category?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Paper>> => {
    const response = await cachedGet<PaginatedResponse<Paper>>('/papers', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  getPaper: async (paperId: string): Promise<Paper | null> => {
    const response = await cachedGet<Paper>(`/papers/${paperId}`);
    if (response && typeof response === 'object' && 'id' in response) {
      return response;
    }
    return null;
  },
};
