'use client';

import { useEffect, useState } from 'react';
import { Card, Spin, Tabs, List, Avatar, Tag, Space, Typography, Row, Col, Statistic, App } from 'antd';
import { TrophyOutlined, FireOutlined, UserOutlined, FileTextOutlined, PlayCircleOutlined, GithubOutlined, EyeOutlined, StarOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { rankingApi } from '@/lib/api/ranking';
import { getLevelByPoints } from '@/lib/utils/levelUtils';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './page.module.css';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function RankingPage() {
  const [loading, setLoading] = useState(false);
  const [overallRanking, setOverallRanking] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overall');
  const { message } = App.useApp();

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const data = await rankingApi.getOverallRanking({ limit: 20 });
      setOverallRanking(data);
    } catch (error: any) {
      message.error(error.message || '加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyOutlined style={{ color: '#ffd700', fontSize: 20 }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 20 }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 20 }} />;
    return <span style={{ color: '#999', fontWeight: 500 }}>#{rank}</span>;
  };

  const renderHotPosts = () => (
    <List
      loading={loading}
      dataSource={overallRanking?.hotPosts || []}
      renderItem={(post: any, index: number) => (
        <List.Item
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <List.Item.Meta
            avatar={
              <div style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                {getRankIcon(index + 1)}
              </div>
            }
            title={
              <Link
                href={`/community/${post.id}`}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {post.title}
              </Link>
            }
            description={
              <div>
                <Space size="middle" style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  <Space>
                    <Avatar size={20} src={post.user?.avatarUrl} icon={<UserOutlined />} />
                    <span>{post.user?.username}</span>
                  </Space>
                  <span>{dayjs(post.createdAt).fromNow()}</span>
                </Space>
                <Space size="large" style={{ fontSize: 13 }}>
                  <Space>
                    <LikeOutlined style={{ color: '#ff4d4f' }} />
                    <span>{post.likeCount}</span>
                  </Space>
                  <Space>
                    <MessageOutlined style={{ color: '#1890ff' }} />
                    <span>{post.commentCount}</span>
                  </Space>
                  <Space>
                    <EyeOutlined style={{ color: '#52c41a' }} />
                    <span>{post.viewCount}</span>
                  </Space>
                </Space>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderActiveUsers = () => (
    <List
      loading={loading}
      dataSource={overallRanking?.activeUsers || []}
      renderItem={(user: any, index: number) => (
        <List.Item
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <List.Item.Meta
            avatar={
              <div style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                {getRankIcon(index + 1)}
              </div>
            }
            title={
              <Link
                href={`/user/${user.id}`}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {user.username}
                {user.isVip && <Tag color="purple" style={{ marginLeft: 8 }}>VIP</Tag>}
              </Link>
            }
            description={
              <div>
                {user.bio && (
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    {user.bio}
                  </div>
                )}
                <Space size="large" style={{ fontSize: 13 }}>
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <span>LV{getLevelByPoints(user.points || 0).level}</span>
                  </Space>
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>{user.points}积分</span>
                  </Space>
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span>{user.postCount}帖子</span>
                  </Space>
                  <Space>
                    <MessageOutlined style={{ color: '#52c41a' }} />
                    <span>{user.commentCount}评论</span>
                  </Space>
                </Space>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderHotPapers = () => (
    <List
      loading={loading}
      dataSource={overallRanking?.hotPapers || []}
      renderItem={(paper: any, index: number) => (
        <List.Item
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <List.Item.Meta
            avatar={
              <div style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                {getRankIcon(index + 1)}
              </div>
            }
            title={
              <Link
                href={`/papers/${paper.id}`}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {paper.title}
              </Link>
            }
            description={
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  {paper.authors}
                </div>
                <Space size="large" style={{ fontSize: 13 }}>
                  <Space>
                    <EyeOutlined style={{ color: '#52c41a' }} />
                    <span>{paper.viewCount}</span>
                  </Space>
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>{paper.favoriteCount}</span>
                  </Space>
                  <span>{dayjs(paper.publishedDate).format('YYYY-MM-DD')}</span>
                </Space>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderHotVideos = () => (
    <List
      loading={loading}
      dataSource={overallRanking?.hotVideos || []}
      renderItem={(video: any, index: number) => (
        <List.Item
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <List.Item.Meta
            avatar={
              <div style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                {getRankIcon(index + 1)}
              </div>
            }
            title={
              <Link
                href={`/videos/${video.id}`}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {video.title}
              </Link>
            }
            description={
              <div>
                <Space size="middle" style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  <Space>
                    <PlayCircleOutlined />
                    <span>{video.uploader}</span>
                  </Space>
                  <Tag color="blue">{video.platform}</Tag>
                </Space>
                <Space size="large" style={{ fontSize: 13 }}>
                  <Space>
                    <EyeOutlined style={{ color: '#52c41a' }} />
                    <span>{video.viewCount}</span>
                  </Space>
                  <Space>
                    <LikeOutlined style={{ color: '#ff4d4f' }} />
                    <span>{video.likeCount}</span>
                  </Space>
                  <span>{dayjs(video.publishedDate).fromNow()}</span>
                </Space>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderHotRepos = () => (
    <List
      loading={loading}
      dataSource={overallRanking?.hotRepos || []}
      renderItem={(repo: any, index: number) => (
        <List.Item
          style={{
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <List.Item.Meta
            avatar={
              <div style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                {getRankIcon(index + 1)}
              </div>
            }
            title={
              <Link
                href={`/repos/${repo.id}`}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {repo.fullName}
              </Link>
            }
            description={
              <div>
                {repo.description && (
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    {repo.description}
                  </div>
                )}
                <Space size="middle" style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  {repo.language && <Tag color="blue">{repo.language}</Tag>}
                  {repo.topics && repo.topics.slice(0, 3).map((topic: string, i: number) => (
                    <Tag key={i} color="green">{topic}</Tag>
                  ))}
                </Space>
                <Space size="large" style={{ fontSize: 13 }}>
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>{repo.starsCount}</span>
                  </Space>
                  <Space>
                    <GithubOutlined style={{ color: '#722ed1' }} />
                    <span>{repo.forksCount}</span>
                  </Space>
                  <span>{dayjs(repo.updatedAt).fromNow()}</span>
                </Space>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const tabItems = [
    {
      key: 'overall',
      label: (
        <span>
          <TrophyOutlined />
          综合榜
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={12}>
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  <span>热门帖子</span>
                </Space>
              }
              extra={<Link href="/ranking?tab=posts">查看更多</Link>}
            >
              {renderHotPosts()}
            </Card>
          </Col>
          <Col xs={24} md={12} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <span>活跃用户</span>
                </Space>
              }
              extra={<Link href="/ranking?tab=users">查看更多</Link>}
            >
              {renderActiveUsers()}
            </Card>
          </Col>
          <Col xs={24} md={12} lg={12}>
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#52c41a' }} />
                  <span>热门论文</span>
                </Space>
              }
              extra={<Link href="/ranking?tab=papers">查看更多</Link>}
            >
              {renderHotPapers()}
            </Card>
          </Col>
          <Col xs={24} md={12} lg={12}>
            <Card
              title={
                <Space>
                  <PlayCircleOutlined style={{ color: '#00a1d6' }} />
                  <span>热门视频</span>
                </Space>
              }
              extra={<Link href="/ranking?tab=videos">查看更多</Link>}
            >
              {renderHotVideos()}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'posts',
      label: (
        <span>
          <FireOutlined />
          热门帖子
        </span>
      ),
      children: renderHotPosts(),
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined />
          活跃用户
        </span>
      ),
      children: renderActiveUsers(),
    },
    {
      key: 'papers',
      label: (
        <span>
          <FileTextOutlined />
          热门论文
        </span>
      ),
      children: renderHotPapers(),
    },
    {
      key: 'videos',
      label: (
        <span>
          <PlayCircleOutlined />
          热门视频
        </span>
      ),
      children: renderHotVideos(),
    },
    {
      key: 'repos',
      label: (
        <span>
          <GithubOutlined />
          热门仓库
        </span>
      ),
      children: renderHotRepos(),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card
          className={styles.rankingCard}
          style={{
            marginBottom: 24,
          }}
        >
          <Title level={2} style={{ textAlign: 'center', margin: 0 }}>
            <TrophyOutlined style={{ color: '#faad14', marginRight: 12 }} />
            排行榜
          </Title>
        </Card>

        <Card
          className={styles.rankingCard}
          tabList={tabItems}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
        >
          {tabItems.find(item => item.key === activeTab)?.children}
        </Card>
      </div>
    </div>
  );
}
