'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Result
        status="error"
        title="页面加载出错"
        subTitle={error.message || '发生了未知错误，请稍后重试'}
        extra={[
          <Button type="primary" key="retry" onClick={reset}>
            重试
          </Button>,
          <Button key="home" onClick={() => router.push('/')}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
}
