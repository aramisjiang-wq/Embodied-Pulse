'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Space, Tag, Empty, Spin, List, Typography, Divider, Pagination, App } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, SyncOutlined, FileTextOutlined, PlayCircleOutlined, StarOutlined, RobotOutlined, GithubOutlined, DollarOutlined } from '@ant-design/icons';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [contentPage, setContentPage] = useState(1);
  const [contentPageSize, setContentPageSize] = useState(10);
  const [contentTotal, setContentTotal] = useState(0);
  const { message } = App.useApp();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadSubscription();
  }, [params?.id, user]);

  useEffect(() => {
    if (subscription) {
      loadContent();
    }
  }, [contentPage, contentPageSize, subscription]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await subscriptionApi.getSubscriptions({
        page: 1,
        size: 100,
      });
      const sub = data.items.find((s: Subscription) => s.id === params?.id);
      if (sub) {
        setSubscription(sub);
      } else {
        message.error('订阅不存在');
        router.push('/subscriptions');
      }
    } catch (error: any) {
      console.error('Load subscription error:', error);
      message.error(error.message || '加载订阅失败');
      router.push('/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    if (!subscription) return;
    
    setContentLoading(true);
    try {
      const data = await subscriptionApi.getSubscriptionContent(subscription.id, {
        page: contentPage,
        size: contentPageSize,
      });
      setContentItems(data.items);
      setContentTotal(data.pagination.total);
    } catch (error: any) {
      console.error('Load content error:', error);
      message.error(error.message || '加载内容失败');
    } finally {
      setContentLoading(false);
    }
  };

  const handleSync = async () => {
    if (!subscription) return;
    
    setSyncing(true);
    try {
      await subscriptionApi.syncSubscription(subscription.id);
      message.success('同步成功');
      loadSubscription();
      loadContent();
    } catch (error: any) {
      console.error('Sync error:', error);
      message.error(error.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleBack = () => {
    router.push('/subscriptions');
  };

  const handleContentPageChange = (page: number, pageSize?: number) => {
    if (pageSize && pageSize !== contentPageSize) {
      setContentPageSize(pageSize);
      setContentPage(1);
    } else {
      setContentPage(page);
    }
  };

  const renderContentItem = (item: any) => {
    switch (subscription?.contentType) {
      case 'paper':
        return (
          <List.Item>
            <List.Item.Meta
              title={
                <a
                  href={item.pdfUrl || `https://arxiv.org/abs/${item.arxivId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 15, fontWeight: 500 }}
                >
                  {item.title}
                </a>
              }
              description={
                <div>
                  <Space size="middle" style={{ fontSize: 13, color: '#666' }}>
                    <span>📚 {item.citationCount || 0} 引用</span>
                    {item.publishedDate && (
                      <span>📅 {dayjs(item.publishedDate).format('YYYY-MM-DD')}</span>
                    )}
                  </Space>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
                    {item.abstract?.substring(0, 150)}...
                  </div>
                </div>
              }
            />
          </List.Item>
        );

      case 'video':
        return (
          <List.Item
            actions={[
              <Button
                key="play"
                type="link"
                icon={<PlayCircleOutlined />}
                onClick={() => window.open(`https://www.bilibili.com/video/${item.bvid || item.videoId}`, '_blank')}
              >
                播放
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <a
                  href={`https://www.bilibili.com/video/${item.bvid || item.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 15, fontWeight: 500 }}
                >
                  {item.title}
                </a>
              }
              description={
                <div>
                  <Space size="middle" style={{ fontSize: 13, color: '#666' }}>
                    <span>👤 {item.uploader || '未知UP主'}</span>
                    {item.playCount && (
                      <span>👁️ {item.playCount.toLocaleString()}</span>
                    )}
                    {item.duration && (
                      <span>⏱️ {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}</span>
                    )}
                  </Space>
                </div>
              }
            />
          </List.Item>
        );

      case 'repo':
        return (
          <List.Item
            actions={[
              <Button
                key="view"
                type="link"
                icon={<GithubOutlined />}
                onClick={() => window.open(item.htmlUrl, '_blank')}
              >
                查看
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <a
                  href={item.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 15, fontWeight: 500 }}
                >
                  {item.fullName || item.name}
                </a>
              }
              description={
                <div>
                  <Space size="middle" style={{ fontSize: 13, color: '#666' }}>
                    <span>⭐ {item.starsCount?.toLocaleString() || 0}</span>
                    <span>🍴 {item.forksCount?.toLocaleString() || 0}</span>
                    {item.language && <span>💻 {item.language}</span>}
                  </Space>
                  {item.description && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
                      {item.description.substring(0, 150)}...
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        );

      case 'huggingface':
        return (
          <List.Item
            actions={[
              <Button
                type="link"
                icon={<RobotOutlined />}
                onClick={() => window.open(`https://huggingface.co/${item.fullName}`, '_blank')}
              >
                查看
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <a
                  href={`https://huggingface.co/${item.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 15, fontWeight: 500 }}
                >
                  {item.fullName}
                </a>
              }
              description={
                <div>
                  <Space size="middle" style={{ fontSize: 13, color: '#666' }}>
                    <span>⬇️ {item.downloads?.toLocaleString() || 0}</span>
                    <span>❤️ {item.likes?.toLocaleString() || 0}</span>
                    {item.task && <Tag color="purple">{item.task}</Tag>}
                  </Space>
                  {item.description && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#999' }}>
                      {item.description.substring(0, 150)}...
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        );

      case 'job':
        return (
          <List.Item
            actions={[
              <Button
                type="link"
                icon={<DollarOutlined />}
                onClick={() => window.open(item.url, '_blank')}
              >
                申请
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <span style={{ fontSize: 15, fontWeight: 500 }}>
                  {item.title}
                </span>
              }
              description={
                <div>
                  <Space size="middle" style={{ fontSize: 13, color: '#666' }}>
                    <span>🏢 {item.company}</span>
                    {item.location && <span>📍 {item.location}</span>}
                    {item.salaryMin && item.salaryMax && (
                      <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                        💰 {item.salaryMin}-{item.salaryMax}K
                      </span>
                    )}
                  </Space>
                </div>
              }
            />
          </List.Item>
        );

      default:
        return null;
    }
  };

  const contentTypeLabels = {
    repo: 'GitHub仓库',
    huggingface: 'HuggingFace模型',
    paper: '论文',
    video: '视频',
    job: '招聘',
  };

  const contentTypeColors = {
    repo: 'blue',
    huggingface: 'purple',
    paper: 'cyan',
    video: 'red',
    job: 'green',
  };

  const contentTypeIcons = {
    repo: <GithubOutlined />,
    huggingface: <RobotOutlined />,
    paper: <FileTextOutlined />,
    video: <PlayCircleOutlined />,
    job: <DollarOutlined />,
  };

  const contentTypeLabel = contentTypeLabels[subscription?.contentType as keyof typeof contentTypeLabels] || subscription?.contentType || '未知';
  const contentTypeColor = contentTypeColors[subscription?.contentType as keyof typeof contentTypeColors] || 'default';
  const contentTypeIcon = contentTypeIcons[subscription?.contentType as keyof typeof contentTypeIcons] || <StarOutlined />;

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Empty description="订阅不存在" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: 16 }}
        >
          返回订阅列表
        </Button>
        
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Space size="middle" wrap>
                <Tag color={contentTypeColor} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {contentTypeLabel}
                </Tag>
                {subscription.newCount > 0 && (
                  <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
                    {subscription.newCount} 新内容
                  </Tag>
                )}
                {subscription.syncEnabled && (
                  <Tag icon={<SyncOutlined />} color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                    自动同步
                  </Tag>
                )}
              </Space>
              
              <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                {subscription.name}
              </Title>
              
              {subscription.description && (
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  {subscription.description}
                </Paragraph>
              )}
            </div>
            
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleSync}
              loading={syncing}
            >
              立即同步
            </Button>
          </div>

          <Divider />

          <Space size="large" wrap>
            <div>
              <Text type="secondary">匹配内容：</Text>
              <Text strong style={{ fontSize: 16, marginLeft: 8 }}>
                {subscription.totalMatched || 0} 条
              </Text>
            </div>
            <div>
              <Text type="secondary">新内容：</Text>
              <Text strong style={{ fontSize: 16, marginLeft: 8, color: '#ff4d4f' }}>
                {subscription.newCount || 0} 条
              </Text>
            </div>
            {subscription.lastSyncAt && (
              <div>
                <Text type="secondary">最后同步：</Text>
                <Text style={{ fontSize: 14, marginLeft: 8 }}>
                  {dayjs(subscription.lastSyncAt).format('YYYY-MM-DD HH:mm:ss')}
                  {' '}({dayjs(subscription.lastSyncAt).fromNow()})
                </Text>
              </div>
            )}
            {subscription.lastChecked && (
              <div>
                <Text type="secondary">最后检查：</Text>
                <Text style={{ fontSize: 14, marginLeft: 8 }}>
                  {dayjs(subscription.lastChecked).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </div>
            )}
          </Space>

          <Divider />

          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              订阅条件
            </Title>
            
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {subscription.keywords && (
                <div>
                  <Text strong>关键词：</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      try {
                        const keywords = JSON.parse(subscription.keywords);
                        return keywords.map((kw: string, i: number) => (
                          <Tag key={i} color="blue" style={{ marginBottom: 8 }}>
                            {kw}
                          </Tag>
                        ));
                      } catch (e) {
                        return <Tag color="blue">{subscription.keywords}</Tag>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {subscription.authors && (
                <div>
                  <Text strong>作者：</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      try {
                        const authors = JSON.parse(subscription.authors);
                        return authors.map((author: string, i: number) => (
                          <Tag key={i} color="cyan" style={{ marginBottom: 8 }}>
                            {author}
                          </Tag>
                        ));
                      } catch (e) {
                        return <Tag color="cyan">{subscription.authors}</Tag>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {subscription.uploaders && (
                <div>
                  <Text strong>UP主：</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      try {
                        const uploaders = JSON.parse(subscription.uploaders);
                        return uploaders.map((uploader: string, i: number) => (
                          <Tag key={i} color="red" style={{ marginBottom: 8 }}>
                            {uploader}
                          </Tag>
                        ));
                      } catch (e) {
                        return <Tag color="red">{subscription.uploaders}</Tag>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {subscription.topics && (
                <div>
                  <Text strong>研究方向：</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      try {
                        const topics = JSON.parse(subscription.topics);
                        return topics.map((topic: string, i: number) => (
                          <Tag key={i} color="purple" style={{ marginBottom: 8 }}>
                            {topic}
                          </Tag>
                        ));
                      } catch (e) {
                        return <Tag color="purple">{subscription.topics}</Tag>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {subscription.owners && (
                <div>
                  <Text strong>仓库所有者：</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      try {
                        const owners = JSON.parse(subscription.owners);
                        return owners.map((owner: string, i: number) => (
                          <Tag key={i} color="green" style={{ marginBottom: 8 }}>
                            {owner}
                          </Tag>
                        ));
                      } catch (e) {
                        return <Tag color="green">{subscription.owners}</Tag>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {subscription.minStars && (
                <div>
                  <Text strong>最低星数：</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {subscription.minStars} ⭐
                  </Text>
                </div>
              )}

              {subscription.minCitations && (
                <div>
                  <Text strong>最低引用数：</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {subscription.minCitations} 📚
                  </Text>
                </div>
              )}
            </Space>
          </div>
        </Card>
      </div>

      <Card 
        title={
          <Space>
            {contentTypeIcon}
            <span>匹配内容</span>
            <Tag color="blue">{contentTotal} 条</Tag>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        {contentLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : contentItems.length === 0 ? (
          <Empty
            description={
              <div>
                <div style={{ marginBottom: 16 }}>
                  暂无匹配内容
                </div>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleSync}
                  loading={syncing}
                >
                  立即同步
                </Button>
              </div>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <>
            <List
              dataSource={contentItems}
              renderItem={renderContentItem}
              style={{ background: '#fff' }}
            />
            {contentTotal > contentPageSize && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={contentPage}
                  pageSize={contentPageSize}
                  total={contentTotal}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                  pageSizeOptions={['10', '20', '30', '50']}
                  onChange={handleContentPageChange}
                  onShowSizeChange={handleContentPageChange}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
