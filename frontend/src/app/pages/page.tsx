'use client';

import { useEffect, useState } from 'react';
import { Card, Empty, Typography, List, Skeleton } from 'antd';
import { customPageApi, CustomPageListItem } from '@/lib/api/custom-page';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

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
      <div className={styles.pageWrapper}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton active />
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Empty description="暂无页面内容" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} className={styles.pageTitle}>页面</Title>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
          dataSource={pages}
          renderItem={(page) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => router.push(`/pages/${page.slug}`)}
                className={styles.pageCard}
              >
                <Card.Meta
                  title={page.title}
                  description="查看详情"
                />
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}
