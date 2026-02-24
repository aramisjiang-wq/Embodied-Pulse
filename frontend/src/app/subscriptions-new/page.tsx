/**
 * 订阅管理页面（内容订阅）
 * 用于管理用户订阅的具体内容（GitHub仓库、论文、HuggingFace模型）
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Button, Space, Tag, Empty, Spin, Tabs, Row, Col, App } from 'antd';
import { 
  StarOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  BellOutlined,
  SyncOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { contentSubscriptionApi, ContentSubscription } from '@/lib/api/content-subscription';
import { paperApi } from '@/lib/api/paper';
import { repoApi } from '@/lib/api/repo';
import { huggingfaceApi } from '@/lib/api/huggingface';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import styles from './page.module.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Content } = Layout;

export default function SubscriptionsPage() {
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<ContentSubscription[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [enrichedSubscriptions, setEnrichedSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      messageApi.warning('请先登录');
      router.push('/login');
      return;
    }
    loadSubscriptions();
  }, [hydrated, user, activeTab]);

  useEffect(() => {
    if (subscriptions.length > 0) {
      enrichSubscriptions();
    }
  }, [subscriptions]);

  const loadSubscriptions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        size: 100,
      };
      
      if (activeTab !== 'all') {
        params.contentType = activeTab;
      }
      
      console.log('Loading subscriptions with params:', params);
      const data = await contentSubscriptionApi.getSubscriptions(params);
      console.log('Subscriptions API response:', data);
      
      let subscriptionsList: ContentSubscription[] = [];
      if (data && Array.isArray(data.items)) {
        subscriptionsList = data.items;
      } else if (Array.isArray(data)) {
        subscriptionsList = data;
      }
      
      console.log('Parsed subscriptions:', subscriptionsList);
      setSubscriptions(subscriptionsList);
    } catch (error: any) {
      console.error('Load subscriptions error:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const enrichSubscriptions = async () => {
    const enriched = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          switch (sub.contentType) {
            case 'paper':
              return { ...sub, detail: await paperApi.getPaper(sub.contentId) };
            case 'repo':
              return { ...sub, detail: await repoApi.getRepo(sub.contentId) };
            case 'huggingface':
              return { ...sub, detail: await huggingfaceApi.getModel(sub.contentId) };
            default:
              return sub;
          }
        } catch (error) {
          console.error('Error loading subscription detail:', error);
          return sub;
        }
      })
    );
    setEnrichedSubscriptions(enriched);
  };

  const handleDelete = async (subscription: ContentSubscription) => {
    try {
      await contentSubscriptionApi.deleteSubscription(subscription.contentType, subscription.contentId);
      messageApi.success('已取消订阅');
      loadSubscriptions();
    } catch (error: any) {
      messageApi.error(error.message || '取消订阅失败');
    }
  };

  const handleToggleNotify = async (subscription: ContentSubscription) => {
    try {
      await contentSubscriptionApi.updateSubscription(subscription.id, {
        notifyEnabled: !subscription.notifyEnabled,
      });
      messageApi.success(subscription.notifyEnabled ? '已关闭通知' : '已开启通知');
      loadSubscriptions();
    } catch (error: any) {
      messageApi.error(error.message || '操作失败');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <FileTextOutlined />;
      case 'repo':
        return <GithubOutlined />;
      case 'huggingface':
        return <RobotOutlined />;
      default:
        return <StarOutlined />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      paper: '论文',
      repo: 'GitHub项目',
      huggingface: 'HuggingFace模型',
    };
    return labels[type] || type;
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      paper: 'blue',
      repo: 'purple',
      huggingface: 'orange',
    };
    return colors[type] || 'default';
  };

  const buildLink = (sub: any) => {
    const detail = sub.detail;
    if (!detail) return '#';
    
    switch (sub.contentType) {
      case 'paper':
        return detail.arxivId ? `https://arxiv.org/abs/${detail.arxivId}` : (detail.pdfUrl || '#');
      case 'repo':
        return detail.htmlUrl || (detail.fullName ? `https://github.com/${detail.fullName}` : '#');
      case 'huggingface':
        const hfContentType = detail.contentType || 'model';
        if (hfContentType === 'dataset') {
          return detail.fullName ? `https://huggingface.co/datasets/${detail.fullName}` : (detail.hfId ? `https://huggingface.co/datasets/${detail.hfId}` : '#');
        } else if (hfContentType === 'space') {
          return detail.fullName ? `https://huggingface.co/spaces/${detail.fullName}` : (detail.hfId ? `https://huggingface.co/spaces/${detail.hfId}` : '#');
        }
        return detail.fullName ? `https://huggingface.co/${detail.fullName}` : (detail.hfId ? `https://huggingface.co/${detail.hfId}` : '#');
      default:
        return '#';
    }
  };

  const formatRelativeTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return dayjs(date).fromNow();
  };

  const groupedSubscriptions = enrichedSubscriptions.reduce((acc, sub) => {
    if (!acc[sub.contentType]) {
      acc[sub.contentType] = [];
    }
    acc[sub.contentType].push(sub);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    total: subscriptions.length,
    paper: groupedSubscriptions.paper?.length || 0,
    repo: groupedSubscriptions.repo?.length || 0,
    huggingface: groupedSubscriptions.huggingface?.length || 0,
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.pageWrapper}>
      <Content style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>我的订阅</h1>
            <p style={{ color: '#666', marginBottom: 16 }}>
              管理你订阅的内容，系统会自动为你推送更新通知
            </p>
          </div>
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.total}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>总订阅数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {stats.paper}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>论文</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {stats.repo}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>GitHub项目</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                {stats.huggingface}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>HuggingFace模型</div>
            </Card>
          </Col>
        </Row>

        <Card style={{ marginBottom: 24 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all', label: '全部' },
              { key: 'paper', label: '论文', icon: <FileTextOutlined /> },
              { key: 'repo', label: 'GitHub', icon: <GithubOutlined /> },
              { key: 'huggingface', label: 'HuggingFace', icon: <RobotOutlined /> },
            ]}
          />
        </Card>

        <Spin spinning={loading}>
          {enrichedSubscriptions.length === 0 ? (
            <Card>
              <Empty
                description="暂无订阅"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <p style={{ color: '#666', marginTop: 16 }}>
                  在论文、GitHub项目或HuggingFace模型页面点击"订阅"按钮来订阅你感兴趣的内容
                </p>
              </Empty>
            </Card>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {enrichedSubscriptions.map((subscription) => {
                const detail = subscription.detail;
                const linkUrl = buildLink(subscription);
                const isExternal = !linkUrl.startsWith('/') && linkUrl !== '#';

                return (
                  <Card
                    key={subscription.id}
                    hoverable
                    style={{ borderRadius: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Tag 
                            icon={getContentTypeIcon(subscription.contentType)}
                            color={getContentTypeColor(subscription.contentType)}
                            style={{ fontSize: 14, padding: '4px 12px' }}
                          >
                            {getContentTypeLabel(subscription.contentType)}
                          </Tag>
                          {subscription.notifyEnabled && (
                            <Tag icon={<BellOutlined />} color="blue">通知</Tag>
                          )}
                          <span style={{ color: '#999', fontSize: 12 }}>
                            订阅于 {formatRelativeTime(subscription.createdAt)}
                          </span>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <a
                            href={linkUrl}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: '#1890ff',
                              textDecoration: 'none',
                            }}
                        >
                            {detail?.title || detail?.fullName || detail?.name || subscription.contentId}
                          </a>
                        </div>

                        {detail?.description && (
                          <div
                            style={{
                              color: '#595959',
                              fontSize: 13,
                              marginBottom: 12,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.6,
                            }}
                        >
                            {detail.description}
                          </div>
                        )}

                        {detail?.language && subscription.contentType === 'repo' && (
                          <Tag color="geekblue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                            {detail.language}
                          </Tag>
                        )}

                        {detail?.tags && Array.isArray(detail.tags) && detail.tags.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            {detail.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <Tag key={idx} color="blue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 24, marginTop: 12, color: '#666', fontSize: 12 }}>
                          {subscription.lastChecked && (
                            <span>最后检查: {formatRelativeTime(subscription.lastChecked)}</span>
                          )}
                          {subscription.lastNotified && (
                            <span>最后通知: {formatRelativeTime(subscription.lastNotified)}</span>
                          )}
                        </div>
                      </div>

                      <Space direction="vertical" size={8}>
                        <Button
                          size="small"
                          icon={subscription.notifyEnabled ? <BellOutlined /> : <SyncOutlined />}
                          onClick={() => handleToggleNotify(subscription)}
                        >
                          {subscription.notifyEnabled ? '关闭通知' : '开启通知'}
                        </Button>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(subscription)}
                        >
                          取消订阅
                        </Button>
                      </Space>
                    </div>
                  </Card>
                );
              })}
            </Space>
          )}
        </Spin>
      </Content>
    </div>
  );
}
