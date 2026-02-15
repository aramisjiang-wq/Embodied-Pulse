/**
 * 数据同步API客户端
 */

import apiClient from './client';

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: number;
  total?: number;
  message?: string;
}

export const syncApi = {
  /**
   * 全量同步所有数据
   */
  syncAll: async (): Promise<void> => {
    await apiClient.post<void>('/admin/sync/all');
  },

  /**
   * 同步具身智能数据
   */
  syncEmbodiedAI: async (): Promise<void> => {
    await apiClient.post<void>('/admin/sync/embodied-ai');
  },

  /**
   * 同步arXiv论文
   */
  syncArxiv: async (params: { query?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/arxiv', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步GitHub项目
   */
  syncGithub: async (params: { query?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/github', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步HuggingFace模型
   */
  syncHuggingFace: async (params: { task?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/huggingface', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步Bilibili视频
   */
  syncBilibili: async (params: { query?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/bilibili', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步YouTube视频
   */
  syncYouTube: async (params: { query?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/youtube', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步GitHub岗位
   */
  syncJobs: async (params: { maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/jobs', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步热点新闻
   */
  syncHotNews: async (params: { platform?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/hot-news', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步DailyHotApi新闻
   */
  syncDailyHotApi: async (params: { platform?: string; maxResults?: number }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/dailyhot-api', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步36kr新闻
   */
  sync36kr: async (params: { maxResults?: number; useApi?: boolean }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/36kr', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步科技新闻（TechCrunch等，作为36kr的替代）
   */
  syncTechNews: async (params: { maxResults?: number; sources?: string[] }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/tech-news', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 同步Semantic Scholar论文
   */
  syncSemanticScholar: async (params: { 
    query?: string; 
    maxResults?: number; 
    year?: number; 
    fieldsOfStudy?: string[] 
  }): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sync/semantic-scholar', params);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 获取同步队列
   */
  getSyncQueue: async (): Promise<Array<Record<string, unknown>>> => {
    const response = await apiClient.get<Array<Record<string, unknown>>>('/admin/sync-queue');
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取同步队列失败');
  },

  /**
   * 重试同步任务
   */
  retrySyncTask: async (id: string): Promise<void> => {
    const response = await apiClient.post<void>(`/admin/sync-queue/${id}/retry`);
    if (response.code !== 0) {
      throw new Error(response.message || '重试失败');
    }
  },

  /**
   * 删除同步任务
   */
  deleteSyncTask: async (id: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/admin/sync-queue/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '删除失败');
    }
  },
};
