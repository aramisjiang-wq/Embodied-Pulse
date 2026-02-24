/**
 * GitHub项目详情页
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Layout, Card, Space, Tag, Spin, Button, App } from 'antd';
import { StarOutlined, ForkOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { repoApi } from '@/lib/api/repo';
import { GithubRepo } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { useFavorite } from '@/hooks/useFavorite';
import { DynamicComponents } from '@/lib/dynamicComponents';
import { communityApi } from '@/lib/api/community';
import styles from './page.module.css';

const { Content } = Layout;

export default function RepoDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const { isFavorited, setIsFavorited } = useFavorite('repo', id || '');

  const loadRepo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await repoApi.getRepo(id);
      if (data) {
        setRepo(data);
      } else {
        setRepo(null);
      }
    } catch (error: any) {
      console.error('Load repo error:', error);
      setRepo(null);
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
      loadRepo();
    }
  }, [id, loadRepo]);

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

  if (!repo) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: '#999' }}>
        项目不存在
      </div>
    );
  }

  const handleFavorite = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const action = isFavorited
      ? communityApi.deleteFavorite('repo', repo.id)
      : communityApi.createFavorite({ contentType: 'repo', contentId: repo.id });
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
    <div className={styles.pageWrapper}>
      <Content style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card className={styles.detailCard}>
          <h1 className={styles.pageTitle}>{repo.fullName}</h1>
          <Space wrap style={{ marginBottom: 16 }}>
            {repo.language && <Tag color="geekblue">{repo.language}</Tag>}
            {repo.owner && <Tag>{repo.owner}</Tag>}
          </Space>

          <div className={styles.statsRow}>
            <Space size="large">
              <span><StarOutlined /> {repo.starsCount} Stars</span>
              <span><ForkOutlined /> {repo.forksCount} Forks</span>
              <span><EyeOutlined /> {repo.viewCount} 浏览</span>
            </Space>
          </div>

          <Space size="middle" className={styles.actionBar}>
            <Button type={isFavorited ? 'primary' : 'default'} onClick={handleFavorite}>
              {isFavorited ? '已收藏' : '收藏'}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>分享到市集</Button>
            <Button 
              type="primary"
              href={repo.htmlUrl || (repo.fullName ? `https://github.com/${repo.fullName}` : '#')} 
              target="_blank"
              rel="noopener noreferrer"
            >
              打开GitHub
            </Button>
          </Space>

          <div className={styles.description}>
            {repo.description || '暂无描述'}
          </div>

          {repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {repo.topics.map((topic) => (
                <Tag key={topic} color="blue">{topic}</Tag>
              ))}
            </div>
          )}
        </Card>
      </Content>

      <DynamicComponents.ShareModal
        open={shareOpen}
        title={repo.fullName}
        url={typeof window !== 'undefined' ? `${window.location.origin}/repos/${repo.id}` : ''}
        onPublish={async (content) => {
          await communityApi.createPost({
            contentType: 'repo',
            contentId: repo.id,
            title: `分享：${repo.fullName}`,
            content,
          });
        }}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
