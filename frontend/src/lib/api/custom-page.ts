import apiClient from './client';
import { PaginatedResponse } from './types';

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomPageListItem {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
}

export interface CustomPageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const customPageApi = {
  getList: async (): Promise<CustomPageListItem[]> => {
    const response = await apiClient.get<CustomPageListItem[]>('/pages/list');
    if (response.code === 0 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getBySlug: async (slug: string): Promise<CustomPage | null> => {
    try {
      const response = await apiClient.get<CustomPage>(`/pages/slug/${slug}`);
      if (response.code === 0 && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Get page by slug error:', error);
      return null;
    }
  },

  adminList: async (params?: {
    page?: number;
    size?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<CustomPage>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<CustomPage>>('/admin/pages', { params });
      if (response.code === 0 && response.data) {
        return response.data;
      }
      return { items: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    } catch (error: any) {
      console.error('Admin list pages error:', error);
      return { items: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  },

  create: async (data: {
    slug: string;
    title: string;
    content: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CustomPageResult<CustomPage>> => {
    try {
      const response = await apiClient.post<CustomPage>('/admin/pages', data);
      if (response.code === 0 && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message || '创建失败' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || '创建失败' };
    }
  },

  update: async (id: string, data: {
    slug?: string;
    title?: string;
    content?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CustomPageResult<CustomPage>> => {
    try {
      const response = await apiClient.put<CustomPage>(`/admin/pages/${id}`, data);
      if (response.code === 0 && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message || '更新失败' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || '更新失败' };
    }
  },

  delete: async (id: string): Promise<CustomPageResult<null>> => {
    try {
      const response = await apiClient.delete(`/admin/pages/${id}`);
      if (response.code === 0) {
        return { success: true };
      }
      return { success: false, error: response.message || '删除失败' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || '删除失败' };
    }
  },

  getById: async (id: string): Promise<CustomPage | null> => {
    try {
      const response = await apiClient.get<CustomPage>(`/admin/pages/detail/${id}`);
      if (response.code === 0 && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Get page by id error:', error);
      return null;
    }
  },
};
