'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Space, Tag, Spin, Button, App } from 'antd';
import { EyeOutlined, HeartOutlined, ShareAltOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { videoApi } from '@/lib/api/video';
import { Video } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { useFavorite } from '@/hooks/useFavorite';
import { DynamicComponents } from '@/lib/dynamicComponents';
import { communityApi } from '@/lib/api/community';
import dayjs from 'dayjs';
import JsonLd from '@/components/JsonLd';
import { generateVideoObjectJsonLd, generateBreadcrumbListJsonLd } from '@/lib/metadata';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

export default function VideoDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const { isFavorited, setIsFavorited } = useFavorite('video', id || '');

  const loadVideo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await videoApi.getVideo(id);
      if (data) {
        setVideo(data);
      } else {
        setVideo(null);
      }
    } catch (error: any) {
      console.error('Load video error:', error);
      setVideo(null);
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
      loadVideo();
    }
  }, [id, loadVideo]);

  const handleShare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setShareOpen(true);
  };

  if (loading) {
    return (
      <PageContainer loading={true}>
        <div className={styles.loadingWrapper}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!video) {
    return (
      <PageContainer>
        <div className={styles.notFoundWrapper}>
          视频不存在
        </div>
      </PageContainer>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embodiedpulse.com';
  const videoUrl = `${baseUrl}/videos/${video.id}`;
  const videoJsonLd = JSON.parse(generateVideoObjectJsonLd({
    name: video.title,
    description: video.description || '',
    thumbnailUrl: video.coverUrl || '',
    uploadDate: video.publishedDate || '',
    author: video.uploader || 'Unknown',
    url: videoUrl
  }));

  const breadcrumbJsonLd = JSON.parse(generateBreadcrumbListJsonLd([
    { name: '首页', url: baseUrl },
    { name: '视频', url: `${baseUrl}/videos` },
    { name: video.title, url: videoUrl }
  ]));

  const handleFavorite = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const action = isFavorited
      ? communityApi.deleteFavorite('video', video.id)
      : communityApi.createFavorite({ contentType: 'video', contentId: video.id });
    action
      .then(() => {
        message.success(isFavorited ? '已取消收藏' : '收藏成功!');
        setIsFavorited(!isFavorited);
      })
      .catch((error: any) => {
        message.error(error.message || (isFavorited ? '取消收藏失败' : '收藏失败'));
      });
  };

  const embedUrl = video.platform === 'youtube'
    ? `https://www.youtube.com/embed/${video.videoId}`
    : '';
  const platformUrl = video.platform === 'bilibili'
    ? `https://www.bilibili.com/video/${video.videoId}`
    : `https://www.youtube.com/watch?v=${video.videoId}`;

  return (
    <>
      <JsonLd data={videoJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <PageContainer title={video.title}>
        <div className={styles.container}>
          <Card className={styles.videoCard}>
            <h1 className={styles.videoTitle}>{video.title}</h1>
            <Space wrap className={styles.metaSection}>
              <span className={styles.uploaderText}>UP主: {video.uploader || '匿名'}</span>
              <Tag color="blue">{video.platform.toUpperCase()}</Tag>
              {video.publishedDate && <Tag>{dayjs(video.publishedDate).format('YYYY-MM-DD')}</Tag>}
            </Space>

            <div className={styles.statsSection}>
              <Space size="large">
                {video.viewCount && video.viewCount > 0 && <span><EyeOutlined /> {video.viewCount} 浏览</span>}
                {video.playCount && video.playCount > 0 && <span><PlayCircleOutlined /> {video.playCount} 播放</span>}
                {video.favoriteCount && video.favoriteCount > 0 && <span><HeartOutlined /> {video.favoriteCount} 收藏</span>}
              </Space>
            </div>

            <Space size="middle" className={styles.actionButtons}>
              <Button type={isFavorited ? 'primary' : 'default'} onClick={handleFavorite}>
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
              <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                分享到市集
              </Button>
              <Button href={platformUrl} target="_blank" rel="noopener noreferrer">
                打开原视频
              </Button>
            </Space>

            {embedUrl ? (
              <div className={styles.videoPlayer}>
                <iframe
                  className={styles.videoPlayerFrame}
                  src={embedUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className={styles.videoPlayerPlaceholder}>
                当前平台暂不支持嵌入播放，请点击"打开原视频"观看。
              </div>
            )}

            {video.description && (
              <div className={styles.descriptionSection}>
                <h3 className={styles.descriptionTitle}>视频简介</h3>
                <div className={styles.descriptionText}>{video.description}</div>
              </div>
            )}

            {video.tags && Array.isArray(video.tags) && video.tags.length > 0 && (
              <div className={styles.tagsSection}>
                {video.tags.map((tag) => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageContainer>

      <DynamicComponents.ShareModal
        open={shareOpen}
        title={video.title}
        url={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : ''}
        onPublish={async (content) => {
          await communityApi.createPost({
            contentType: 'video',
            contentId: video.id,
            title: `分享：${video.title}`,
            content,
          });
        }}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
