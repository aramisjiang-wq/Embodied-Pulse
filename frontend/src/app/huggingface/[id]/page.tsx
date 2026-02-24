/**
 * Hugging Face 模型详情页
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Layout, Card, Space, Tag, Spin, Button, App } from 'antd';
import { DownloadOutlined, LikeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { huggingfaceApi } from '@/lib/api/huggingface';
import { HuggingFaceModel } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { useFavorite } from '@/hooks/useFavorite';
import { DynamicComponents } from '@/lib/dynamicComponents';
import { communityApi } from '@/lib/api/community';
import styles from './page.module.css';

const { Content } = Layout;

export default function HuggingFaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<HuggingFaceModel | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const { isFavorited, setIsFavorited } = useFavorite('huggingface', id || '');

  const loadModel = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await huggingfaceApi.getModel(id);
      if (data) {
        setModel(data);
      } else {
        setModel(null);
      }
    } catch (error: any) {
      console.error('Load model error:', error);
      setModel(null);
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
      loadModel();
    }
  }, [id, loadModel]);

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

  const getHuggingFaceUrl = () => {
    const contentType = model.contentType || 'model';
    if (contentType === 'dataset') {
      return `https://huggingface.co/datasets/${model.fullName}`;
    } else if (contentType === 'space') {
      return `https://huggingface.co/spaces/${model.fullName}`;
    }
    return `https://huggingface.co/${model.fullName}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <Content style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card className={styles.detailCard}>
          <h1 className={styles.pageTitle}>{model.fullName}</h1>
          <Space wrap style={{ marginBottom: 16 }}>
            {model.task && <Tag color="purple">{model.task}</Tag>}
            {model.license && <Tag>{model.license}</Tag>}
            {model.author && <Tag>{model.author}</Tag>}
          </Space>

          <div className={styles.statsRow}>
            <Space size="large">
              <span><DownloadOutlined /> {model.downloads} 下载</span>
              <span><LikeOutlined /> {model.likes} 点赞</span>
            </Space>
          </div>

          <Space size="middle" className={styles.actionBar}>
            <Button type={isFavorited ? 'primary' : 'default'} onClick={handleFavorite}>
              {isFavorited ? '已收藏' : '收藏'}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享到市集
            </Button>
            <Button 
              type="primary"
              href={model.fullName ? getHuggingFaceUrl() : (model.hfId ? `https://huggingface.co/${model.hfId}` : '#')} 
              target="_blank"
              rel="noopener noreferrer"
            >
              打开HuggingFace
            </Button>
          </Space>

          <div className={styles.description}>
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

      <DynamicComponents.ShareModal
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
