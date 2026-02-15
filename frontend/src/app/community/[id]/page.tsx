'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Avatar, Space, Button, Spin, Divider, Tag, Typography, Row, Col, App } from 'antd';
import { LikeOutlined, ShareAltOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { Post } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import RealTimeComments from '@/components/RealTimeComments';
import QuickActions from '@/components/QuickActions';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  useEffect(() => {
    loadPost();
  }, [params.id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await communityApi.getPost(params.id);
      setPost(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    try {
      await communityApi.likePost(params.id);
      message.success('点赞成功');
      loadPost();
    } catch (error: any) {
      message.error(error.message || '点赞失败');
    }
  };

  const handleShare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/community/${params.id}`;
    
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
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: '#999' }}>
        帖子不存在
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <Avatar src={post.user.avatarUrl} size={48} icon={<div style={{ fontSize: 20 }}>{post.user.username?.[0]?.toUpperCase()}</div>} />
                <div style={{ marginLeft: 12, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>{post.user.username}</Text>
                    <Tag color="blue">LV{post.user.level}</Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {dayjs(post.createdAt).fromNow()}
                  </Text>
                </div>
              </div>

              {post.title && (
                <Title level={2} style={{ marginBottom: 16, marginTop: 0 }}>
                  {post.title}
                </Title>
              )}

              <div style={{ 
                color: '#333', 
                lineHeight: 1.8, 
                fontSize: 15, 
                whiteSpace: 'pre-wrap',
                marginBottom: 24 
              }}>
                {post.content}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Space wrap>
                    {post.tags.map((tag, index) => (
                      <Tag key={index} color="geekblue">
                        #{tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <Divider />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Space>
                  <Button 
                    type={user ? 'default' : 'text'}
                    icon={<LikeOutlined />}
                    onClick={handleLike}
                    disabled={!user}
                  >
                    {post.likeCount}
                  </Button>
                  <Button 
                    type="text" 
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    disabled={!user}
                  >
                    分享
                  </Button>
                </Space>
                
                <Space size="large" style={{ marginLeft: 'auto' }}>
                  <Text type="secondary">
                    <EyeOutlined /> {post.viewCount}
                  </Text>
                  <Text type="secondary">
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
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Card title="快捷操作">
                <QuickActions
                  contentType="post"
                  contentId={post.id}
                  title={post.title || '市集讨论'}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  onShare={handleShare}
                />
              </Card>

              <Card title="帖子信息">
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  <div>
                    <Text type="secondary">浏览量</Text>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {post.viewCount}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">点赞数</Text>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {post.likeCount}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">评论数</Text>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {commentCount}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">分享数</Text>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {post.shareCount}
                    </div>
                  </div>
                </Space>
              </Card>

              {post.isTop && (
                <Card>
                  <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
                    置顶帖子
                  </Tag>
                </Card>
              )}

              {post.isFeatured && (
                <Card>
                  <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
                    精选帖子
                  </Tag>
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      </Content>
    </div>
  );
}
