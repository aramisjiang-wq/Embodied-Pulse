import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiCache } from './cache';
import { ApiResponse } from './types';
import { getApiConfig, isDevelopment } from './config';

const API_CONFIG = getApiConfig();

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.baseUrl}/api/v1`,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const requestUrl = config.url || '';
      
      if (requestUrl.includes('/admin/sync/huggingface') || 
          requestUrl.includes('/admin/sync/all') ||
          requestUrl.includes('/admin/sync/embodied-ai') ||
          (requestUrl.includes('/admin/subscriptions/') && requestUrl.includes('/sync'))) {
        config.timeout = 180000;
      } else if (requestUrl.includes('/admin/sync/') ||
                 requestUrl.includes('/admin/news-search-keywords/search') ||
                 requestUrl.includes('/admin/bilibili-search-keywords/search')) {
        config.timeout = 120000;
      } else if (requestUrl.includes('/discovery')) {
        config.timeout = 60000;
      }
      
      const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                            requestUrl.includes('/auth/register') ||
                            requestUrl.includes('/auth/admin/login');
      
      const isPublicApi = requestUrl.startsWith('/stats/') ||
                         requestUrl.startsWith('/analytics/') ||
                         requestUrl.startsWith('/announcements/') ||
                         requestUrl.startsWith('/home-modules/') ||
                         requestUrl.startsWith('/github-repo-info/') ||
                         requestUrl.startsWith('/search/') ||
                         requestUrl.startsWith('/papers/') ||
                         requestUrl.startsWith('/videos/') ||
                         requestUrl.startsWith('/repos/') ||
                         requestUrl.startsWith('/jobs/') ||
                         requestUrl.startsWith('/huggingface/') ||
                         requestUrl.startsWith('/news/') ||
                         (requestUrl.startsWith('/posts/') && !requestUrl.includes('/posts/my') && !requestUrl.includes('/posts/like')) ||
                         requestUrl.startsWith('/comments/') ||
                         requestUrl.startsWith('/favorites') ||
                         requestUrl.startsWith('/tasks/') ||
                         requestUrl.startsWith('/banners/') ||
                         requestUrl.startsWith('/community/');
      
      if (!isAuthEndpoint && !isPublicApi) {
        const isAdminRequest = requestUrl.includes('/admin/');
        const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        
        const isAdminOnlyApi = isAdminPage && (
          requestUrl.includes('/home-modules/all') ||
          (requestUrl.includes('/home-modules') && ['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '')) ||
          requestUrl.includes('/banners') && ['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '') ||
          requestUrl.includes('/announcements') && ['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '')
        );
        
        const isAdmin = isAdminRequest || isAdminPage || isAdminOnlyApi;
        const tokenKey = isAdmin ? 'admin_token' : 'user_token';
        token = localStorage.getItem(tokenKey);
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: unknown) => {
    const axiosError = error as AxiosError;
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNREFUSED' || 
          axiosError.message.includes('ERR_CONNECTION_REFUSED') ||
          axiosError.message.includes('Network Error') ||
          axiosError.message.includes('Failed to fetch')) {
        console.error(`[API Client] 后端服务连接失败: ${API_CONFIG.baseUrl}`);
        if (isDevelopment()) {
          console.info(`[API Client] 提示: 请确保后端服务已启动，或检查 NEXT_PUBLIC_API_URL 环境变量`);
        }
        return Promise.reject({
          code: 'CONNECTION_REFUSED',
          message: '网络连接失败，请检查后端服务是否已启动',
          status: 0,
        });
      }
      
      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        console.error('API请求超时');
        return Promise.reject({
          code: 'TIMEOUT',
          message: '请求超时，请稍后重试',
          status: 0,
        });
      }
      
      console.error('网络错误:', axiosError.message);
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: '网络错误，请检查网络连接',
        status: 0,
      });
    }
    
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      const responseData = (data || {}) as { code?: number; message?: string };
      
      if (isDevelopment()) {
        const fullUrl = axiosError.config ? `${axiosError.config.baseURL}${axiosError.config.url}` : 'unknown';
        console.error(`[API Error] ${axiosError.config?.method?.toUpperCase()} ${fullUrl}`, {
          status,
          data,
          message: responseData.message,
          code: responseData.code,
        });
      }
      
      if (status === 401 || responseData.code === 1002 || responseData.code === 1003) {
        if (typeof window !== 'undefined') {
          const isAdminLogin = (axiosError.config?.url || '').includes('/auth/admin/login');
          const isLoginPage = window.location.pathname.includes('/login');
          const isRegisterPage = window.location.pathname.includes('/register');
          const isAdminPage = window.location.pathname.startsWith('/admin');
          
          const tokenKey = isAdminPage ? 'admin_token' : 'user_token';
          localStorage.removeItem(tokenKey);
          
          if (isAdminPage && !isAdminLogin && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
            return Promise.reject({
              code: 'UNAUTHORIZED',
              message: '未登录或登录已过期，请重新登录',
              status: 401,
            });
          }
          
          const isAuthApi = (axiosError.config?.url || '').includes('/auth/login') || 
                           (axiosError.config?.url || '').includes('/auth/register');
          
          if (!isLoginPage && !isRegisterPage && !isAdminPage && !isAuthApi) {
            window.location.href = '/login';
            return Promise.reject({
              code: 'UNAUTHORIZED',
              message: '未登录或登录已过期，请重新登录',
              status: 401,
            });
          }
        }
      }
      
      return Promise.reject({
        code: responseData.code || 'UNKNOWN_ERROR',
        message: responseData.message || axiosError.message,
        status,
      });
    }
    
    return Promise.reject(axiosError);
  }
);

const apiClient: ApiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return axiosInstance.get(url, config);
  },
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return axiosInstance.post(url, data, config);
  },
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return axiosInstance.put(url, data, config);
  },
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return axiosInstance.patch(url, data, config);
  },
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return axiosInstance.delete(url, config);
  },
};

export function getApiBaseUrl(): string {
  return API_CONFIG.baseUrl;
}

export function isApiDebugEnabled(): boolean {
  return API_CONFIG.debug;
}

export default apiClient;
