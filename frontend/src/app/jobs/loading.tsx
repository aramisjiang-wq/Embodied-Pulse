import { Skeleton } from 'antd';
import PageContainer from '@/components/PageContainer';

export default function JobsLoading() {
  return (
    <PageContainer>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: 24 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 16 }} />
        <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 16 }} />
      </div>
    </PageContainer>
  );
}
