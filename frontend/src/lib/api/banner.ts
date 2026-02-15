import apiClient from './client';
import { PaginatedResponse, Banner } from './types';

export const bannerApi = {
  getBanners: async (params?: { page?: number; size?: number; status?: 'active' | 'inactive' }): Promise<PaginatedResponse<Banner>> => {
    const response = await apiClient.get<PaginatedResponse<Banner>>('/banners', { params });
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '获取Banner列表失败');
  },

  getActiveBanners: async (): Promise<Banner[]> => {
    const response = await apiClient.get<{ items: Banner[] }>('/banners/active');
    if (response.code === 0) {
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        return [];
      }
    } else {
      throw new Error(response.message || '获取活跃Banner失败');
    }
  },

  createBanner: async (data: Partial<Banner>): Promise<Banner> => {
    const response = await apiClient.post<Banner>('/admin/content/banners', data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '创建Banner失败');
  },

  updateBanner: async (id: string, data: Partial<Banner>): Promise<Banner> => {
    const response = await apiClient.put<Banner>(`/admin/content/banners/${id}`, data);
    if (response.code === 0) {
      return response.data;
    }
    throw new Error(response.message || '更新Banner失败');
  },

  deleteBanner: async (id: string): Promise<void> => {
    const response = await apiClient.delete<void>(`/admin/content/banners/${id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '删除Banner失败');
    }
  },

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    
    const response = await fetch(`${API_URL}/api/v1/upload/banner`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || '图片上传失败');
    }
    
    return {
      url: data.data.url,
      filename: data.data.filename,
    };
  },
};
