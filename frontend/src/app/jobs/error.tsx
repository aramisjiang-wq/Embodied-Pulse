'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import PageContainer from '@/components/PageContainer';

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Jobs 页面错误]', error);
  }, [error]);

  return (
    <PageContainer>
      <Result
        status="error"
        title="页面加载出错"
        subTitle={error.message || '招聘/求职页暂时无法加载，请重试或联系管理员'}
        extra={
          <Button type="primary" onClick={reset}>
            重新加载
          </Button>
        }
      />
    </PageContainer>
  );
}
