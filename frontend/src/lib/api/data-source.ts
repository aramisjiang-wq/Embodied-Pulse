/**
 * 数据源管理API客户端
 */

import apiClient from './client';

export interface DataSource {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  tags?: string[]; // 标签数组
  apiBaseUrl: string;
  apiKey?: string;
  config: {
    query?: string;
    maxResults?: number;
    task?: string;
    category?: string;
    language?: string;
    topic?: string;
    [key: string]: unknown;
  };
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'running';
  lastSyncResult?: {
    synced: number;
    errors: number;
    total?: number;
  };
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck?: string;
  healthError?: string; // 健康检查错误信息
  createdAt: string;
  updatedAt: string;
  logs?: DataSourceLog[]; // 数据源日志
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export interface DataSourceLog {
  id: string;
  type: 'sync' | 'health_check' | 'config_update';
  status: 'success' | 'error' | 'warning';
  requestUrl?: string;
  requestMethod?: string;
  requestBody?: unknown;
  responseCode?: number;
  responseBody?: unknown;
  errorMessage?: string;
  duration?: number;
  syncedCount?: number;
  errorCount?: number;
  createdAt: string;
}

export const dataSourceApi = {
  /**
   * 初始化数据源
   */
  init: async (): Promise<void> => {
    const response = await apiClient.post<void>('/admin/data-sources/init');
    if (response.code !== 0) {
      throw new Error(response.message);
    }
  },

  /**
   * 获取所有数据源
   */
  getAll: async (): Promise<DataSource[]> => {
    const response = await apiClient.get<DataSource[]>('/admin/data-sources');
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    // 确保返回的是数组
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * 获取单个数据源
   */
  getById: async (id: string): Promise<DataSource> => {
    const response = await apiClient.get<DataSource>(`/admin/data-sources/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 更新数据源配置
   */
  update: async (id: string, data: Partial<DataSource>): Promise<DataSource> => {
    const response = await apiClient.put<DataSource>(`/admin/data-sources/${id}`, data);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 切换数据源启用状态
   */
  toggle: async (id: string, enabled: boolean): Promise<DataSource> => {
    const response = await apiClient.patch<DataSource>(`/admin/data-sources/${id}/toggle`, { enabled });
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 检查单个数据源健康状态
   */
  checkHealth: async (id: string): Promise<HealthCheckResult> => {
    const response = await apiClient.get<HealthCheckResult>(`/admin/data-sources/${id}/health`);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 检查所有数据源健康状态
   */
  checkAllHealth: async (): Promise<Array<{ sourceId: string; sourceName: string; result: HealthCheckResult }>> => {
    const response = await apiClient.get<Array<{ sourceId: string; sourceName: string; result: HealthCheckResult }>>('/admin/data-sources/health/all');
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },

  /**
   * 获取数据源日志
   */
  getLogs: async (id: string, limit: number = 100, offset: number = 0): Promise<{ logs: DataSourceLog[]; total: number }> => {
    const response = await apiClient.get<{ logs: DataSourceLog[]; total: number }>(`/admin/data-sources/${id}/logs`, {
      params: { limit, offset },
    });
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },
};
