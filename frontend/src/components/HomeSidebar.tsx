/**
 * 首页侧边栏组件
 */

'use client';

import { Card, Space, Tag, Avatar, Progress, Divider } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  TagsOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import ForumFeed from './ForumFeed';

interface HomeSidebarProps {
  className?: string;
}

export default function HomeSidebar({ className }: HomeSidebarProps) {
  const { user } = useAuthStore();

  // 模拟数据 - 后期从API获取
  const hotTopics = [
    { id: '1', title: '具身智能新突破', count: 1234, trend: 'up' },
    { id: '2', title: 'GPT-5即将发布', count: 980, trend: 'up' },
    { id: '3', title: '开源大模型', count: 756, trend: 'up' },
    { id: '4', title: 'Transformer优化', count: 645, trend: 'up' },
    { id: '5', title: '机器人视觉', count: 523, trend: 'up' },
  ];

  const hotTags = [
    { name: '机器人', count: 2345, color: 'blue' },
    { name: '深度学习', count: 1876, color: 'purple' },
    { name: '计算机视觉', count: 1654, color: 'cyan' },
    { name: '自然语言处理', count: 1432, color: 'green' },
    { name: 'RL强化学习', count: 1098, color: 'orange' },
    { name: '多模态', count: 987, color: 'red' },
  ];

  const trendingItems = [
    { id: '1', title: 'RT-2: Vision-Language-Action Models', type: 'paper', change: 120 },
    { id: '2', title: 'Stable Diffusion XL 1.0', type: 'model', change: 85 },
    { id: '3', title: '李沐讲深度学习', type: 'video', change: 60 },
  ];

  return (
    <div className={className} style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 用户信息卡片 */}
        {user ? (
          <Card
            size="small"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ textAlign: 'center' }}>
              <Avatar size={64} style={{ backgroundColor: '#1890ff', fontSize: 24 }}>
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>
                {user.username}
              </div>
              <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 13 }}>
                Level {user.level || 1} {'⭐'.repeat(Math.min(user.level || 1, 5))}
              </div>
              <Progress
                percent={(user.points || 0) % 100}
                size="small"
                showInfo={false}
                strokeColor="#52c41a"
                style={{ marginTop: 8 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                {user.points || 0} 积分 · 距离下一级还需 {100 - ((user.points || 0) % 100)} 积分
              </div>
              <div style={{ marginTop: 12 }}>
                <Tag icon={<CheckCircleOutlined />} color="success">
                  今日已签到
                </Tag>
              </div>
            </div>
          </Card>
        ) : (
          <Card
            size="small"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}
          >
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: 15, marginBottom: 16 }}>登录解锁更多功能</div>
              <Link href="/login">
                <button style={{
                  padding: '8px 24px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  立即登录
                </button>
              </Link>
            </div>
          </Card>
        )}

        {/* 今日热门话题 */}
        <Card
          title={
            <Space>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>今日热门话题</span>
            </Space>
          }
          size="small"
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {hotTopics.map((topic, index) => (
              <div
                key={topic.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f7fa';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 20,
                      height: 20,
                      lineHeight: '20px',
                      textAlign: 'center',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      marginRight: 8,
                      background: index < 3 ? '#ff4d4f' : '#8c8c8c',
                      color: '#fff',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{topic.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                  <RiseOutlined style={{ color: '#ff4d4f', fontSize: 12, marginRight: 4 }} />
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>{topic.count}</span>
                </div>
              </div>
            ))}
          </Space>
        </Card>

        {/* 热门标签 */}
        <Card
          title={
            <Space>
              <TagsOutlined style={{ color: '#1890ff' }} />
              <span>热门标签</span>
            </Space>
          }
          size="small"
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {hotTags.map((tag) => (
              <Tag
                key={tag.name}
                color={tag.color}
                style={{
                  fontSize: 12,
                  padding: '4px 12px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {tag.name} {tag.count}
              </Tag>
            ))}
          </div>
        </Card>

        {/* 本周趋势 */}
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: '#faad14' }} />
              <span>本周趋势</span>
            </Space>
          }
          size="small"
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {trendingItems.map((item, index) => (
              <div key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {index + 1}. {item.title}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag
                    style={{ fontSize: 11 }}
                    color={
                      item.type === 'paper'
                        ? 'blue'
                        : item.type === 'model'
                          ? 'purple'
                          : 'red'
                    }
                  >
                    {item.type === 'paper' ? '📄 论文' : item.type === 'model' ? '🤖 模型' : '🎬 视频'}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>
                    <RiseOutlined /> {item.change}%
                  </span>
                </div>
                {index < trendingItems.length - 1 && <Divider style={{ margin: '12px 0' }} />}
              </div>
            ))}
          </Space>
        </Card>

        {/* 论坛实时动态 */}
        <ForumFeed limit={5} />

        {/* 推荐关注 */}
        <Card
          title="💡 推荐关注"
          size="small"
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <div style={{ fontSize: 13, color: '#8c8c8c', textAlign: 'center', padding: '12px 0' }}>
            基于你的浏览历史推荐
          </div>
        </Card>
      </Space>
    </div>
  );
}
