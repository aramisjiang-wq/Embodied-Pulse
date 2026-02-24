'use client';

import { useState, useEffect } from 'react';
import { Card, Space, Button, Spin, Input, Row, Col, Empty, Typography, Avatar, Tag, Divider, App, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, FireOutlined, ClockCircleOutlined, TrophyOutlined, RiseOutlined, UserOutlined, QuestionCircleOutlined, StarOutlined, CrownOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { Post } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { DynamicComponents } from '@/lib/dynamicComponents';
import QuickPostModal from '@/components/QuickPostModal';
import PostCard from '@/components/PostCard';
import { LEVEL_CONFIG, POINTS_CONFIG, getLevelBadge } from '@/lib/utils/levelUtils';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const { Text, Paragraph } = Typography;

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
        console.error('[Community] Invalid data structure:', data, 'type of data:', typeof data, 'data?.items:', data?.items);
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
      console.error('[Community] Load posts error:', error?.message || error, error?.response?.data ?? error);
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
    <PageContainer loading={loading && posts.length === 0}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FireOutlined style={{ fontSize: 20, color: '#262626' }} />
            </div>
            <div>
              <h2 className={styles.pageTitle}>具身市集</h2>
              <Paragraph className={styles.pageDescription}>
                分享知识 · 交流想法 · 共同成长
              </Paragraph>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreatePost}
            size="large"
            style={{ 
              borderRadius: 12, 
              height: 44, 
              background: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)', 
              color: '#fff', 
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            发布内容
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              variant="borderless"
              className={styles.filterCard}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <Space className={styles.filterSection} size="middle">
                <Input.Search
                  placeholder="搜索帖子、话题、用户..."
                  className={styles.searchInput}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<SearchOutlined />}
                  size="large"
                />
                <Space size={8}>
                  <Button
                    type="default"
                    icon={<FireOutlined />}
                    onClick={() => setSort('hot')}
                    size="large"
                    style={{
                      borderRadius: '10px',
                      fontWeight: 500,
                      ...(sort === 'hot' ? {
                        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
                      } : {
                        borderColor: '#e5e7eb',
                        color: '#6b7280'
                      })
                    }}
                  >
                    热门
                  </Button>
                  <Button
                    type="default"
                    icon={<ClockCircleOutlined />}
                    onClick={() => setSort('latest')}
                    size="large"
                    style={{
                      borderRadius: '10px',
                      fontWeight: 500,
                      ...(sort === 'latest' ? {
                        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
                      } : {
                        borderColor: '#e5e7eb',
                        color: '#6b7280'
                      })
                    }}
                  >
                    最新
                  </Button>
                </Space>
              </Space>
            </Card>

            <div className={styles.categoryButtons}>
              <Space size={8} wrap>
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    type={selectedCategory === category.id ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(category.id)}
                    className={styles.categoryButton}
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </Space>
            </div>

            <Spin spinning={loading && posts.length === 0}>
              <Space direction="vertical" className={styles.postsList} size={16}>
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
                <Card className={styles.emptyCard}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Text className={styles.emptyText}>
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
                    className={styles.loadMoreButton}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </Spin>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" className={styles.sidebar} size={16}>
              <Card
                variant="borderless"
                className={styles.sidebarCard}
                styles={{ body: { padding: '10px 14px' } }}
                title={
                  <Space>
                    <FireOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>热门话题</Text>
                    <Tooltip title="根据最近7天内帖子的标签使用频率自动生成">
                      <QuestionCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                    </Tooltip>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  {hotTopics.slice(0, 5).map((topic, index) => (
                    <div key={index} className={styles.hotTopicItem}>
                      <Tag color={index < 3 ? 'red' : 'default'} className={styles.hotTopicRank}>
                        {index + 1}
                      </Tag>
                      <Text className={styles.hotTopicText}>
                        {topic}
                      </Text>
                    </div>
                  ))}
                  {hotTopics.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 13, padding: '10px 0', display: 'block' }}>
                      暂无热门话题
                    </Text>
                  )}
                </Space>
              </Card>

              <Card
                variant="borderless"
                className={styles.sidebarCard}
                styles={{ body: { padding: '10px 14px' } }}
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <Text strong>活跃用户</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  {activeUsers.slice(0, 5).map((activeUser, index) => {
                    return (
                    <div key={activeUser.id} className={styles.activeUserItem}>
                      <Avatar 
                        size={28} 
                        src={activeUser.avatar || activeUser.avatarUrl} 
                        icon={<UserOutlined />} 
                        style={{ 
                          border: '1.5px solid #e5e7eb',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }} 
                      />
                      <div className={styles.activeUserInfo}>
                        <Text className={styles.activeUserName}>
                          {activeUser.username}
                        </Text>
                      </div>
                      {index < 3 && (
                        <Tag color="gold" style={{ margin: 0, borderRadius: '6px', fontWeight: 500 }}>
                          TOP{index + 1}
                        </Tag>
                      )}
                    </div>
                    );
                  })}
                  {activeUsers.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 13, padding: '10px 0', display: 'block' }}>
                      暂无活跃用户
                    </Text>
                  )}
                </Space>
              </Card>

              <Card
                variant="borderless"
                className={styles.sidebarCard}
                styles={{ body: { padding: '10px 14px' } }}
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
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  {LEVEL_CONFIG.slice(0, 6).map((level) => (
                    <div key={level.level} className={styles.levelItem}>
                      <span className={styles.levelIcon}>{level.icon}</span>
                      <div className={styles.levelInfo}>
                        <div className={styles.levelHeader}>
                          <Text className={styles.levelName}>
                            LV{level.level} {level.name}
                          </Text>
                          <Text type="secondary" className={styles.levelRange}>
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
                className={styles.sidebarCard}
                styles={{ body: { padding: '10px 14px' } }}
                title={
                  <Space>
                    <StarOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>积分规则</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <div className={styles.pointsItem}>
                    <span>发布帖子</span>
                    <Tag color="green">+{POINTS_CONFIG.post}</Tag>
                  </div>
                  <div className={styles.pointsItem}>
                    <span>发表评论</span>
                    <Tag color="green">+{POINTS_CONFIG.comment}</Tag>
                  </div>
                  <div className={styles.pointsItem}>
                    <span>收到点赞</span>
                    <Tag color="green">+{POINTS_CONFIG.liked}</Tag>
                  </div>
                  <div className={styles.pointsItem}>
                    <span>收到收藏</span>
                    <Tag color="green">+{POINTS_CONFIG.favorited}</Tag>
                  </div>
                  <div className={styles.pointsItem}>
                    <span>每日签到</span>
                    <Tag color="blue">+{POINTS_CONFIG.dailyLogin}</Tag>
                  </div>
                </Space>
              </Card>

              <Card
                variant="borderless"
                className={styles.sidebarCard}
                styles={{ body: { padding: '10px 14px' } }}
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#52c41a' }} />
                    <Text strong>分类说明</Text>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  {CATEGORIES.filter(c => c.id !== 'all').map((category) => (
                    <div key={category.id} className={styles.categoryInfoItem}>
                      <Text className={styles.categoryInfoName}>
                        {category.icon} {category.name}
                      </Text>
                      <Text type="secondary" className={styles.categoryInfoDesc}>
                        {category.description}
                      </Text>
                    </div>
                  ))}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>

      <DynamicComponents.ShareModal
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
    </PageContainer>
  );
}
