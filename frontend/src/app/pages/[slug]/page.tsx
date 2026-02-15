'use client';

import { useEffect, useState } from 'react';
import { Card, Spin, Empty, Typography, Skeleton, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { customPageApi, CustomPage } from '@/lib/api/custom-page';
import { useRouter, useParams } from 'next/navigation';

const { Title } = Typography;

export default function PageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<CustomPage | null>(null);

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug]);

  const loadPage = async () => {
    setLoading(true);
    try {
      const result = await customPageApi.getBySlug(slug);
      setPage(result);
    } catch (error) {
      console.error('Load page error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Skeleton active />
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Empty description="页面不存在或未发布" />
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button onClick={() => router.push('/pages')}>返回资讯列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/pages')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>
        <Card style={{ borderRadius: 8 }}>
          <Title level={2} style={{ marginBottom: 24 }}>{page.title}</Title>
          <div 
            className="custom-page-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
            style={{
              lineHeight: 1.8,
              fontSize: 16,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
