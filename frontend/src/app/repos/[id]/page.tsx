/**
 * GitHub项目详情页
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Space, Tag, Spin, Button, App } from 'antd';
import { StarOutlined, ForkOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { repoApi } from '@/lib/api/repo';
import { GithubRepo } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import ShareModal from '@/components/ShareModal';
import { communityApi } from '@/lib/api/community';

const { Content } = Layout;

export default function RepoDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    loadRepo();
  }, [params.id]);

  useEffect(() => {
    if (user) {
      loadFavoriteState();
    } else {
      setIsFavorited(false);
    }
  }, [user, params.id]);

  const loadRepo = async () => {
    setLoading(true);
    try {
      const data = await repoApi.getRepo(params.id);
      setRepo(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteState = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'repo' });
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
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <Card>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>{repo.fullName}</h1>
          <Space wrap style={{ marginBottom: 16 }}>
            {repo.language && <Tag color="geekblue">{repo.language}</Tag>}
            {repo.owner && <Tag>{repo.owner}</Tag>}
          </Space>

          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <span><StarOutlined /> {repo.starsCount} Stars</span>
              <span><ForkOutlined /> {repo.forksCount} Forks</span>
              <span><EyeOutlined /> {repo.viewCount} 浏览</span>
            </Space>
          </div>

          <Space size="middle" style={{ marginBottom: 16 }}>
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

          <div style={{ color: '#333', marginBottom: 16 }}>
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

      <ShareModal
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
