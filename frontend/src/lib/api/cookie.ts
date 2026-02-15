import apiClient from './client';

export interface BilibiliCookie {
  id: string;
  name: string;
  isActive: boolean;
  errorCount: number;
  lastUsed: string;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CookieStatus {
  cookies: BilibiliCookie[];
  activeCount: number;
  totalCount: number;
}

export interface CookieSettings {
  autoRotateEnabled: boolean;
  healthCheckInterval: number;
}

export const cookieApi = {
  addCookie: async (name: string, cookie: string) => {
    return apiClient.post('/api/admin/cookies', { name, cookie });
  },

  removeCookie: async (id: string) => {
    return apiClient.delete(`/api/admin/cookies/${id}`);
  },

  getCookieStatus: async (): Promise<CookieStatus> => {
    const response = await apiClient.get<CookieStatus>('/api/admin/cookies/status');
    return response.data;
  },

  rotateCookie: async () => {
    return apiClient.post('/api/admin/cookies/rotate');
  },

  getSettings: async () => {
    const response = await apiClient.get<CookieSettings>('/api/admin/cookies/settings');
    return response.data;
  },

  updateSettings: async (settings: { autoRotateEnabled: boolean; healthCheckInterval: number }) => {
    return apiClient.put('/api/admin/cookies/settings', settings);
  },

  checkHealth: async () => {
    const response = await apiClient.get<CookieStatus>('/api/admin/cookies/health');
    return response.data;
  },
};
