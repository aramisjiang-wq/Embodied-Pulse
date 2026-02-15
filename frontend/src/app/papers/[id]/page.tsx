/**
 * 论文详情页
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Tag, Space, Button, Spin, Divider, Tabs, App } from 'antd';
import { EyeOutlined, HeartOutlined, ShareAltOutlined, StarOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { paperApi } from '@/lib/api/paper';
import { Paper } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import dynamic from 'next/dynamic';
import DynamicComponents from '@/lib/dynamicComponents';
import { communityApi } from '@/lib/api/community';
import RelatedContent from '@/components/RelatedContent';
import QuickActions from '@/components/QuickActions';
import JsonLd from '@/components/JsonLd';
import { generateArticleJsonLd, generateBreadcrumbListJsonLd } from '@/lib/metadata';

const ShareModal = DynamicComponents.ShareModal;
const PDFViewer = DynamicComponents.PDFViewer;

const { Content } = Layout;

export default function PaperDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState<Paper | null>(null);
  const { user } = useAuthStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('abstract');
  const { message } = App.useApp();

  useEffect(() => {
    loadPaper();
  }, [params.id]);

  useEffect(() => {
    if (user) {
      loadFavoriteState();
    } else {
      setIsFavorited(false);
    }
  }, [user, params.id]);

  const loadFavoriteState = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 1000, contentType: 'paper' });
      const favorited = data.items?.some((fav: any) => fav.contentId === params.id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Load favorite state error:', error);
    }
  };

  const loadPaper = async () => {
    setLoading(true);
    try {
      const data = await paperApi.getPaper(params.id);
      setPaper(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: '#999' }}>
        论文不存在
      </div>
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
      <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <Card style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>{paper.title}</h1>

          <Space wrap style={{ marginBottom: 16 }}>
            <span style={{ color: '#000000', fontSize: 15 }}>作者: {Array.isArray(paper.authors) ? paper.authors.join(', ') : ''}</span>
          </Space>

          <Space wrap style={{ marginBottom: 16 }}>
            {paper.venue && <Tag color="green" style={{ fontSize: 14, color: '#000000', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{paper.venue}</Tag>}
            {paper.publishedDate && (
              <Tag style={{ fontSize: 14, color: '#000000', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{new Date(paper.publishedDate).toLocaleDateString()}</Tag>
            )}
            {paper.arxivId && <Tag style={{ fontSize: 14, color: '#000000', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>arXiv: {paper.arxivId}</Tag>}
          </Space>

          <div style={{ marginBottom: 16 }}>
            <Space size="large" style={{ fontSize: 14, color: '#000000' }}>
              <span><EyeOutlined /> {paper.viewCount} 浏览</span>
              <span><HeartOutlined /> {paper.favoriteCount} 收藏</span>
              <span><ShareAltOutlined /> {paper.shareCount} 分享</span>
              <span>引用 {paper.citationCount}</span>
            </Space>
          </div>

          <QuickActions
            contentType="paper"
            contentId={paper.id}
            title={paper.title}
            url={typeof window !== 'undefined' ? `${window.location.origin}/papers/${paper.id}` : ''}
            onShare={() => setShareOpen(true)}
            onFavoriteChange={(isFav) => setIsFavorited(isFav)}
          />

          <Space size="middle" style={{ marginBottom: 24 }}>
            {paper.arxivId && (
              <Button 
                type="primary"
                href={`https://arxiv.org/abs/${paper.arxivId}`} 
                target="_blank"
                rel="noopener noreferrer"
              >
                查看arXiv原文
              </Button>
            )}
            {paper.pdfUrl && (
              <Button icon={<DownloadOutlined />} href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                下载PDF
              </Button>
            )}
          </Space>

          <Divider />

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
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
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>摘要</h2>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: '#333' }}>
                      {paper.abstract}
                    </p>

                    {paper.categories && Array.isArray(paper.categories) && paper.categories.length > 0 && (
                      <>
                        <Divider />
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>分类标签</h3>
                          <Space wrap>
                            {paper.categories.map((cat: string) => (
                              <Tag key={cat} color="blue">{cat}</Tag>
                            ))}
                          </Space>
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
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
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
      </Content>

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
    </div>
    </>
  );
}
