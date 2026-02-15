'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { ReloadOutlined, HomeOutlined, LeftOutlined } from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface ErrorInfo {
  title?: string;
  message?: string;
  code?: string;
  showHome?: boolean;
  showBack?: boolean;
  showRetry?: boolean;
  retryFn?: () => void;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  NOT_FOUND: {
    title: '页面未找到',
    message: '抱歉，您访问的页面不存在或已被移除',
  },
  FORBIDDEN: {
    title: '访问被拒绝',
    message: '抱歉，您没有权限访问此页面',
  },
  UNAUTHORIZED: {
    title: '未登录',
    message: '请先登录后再访问此页面',
  },
  SERVER_ERROR: {
    title: '服务器错误',
    message: '抱歉，服务器出了点问题，请稍后再试',
  },
  NETWORK_ERROR: {
    title: '网络错误',
    message: '无法连接到服务器，请检查您的网络连接',
  },
  TIMEOUT: {
    title: '请求超时',
    message: '请求超时，请稍后重试',
  },
  VALIDATION_ERROR: {
    title: '数据验证失败',
    message: '提交的数据不符合要求，请检查后重试',
  },
  CONNECTION_REFUSED: {
    title: '服务不可用',
    message: '后端服务未启动或无法访问，请确保服务已启动',
  },
  UNKNOWN: {
    title: '未知错误',
    message: '发生了未知错误，请稍后重试',
  },
};

function getErrorInfo(error: Error | unknown): ErrorInfo {
  const errorObj = typeof error === 'object' && error !== null ? (error as { code?: string; status?: number; message?: string }) : undefined;
  const errorCode = errorObj?.code || errorObj?.status?.toString();
  const errorMessage = errorObj?.message || String(error);

  if (errorCode === 'ECONNREFUSED' || errorMessage.includes('Connection refused')) {
    return {
      code: 'CONNECTION_REFUSED',
      ...ERROR_MESSAGES.CONNECTION_REFUSED,
      showRetry: true,
    };
  }

  if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      ...ERROR_MESSAGES.TIMEOUT,
      showRetry: true,
    };
  }

  if (errorCode === '404' || errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
    return {
      code: 'NOT_FOUND',
      ...ERROR_MESSAGES.NOT_FOUND,
      showBack: true,
    };
  }

  if (errorCode === '401' || errorCode === 'UNAUTHORIZED') {
    return {
      code: 'UNAUTHORIZED',
      ...ERROR_MESSAGES.UNAUTHORIZED,
      showHome: true,
    };
  }

  if (errorCode === '403' || errorCode === 'FORBIDDEN') {
    return {
      code: 'FORBIDDEN',
      ...ERROR_MESSAGES.FORBIDDEN,
      showHome: true,
    };
  }

  if (errorCode === '500' || errorMessage.includes('server error') || errorMessage.includes('Server Error')) {
    return {
      code: 'SERVER_ERROR',
      ...ERROR_MESSAGES.SERVER_ERROR,
      showRetry: true,
    };
  }

  if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
    return {
      code: 'NETWORK_ERROR',
      ...ERROR_MESSAGES.NETWORK_ERROR,
      showRetry: true,
    };
  }

  return {
    code: 'UNKNOWN',
    ...ERROR_MESSAGES.UNKNOWN,
    message: errorMessage || ERROR_MESSAGES.UNKNOWN.message,
    showRetry: true,
  };
}

export class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    const errorInfo = getErrorInfo(error);
    return {
      hasError: true,
      error,
      errorInfo,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PageErrorBoundary] Caught error:', error);
    console.error('[PageErrorBoundary] Error info:', errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.state.errorInfo?.retryFn) {
      this.state.errorInfo.retryFn();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <PageErrorDisplay errorInfo={this.state.errorInfo} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

interface PageErrorDisplayProps {
  errorInfo?: ErrorInfo;
  onRetry?: () => void;
}

export function PageErrorDisplay({ errorInfo, onRetry }: PageErrorDisplayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      router.refresh();
    }
  }, [onRetry, router]);

  const info = errorInfo || {
    title: '页面错误',
    message: '发生了错误',
    showHome: true,
    showBack: true,
    showRetry: true,
  };

  const subTitle = searchParams?.get('id') 
    ? `资源 ID: ${searchParams.get('id')}` 
    : undefined;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      padding: '24px'
    }}>
      <Result
        status={info.code === 'NOT_FOUND' ? '404' : 
                info.code === 'FORBIDDEN' || info.code === 'UNAUTHORIZED' ? '403' : 
                info.code === 'SERVER_ERROR' ? '500' : 'error'}
        title={info.title}
        subTitle={subTitle || info.message}
        extra={[
          info.showRetry && (
            <Button 
              key="retry"
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleRetry}
            >
              重试
            </Button>
          ),
          info.showBack && (
            <Button 
              key="back"
              icon={<LeftOutlined />}
              onClick={handleGoBack}
            >
              返回
            </Button>
          ),
          info.showHome && (
            <Button 
              key="home"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
            >
              返回首页
            </Button>
          ),
        ].filter(Boolean)}
      />
    </div>
  );
}

interface AsyncErrorHandlerProps {
  children: (handleError: (error: unknown) => void) => React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: unknown) => void;
}

export function AsyncErrorHandler({ children, fallback, onError }: AsyncErrorHandlerProps) {
  const [error, setError] = useState<ErrorInfo | null>(null);

  const handleError = useCallback((err: unknown) => {
    const errorInfo = getErrorInfo(err);
    setError(errorInfo);
    if (onError) {
      onError(err);
    }
    console.error('[AsyncErrorHandler] Caught error:', err);
  }, [onError]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <PageErrorDisplay errorInfo={error} onRetry={() => setError(null)} />;
  }

  return <>{children(handleError)}</>;
}

interface LoadingDisplayProps {
  tip?: string;
  children?: React.ReactNode;
}

export function LoadingDisplay({ tip = '加载中...', children }: LoadingDisplayProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px' 
    }}>
      <Spin size="large" tip={tip}>
        <div style={{ padding: '50px', background: 'transparent' }} />
      </Spin>
      {children}
    </div>
  );
}

interface DataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: ErrorInfo | null;
  refetch: () => Promise<void>;
}

interface UseDataFetchOptions<T> {
  fetchFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: ErrorInfo) => void;
  deps?: React.DependencyList;
}

export function useDataFetch<T>({
  fetchFn,
  onSuccess,
  onError,
  deps = [],
}: UseDataFetchOptions<T>): DataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorInfo | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorInfo = getErrorInfo(err);
      setError(errorInfo);
      if (onError) {
        onError(errorInfo);
      }
      console.error('[useDataFetch] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData, deps]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

import React from 'react';

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<PageErrorBoundaryProps>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <PageErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </PageErrorBoundary>
    );
  };
}
