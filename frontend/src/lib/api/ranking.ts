/**
 * 排行榜 API 客户端
 */

import apiClient from './client';

export interface RankingItem {
  id: string;
  rank?: number;
  [key: string]: unknown;
}

export interface OverallRanking {
  hotPosts: RankingItem[];
  activeUsers: RankingItem[];
  hotPapers: RankingItem[];
  hotVideos: RankingItem[];
  hotRepos: RankingItem[];
}

export const rankingApi = {
  getOverallRanking: async (params?: { limit?: number }): Promise<OverallRanking> => {
    const response = await apiClient.get<OverallRanking>('/ranking/overall', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取排行榜失败');
    }
  },

  getHotPosts: async (params?: { limit?: number }): Promise<RankingItem[]> => {
    const response = await apiClient.get<RankingItem[]>('/ranking/posts', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取热门帖子失败');
    }
  },

  getActiveUsers: async (params?: { limit?: number }): Promise<RankingItem[]> => {
    const response = await apiClient.get<RankingItem[]>('/ranking/users', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取活跃用户失败');
    }
  },

  getHotPapers: async (params?: { limit?: number }): Promise<RankingItem[]> => {
    const response = await apiClient.get<RankingItem[]>('/ranking/papers', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取热门论文失败');
    }
  },

  getHotVideos: async (params?: { limit?: number }): Promise<RankingItem[]> => {
    const response = await apiClient.get<RankingItem[]>('/ranking/videos', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取热门视频失败');
    }
  },

  getHotRepos: async (params?: { limit?: number }): Promise<RankingItem[]> => {
    const response = await apiClient.get<RankingItem[]>('/ranking/repos', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取热门仓库失败');
    }
  },
};
