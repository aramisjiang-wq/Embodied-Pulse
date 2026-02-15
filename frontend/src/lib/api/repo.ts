import { cachedGet } from './cached-client';
import apiClient from './client';
import { PaginatedResponse, GithubRepo } from './types';

export const repoApi = {
  getRepos: async (params: {
    page?: number;
    size?: number;
    sort?: 'latest' | 'hot' | 'stars';
    language?: string;
    keyword?: string;
    domain?: string;
    scenario?: string;
  }): Promise<PaginatedResponse<GithubRepo>> => {
    try {
      const response = await cachedGet<PaginatedResponse<GithubRepo>>('/repos', { params });
      if (response && typeof response === 'object' && 'items' in response) {
        return response;
      }
      return { items: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    } catch (error) {
      console.error('getRepos error:', error);
      return { items: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  },

  getRepo: async (repoId: string): Promise<GithubRepo | null> => {
    try {
      const response = await cachedGet<GithubRepo>(`/repos/${repoId}`);
      if (response && typeof response === 'object' && 'id' in response) {
        return response;
      }
      return null;
    } catch (error) {
      console.error('getRepo error:', error);
      return null;
    }
  },

  createRepo: async (data: Partial<GithubRepo>): Promise<GithubRepo> => {
    const response = await apiClient.post<GithubRepo>('/repos', data);
    return response.data;
  },

  getGitHubRepoInfo: async (url: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/github-repo-info/info', { params: { url } });
    return response.data;
  },
};
