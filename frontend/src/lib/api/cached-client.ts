import apiClient from './client';
import { apiCache } from './cache';
import { AxiosRequestConfig } from 'axios';
import { ApiResponse } from './types';

function extractData<T>(result: unknown, url: string): T {
  console.log('[extractData] url:', url, 'result:', JSON.stringify(result).slice(0, 200));
  
  if (!result || typeof result !== 'object') {
    console.log('[extractData] Returning empty object - result is null/not object');
    return {} as T;
  }
  
  if ('data' in result && 'code' in result) {
    const data = (result as ApiResponse<T>).data;
    console.log('[extractData] Found data field:', typeof data, 'isArray:', Array.isArray(data), 'hasItems:', data && typeof data === 'object' && 'items' in data);
    if (data !== undefined && data !== null) {
      return data;
    }
  }
  
  console.log('[extractData] No data/code field, returning result as-is, hasItems:', result && typeof result === 'object' && 'items' in result);
  return result as T;
}

export async function cachedGet<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const params = config?.params;
  
  const cached = apiCache.get(url, params);
  if (cached !== null && cached !== undefined) {
    console.log('[cachedGet] Cache HIT for:', url, 'keys:', Object.keys(cached || {}));
    return cached as T;
  }
  
  console.log('[cachedGet] Cache MISS for:', url);
  
  const pending = apiCache.getPendingRequest(url, params);
  if (pending) {
    console.log('[cachedGet] Found pending request for:', url);
    try {
      const result = await pending as T;
      console.log('[cachedGet] Pending resolved for:', url, 'type:', typeof result, 'isArray:', Array.isArray(result), 'keys:', Object.keys(result || {}));
      return result;
    } catch (error) {
      console.error('[cachedGet] Pending request error:', error);
      throw error;
    }
  }
  
  const promise = (async (): Promise<T> => {
    try {
      console.log('[cachedGet] Making API request for:', url);
      const result = await apiClient.get<ApiResponse<T>>(url, config);
      console.log('[cachedGet] API response for:', url, 'keys:', Object.keys(result || {}));
      const data = extractData<T>(result, url);
      console.log('[cachedGet] Extracted data for:', url, 'isArray:', Array.isArray(data), 'hasItems:', 'items' in (data || {}));
      apiCache.set(url, data, params);
      return data;
    } catch (error) {
      apiCache.clearPendingRequest(url, params);
      throw error;
    }
  })();
  
  apiCache.setPendingRequest(url, promise, params);
  
  return promise;
}

export function clearCache(url: string, params?: unknown): void {
  apiCache.clear(url, params);
}

export function clearAllCache(): void {
  apiCache.clear();
}
