/**
 * 论坛实时动态组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, Avatar, Space, Tag, Typography } from 'antd';
import { CommentOutlined, LikeOutlined, EyeOutlined, FireOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { Post } from '@/lib/api/types';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

interface ForumFeedProps {
  limit?: number;
}

export default function ForumFeed({ limit = 5 }: ForumFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await communityApi.getPosts({
        page: 1,
        size: limit,
        sort: 'hot',
      });
      setPosts(data.items);
    } catch (error) {
      console.error('Load forum posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <span>市集动态</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <div style={{ padding: '20px 0' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0f0f0' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: '#f0f0f0', borderRadius: 4, marginBottom: 8, width: '60%' }} />
                  <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, width: '80%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <span>市集动态</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c', fontSize: 13 }}>
          暂无动态，快去市集发帖吧！
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <span>市集动态</span>
        </Space>
      }
      style={{ borderRadius: 12 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {posts.map((post) => (
          <Link key={post.id} href={`/community/${post.id}`}>
            <div
              style={{
                padding: '12px',
                borderRadius: 8,
                background: '#fafafa',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fafafa';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <Space align="start" style={{ width: '100%' }}>
                <Avatar
                  src={post.user?.avatarUrl}
                  size={32}
                  style={{ flexShrink: 0 }}
                >
                  {post.user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space size={4} style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {post.user?.username || '匿名'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(post.createdAt).fromNow()}
                    </Text>
                  </Space>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#262626',
                      lineHeight: 1.5,
                    }}
                  >
                    {post.title || post.content}
                  </Paragraph>
                  <Space size={12} style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                    {post.viewCount && post.viewCount > 0 && (
                      <span>
                        <EyeOutlined /> {post.viewCount}
                      </span>
                    )}
                    {post.likeCount && post.likeCount > 0 && (
                      <span>
                        <LikeOutlined /> {post.likeCount}
                      </span>
                    )}
                    {post.commentCount && post.commentCount > 0 && (
                      <span>
                        <CommentOutlined /> {post.commentCount}
                      </span>
                    )}
                  </Space>
                </div>
              </Space>
            </div>
          </Link>
        ))}
      </Space>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <Link href="/community">
          <Text type="secondary" style={{ fontSize: 12 }}>
            查看更多 →
          </Text>
        </Link>
      </div>
    </Card>
  );
}
