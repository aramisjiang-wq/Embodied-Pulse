import apiClient from './client';

export interface OverviewData {
  totalUploaders: number;
  totalVideos: number;
  total_play_count: number;
  newVideosThisMonth: number;
  avg_play_count: number;
  lastUpdatedAt: string;
}

export interface PublishTrendData {
  data: Array<{
    period: string;
    uploaderId: string;
    uploaderName: string;
    video_count: number;
  }>;
}

export interface PlayHeatmapData {
  data: Array<{
    month: string;
    uploaderId: string;
    uploaderName: string;
    playCount: number;
  }>;
}

export interface RankingItem {
  rank: number;
  uploaderId: string;
  uploaderName: string;
  avatar: string;
  video_count: number;
  total_play_count: number;
  avg_play_count: number;
  total_like_count: number;
  total_favorite_count: number;
  growth_rate: number;
}

export interface BilibiliUploader {
  id: string;
  mid: string;
  name: string;
  avatar?: string;
  description?: string;
  tags?: string[];
  video_count: number;
}

export interface UploaderDetail {
  uploader: {
    id: string;
    mid: string;
    name: string;
    avatar: string;
    description: string;
    tags: string[];
    subscribedAt: string;
    lastSyncAt: string;
  };
  stats: {
    totalVideos: number;
    total_play_count: number;
    avg_play_count: number;
    total_like_count: number;
    total_favorite_count: number;
    avgDuration: number;
    newVideosThisMonth: number;
  };
  publishPattern: {
    frequency: number;
    preferredDays: string[];
    preferredTime: string;
    trend: Array<{ date: string; count: number }>;
  };
  playPerformance: {
    trend: Array<{ date: string; playCount: number }>;
    likeRate: number;
    favoriteRate: number;
    shareRate: number;
    distribution: Array<{ range: string; count: number; percentage: number }>;
  };
  topVideos: Array<{
    id: string;
    title: string;
    publishedDate: string;
    playCount: number;
    likeCount: number;
  }>;
}

export const analyticsApi = {
  getBilibiliUploaders: async () => {
    const response = await apiClient.get<{ uploaders: BilibiliUploader[] }>('/analytics/bilibili/uploaders');
    return response.data;
  },

  getOverview: async (params: {
    uploaderIds: string[];
    startDate: string;
    endDate: string;
  }) => {
    const response = await apiClient.get<OverviewData>('/analytics/bilibili/overview', { params });
    return response.data;
  },

  getPublishTrend: async (params: {
    uploaderIds: string[];
    startDate: string;
    endDate: string;
    groupBy: 'day' | 'week' | 'month';
  }) => {
    const response = await apiClient.get<PublishTrendData>('/analytics/bilibili/publish-trend', { params });
    return response.data;
  },

  getPlayHeatmap: async (params: {
    uploaderIds: string[];
    startDate: string;
    endDate: string;
  }) => {
    const response = await apiClient.get<PlayHeatmapData>('/analytics/bilibili/play-heatmap', { params });
    return response.data;
  },

  getRankings: async (params: {
    uploaderIds: string[];
    startDate: string;
    endDate: string;
    type: 'publishCount' | 'playCount' | 'avgPlayCount' | 'growthRate';
  }) => {
    const response = await apiClient.get<{ rankings: RankingItem[] }>('/analytics/bilibili/rankings', { params });
    return response.data;
  },

  getUploaderDetail: async (params: {
    uploaderId: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await apiClient.get<UploaderDetail>('/analytics/bilibili/uploader-detail', { params });
    return response.data;
  },

  exportData: async (params: {
    uploaderIds: string[];
    startDate: string;
    endDate: string;
    format: 'excel' | 'csv' | 'image';
  }) => {
    const response = await apiClient.get('/analytics/bilibili/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
