/**
 * 订阅模块组件
 * 展示用户订阅的内容：GitHub仓库、HuggingFace资源主、论文作者、研究方向、视频UP主等
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Badge, Empty, Button, Space, Tag, Spin } from 'antd';
import { StarOutlined, PlusOutlined, GithubOutlined, RobotOutlined, FileTextOutlined, PlayCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface SubscriptionModuleProps {
  limit?: number;
}

export default function SubscriptionModule({ limit }: SubscriptionModuleProps) {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const { user, hydrated } = useAuthStore();
  const router = useRouter();

  const loadSubscriptions = useCallback(async () => {
    if (!user || !user.id) return;
    
    setLoading(true);
    try {
      const data = await subscriptionApi.getSubscriptions({
        page: 1,
        size: 100,
      });
      setSubscriptions(Array.isArray(data.items) ? data.items : []);
    } catch (error: unknown) {
      const code = (error && typeof error === 'object' && 'code' in error) ? (error as { code?: string }).code : undefined;
      if (code !== 'UNAUTHORIZED' && code !== 'CONNECTION_REFUSED' && code !== 'TIMEOUT' && code !== 'NETWORK_ERROR') {
      }
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    if (user && user.id) {
      loadSubscriptions();
    }
  }, [hydrated, user, loadSubscriptions]);

  // 按类型分组订阅
  const groupedSubscriptions = subscriptions.reduce((acc, sub) => {
    if (!acc[sub.contentType]) {
      acc[sub.contentType] = [];
    }
    acc[sub.contentType].push(sub);
    return acc;
  }, {} as Record<string, Subscription[]>);

  // 获取订阅统计
  const getSubscriptionStats = () => {
    return {
      github: groupedSubscriptions.repo?.length || 0,
      huggingface: groupedSubscriptions.huggingface?.length || 0,
      paper: groupedSubscriptions.paper?.length || 0,
      video: groupedSubscriptions.video?.length || 0,
      job: groupedSubscriptions.job?.length || 0,
      total: subscriptions.length,
      newCount: subscriptions.reduce((sum, sub) => sum + (sub.newCount || 0), 0),
    };
  };

  const stats = getSubscriptionStats();

  // 渲染订阅内容
  const renderSubscriptionContent = (type: string) => {
    const subs = groupedSubscriptions[type] || [];
    
    if (subs.length === 0) {
      return (
        <Empty
          description={
            <div>
              <div style={{ marginBottom: 16 }}>暂无订阅</div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/subscriptions')}
              >
                去订阅
              </Button>
            </div>
          }
          style={{ padding: '40px 0' }}
        />
      );
    }

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {subs.slice(0, limit || 10).map((sub) => (
          <Card
            key={sub.id}
            size="small"
            hoverable
            style={{ borderRadius: 12 }}
            onClick={() => router.push(`/subscriptions/${sub.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Tag color={
                    sub.contentType === 'repo' ? 'blue' :
                    sub.contentType === 'huggingface' ? 'purple' :
                    sub.contentType === 'paper' ? 'cyan' :
                    sub.contentType === 'video' ? 'red' :
                    sub.contentType === 'job' ? 'green' : 'default'
                  }>
                    {sub.contentType === 'repo' ? 'GitHub' :
                     sub.contentType === 'huggingface' ? 'HuggingFace' :
                     sub.contentType === 'paper' ? '论文' :
                     sub.contentType === 'video' ? '视频' :
                     sub.contentType === 'job' ? '招聘' : sub.contentType}
                  </Tag>
                  {sub.newCount > 0 && (
                    <Badge count={sub.newCount} size="small" />
                  )}
                </div>
                
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {(() => {
                    try {
                      if (sub.authors) {
                        const authors = JSON.parse(sub.authors);
                        return `作者: ${authors.slice(0, 2).join(', ')}${authors.length > 2 ? '...' : ''}`;
                      }
                      if (sub.uploaders) {
                        const uploaders = JSON.parse(sub.uploaders);
                        return `UP主: ${uploaders.slice(0, 2).join(', ')}${uploaders.length > 2 ? '...' : ''}`;
                      }
                      if (sub.keywords) {
                        const keywords = JSON.parse(sub.keywords);
                        return `关键词: ${keywords.slice(0, 2).join(', ')}${keywords.length > 2 ? '...' : ''}`;
                      }
                      return '订阅内容';
                    } catch (e) {
                      return '订阅内容';
                    }
                  })()}
                </div>
                
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  匹配 {sub.totalMatched || 0} 条内容
                  {sub.lastSyncAt && ` · ${dayjs(sub.lastSyncAt).fromNow()}更新`}
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {subs.length > (limit || 10) && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => router.push('/subscriptions')}>
              查看更多 ({subs.length - (limit || 10)})
            </Button>
          </div>
        )}
      </Space>
    );
  };

  if (!user) {
    return (
      <Card
        title={
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>订阅</span>
          </Space>
        }
        style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: '100%' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 16, marginBottom: 16, color: '#8c8c8c' }}>
            登录后查看你的订阅内容
          </div>
          <Button
            type="primary"
            onClick={() => router.push('/login')}
            style={{
              borderRadius: 20,
            }}
          >
            立即登录
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>订阅</span>
          {stats.newCount > 0 && (
            <Badge count={stats.newCount} size="small" />
          )}
        </Space>
      }
      extra={
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => router.push('/subscriptions')}
        >
          管理订阅
        </Button>
      }
      style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: '100%' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Empty
          description={
            <div>
              <div style={{ marginBottom: 16 }}>还没有订阅任何内容</div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/subscriptions')}
                style={{
                  borderRadius: 20,
                }}
              >
                开始订阅
              </Button>
            </div>
          }
          style={{ padding: '40px 0' }}
        />
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: `全部 (${stats.total})`,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {stats.github > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#262626' }}>
                        <GithubOutlined style={{ marginRight: 4 }} />
                        GitHub仓库 ({stats.github})
                      </div>
                      {renderSubscriptionContent('repo')}
                    </div>
                  )}
                  {stats.huggingface > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#262626' }}>
                        <RobotOutlined style={{ marginRight: 4 }} />
                        HuggingFace ({stats.huggingface})
                      </div>
                      {renderSubscriptionContent('huggingface')}
                    </div>
                  )}
                  {stats.paper > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#262626' }}>
                        <FileTextOutlined style={{ marginRight: 4 }} />
                        论文 ({stats.paper})
                      </div>
                      {renderSubscriptionContent('paper')}
                    </div>
                  )}
                  {stats.video > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#262626' }}>
                        <PlayCircleOutlined style={{ marginRight: 4 }} />
                        视频 ({stats.video})
                      </div>
                      {renderSubscriptionContent('video')}
                    </div>
                  )}
                  {stats.job > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#262626' }}>
                        <TeamOutlined style={{ marginRight: 4 }} />
                        招聘 ({stats.job})
                      </div>
                      {renderSubscriptionContent('job')}
                    </div>
                  )}
                </Space>
              ),
            },
            {
              key: 'repo',
              label: `GitHub (${stats.github})`,
              children: renderSubscriptionContent('repo'),
            },
            {
              key: 'huggingface',
              label: `HuggingFace (${stats.huggingface})`,
              children: renderSubscriptionContent('huggingface'),
            },
            {
              key: 'paper',
              label: `论文 (${stats.paper})`,
              children: renderSubscriptionContent('paper'),
            },
            {
              key: 'video',
              label: `视频 (${stats.video})`,
              children: renderSubscriptionContent('video'),
            },
            {
              key: 'job',
              label: `招聘 (${stats.job})`,
              children: renderSubscriptionContent('job'),
            },
          ].filter(item => {
            if (item.key === 'all') return true;
            const count = item.key === 'repo' ? stats.github :
                         item.key === 'huggingface' ? stats.huggingface :
                         item.key === 'paper' ? stats.paper :
                         item.key === 'video' ? stats.video :
                         item.key === 'job' ? stats.job : 0;
            return count > 0;
          })}
        />
      )}
    </Card>
  );
}
