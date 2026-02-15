'use client';

import { useState, useEffect } from 'react';
import { Layout, Card, Space, Button, Spin, Input, Row, Col, Empty, Typography, Avatar, Tag, Divider, App, Progress, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, FireOutlined, ClockCircleOutlined, SendOutlined, TrophyOutlined, RiseOutlined, UserOutlined, QuestionCircleOutlined, StarOutlined, CrownOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { Post } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import ShareModal from '@/components/ShareModal';
import QuickPostModal from '@/components/QuickPostModal';
import PostCard from '@/components/PostCard';
import { LEVEL_CONFIG, POINTS_CONFIG, getLevelBadge } from '@/lib/utils/levelUtils';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📋', description: '所有内容' },
  { id: 'tech', name: '技术讨论', icon: '💻', description: '论文解读、技术探讨、问题求助' },
  { id: 'resource', name: '资源分享', icon: '📦', description: '项目、模型、工具、教程' },
  { id: 'jobs', name: '求职招聘', icon: '💼', description: '招聘信息、求职需求' },
  { id: 'activity', name: '活动交流', icon: '🎯', description: '会议、比赛、线下活动' },
];

export default function CommunityPage() {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<'hot' | 'latest'>('latest');
  const [showPostModal, setShowPostModal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hotTopics, setHotTopics] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  useEffect(() => {
    loadPosts(1);
    loadHotTopics();
    loadActiveUsers();
  }, [sort, selectedCategory]);

  const loadPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await communityApi.getPosts({
        page: pageNum,
        size: 20,
        sort,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        if (pageNum === 1) {
          setPosts([]);
        }
        setHasMore(false);
        return;
      }

      if (pageNum === 1) {
        setPosts(data.items);
      } else {
        setPosts(prev => [...prev, ...data.items]);
      }

      setPage(pageNum);
      setHasMore(data.pagination?.hasNext || false);
    } catch (error: any) {
      console.error('Load posts error:', error);
      if (pageNum === 1) {
        setPosts([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadHotTopics = async () => {
    try {
      const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/community/hot-topics`).then(res => res.json());
      if (data.code === 0 && data.data) {
        setHotTopics(data.data.topics || []);
      }
    } catch (error) {
      console.error('加载热门话题失败:', error);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/community/active-users`).then(res => res.json());
      if (data.code === 0 && data.data) {
        setActiveUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('加载活跃用户失败:', error);
    }
  };

  const handleSearch = () => {
    loadPosts(1);
  };

  const handleCreatePost = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setShowPostModal(true);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    try {
      await communityApi.likePost(postId);
      message.success('点赞成功!+1积分');
      loadPosts(1);
    } catch (error: any) {
      message.error(error.message || '点赞失败');
    }
  };

  const handleShare = (post: Post) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setShareTitle(post.title || '市集讨论');
    setShareUrl(`${baseUrl}/community/${post.id}`);
    setShareOpen(true);
  };

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleEdit = (postId: string) => {
    loadPosts(1);
  };

  return (
    <div style={{ background: '#fafafa', minHeight: 'calc(100vh - 64px)', padding: '0' }}>
      <Content style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, marginBottom: 8, color: '#1a1a1a', fontWeight: 600 }}>
            具身市集
          </Title>
          <Paragraph style={{ color: '#666', margin: 0, fontSize: 15 }}>
            分享知识，交流想法，共同成长
          </Paragraph>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                marginBottom: 16,
                background: '#fff',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} size="middle">
                <Input.Search
                  placeholder="搜索帖子、话题、用户..."
                  style={{ width: 320 }}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                  size="large"
                />
                <Space size={8}>
                  <Button
                    type={sort === 'hot' ? 'primary' : 'default'}
                    icon={<FireOutlined />}
                    onClick={() => setSort('hot')}
                    size="large"
                  >
                    热门
                  </Button>
                  <Button
                    type={sort === 'latest' ? 'primary' : 'default'}
                    icon={<ClockCircleOutlined />}
                    onClick={() => setSort('latest')}
                    size="large"
                  >
                    最新
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreatePost}
                    size="large"
                  >
                    发布内容
                  </Button>
                </Space>
              </Space>
            </Card>

            <div style={{ marginBottom: 16 }}>
              <Space size={8} wrap>
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    type={selectedCategory === category.id ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      borderRadius: 20,
                      height: 36,
                      padding: '0 20px',
                      fontSize: 14,
                    }}
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </Space>
            </div>

            <Spin spinning={loading && posts.length === 0}>
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </Space>

              {posts.length === 0 && !loading && (
                <Card style={{ textAlign: 'center', padding: '80px 20px', borderRadius: 8 }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Text style={{ color: '#999', fontSize: 15, display: 'block', marginBottom: 16 }}>
                          暂无帖子，成为第一个发帖的人吧！
                        </Text>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePost}>
                          立即发帖
                        </Button>
                      </div>
                    }
                  />
                </Card>
              )}

              {hasMore && posts.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Button
                    size="large"
                    onClick={() => loadPosts(page + 1)}
                    loading={loading}
                    style={{ borderRadius: 20, padding: '0 40px', height: 40 }}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </Spin>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Card
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: '16px 20px' } }}
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>热门话题</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {hotTopics.slice(0, 5).map((topic, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={index < 3 ? 'red' : 'default'} style={{ margin: 0 }}>
                        {index + 1}
                      </Tag>
                      <Text style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topic}
                      </Text>
                    </div>
                  ))}
                  {hotTopics.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      暂无热门话题
                    </Text>
                  )}
                </Space>
              </Card>

              <Card
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: '16px 20px' } }}
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <Text strong>活跃用户</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {activeUsers.slice(0, 5).map((activeUser, index) => {
                    const badge = getLevelBadge(activeUser.level || 1);
                    return (
                    <div key={activeUser.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar size={32} src={activeUser.avatar} icon={<UserOutlined />} style={{ border: `2px solid ${badge.color}` }} />
                        <span style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', fontSize: 10 }}>{badge.icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ display: 'block', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activeUser.username}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {badge.icon} LV{activeUser.level} · {activeUser.points}积分
                        </Text>
                      </div>
                      {index < 3 && (
                        <Tag color="gold" style={{ margin: 0 }}>
                          TOP{index + 1}
                        </Tag>
                      )}
                    </div>
                    );
                  })}
                  {activeUsers.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      暂无活跃用户
                    </Text>
                  )}
                </Space>
              </Card>

              <Card
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: '16px 20px' } }}
                title={
                  <Space>
                    <CrownOutlined style={{ color: '#ffd700' }} />
                    <Text strong>等级体系</Text>
                    <Tooltip title="通过发帖、评论、点赞等行为获取积分，提升等级">
                      <QuestionCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                    </Tooltip>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {LEVEL_CONFIG.slice(0, 6).map((level) => (
                    <div key={level.level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{level.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: 500 }}>
                            LV{level.level} {level.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {level.maxPoints === Infinity ? `${level.minPoints}+` : `${level.minPoints}-${level.maxPoints}`}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>

              <Card
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: '16px 20px' } }}
                title={
                  <Space>
                    <StarOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>积分规则</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>发布帖子</span>
                    <Tag color="green">+{POINTS_CONFIG.post}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>发表评论</span>
                    <Tag color="green">+{POINTS_CONFIG.comment}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>收到点赞</span>
                    <Tag color="green">+{POINTS_CONFIG.liked}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>收到收藏</span>
                    <Tag color="green">+{POINTS_CONFIG.favorited}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>每日签到</span>
                    <Tag color="blue">+{POINTS_CONFIG.dailyLogin}</Tag>
                  </div>
                </Space>
              </Card>

              <Card
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                styles={{ body: { padding: '16px 20px' } }}
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#52c41a' }} />
                    <Text strong>分类说明</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {CATEGORIES.filter(c => c.id !== 'all').map((category) => (
                    <div key={category.id}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>
                        {category.icon} {category.name}
                      </Text>
                      <Paragraph style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>
                        {category.description}
                      </Paragraph>
                    </div>
                  ))}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Content>

      <ShareModal
        open={shareOpen}
        title={shareTitle}
        url={shareUrl}
        onClose={() => setShareOpen(false)}
      />

      <QuickPostModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={() => loadPosts(1)}
      />
    </div>
  );
}
