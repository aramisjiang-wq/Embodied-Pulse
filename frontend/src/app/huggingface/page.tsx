/**
 * Hugging Face 页面
 * 支持模型浏览和订阅功能
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Button, Space, Select, Input, Card, Empty, Skeleton, App, Tag, Modal, List, Divider, Tabs, Badge, Tooltip, Switch, message } from 'antd';
import { 
  SearchOutlined, 
  LikeOutlined, 
  StarOutlined, 
  StarFilled, 
  RobotOutlined, 
  BellOutlined, 
  BellFilled,
  UserOutlined,
  BookOutlined,
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  SyncOutlined,
  CalendarOutlined,
  FireOutlined,
  DownloadOutlined,
  HeartOutlined,
  HeartFilled,
  ExportOutlined,
} from '@ant-design/icons';
import { huggingfaceApi } from '@/lib/api/huggingface';
import { HuggingFaceModel } from '@/lib/api/types';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { parseTags } from '@/lib/utils/jsonParse';

const { Option } = Select;

export default function HuggingFacePage() {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<'latest' | 'hot' | 'downloads' | 'likes'>('latest');
  const [task, setTask] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const { user } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  const [subscribedPapers, setSubscribedPapers] = useState(false);
  const [subscribedAuthors, setSubscribedAuthors] = useState<Array<{
    id: string;
    author: string;
    authorUrl: string;
    isActive: boolean;
    createdAt: string;
  }>>([]);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadModels(1);
  }, [sort, task]);

  useEffect(() => {
    if (user) {
      loadFavorites();
      loadSubscriptions();
    } else {
      setFavoriteIds(new Set());
      setSubscribedPapers(false);
      setSubscribedAuthors([]);
    }
  }, [user]);

  const loadModels = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await huggingfaceApi.getModels({
        page: pageNum,
        size: 20,
        sort,
        task,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        if (pageNum === 1) {
          setModels([]);
        }
        setHasMore(false);
        return;
      }

      if (pageNum === 1) {
        setModels(data.items);
      } else {
        setModels((prev) => [...prev, ...data.items]);
      }

      setPage(pageNum);
      setHasMore(data.pagination?.hasNext || false);
    } catch (error: any) {
      console.error('Load models error:', error);
      if (pageNum === 1) {
        setModels([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadModels(1);
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'huggingface' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Load favorites error:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const data = await huggingfaceApi.getMySubscriptions();
      setSubscribedPapers(data.papers);
      setSubscribedAuthors(data.authors || []);
    } catch (error: any) {
      console.error('Load subscriptions error:', error);
    }
  };

  const handleToggleFavorite = (modelId: string) => {
    if (!user) {
      messageApi.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(modelId);
    const action = already
      ? communityApi.deleteFavorite('huggingface', modelId)
      : communityApi.createFavorite({ contentType: 'huggingface', contentId: modelId });
    action
      .then(() => {
        messageApi.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        messageApi.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const handleSubscribePapers = async () => {
    if (!user) {
      messageApi.warning('请先登录');
      return;
    }
    setSubscribing(true);
    try {
      if (subscribedPapers) {
        await huggingfaceApi.unsubscribePapers();
        setSubscribedPapers(false);
        messageApi.success('已取消订阅每日论文');
      } else {
        await huggingfaceApi.subscribePapers();
        setSubscribedPapers(true);
        messageApi.success('订阅成功！每日将收到最新论文推送');
      }
    } catch (error: any) {
      messageApi.error(error.message || '操作失败');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubscribeAuthor = async () => {
    if (!user) {
      messageApi.warning('请先登录');
      return;
    }
    if (!authorInput.trim()) {
      messageApi.warning('请输入作者名称');
      return;
    }
    setSubscribing(true);
    try {
      const result = await huggingfaceApi.subscribeAuthor(authorInput.trim());
      messageApi.success(result.message);
      setAuthorInput('');
      loadSubscriptions();
    } catch (error: any) {
      messageApi.error(error.message || '订阅失败');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribeAuthor = async (subscriptionId: string) => {
    setSubscribing(true);
    try {
      await huggingfaceApi.unsubscribeAuthor(subscriptionId);
      messageApi.success('已取消订阅');
      loadSubscriptions();
    } catch (error: any) {
      messageApi.error(error.message || '取消订阅失败');
    } finally {
      setSubscribing(false);
    }
  };

  const getTaskColor = (taskName: string | undefined) => {
    if (!taskName) return '#8c8c8c';
    const colors: Record<string, string> = {
      'text-generation': '#1890ff',
      'text-classification': '#52c41a',
      'image-classification': '#722ed1',
      'speech-recognition': '#fa8c16',
      'translation': '#13c2c2',
      'fill-mask': '#eb2f96',
      'question-answering': '#faad14',
    };
    return colors[taskName] || '#8c8c8c';
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', padding: '20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
          padding: '32px 40px', 
          borderRadius: 16, 
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255,215,0,0.3)',
              }}>
                <RobotOutlined style={{ fontSize: 28, color: '#1a1a2e' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#fff', lineHeight: 1.2 }}>
                  HuggingFace
                </h1>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  探索AI模型，订阅更新通知
                </div>
              </div>
            </div>
            
            <Button
              type="primary"
              icon={<BellOutlined />}
              onClick={() => setSubscriptionModalOpen(true)}
              style={{
                background: subscribedPapers || subscribedAuthors.length > 0 ? '#52c41a' : '#1890ff',
                borderColor: subscribedPapers || subscribedAuthors.length > 0 ? '#52c41a' : '#1890ff',
                borderRadius: 8,
                height: 40,
                fontWeight: 600,
              }}
            >
              {subscribedPapers || subscribedAuthors.length > 0 ? `已订阅 ${subscribedAuthors.length + (subscribedPapers ? 1 : 0)} 项` : '管理订阅'}
            </Button>
          </div>
        </div>

        <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24 }}>
            <Space wrap>
              <Input.Search
                placeholder="搜索模型名称、作者、描述..."
                style={{ width: 400 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
                size="large"
              />
              <Select
                value={task}
                onChange={(value) => setTask(value)}
                style={{ width: 180 }}
                allowClear
                placeholder="任务类型"
                size="large"
              >
                <Option value="text-generation">Text Generation</Option>
                <Option value="text-classification">Text Classification</Option>
                <Option value="image-classification">Image Classification</Option>
                <Option value="speech-recognition">Speech Recognition</Option>
                <Option value="translation">Translation</Option>
                <Option value="fill-mask">Fill Mask</Option>
                <Option value="question-answering">Question Answering</Option>
              </Select>
            </Space>
            <Select value={sort} onChange={setSort} style={{ width: 140 }} size="large">
              <Option value="latest">最新更新</Option>
              <Option value="hot">最热</Option>
              <Option value="downloads">下载量</Option>
              <Option value="likes">点赞数</Option>
            </Select>
          </Space>

          {loading && models.length === 0 ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Col xs={24} sm={12} md={8} key={n}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Col>
              ))}
            </Row>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {models.map((model) => (
                  <Col xs={24} sm={12} md={8} key={model.id}>
                    <Card 
                      hoverable 
                      style={{ 
                        borderRadius: 12, 
                        border: '1px solid #f0f0f0', 
                        transition: 'all 0.3s', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100%',
                      }}
                      styles={{
                        body: {
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                        },
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                    >
                      <a 
                        href={model.fullName ? `https://huggingface.co/${model.fullName}` : '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ textDecoration: 'none' }}
                      >
                        <div style={{ 
                          fontSize: 16, 
                          fontWeight: 600, 
                          lineHeight: 1.5, 
                          marginBottom: 8, 
                          color: '#262626', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden',
                        }}>
                          {model.fullName}
                        </div>
                      </a>

                      {model.description && (
                        <div style={{ 
                          fontSize: 13, 
                          color: '#8c8c8c', 
                          marginBottom: 12, 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden',
                          flex: 1,
                        }}>
                          {model.description}
                        </div>
                      )}

                      {model.task && (
                        <Tag 
                          style={{ 
                            marginBottom: 12, 
                            borderRadius: 6, 
                            background: getTaskColor(model.task),
                            border: 'none',
                            color: '#fff',
                          }}
                        >
                          {model.task}
                        </Tag>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 16, 
                        marginBottom: 12,
                        fontSize: 13,
                        color: '#8c8c8c',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DownloadOutlined style={{ color: '#1890ff' }} />
                          {formatNumber(model.downloads)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <HeartOutlined style={{ color: '#ff4d4f' }} />
                          {formatNumber(model.likes)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <a 
                          href={model.fullName ? `https://huggingface.co/${model.fullName}` : '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, color: '#1890ff' }}
                        >
                          <LinkOutlined /> 查看详情
                        </a>
                        <Button
                          size="small"
                          icon={favoriteIds.has(model.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                          type={favoriteIds.has(model.id) ? 'primary' : 'default'}
                          onClick={() => handleToggleFavorite(model.id)}
                          style={{ borderRadius: 6, fontSize: 13, height: 32 }}
                        >
                          {favoriteIds.has(model.id) ? '已收藏' : '收藏'}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {models.length === 0 && !loading && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: '#999', fontSize: 15 }}>暂无HuggingFace模型</span>}
                  style={{ padding: '60px 0' }}
                />
              )}

              {hasMore && models.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Button 
                    size="large" 
                    onClick={() => loadModels(page + 1)} 
                    loading={loading} 
                    style={{ borderRadius: 20, padding: '0 32px' }}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellOutlined style={{ color: '#1890ff' }} />
            <span>订阅管理</span>
          </div>
        }
        open={subscriptionModalOpen}
        onCancel={() => setSubscriptionModalOpen(false)}
        footer={null}
        width={600}
      >
        {!user ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#8c8c8c', marginBottom: 16 }}>请先登录以管理订阅</p>
            <Link href="/login">
              <Button type="primary">去登录</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    HuggingFace 每日论文
                  </div>
                  <div style={{ fontSize: 13, color: '#8c8c8c' }}>
                    每天自动推送最新AI论文
                  </div>
                </div>
                <Switch
                  checked={subscribedPapers}
                  onChange={handleSubscribePapers}
                  loading={subscribing}
                />
              </div>
            </div>

            <Divider />

            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                <UserOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                订阅作者
              </div>
              <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 16 }}>
                作者发布新模型时，您将收到通知
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Input
                  placeholder="输入HuggingFace作者名称，如：meta-llama"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onPressEnter={handleSubscribeAuthor}
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                />
                <Button 
                  type="primary" 
                  onClick={handleSubscribeAuthor}
                  loading={subscribing}
                  icon={<PlusOutlined />}
                >
                  订阅
                </Button>
              </div>

              {subscribedAuthors.length > 0 && (
                <List
                  size="small"
                  dataSource={subscribedAuthors}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          key="unsubscribe" 
                          type="link" 
                          danger 
                          size="small"
                          onClick={() => handleUnsubscribeAuthor(item.id)}
                          icon={<DeleteOutlined />}
                        >
                          取消
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: '#f0f5ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <UserOutlined style={{ color: '#1890ff' }} />
                          </div>
                        }
                        title={
                          <a 
                            href={item.authorUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#262626' }}
                          >
                            {item.author}
                          </a>
                        }
                        description={`订阅于 ${new Date(item.createdAt).toLocaleDateString()}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
