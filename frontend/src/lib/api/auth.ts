import apiClient from './client';
import { LoginResponse, User } from './types';

export const authApi = {
  // 邮箱注册
  register: async (data: {
    username: string;
    email: string;
    password: string;
    verificationCode: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    // apiClient的响应拦截器已经返回了response.data，所以response就是ApiResponse
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '注册失败');
    }
  },

  // 邮箱登录（用户端）
  login: async (data: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    // apiClient的响应拦截器已经返回了response.data，所以response就是ApiResponse
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '登录失败');
    }
  },

  // 管理员登录（管理端）
  adminLogin: async (data: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/admin/login', data);
    // apiClient的响应拦截器已经返回了response.data，所以response就是ApiResponse
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '管理员登录失败');
    }
  },

  // 获取当前用户信息
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    // apiClient的响应拦截器已经返回了response.data，所以response就是ApiResponse
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取用户信息失败');
    }
  },

  // 获取当前管理员信息（管理端专用）
  getAdminMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/admin/me');
    // apiClient的响应拦截器已经返回了response.data，所以response就是ApiResponse
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '获取管理员信息失败');
    }
  },

  // 刷新Token
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    // apiClient的响应拦截器已经返回了response.data，所以response就是ApiResponse
    if (response.code === 0) {
      return response.data;
    } else {
      throw new Error(response.message || '刷新Token失败');
    }
  },

  // 登出
  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      // 根据路径清除对应的token
      const isAdmin = window.location.pathname.startsWith('/admin');
      const tokenKey = isAdmin ? 'admin_token' : 'user_token';
      localStorage.removeItem(tokenKey);
    }
  },
};
