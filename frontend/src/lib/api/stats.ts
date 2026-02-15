/**
 * 统计数据API客户端
 */

import { cachedGet } from './cached-client';

export interface ContentStats {
  papers: number;
  videos: number;
  repos: number;
  huggingface: number;
  jobs: number;
}

export const statsApi = {
  getContentStats: async (): Promise<ContentStats> => {
    try {
      const response = await cachedGet<ContentStats>('/stats/content');
      if (response && typeof response === 'object') {
        return response;
      }
      return {
        papers: 0,
        videos: 0,
        repos: 0,
        huggingface: 0,
        jobs: 0,
      };
    } catch (error) {
      console.error('Stats API error:', error);
      return {
        papers: 0,
        videos: 0,
        repos: 0,
        huggingface: 0,
        jobs: 0,
      };
    }
  },
};
