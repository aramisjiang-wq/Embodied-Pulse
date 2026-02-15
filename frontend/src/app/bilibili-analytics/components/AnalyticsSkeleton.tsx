import { Card, Row, Col, Skeleton } from 'antd';

export default function AnalyticsSkeleton() {
  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 24 }} />

        <Card style={{ marginBottom: 24 }}>
          <Skeleton.Input active style={{ width: 200, marginBottom: 16 }} />
          <Skeleton.Input active style={{ width: 120 }} />
        </Card>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    </div>
  );
}
