'use client';

import { Card, Space, Tag, Typography, Button, Avatar, Badge } from 'antd';
import { FireOutlined, TrophyOutlined, UserOutlined, RiseOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getLevelByPoints } from '@/lib/utils/levelUtils';

const { Text } = Typography;

interface TopicSidebarProps {
  selectedTopic?: string;
  onTopicChange: (topic: string | undefined) => void;
  postCounts?: Record<string, number>;
}

interface ActiveUser {
  id: string;
  username: string;
  avatarUrl?: string;
  level: number;
  points: number;
  postCount: number;
  commentCount: number;
  activityScore: number;
}

const TOPIC_CATEGORIES = [
  { id: 'all', name: '全部', icon: null, color: '#1890ff' },
  { id: 'discussion', name: '技术讨论', icon: null, color: '#52c41a', description: '论文解读、技术探讨、问题求助' },
  { id: 'resource', name: '资源分享', icon: null, color: '#faad14', description: '项目、模型、工具、教程' },
  { id: 'job', name: '求职招聘', icon: null, color: '#722ed1', description: '招聘信息、求职需求' },
  { id: 'event', name: '活动交流', icon: null, color: '#eb2f96', description: '会议、比赛、线下活动' },
];

export default function TopicSidebar({ selectedTopic, onTopicChange, postCounts = {} }: TopicSidebarProps) {
  const [hotTopics, setHotTopics] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotTopics();
    loadActiveUsers();
  }, []);

  const loadHotTopics = async () => {
    try {
      const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/community/hot-topics`).then(res => res.json());
      if (data.code === 0 && data.data) {
        setHotTopics(data.data.topics || []);
      }
    } catch (error) {
      console.error('加载热门话题失败:', error);
    } finally {
      setLoading(false);
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

  const totalCount = Object.values(postCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>内容分类</span>
          </Space>
        }
        size="small"
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          {TOPIC_CATEGORIES.map((topic) => {
            const count = topic.id === 'all' ? totalCount : (postCounts[topic.id] || 0);
            const isSelected = selectedTopic === topic.id;
            return (
              <div
                key={topic.id}
                onClick={() => onTopicChange(topic.id === 'all' ? undefined : topic.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? `${topic.color}15` : 'transparent',
                  border: isSelected ? `1px solid ${topic.color}30` : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: topic.description ? 4 : 0 }}>
                  <span style={{ 
                    fontSize: 14, 
                    color: isSelected ? topic.color : '#262626', 
                    fontWeight: isSelected ? 600 : 500 
                  }}>
                    {topic.name}
                  </span>
                  {count > 0 && (
                    <Badge 
                      count={count} 
                      style={{ 
                        backgroundColor: isSelected ? topic.color : '#f0f0f0',
                        color: isSelected ? '#fff' : '#999',
                        fontSize: 11,
                        padding: '0 6px',
                        height: 18,
                        lineHeight: '18px',
                        borderRadius: 9
                      }} 
                    />
                  )}
                </div>
                {topic.description && (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                    {topic.description}
                  </Text>
                )}
              </div>
            );
          })}
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <RiseOutlined style={{ color: '#faad14' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>热门话题</span>
          </Space>
        }
        size="small"
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
            加载中...
          </div>
        ) : hotTopics.length > 0 ? (
          <Space wrap size={6}>
            {hotTopics.map((topic, index) => (
              <Tag 
                key={topic} 
                color={['blue', 'green', 'orange', 'purple', 'cyan'][index % 5]} 
                style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, cursor: 'pointer', marginBottom: 4 }}
                onClick={() => onTopicChange(topic)}
              >
                {topic}
              </Tag>
            ))}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 12 }}>
            暂无热门话题
          </div>
        )}
      </Card>

      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>活跃用户</span>
          </Space>
        }
        size="small"
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {activeUsers.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {activeUsers.slice(0, 5).map((user, index) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: index < 3 ? '#faad14' : '#d9d9d9',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </div>
                <Avatar 
                  size={32} 
                  src={user.avatarUrl}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#262626', marginBottom: 2 }}>
                    {user.username}
                  </div>
                  <Space size={4}>
                    <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                      LV{getLevelByPoints(user.points || 0).level}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {user.postCount}帖
                    </Text>
                  </Space>
                </div>
              </div>
            ))}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 12 }}>
            暂无活跃用户
          </div>
        )}
      </Card>

      <Card
        style={{ 
          borderRadius: 12, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            🎯 成为优质创作者
          </div>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 12 }}>
            分享知识，获得认可，提升影响力
          </Text>
          <Button 
            type="primary" 
            size="small" 
            style={{ 
              background: '#fff', 
              color: '#667eea',
              border: 'none',
              borderRadius: 6
            }}
            onClick={() => window.location.href = '/community'}
          >
            立即发帖
          </Button>
        </div>
      </Card>
    </Space>
  );
}
