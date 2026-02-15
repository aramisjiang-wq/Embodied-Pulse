import { Card, Skeleton, Space } from 'antd';

export default function DiscoverySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(5)].map((_, index) => (
        <Card
          key={index}
          style={{
            borderRadius: 12,
            border: '1px solid #f0f0f0',
          }}
          styles={{ body: { padding: 16 } }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <Skeleton.Avatar active size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton.Input active size="small" style={{ width: '60%', marginBottom: 12 }} />
              <Skeleton.Input active size="small" style={{ width: '100%', marginBottom: 8 }} />
              <Skeleton.Input active size="small" style={{ width: '40%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 24 }}>
                <Skeleton.Input active size="small" style={{ width: 60 }} />
                <Skeleton.Input active size="small" style={{ width: 60 }} />
                <Skeleton.Input active size="small" style={{ width: 60 }} />
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
              <Skeleton.Button active size="small" />
              <Skeleton.Button active size="small" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
