'use client';

import { useState, useEffect } from 'react';
import { Typography, Tag, Pagination, Spin, Empty } from 'antd';
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { dailyNewsApi } from '@/lib/api/daily-news';
import { DailyNews } from '@/lib/api/types';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const { Paragraph } = Typography;

export default function NewsListPage() {
  const [news, setNews] = useState<DailyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchNews();
  }, [page]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const result = await dailyNewsApi.getNewsList({ page, size: pageSize });
      setNews(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getSummary = (content: string) => {
    const lines = content.split('\n').filter((line) => line.trim());
    const summary = lines.slice(0, 3).join(' ');
    return summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSkeleton = () => (
    <div className={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={styles.listItem} style={{ padding: '20px 24px' }}>
          <Spin />
        </div>
      ))}
    </div>
  );

  return (
    <PageContainer loading={false} maxWidth="1360px">
      <div className={styles.newsContainer}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.statsCard}>
                <div className={styles.statsNumber}>{total.toLocaleString()}</div>
                <div className={styles.statsLabel}>篇新闻资讯</div>
                <div className={styles.statsDesc}>具身智能领域动态</div>
              </div>
            </div>
          </aside>

          <div className={styles.main}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <h1 className={styles.pageTitle}>每日新闻</h1>
                <span className={styles.pageSubtitle}>具身智能领域最新动态</span>
              </div>
            </div>

            {!loading && news.length > 0 && (
              <div className={styles.resultInfo}>
                共找到 <strong>{total.toLocaleString()}</strong> 篇新闻
              </div>
            )}

            {loading && news.length === 0 ? (
              renderSkeleton()
            ) : news.length === 0 ? (
              <div className={styles.emptyWrapper}>
                <Empty description="暂无新闻" />
              </div>
            ) : (
              <div className={styles.listContainer}>
                {news.map((item) => (
                  <div key={item.id} className={styles.listItem}>
                    <Link href={`/news/${item.id}`} className={styles.listItemMain}>
                      <div className={styles.listHeader}>
                        <span className={styles.dateTag}>
                          <CalendarOutlined />
                          {formatDate(item.date)}
                        </span>
                        {item.isPinned && <span className={styles.pinBadge}>置顶</span>}
                      </div>
                      <span className={styles.listTitle}>{item.title}</span>
                      <Paragraph className={styles.listSummary} ellipsis={{ rows: 2 }}>
                        {getSummary(item.content)}
                      </Paragraph>
                      <div className={styles.listMeta}>
                        <span className={styles.metaItem}>
                          <EyeOutlined />
                          {item.viewCount} 次浏览
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {total > pageSize && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showTotal={(t, range) => `第 ${range[0]}–${range[1]} 篇，共 ${t} 篇`}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
