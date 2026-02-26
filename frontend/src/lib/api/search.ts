/**
 * 搜索API客户端
 */

import { cachedGet } from './cached-client';
import { PaginatedResponse } from './types';

export interface SearchResult {
  type: 'paper' | 'video' | 'repo' | 'job' | 'huggingface' | 'post';
  id: string;
  title: string;
  description?: string;
  abstract?: string;
  name?: string;
  fullName?: string;
  htmlUrl?: string;
  arxivId?: string;
  pdfUrl?: string;
  platform?: string;
  videoId?: string;
  bvid?: string;
  applyUrl?: string;
  hfId?: string;
  url?: string;
  tags?: string[];
  createdAt?: string;
  metadata?: Record<string, unknown>;
  contentType?: string;
}

export const searchApi = {
  search: async (params: {
    q: string;
    type?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<SearchResult>> => {
    const response = await cachedGet<PaginatedResponse<SearchResult>>('/search', { params });
    if (response && typeof response === 'object' && 'items' in response) {
      return response;
    }
    return { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },
};
