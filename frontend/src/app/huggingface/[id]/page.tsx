/**
 * Hugging Face 模型详情页
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Space, Tag, Spin, Button, App } from 'antd';
import { DownloadOutlined, LikeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { huggingfaceApi } from '@/lib/api/huggingface';
import { HuggingFaceModel } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import ShareModal from '@/components/ShareModal';
import { communityApi } from '@/lib/api/community';

const { Content } = Layout;

export default function HuggingFaceDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<HuggingFaceModel | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    loadModel();
  }, [params.id]);

  useEffect(() => {
    if (user) {
      loadFavoriteState();
    } else {
      setIsFavorited(false);
    }
  }, [user, params.id]);

  const loadModel = async () => {
    setLoading(true);
    try {
      const data = await huggingfaceApi.getModel(params.id);
      setModel(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteState = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'huggingface' });
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

  if (!model) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: '#999' }}>
        模型不存在
      </div>
    );
  }

  const handleFavorite = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const action = isFavorited
      ? communityApi.deleteFavorite('huggingface', model.id)
      : communityApi.createFavorite({ contentType: 'huggingface', contentId: model.id });
    action
      .then(() => {
        message.success(isFavorited ? '已取消收藏' : '收藏成功!');
        setIsFavorited(!isFavorited);
      })
      .catch((error: any) => {
        message.error(error.message || (isFavorited ? '取消收藏失败' : '收藏失败'));
      });
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>{model.fullName}</h1>
          <Space wrap style={{ marginBottom: 16 }}>
            {model.task && <Tag color="purple">{model.task}</Tag>}
            {model.license && <Tag>{model.license}</Tag>}
            {model.author && <Tag>{model.author}</Tag>}
          </Space>

          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <span><DownloadOutlined /> {model.downloads} 下载</span>
              <span><LikeOutlined /> {model.likes} 点赞</span>
            </Space>
          </div>

          <Space size="middle" style={{ marginBottom: 16 }}>
            <Button type={isFavorited ? 'primary' : 'default'} onClick={handleFavorite}>
              {isFavorited ? '已收藏' : '收藏'}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享到市集
            </Button>
            <Button 
              type="primary"
              href={model.fullName ? `https://huggingface.co/${model.fullName}` : (model.hfId ? `https://huggingface.co/${model.hfId}` : '#')} 
              target="_blank"
              rel="noopener noreferrer"
            >
              打开HuggingFace
            </Button>
          </Space>

          <div style={{ color: '#333', marginBottom: 16 }}>
            {model.description || '暂无描述'}
          </div>

          {model.tags && Array.isArray(model.tags) && model.tags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {model.tags.map((tag) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </div>
          )}
        </Card>
      </Content>

      <ShareModal
        open={shareOpen}
        title={model.fullName}
        url={typeof window !== 'undefined' ? `${window.location.origin}/huggingface/${model.id}` : ''}
        onPublish={async (content) => {
          await communityApi.createPost({
            contentType: 'huggingface',
            contentId: model.id,
            title: `分享：${model.fullName}`,
            content,
          });
        }}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
