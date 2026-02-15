/**
 * 市集API客户端
 */

import apiClient from './client';
import { PaginatedResponse, Post, Comment, User } from './types';

function safeResponse<T>(response: unknown, fallback: T): T {
  if (!response || typeof response !== 'object') {
    return fallback;
  }
  if ('code' in response && (response as { code?: number }).code === 0 && 'data' in response) {
    return (response as { data: T }).data;
  }
  return fallback;
}

export const communityApi = {
  createPost: async (data: {
    contentType: string;
    contentId?: string;
    title?: string;
    content: string;
    images?: string[];
    tags?: string[];
    topicId?: string;
  }): Promise<{ postId: string; pointsEarned: number; estimatedViews: number } | null> => {
    const response = await apiClient.post<{ postId: string; pointsEarned: number; estimatedViews: number }>('/posts', data);
    return safeResponse(response, null);
  },

  getPosts: async (params: {
    page?: number;
    size?: number;
    sort?: 'hot' | 'latest';
    topicId?: string;
  }): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<PaginatedResponse<Post>>('/posts', { params });
    return safeResponse(response, { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
  },

  getUser: async (userId: string): Promise<User | null> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return safeResponse(response, null);
  },

  getUserPosts: async (userId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<PaginatedResponse<Post>>(`/users/${userId}/posts`, { params });
    return safeResponse(response, { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
  },

  getMyPosts: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<PaginatedResponse<Post>>('/posts/my', { params });
    return safeResponse(response, { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
  },

  getPost: async (postId: string): Promise<Post | null> => {
    const response = await apiClient.get<Post>(`/posts/${postId}`);
    return safeResponse(response, null);
  },

  updatePost: async (postId: string, data: {
    contentType?: string;
    title?: string;
    content?: string;
    tags?: string[];
  }): Promise<Post | null> => {
    const response = await apiClient.put<Post>(`/posts/${postId}`, data);
    return safeResponse(response, null);
  },

  deletePost: async (postId: string): Promise<boolean> => {
    const response = await apiClient.delete<void>(`/posts/${postId}`);
    return response.code === 0;
  },

  likePost: async (postId: string): Promise<boolean> => {
    try {
      await apiClient.post(`/posts/${postId}/like`);
      return true;
    } catch {
      return false;
    }
  },

  createComment: async (data: {
    postId: string;
    parentId?: string;
    content: string;
  }): Promise<{ commentId: string; pointsEarned: number } | null> => {
    const response = await apiClient.post<{ commentId: string; pointsEarned: number }>('/comments', data);
    return safeResponse(response, null);
  },

  getComments: async (postId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<PaginatedResponse<Comment>>(`/comments/post/${postId}`, { params });
    return safeResponse(response, { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
  },

  likeComment: async (commentId: string): Promise<boolean> => {
    try {
      await apiClient.post(`/comments/${commentId}/like`);
      return true;
    } catch {
      return false;
    }
  },

  updateComment: async (commentId: string, data: { content: string }): Promise<Comment | null> => {
    const response = await apiClient.put<Comment>(`/comments/${commentId}`, data);
    return safeResponse(response, null);
  },

  deleteComment: async (commentId: string): Promise<boolean> => {
    const response = await apiClient.delete<void>(`/comments/${commentId}`);
    return response.code === 0;
  },

  createFavorite: async (data: {
    contentType: string;
    contentId: string;
    folderId?: string;
  }): Promise<{ favoriteId: string; pointsEarned: number } | null> => {
    const response = await apiClient.post<{ favoriteId: string; pointsEarned: number }>('/favorites', data);
    return safeResponse(response, null);
  },

  deleteFavorite: async (contentType: string, contentId: string): Promise<boolean> => {
    const response = await apiClient.delete<void>(`/favorites/${contentType}/${contentId}`);
    return response.code === 0;
  },

  getFavorites: async (params: {
    page?: number;
    size?: number;
    contentType?: string;
  }): Promise<PaginatedResponse<Record<string, unknown>>> => {
    const response = await apiClient.get<PaginatedResponse<Record<string, unknown>>>('/favorites', { params });
    return safeResponse(response, { items: [], pagination: { page: 1, size: params?.size || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
  },

  getDailyTasks: async (): Promise<Record<string, unknown> | null> => {
    const response = await apiClient.get<Record<string, unknown>>('/tasks/daily');
    return safeResponse(response, null);
  },

  signIn: async (): Promise<{ points: number } | null> => {
    const response = await apiClient.post<{ points: number }>('/tasks/sign-in');
    return safeResponse(response, null);
  },
};
