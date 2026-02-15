'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Spin } from 'antd';

interface DataLoaderOptions<T> {
  fetchFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  cacheKey?: string;
  cacheDuration?: number;
  retryCount?: number;
  retryDelay?: number;
  enabled?: boolean;
  showMessage?: (type: 'success' | 'info' | 'warning' | 'error', content: string) => void;
}

interface DataLoaderResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  cancel: () => void;
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

export function useDataLoader<T>(options: DataLoaderOptions<T>): DataLoaderResult<T> {
  const {
    fetchFn,
    onSuccess,
    onError,
    cacheKey,
    cacheDuration = 5 * 60 * 1000,
    retryCount = 3,
    retryDelay = 1000,
    enabled = true,
    showMessage,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const loadData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let result: T;

      if (cacheKey) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
          result = cached.data as T;
          setData(result);
          onSuccess?.(result);
          setLoading(false);
          return;
        }
      }

      result = await fetchFn();

      if (cacheKey) {
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      setData(result);
      onSuccess?.(result);
      retryCountRef.current = 0;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          loadData();
        }, retryDelay * retryCountRef.current);
        return;
      }

      const errorMessage = err instanceof Error ? err.message : '加载失败';
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      onError?.(error);
      showMessage?.('error', error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError, cacheKey, cacheDuration, retryCount, retryDelay, enabled, showMessage]);

  const refresh = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    loadData();
  }, [cacheKey, loadData]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      cancel();
    };
  }, [loadData, cancel]);

  return { data, loading, error, refresh, cancel };
}

interface ParallelDataLoaderOptions<T> {
  fetchFns: Array<() => Promise<T>>;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
  showLoading?: boolean;
  showMessage?: (type: 'success' | 'info' | 'warning' | 'error', content: string) => void;
}

export function useParallelDataLoader<T>(options: ParallelDataLoaderOptions<T>) {
  const {
    fetchFns,
    onSuccess,
    onError,
    showLoading = true,
    showMessage,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const loadAll = useCallback(async () => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    setProgress(0);

    try {
      const results: T[] = [];
      const total = fetchFns.length;

      const promises = fetchFns.map(async (fetchFn, index) => {
        try {
          const result = await fetchFn();
          results[index] = result;
          setProgress(Math.round(((index + 1) / total) * 100));
          return result;
        } catch (err) {
          console.error(`Failed to load data at index ${index}:`, err);
          return null;
        }
      });

      await Promise.all(promises);
      setData(results.filter(r => r !== null) as T[]);
      onSuccess?.(results);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      onError?.(error);
      showMessage?.('error', error.message || '加载数据失败');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setProgress(0);
    }
  }, [fetchFns, onSuccess, onError, showLoading, showMessage]);

  return { data, loading, error, progress, refresh: loadAll };
}

export function clearCache(pattern?: string) {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

interface DataLoaderProps {
  loading?: boolean;
  children: React.ReactNode;
  size?: 'small' | 'default' | 'large';
}

export function DataLoader({ loading, children, size = 'default' }: DataLoaderProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: size === 'large' ? 400 : size === 'small' ? 100 : 200,
      width: '100%'
    }}>
      <Spin size={size} />
    </div>
  );
}

interface LazyLoadProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
}

export function LazyLoad({ children, threshold = 0.1, rootMargin = '100px', fallback }: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsVisible(true);
            setIsLoaded(true);
          }
        });
      },
      { threshold, rootMargin }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, isLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || null)}
    </div>
  );
}
