'use client';

import { useEffect, useState } from 'react';
import { Card, Spin, Empty, Typography, List, Skeleton } from 'antd';
import { customPageApi, CustomPageListItem } from '@/lib/api/custom-page';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function PagesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<CustomPageListItem[]>([]);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const result = await customPageApi.getList();
      setPages(result);
    } catch (error) {
      console.error('Load pages error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Skeleton active />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Empty description="暂无资讯内容" />
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>资讯</Title>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
          dataSource={pages}
          renderItem={(page) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => router.push(`/pages/${page.slug}`)}
                style={{ borderRadius: 8 }}
              >
                <Card.Meta
                  title={page.title}
                  description={`查看详情`}
                />
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}
