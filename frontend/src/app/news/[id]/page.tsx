'use client';

import { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { ArrowLeftOutlined, ShareAltOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { dailyNewsApi } from '@/lib/api/daily-news';
import { DailyNews } from '@/lib/api/types';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchNews(params.id as string);
    }
  }, [params.id]);

  const fetchNews = async (id: string) => {
    setLoading(true);
    try {
      const result = await dailyNewsApi.getNewsById(id);
      setNews(result);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      message.error('获取新闻失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制');
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        return (
          <h3 key={index} className={styles.contentHeading}>
            {trimmedLine.replace('## ', '')}
          </h3>
        );
      }
      if (trimmedLine.startsWith('### ')) {
        return (
          <h4 key={index} className={styles.contentSubHeading}>
            {trimmedLine.replace('### ', '')}
          </h4>
        );
      }
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <p key={index} className={styles.contentStrong}>
            {trimmedLine.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (trimmedLine.startsWith('- ')) {
        return (
          <div key={index} className={styles.contentListItem}>
            {trimmedLine.substring(2)}
          </div>
        );
      }
      if (/^\d+\./.test(trimmedLine)) {
        return (
          <p key={index} className={styles.contentNumberedItem}>
            {trimmedLine}
          </p>
        );
      }
      if (trimmedLine.startsWith('标题：')) {
        return (
          <p key={index} className={styles.contentStrong}>
            {trimmedLine.replace('标题：', '')}
          </p>
        );
      }
      if (trimmedLine.startsWith('时间：')) {
        return (
          <p key={index} className={styles.contentSecondary}>
            {trimmedLine}
          </p>
        );
      }
      if (trimmedLine.startsWith('来源：')) {
        return (
          <p key={index} className={styles.contentSecondary}>
            {trimmedLine}
          </p>
        );
      }
      if (trimmedLine.startsWith('链接：')) {
        const url = trimmedLine.replace('链接：', '').trim();
        if (url && url !== '无') {
          return (
            <Link
              key={index}
              href={url}
              target="_blank"
              className={styles.contentLink}
            >
              查看原文
            </Link>
          );
        }
        return null;
      }
      if (trimmedLine.startsWith('观点：')) {
        return (
          <p key={index} className={styles.contentSecondary}>
            {trimmedLine.replace('观点：', '')}
          </p>
        );
      }
      if (trimmedLine) {
        return <p key={index} className={styles.contentParagraph}>{trimmedLine}</p>;
      }
      return null;
    });
  };

  if (loading) {
    return (
      <PageContainer loading={false} maxWidth="900px">
        <div className={styles.loadingWrapper}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!news) {
    return (
      <PageContainer loading={false} maxWidth="900px">
        <div className={styles.notFound}>
          <h3 className={styles.notFoundTitle}>新闻不存在</h3>
          <Link href="/news" className={styles.notFoundButton}>
            返回列表
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer loading={false} maxWidth="900px">
      <div className={styles.detailContainer}>
        <button
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <ArrowLeftOutlined />
          返回
        </button>

        <div className={styles.newsCard}>
          <div className={styles.newsHeader}>
            <span className={styles.dateTag}>
              <CalendarOutlined />
              {formatDate(news.date)}
            </span>
            {news.isPinned && <span className={styles.pinBadge}>置顶</span>}
          </div>

          <h1 className={styles.newsTitle}>{news.title}</h1>

          <div className={styles.newsMeta}>
            <span>
              <EyeOutlined style={{ marginRight: 4 }} />
              {news.viewCount} 次浏览
            </span>
          </div>

          <div className={styles.newsContent}>{renderContent(news.content)}</div>

          <div className={styles.newsFooter}>
            <button className={styles.shareButton} onClick={handleShare}>
              <ShareAltOutlined />
              分享
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
