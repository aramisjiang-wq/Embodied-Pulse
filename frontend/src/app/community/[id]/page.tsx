'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Avatar, Space, Button, Spin, Divider, Tag, Typography, Row, Col, App } from 'antd';
import { LikeOutlined, ShareAltOutlined, EyeOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { communityApi } from '@/lib/api/community';
import { Post } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import RealTimeComments from '@/components/RealTimeComments';
import QuickActions from '@/components/QuickActions';
import { getLevelBadge } from '@/lib/utils/levelUtils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import PageContainer from '@/components/PageContainer';
import Link from 'next/link';
import styles from './page.module.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

const POST_TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  tech: { icon: '💻', label: '技术讨论' },
  resource: { icon: '📦', label: '资源分享' },
  jobs: { icon: '💼', label: '求职招聘' },
  activity: { icon: '🎯', label: '活动交流' },
  discussion: { icon: '💬', label: '讨论' },
  paper: { icon: '📄', label: '论文分享' },
  video: { icon: '🎬', label: '视频分享' },
  repo: { icon: '🔧', label: '项目推荐' },
  model: { icon: '🤖', label: '模型推荐' },
  event: { icon: '📅', label: '活动信息' },
  job: { icon: '💼', label: '招聘信息' },
};

export default function CommunityDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await communityApi.getPost(id);
      if (data) {
        setPost(data);
      } else {
        setPost(null);
      }
    } catch (error: any) {
      console.error('Load post error:', error);
      setPost(null);
      const errorMessage = error?.message || error?.response?.data?.message || '加载失败';
      if (error?.status !== 404) {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [id, message]);

  const handleLike = useCallback(async () => {
    if (!user || !id) {
      message.warning('请先登录');
      return;
    }
    try {
      await communityApi.likePost(id);
      message.success('点赞成功');
      loadPost();
    } catch (error: any) {
      message.error(error.message || '点赞失败');
    }
  }, [user, id, message, loadPost]);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      loadPost();
    }
  }, [id, loadPost]);

  const handleShare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/community/${id}`;
    
    if (navigator.share) {
      navigator.share({
        title: post?.title || '市集讨论',
        text: post?.content?.substring(0, 100) || '',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      message.success('链接已复制到剪贴板');
    }
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

  if (!post) {
    return (
      <PageContainer>
        <div className={styles.notFoundWrapper}>
          帖子不存在
        </div>
      </PageContainer>
    );
  }

  const typeConfig = POST_TYPE_CONFIG[post.contentType as string] || POST_TYPE_CONFIG.discussion;
  const levelBadge = getLevelBadge(post.user?.level || 1);

  return (
    <PageContainer title={post.title || '市集讨论'}>
      <div className={styles.container}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card className={styles.postCard}>
              <div className={styles.postHeader}>
                <Link href={post.user?.id ? `/user/${post.user.id}` : '#'}>
                  <Avatar 
                    src={post.user?.avatarUrl} 
                    size={48} 
                    icon={<UserOutlined />}
                    style={{ border: '2px solid #e5e7eb' }}
                  />
                </Link>
                <div className={styles.userInfo}>
                  <div className={styles.userNameRow}>
                    <Link href={post.user?.id ? `/user/${post.user.id}` : '#'} style={{ textDecoration: 'none' }}>
                      <Text strong className={styles.userName}>{post.user?.username}</Text>
                    </Link>
                    <Tag style={{ color: levelBadge.color, borderColor: levelBadge.color, background: 'transparent' }}>
                      {levelBadge.icon} LV{post.user?.level || 1} {levelBadge.name}
                    </Tag>
                    <Tag style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#4b5563' }}>
                      {typeConfig.icon} {typeConfig.label}
                    </Tag>
                    {post.isTop && <Tag color="red">置顶</Tag>}
                    {post.isFeatured && <Tag color="gold">精选</Tag>}
                  </div>
                  <Text type="secondary" className={styles.postTime}>
                    {dayjs(post.createdAt).fromNow()} · {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
              </div>

              {post.title && (
                <Title level={2} className={styles.postTitle}>
                  {post.title}
                </Title>
              )}

              <div className={styles.postContent}>
                {post.content}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <Space wrap size={8}>
                    {post.tags.map((tag, index) => (
                      <Tag key={index}>
                        #{tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <Divider />

              <div className={styles.postActions}>
                <Space>
                  <Button 
                    type="text"
                    icon={<LikeOutlined />}
                    onClick={handleLike}
                    disabled={!user}
                    style={{ color: '#6b7280' }}
                  >
                    {post.likeCount || 0}
                  </Button>
                  <Button 
                    type="text" 
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    disabled={!user}
                    style={{ color: '#6b7280' }}
                  >
                    分享
                  </Button>
                </Space>
                
                <Space size="large" className={styles.postStats}>
                  <Text type="secondary" className={styles.statText}>
                    <EyeOutlined /> {post.viewCount || 0}
                  </Text>
                  <Text type="secondary" className={styles.statText}>
                    <CalendarOutlined /> {dayjs(post.createdAt).format('YYYY-MM-DD')}
                  </Text>
                </Space>
              </div>

              <Divider />

              <RealTimeComments 
                postId={post.id} 
                onCommentCountChange={setCommentCount}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" className={styles.sidebar} size={16}>
              <Card title="快捷操作" className={styles.sidebarCard}>
                <QuickActions
                  contentType="post"
                  contentId={post.id}
                  title={post.title || '市集讨论'}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  onShare={handleShare}
                />
              </Card>

              <Card title="帖子信息" className={styles.sidebarCard}>
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <div className={styles.infoItem}>
                    <Text type="secondary" className={styles.infoLabel}>浏览量</Text>
                    <div className={styles.infoValue}>
                      {post.viewCount || 0}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Text type="secondary" className={styles.infoLabel}>点赞数</Text>
                    <div className={styles.infoValue}>
                      {post.likeCount || 0}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Text type="secondary" className={styles.infoLabel}>评论数</Text>
                    <div className={styles.infoValue}>
                      {commentCount}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Text type="secondary" className={styles.infoLabel}>分享数</Text>
                    <div className={styles.infoValue}>
                      {post.shareCount || 0}
                    </div>
                  </div>
                </Space>
              </Card>

              {post.isTop && (
                <Card className={styles.sidebarCard}>
                  <Tag color="red" className={styles.specialTag}>
                    置顶帖子
                  </Tag>
                </Card>
              )}

              {post.isFeatured && (
                <Card className={styles.sidebarCard}>
                  <Tag color="gold" className={styles.specialTag}>
                    精选帖子
                  </Tag>
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
}
