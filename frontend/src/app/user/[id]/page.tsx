'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Spin, Empty, Avatar, Space, Tag, Tabs, Button, List, Typography, Divider, Descriptions, Row, Col, App } from 'antd';
import { UserOutlined, FileTextOutlined, CommentOutlined, StarOutlined, TrophyOutlined, FireOutlined, GithubOutlined, LinkOutlined, TwitterOutlined, GlobalOutlined, EnvironmentOutlined, TagOutlined, HeartOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { communityApi as api } from '@/lib/api/community';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import JsonLd from '@/components/JsonLd';
import { generatePersonJsonLd, generateBreadcrumbListJsonLd } from '@/lib/metadata';
import { getLevelByPoints } from '@/lib/utils/levelUtils';
import styles from './page.module.css';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

export default function UserPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const { message } = App.useApp();

  const loadUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getUser(id);
      if (data) {
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Load user error:', error);
      setUser(null);
      const errorMessage = error?.message || error?.response?.data?.message || '加载用户信息失败';
      if (error?.status !== 404) {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [id, message]);

  const loadUserPosts = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getUserPosts(id);
      
      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setPosts([]);
        return;
      }
      
      setPosts(data.items);
    } catch (error: any) {
      console.error('Load user posts error:', error);
      setPosts([]);
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      loadUser();
      loadUserPosts();
    }
  }, [id, loadUser, loadUserPosts]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="用户不存在" />
      </div>
    );
  }

  const skillsList = user.skills ? user.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
  const interestsList = user.interests ? user.interests.split(',').map((i: string) => i.trim()).filter((i: string) => i) : [];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://embodiedpulse.com';
  const userUrl = `${baseUrl}/user/${user.id}`;
  const personJsonLd = JSON.parse(generatePersonJsonLd({
    name: user.username,
    description: user.bio || undefined,
    url: userUrl,
    image: user.avatarUrl || undefined
  }));

  const breadcrumbJsonLd = JSON.parse(generateBreadcrumbListJsonLd([
    { name: '首页', url: baseUrl },
    { name: user.username, url: userUrl }
  ]));

  return (
    <>
      <JsonLd data={personJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className={styles.pageWrapper}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card className={styles.userCard}>
          <div className={styles.userInfo}>
            <Avatar
              src={user.avatarUrl}
              size={120}
              icon={<UserOutlined />}
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 12 }}>
                <Title level={2} className={styles.userName}>
                  {user.username}
                </Title>
                <Space size="middle">
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                    LV{getLevelByPoints(user.points || 0).level}
                  </Tag>
                  <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
                    <TrophyOutlined /> {user.points}积分
                  </Tag>
                </Space>
              </div>

              {user.bio && (
                <Paragraph className={styles.userBio}>
                  {user.bio}
                </Paragraph>
              )}

              <Space size="large" className={styles.userStats}>
                <Space>
                  <FileTextOutlined />
                  <span>{user.postCount || 0} 帖子</span>
                </Space>
                <Space>
                  <StarOutlined />
                  <span>{user.favoriteCount || 0} 收藏</span>
                </Space>
                <Space>
                  <CommentOutlined />
                  <span>{user.commentCount || 0} 评论</span>
                </Space>
                <Space>
                  <HeartOutlined />
                  <span>{user.likeCount || 0} 获赞</span>
                </Space>
              </Space>

              <div style={{ marginTop: 16, fontSize: 13, color: '#999' }}>
                注册时间：{dayjs(user.createdAt).format('YYYY-MM-DD')}
              </div>
            </div>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <Row gutter={[16, 16]}>
            {user.location && (
              <Col span={12}>
                <Space>
                  <EnvironmentOutlined style={{ color: '#999' }} />
                  <Text style={{ color: '#666' }}>{user.location}</Text>
                </Space>
              </Col>
            )}
            {user.githubUrl && (
              <Col span={12}>
                <Space>
                  <GithubOutlined style={{ color: '#333' }} />
                  <Link href={user.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    GitHub
                  </Link>
                </Space>
              </Col>
            )}
            {user.linkedinUrl && (
              <Col span={12}>
                <Space>
                  <LinkOutlined style={{ color: '#0077b5' }} />
                  <Link href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    LinkedIn
                  </Link>
                </Space>
              </Col>
            )}
            {user.twitterUrl && (
              <Col span={12}>
                <Space>
                  <TwitterOutlined style={{ color: '#1DA1F2' }} />
                  <Link href={user.twitterUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    Twitter
                  </Link>
                </Space>
              </Col>
            )}
            {user.websiteUrl && (
              <Col span={12}>
                <Space>
                  <GlobalOutlined style={{ color: '#999' }} />
                  <Link href={user.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    个人网站
                  </Link>
                </Space>
              </Col>
            )}
          </Row>

          {skillsList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Space wrap>
                <TagOutlined style={{ color: '#999' }} />
                {skillsList.map((skill: string, index: number) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                    {skill}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {interestsList.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Space wrap>
                <HeartOutlined style={{ color: '#ff4d4f' }} />
                {interestsList.map((interest: string, index: number) => (
                  <Tag key={index} color="pink" style={{ marginBottom: 4 }}>
                    {interest}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </Card>

        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          tabList={[
            {
              key: 'posts',
              tab: `帖子 (${posts.length})`,
            },
          ]}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'posts' && (
            <>
              {posts.length === 0 ? (
                <Empty description="暂无帖子" />
              ) : (
                <List
                  dataSource={posts}
                  renderItem={(post: any) => (
                    <List.Item
                      style={{
                        padding: '16px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <List.Item.Meta
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
                            <div
                              style={{
                                fontSize: 14,
                                color: '#595959',
                                marginBottom: 8,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {post.content}
                            </div>
                            <Space size="middle" style={{ fontSize: 12, color: '#999' }}>
                              <span>
                                <CommentOutlined /> {post.commentCount} 评论
                              </span>
                              <span>
                                <StarOutlined /> {post.likeCount} 点赞
                              </span>
                              <span>
                                {dayjs(post.createdAt).fromNow()}
                              </span>
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
    </>
  );
}
