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

export const customPageApi = {
  getList: async (): Promise<CustomPageListItem[]> => {
    const response = await apiClient.get<CustomPageListItem[]>('/pages/list');
    if (response.code === 0 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getBySlug: async (slug: string): Promise<CustomPage | null> => {
    const response = await apiClient.get<CustomPage>(`/pages/slug/${slug}`);
    if (response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  },

  adminList: async (params?: {
    page?: number;
    size?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<CustomPage>> => {
    const response = await apiClient.get<PaginatedResponse<CustomPage>>('/admin/pages', { params });
    if (response.code === 0 && response.data) {
      return response.data;
    }
    return { items: [], pagination: { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  },

  create: async (data: {
    slug: string;
    title: string;
    content: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CustomPage | null> => {
    const response = await apiClient.post<CustomPage>('/admin/pages', data);
    if (response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  },

  update: async (id: string, data: {
    slug?: string;
    title?: string;
    content?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CustomPage | null> => {
    const response = await apiClient.put<CustomPage>(`/admin/pages/${id}`, data);
    if (response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete(`/admin/pages/${id}`);
    return response.code === 0;
  },

  getById: async (id: string): Promise<CustomPage | null> => {
    const response = await apiClient.get<CustomPage>(`/admin/pages/detail/${id}`);
    if (response.code === 0 && response.data) {
      return response.data;
    }
    return null;
  },
};
