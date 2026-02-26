import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiCache } from './cache';
import { ApiResponse } from './types';
import { getApiConfig, isDevelopment } from './config';
import { useAuthStore } from '@/store/authStore';

const API_CONFIG = getApiConfig();

/** 用于 401 时串行刷新：多个请求同时 401 时共用一个刷新请求 */
let refreshPromise: Promise<boolean> | null = null;

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
      
      console.log(`[API Request] ${config.method?.toUpperCase()} ${requestUrl}`);
      
      if (requestUrl.includes('/admin/sync/huggingface') || 
          requestUrl.includes('/admin/sync/all') ||
          requestUrl.includes('/admin/sync/embodied-ai') ||
          (requestUrl.includes('/admin/subscriptions/') && requestUrl.includes('/sync'))) {
        config.timeout = 180000;
      } else if (requestUrl.includes('/admin/sync/') ||
                 requestUrl.includes('/admin/bilibili-search-keywords/search')) {
        config.timeout = 120000;
      } else if (requestUrl.includes('/discovery')) {
        config.timeout = 60000;
      }
      
      const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                            requestUrl.includes('/auth/register') ||
                            requestUrl.includes('/auth/admin/login');
      
      const requestMethod = config.method?.toLowerCase() || 'get';
      const isPublicApi = requestUrl.startsWith('/stats/public/') ||
                         requestUrl.startsWith('/announcements') ||
                         requestUrl.startsWith('/home-modules') && requestMethod === 'get' && !requestUrl.includes('/home-modules/all') ||
                         requestUrl.startsWith('/github-repo-info/') ||
                         requestUrl.startsWith('/search/') ||
                         (requestUrl.startsWith('/papers') && requestMethod === 'get') ||
                         (requestUrl.startsWith('/videos') && requestMethod === 'get') ||
                         (requestUrl.startsWith('/repos') && requestMethod === 'get') ||
                         (requestUrl.startsWith('/jobs') && requestMethod === 'get') ||
                         (requestUrl.startsWith('/huggingface') && requestMethod === 'get') ||
                         (requestUrl.startsWith('/posts/') && !requestUrl.includes('/posts/my') && !requestUrl.includes('/posts/like')) ||
                         requestUrl.startsWith('/comments/') ||
                         requestUrl.startsWith('/banners') ||
                         requestUrl.startsWith('/community') ||
                         requestUrl.startsWith('/users/');
      
      console.log(`[API Request] isAuthEndpoint=${isAuthEndpoint}, isPublicApi=${isPublicApi}`);
      
      if (requestUrl.includes('/auth/refresh')) {
        const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        const tokenKey = isAdmin ? 'admin_refresh_token' : 'user_refresh_token';
        token = localStorage.getItem(tokenKey);
        if (!token) console.warn('[API Request] No refresh token for /auth/refresh');
      } else if (!isAuthEndpoint && !isPublicApi) {
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
        
        if (!token) {
          try {
            const authState = useAuthStore.getState();
            if (authState.token && authState.isAdmin === isAdmin) {
              token = authState.token;
              console.log(`[API Request] Got token from zustand store instead of localStorage`);
            }
          } catch (e) {
            console.warn('[API Request] Failed to get token from zustand store:', e);
          }
        }
        
        console.log(`[API Request] URL=${requestUrl}, isAdmin=${isAdmin}, tokenKey=${tokenKey}, hasToken=${!!token}, tokenPreview=${token ? token.substring(0, 20) + '...' : 'null'}`);
        
        if (!token) {
          console.warn(`[API Request] No token found for ${requestUrl}! This may cause 401 error.`);
        }
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
      const responseData = (data || {}) as {
        code?: number;
        message?: string;
        error?: { code?: string; message?: string };
      };
      const extractedMessage =
        responseData.message ||
        responseData.error?.message ||
        axiosError.message;
      const extractedCode = responseData.code || responseData.error?.code || 'UNKNOWN_ERROR';
      
      if (isDevelopment()) {
        const fullUrl = axiosError.config ? `${axiosError.config.baseURL}${axiosError.config.url}` : 'unknown';
        console.error(`[API Error] ${axiosError.config?.method?.toUpperCase()} ${fullUrl}`, {
          status,
          data,
          message: extractedMessage,
          code: extractedCode,
        });
      }
      
      if (status === 401 || responseData.code === 1002 || responseData.code === 1003) {
        if (typeof window !== 'undefined') {
          const requestUrl = axiosError.config?.url || '';
          const isAdminLogin = requestUrl.includes('/auth/admin/login');
          const isUserLogin = requestUrl.includes('/auth/login') && !isAdminLogin;
          const isLoginRequest = isUserLogin || isAdminLogin;
          const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
          const isRefreshRequest = requestUrl.includes('/auth/refresh');

          // 登录接口返回 401：直接返回后端文案（如「邮箱或密码错误」），不要改成「请先登录」
          if (isLoginRequest) {
            return Promise.reject({
              code: extractedCode,
              message: extractedMessage || '邮箱或密码错误',
              status: 401,
            });
          }

          // 刷新 Token 失败：清除本地 token，不再重试
          if (isRefreshRequest) {
            const tokenKey = isAdminPage ? 'admin_token' : 'user_token';
            const refreshKey = isAdminPage ? 'admin_refresh_token' : 'user_refresh_token';
            const userKey = isAdminPage ? 'admin_user' : 'user_user';
            localStorage.removeItem(tokenKey);
            localStorage.removeItem(refreshKey);
            localStorage.removeItem(userKey);
            if (!isAdminPage) useAuthStore.getState().logout();
            if (isAdminPage && typeof window !== 'undefined' && window.location.pathname !== '/admin/login') window.location.href = '/admin/login';
            return Promise.reject({
              code: 'UNAUTHORIZED',
              message: '登录已过期，请重新登录',
              status: 401,
            });
          }

          const tokenKey = isAdminPage ? 'admin_token' : 'user_token';
          const refreshKey = isAdminPage ? 'admin_refresh_token' : 'user_refresh_token';
          const userKey = isAdminPage ? 'admin_user' : 'user_user';
          const refreshToken = localStorage.getItem(refreshKey);

          // 有 refreshToken 时尝试刷新再重试原请求，实现长久登录
          if (refreshToken) {
            const doRefresh = (): Promise<boolean> => {
              console.log('[API Refresh] Starting token refresh...');
              return axiosInstance
                .post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh')
                .then((res: unknown) => {
                  const data = (res as ApiResponse<{ token: string; refreshToken: string }>).data;
                  console.log('[API Refresh] Refresh response:', data ? 'has data' : 'no data');
                  if (data?.token) {
                    localStorage.setItem(tokenKey, data.token);
                    if (data.refreshToken) localStorage.setItem(refreshKey, data.refreshToken);
                    useAuthStore.getState().setToken(data.token, isAdminPage);
                    useAuthStore.getState().setRefreshToken(data.refreshToken || null, isAdminPage);
                    console.log('[API Refresh] Token refreshed successfully');
                    return true;
                  }
                  console.log('[API Refresh] No token in response');
                  return false;
                })
                .catch((err) => {
                  console.error('[API Refresh] Refresh failed:', err);
                  return false;
                });
            };
            if (!refreshPromise) refreshPromise = doRefresh();
            return refreshPromise.then((ok) => {
              refreshPromise = null;
              console.log('[API Refresh] Refresh result:', ok);
              if (ok && axiosError.config) {
                const newToken = localStorage.getItem(tokenKey);
                console.log('[API Refresh] New token from localStorage:', newToken ? newToken.substring(0, 30) + '...' : 'null');
                if (newToken && axiosError.config.headers) {
                  axiosError.config.headers.Authorization = `Bearer ${newToken}`;
                  console.log('[API Refresh] Updated Authorization header');
                }
                console.log('[API Refresh] Retrying request to:', axiosError.config.url);
                return axiosInstance(axiosError.config);
              }
              localStorage.removeItem(tokenKey);
              localStorage.removeItem(refreshKey);
              localStorage.removeItem(userKey);
              if (!isAdminPage) useAuthStore.getState().logout();
              if (isAdminPage && typeof window !== 'undefined' && window.location.pathname !== '/admin/login') window.location.href = '/admin/login';
              return Promise.reject({
                code: 'UNAUTHORIZED',
                message: '登录已过期，请重新登录',
                status: 401,
              });
            });
          }

          const currentToken = localStorage.getItem(tokenKey);
          if (currentToken) {
            console.log(`[API 401] Token exists in localStorage, clearing invalid token`);
            localStorage.removeItem(tokenKey);
            localStorage.removeItem(userKey);
            if (!isAdminPage) useAuthStore.getState().logout();
          }

          if (isAdminPage && typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
            return Promise.reject({
              code: 'UNAUTHORIZED',
              message: '未登录或登录已过期，请重新登录',
              status: 401,
            });
          }

          return Promise.reject({
            code: 'UNAUTHORIZED',
            message: '请先登录',
            status: 401,
          });
        }
      }
      
      return Promise.reject({
        code: extractedCode,
        message: extractedMessage,
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
