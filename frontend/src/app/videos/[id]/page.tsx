/**
 * 视频详情页
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Space, Tag, Spin, Button, App } from 'antd';
import { EyeOutlined, HeartOutlined, ShareAltOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { videoApi } from '@/lib/api/video';
import { Video } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import ShareModal from '@/components/ShareModal';
import { communityApi } from '@/lib/api/community';
import dayjs from 'dayjs';
import JsonLd from '@/components/JsonLd';
import { generateVideoObjectJsonLd, generateBreadcrumbListJsonLd } from '@/lib/metadata';

const { Content } = Layout;

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    loadVideo();
  }, [params.id]);

  useEffect(() => {
    if (user) {
      loadFavoriteState();
    } else {
      setIsFavorited(false);
    }
  }, [user, params.id]);

  const loadVideo = async () => {
    setLoading(true);
    try {
      const data = await videoApi.getVideo(params.id);
      setVideo(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteState = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'video' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setIsFavorited(ids.has(params.id));
    } catch (error: any) {
      message.error(error.message || '收藏状态获取失败');
    }
  };

  const handleShare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setShareOpen(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: '#999' }}>
        视频不存在
      </div>
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
      <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>{video.title}</h1>
          <Space wrap style={{ marginBottom: 16 }}>
            <span style={{ color: '#666' }}>UP主: {video.uploader || '匿名'}</span>
            <Tag color="blue">{video.platform.toUpperCase()}</Tag>
            {video.publishedDate && <Tag>{dayjs(video.publishedDate).format('YYYY-MM-DD')}</Tag>}
          </Space>

          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              {video.viewCount && video.viewCount > 0 && <span><EyeOutlined /> {video.viewCount} 浏览</span>}
              {video.playCount && video.playCount > 0 && <span><PlayCircleOutlined /> {video.playCount} 播放</span>}
              {video.favoriteCount && video.favoriteCount > 0 && <span><HeartOutlined /> {video.favoriteCount} 收藏</span>}
            </Space>
          </div>

          <Space size="middle" style={{ marginBottom: 16 }}>
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
            <div style={{ marginTop: 16 }}>
              <iframe
                width="100%"
                height="420"
                src={embedUrl}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0, borderRadius: 8 }}
              />
            </div>
          ) : (
            <div style={{ marginTop: 16, color: '#999' }}>
              当前平台暂不支持嵌入播放，请点击“打开原视频”观看。
            </div>
          )}

          {video.description && (
            <div style={{ marginTop: 24, color: '#333' }}>
              <h3 style={{ marginBottom: 12 }}>视频简介</h3>
              <div style={{ whiteSpace: 'pre-wrap' }}>{video.description}</div>
            </div>
          )}

          {video.tags && Array.isArray(video.tags) && video.tags.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {video.tags.map((tag) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </div>
          )}
        </Card>
      </Content>

      <ShareModal
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
    </div>
    </>
  );
}
