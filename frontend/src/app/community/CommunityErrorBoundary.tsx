'use client';

import React from 'react';
import { Result, Button } from 'antd';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CommunityErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Community] ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 48, maxWidth: 560, margin: '0 auto' }}>
          <Result
            status="error"
            title="页面加载出错"
            subTitle={this.state.error.message || '请刷新页面重试'}
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                刷新页面
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
