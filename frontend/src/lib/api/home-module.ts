import apiClient from './client';
import { HomeModule } from './types';

export const homeModuleApi = {
  getHomeModules: async (params?: { position?: string }): Promise<HomeModule[]> => {
    const response = await apiClient.get<HomeModule[]>('/home-modules', { params });
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取首页模块失败');
    }
  },

  getAllHomeModules: async (): Promise<HomeModule[]> => {
    const response = await apiClient.get<HomeModule[]>('/home-modules/all');
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取所有首页模块失败');
    }
  },

  createHomeModule: async (data: Partial<HomeModule>): Promise<HomeModule> => {
    const response = await apiClient.post<HomeModule>('/home-modules', data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '创建首页模块失败');
  },

  updateHomeModule: async (id: string, data: Partial<HomeModule>): Promise<HomeModule> => {
    const response = await apiClient.put<HomeModule>(`/home-modules/${id}`, data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '更新首页模块失败');
  },

  deleteHomeModule: async (id: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/home-modules/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '删除首页模块失败');
    }
  },
};
