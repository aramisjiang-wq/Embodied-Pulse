import apiClient from './client';

export interface BilibiliCookie {
  id: string;
  name: string;
  isActive: boolean;
  errorCount: number;
  lastUsed: string;
  lastError?: string;
  lastCheckAt?: string;
  checkResult?: string;
  userMid?: string;
  userName?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CookieStatus {
  cookies: BilibiliCookie[];
  activeCount: number;
  totalCount: number;
  inactiveCount: number;
}

export interface CookieSettings {
  autoRotateEnabled: boolean;
  healthCheckInterval: number;
  maxErrorCount: number;
  alertEnabled: boolean;
}

export interface HealthCheckResult {
  id: string;
  name: string;
  valid: boolean;
  mid?: string;
  userName?: string;
  error?: string;
  errorCode?: number;
}

export const cookieApi = {
  addCookie: async (name: string, cookie: string, priority?: number) => {
    return apiClient.post('/admin/bilibili-cookies', { name, cookie, priority });
  },

  removeCookie: async (id: string) => {
    return apiClient.delete(`/admin/bilibili-cookies/${id}`);
  },

  getCookieStatus: async (): Promise<CookieStatus> => {
    const response = await apiClient.get<CookieStatus>('/admin/bilibili-cookies/status');
    return response.data as any;
  },

  rotateCookie: async () => {
    return apiClient.post('/admin/bilibili-cookies/rotate');
  },

  getSettings: async (): Promise<CookieSettings> => {
    const response = await apiClient.get<CookieSettings>('/admin/bilibili-cookies/settings');
    return response.data as any;
  },

  updateSettings: async (settings: Partial<CookieSettings>) => {
    return apiClient.put('/admin/bilibili-cookies/settings', settings);
  },

  checkHealth: async (): Promise<CookieStatus> => {
    const response = await apiClient.get<CookieStatus>('/admin/bilibili-cookies/health');
    return response.data as any;
  },

  checkAllCookies: async (): Promise<{
    total: number;
    valid: number;
    invalid: number;
    cookies: HealthCheckResult[];
  }> => {
    const response = await apiClient.get('/admin/bilibili-cookies/check');
    return response.data as any;
  },

  checkSingleCookie: async (id: string): Promise<HealthCheckResult> => {
    const response = await apiClient.get(`/admin/bilibili-cookies/${id}/check`);
    return response.data as any;
  },

  toggleCookieStatus: async (id: string) => {
    return apiClient.put(`/admin/bilibili-cookies/${id}/toggle`);
  },

  resetCookieErrorCount: async (id: string) => {
    return apiClient.put(`/admin/bilibili-cookies/${id}/reset`);
  },

  getStats: async () => {
    const response = await apiClient.get('/admin/bilibili-cookies/stats');
    return response.data as any;
  },
};
