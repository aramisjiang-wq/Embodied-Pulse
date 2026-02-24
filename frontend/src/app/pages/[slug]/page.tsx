'use client';

import { useEffect, useState } from 'react';
import { Card, Empty, Typography, Skeleton, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { customPageApi, CustomPage } from '@/lib/api/custom-page';
import { useRouter, useParams } from 'next/navigation';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import styles from './page.module.css';

const { Title } = Typography;

export default function PageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<CustomPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug]);

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customPageApi.getBySlug(slug);
      setPage(result);
      if (!result) {
        setError('页面不存在或未发布');
      }
    } catch (err: any) {
      console.error('Load page error:', err);
      setError(err.message || '加载页面失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className={styles.pageWrapper}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Empty description={error || '页面不存在或未发布'} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button onClick={() => router.push('/pages')}>返回页面列表</Button>
          </div>
        </div>
      </div>
    );
  }

  const sanitizedContent = sanitizeHtml(page.content);

  return (
    <div className={styles.pageWrapper}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/pages')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>
        <Card className={styles.pageCard}>
          <Title level={2} className={styles.pageTitle}>{page.title}</Title>
          <div
            className={`custom-page-content ${styles.pageContent}`}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </Card>
      </div>
    </div>
  );
}
