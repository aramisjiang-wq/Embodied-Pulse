'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Divider, Tabs, App, Spin } from 'antd';
import { EyeOutlined, HeartOutlined, ShareAltOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { paperApi } from '@/lib/api/paper';
import { Paper } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { useFavorite } from '@/hooks/useFavorite';
import dynamic from 'next/dynamic';
import DynamicComponents from '@/lib/dynamicComponents';
import { communityApi } from '@/lib/api/community';
import RelatedContent from '@/components/RelatedContent';
import QuickActions from '@/components/QuickActions';
import JsonLd from '@/components/JsonLd';
import { generateArticleJsonLd, generateBreadcrumbListJsonLd } from '@/lib/metadata';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const ShareModal = DynamicComponents.ShareModal;
const PDFViewer = DynamicComponents.PDFViewer;

export default function PaperDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState<Paper | null>(null);
  const { user } = useAuthStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('abstract');
  const { message } = App.useApp();

  const { isFavorited, setIsFavorited } = useFavorite('paper', id || '');

  const loadPaper = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await paperApi.getPaper(id);
      if (data) {
        setPaper(data);
      } else {
        setPaper(null);
      }
    } catch (error: any) {
      console.error('Load paper error:', error);
      setPaper(null);
      const errorMessage = error?.message || error?.response?.data?.message || '加载失败';
      if (error?.status !== 404) {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [id, message]);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      loadPaper();
    }
  }, [id, loadPaper]);

  if (loading) {
    return (
      <PageContainer loading={true}>
        <div className={styles.loadingWrapper}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!paper) {
    return (
      <PageContainer>
        <div className={styles.notFoundWrapper}>
          论文不存在
        </div>
      </PageContainer>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embodiedpulse.com';
  const paperUrl = `${baseUrl}/papers/${paper.id}`;
  
  const getThumbnailUrl = (): string => {
    if (paper.thumbnailUrl) return paper.thumbnailUrl;
    if (paper.arxivId) {
      return `https://arxiv.org/abs/${paper.arxivId}`;
    }
    return '';
  };
  
  const articleJsonLd = JSON.parse(generateArticleJsonLd({
    headline: paper.title,
    description: paper.abstract || '',
    image: getThumbnailUrl(),
    author: Array.isArray(paper.authors) ? paper.authors[0] : 'Unknown',
    datePublished: paper.publishedDate || '',
    dateModified: paper.updatedAt || '',
    url: paperUrl
  }));

  const breadcrumbJsonLd = JSON.parse(generateBreadcrumbListJsonLd([
    { name: '首页', url: baseUrl },
    { name: '论文', url: `${baseUrl}/papers` },
    { name: paper.title, url: paperUrl }
  ]));

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <PageContainer title={paper.title}>
        <div className={styles.container}>
          <Card className={styles.paperCard}>
            <header className={styles.header}>
              <h1 className={styles.paperTitle}>{paper.title}</h1>
              {Array.isArray(paper.authors) && paper.authors.length > 0 && (
                <p className={styles.authorsText}>
                  作者：{paper.authors.join('、')}
                </p>
              )}
              <div className={styles.metaRow}>
                {paper.venue && (
                  <span className={styles.venuePill}>{paper.venue}</span>
                )}
                {paper.publishedDate && (
                  <span className={styles.metaChip}>
                    {new Date(paper.publishedDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
                {paper.arxivId && (
                  <span className={styles.arxivChip}>arXiv: {paper.arxivId}</span>
                )}
              </div>
            </header>

            <div className={styles.statsBar}>
              <span className={styles.statItem}><EyeOutlined /> {paper.viewCount}</span>
              <span className={styles.statItem}><HeartOutlined /> {paper.favoriteCount}</span>
              <span className={styles.statItem}><ShareAltOutlined /> {paper.shareCount}</span>
              <span className={styles.statItem}>引用 {paper.citationCount}</span>
            </div>

            <div className={styles.actionBar}>
              <div className={styles.primaryActions}>
                {paper.arxivId && (
                  <Button
                    type="primary"
                    size="large"
                    href={`https://arxiv.org/abs/${paper.arxivId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ctaButton}
                  >
                    <FileTextOutlined /> 查看 arXiv 原文
                  </Button>
                )}
                {paper.pdfUrl && (
                  <Button
                    size="large"
                    icon={<DownloadOutlined />}
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondaryButton}
                  >
                    下载 PDF
                  </Button>
                )}
              </div>
              <div className={styles.quickActionsWrap}>
                <QuickActions
                  contentType="paper"
                  contentId={paper.id}
                  title={paper.title}
                  url={typeof window !== 'undefined' ? `${window.location.origin}/papers/${paper.id}` : ''}
                  onShare={() => setShareOpen(true)}
                  onFavoriteChange={(isFav) => setIsFavorited(isFav)}
                  showSubscribe={false}
                />
              </div>
            </div>

            <Divider className={styles.divider} />

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className={styles.tabs}
              items={[
                {
                  key: 'abstract',
                  label: (
                    <span>
                      <FileTextOutlined />
                      摘要
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <h2 className={styles.sectionTitle}>摘要</h2>
                      <p className={styles.abstractText}>
                        {paper.abstract}
                      </p>

                      {paper.categories && Array.isArray(paper.categories) && paper.categories.length > 0 && (
                        <>
                          <Divider className={styles.categoryDivider} />
                          <div className={styles.categorySection}>
                            <h3 className={styles.categoryTitle}>分类标签</h3>
                            <div className={styles.categoryTags}>
                              {paper.categories.map((cat: string) => (
                                <span key={cat} className={styles.categoryTag}>{cat}</span>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'pdf',
                  label: (
                    <span>
                      <DownloadOutlined />
                      PDF预览
                    </span>
                  ),
                  children: paper.pdfUrl ? (
                    <PDFViewer url={paper.pdfUrl} title={paper.title} />
                  ) : (
                    <div className={styles.pdfPlaceholder}>
                      暂无PDF预览
                    </div>
                  ),
                  disabled: !paper.pdfUrl,
                },
              ]}
            />
          </Card>

          <RelatedContent
            currentId={paper.id}
            type="paper"
            categories={paper.categories}
            keywords={paper.title ? paper.title.split(' ') : []}
            limit={5}
          />
        </div>
      </PageContainer>

      <ShareModal
        open={shareOpen}
        title={paper.title}
        url={typeof window !== 'undefined' ? `${window.location.origin}/papers/${paper.id}` : ''}
        onPublish={async (content) => {
          await communityApi.createPost({
            contentType: 'paper',
            contentId: paper.id,
            title: `分享：${paper.title}`,
            content,
          });
        }}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
