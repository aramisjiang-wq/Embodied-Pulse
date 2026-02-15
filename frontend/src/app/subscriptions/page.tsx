/**
 * 订阅管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Button, Space, Tag, Empty, Spin, Modal, Form, Input, Select, Switch, Tabs, Row, Col, Popconfirm, App, Dropdown, MenuProps, Badge, Checkbox } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  StarOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
  BellOutlined,
  SyncOutlined,
  FolderOutlined,
  FolderAddOutlined,
  MoreOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import { SubscriptionRecommendations } from '@/components/SubscriptionRecommendations';

const { Content } = Layout;
const { TextArea } = Input;
const { TabPane } = Tabs;

export interface SubscriptionGroup {
  id: string;
  name: string;
  description?: string;
  subscriptionIds: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [groups, setGroups] = useState<SubscriptionGroup[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [modalVisible, setModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editingGroup, setEditingGroup] = useState<SubscriptionGroup | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();

  useEffect(() => {
    if (!user) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }
    loadSubscriptions();
    loadGroups();
  }, [user, activeTab, selectedGroup]);

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
      const data = await subscriptionApi.getSubscriptions(params);
      console.log('Subscriptions API response:', data);
      
      let subscriptionsList: Subscription[] = [];
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

  const loadGroups = () => {
    const saved = localStorage.getItem('subscriptionGroups');
    if (saved) {
      setGroups(JSON.parse(saved));
    }
  };

  const saveGroups = (newGroups: SubscriptionGroup[]) => {
    setGroups(newGroups);
    localStorage.setItem('subscriptionGroups', JSON.stringify(newGroups));
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    setGroupModalVisible(true);
  };

  const handleEditGroup = (group: SubscriptionGroup) => {
    setEditingGroup(group);
    groupForm.setFieldsValue({
      name: group.name,
      description: group.description,
      color: group.color || 'blue',
    });
    setGroupModalVisible(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    const newGroups = groups.filter(g => g.id !== groupId);
    saveGroups(newGroups);
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
    }
    message.success('分组已删除');
  };

  const handleGroupSubmit = async (values: any) => {
    if (editingGroup) {
      const updatedGroups = groups.map(g => 
        g.id === editingGroup.id 
          ? { ...g, ...values, updatedAt: new Date().toISOString() }
          : g
      );
      saveGroups(updatedGroups);
      message.success('分组更新成功');
    } else {
      const newGroup: SubscriptionGroup = {
        id: `group_${Date.now()}`,
        name: values.name,
        description: values.description,
        color: values.color || 'blue',
        subscriptionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveGroups([...groups, newGroup]);
      message.success('分组创建成功');
    }
    setGroupModalVisible(false);
    groupForm.resetFields();
  };

  const handleAddToGroup = (subscriptionId: string, groupId: string) => {
    const updatedGroups = groups.map(g => 
      g.id === groupId 
        ? { ...g, subscriptionIds: [...g.subscriptionIds, subscriptionId], updatedAt: new Date().toISOString() }
        : g
    );
    saveGroups(updatedGroups);
    message.success('已添加到分组');
  };

  const handleRemoveFromGroup = (subscriptionId: string, groupId: string) => {
    const updatedGroups = groups.map(g => 
      g.id === groupId 
        ? { ...g, subscriptionIds: g.subscriptionIds.filter(id => id !== subscriptionId), updatedAt: new Date().toISOString() }
        : g
    );
    saveGroups(updatedGroups);
    message.success('已从分组移除');
  };

  const getGroupSubscriptions = () => {
    if (!selectedGroup) return subscriptions;
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return subscriptions;
    return subscriptions.filter(s => group.subscriptionIds.includes(s.id));
  };

  const handleBatchAction = async (action: string) => {
    if (selectedSubscriptions.size === 0) {
      message.warning('请先选择订阅');
      return;
    }

    try {
      setLoading(true);
      const ids = Array.from(selectedSubscriptions);

      switch (action) {
        case 'sync':
          await Promise.all(ids.map(id => subscriptionApi.syncSubscription(id)));
          message.success('批量同步成功');
          break;
        case 'activate':
          await Promise.all(ids.map(id => subscriptionApi.updateSubscription(id, { isActive: true })));
          message.success('批量启用成功');
          break;
        case 'deactivate':
          await Promise.all(ids.map(id => subscriptionApi.updateSubscription(id, { isActive: false })));
          message.success('批量停用成功');
          break;
        case 'delete':
          await Promise.all(ids.map(id => subscriptionApi.deleteSubscription(id)));
          message.success('批量删除成功');
          break;
        case 'addToGroup':
          if (!selectedGroup) {
            message.warning('请先选择分组');
            return;
          }
          ids.forEach(id => handleAddToGroup(id, selectedGroup));
          message.success('批量添加到分组成功');
          break;
      }

      setSelectedSubscriptions(new Set());
      loadSubscriptions();
    } catch (error: any) {
      message.error(error.message || '批量操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getBatchMenuItems: MenuProps['items'] = [
    {
      key: 'sync',
      label: '立即同步',
      icon: <SyncOutlined />,
    },
    {
      key: 'activate',
      label: '批量启用',
      icon: <BellOutlined />,
    },
    {
      key: 'deactivate',
      label: '批量停用',
    },
    {
      key: 'addToGroup',
      label: '添加到分组',
      icon: <FolderOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  const handleCreate = () => {
    setEditingSubscription(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    form.setFieldsValue({
      contentType: subscription.contentType,
      keywords: subscription.keywords ? JSON.parse(subscription.keywords).join(', ') : '',
      tags: subscription.tags ? JSON.parse(subscription.tags).join(', ') : '',
      authors: subscription.authors ? JSON.parse(subscription.authors).join(', ') : '',
      notifyEnabled: subscription.notifyEnabled,
      isActive: subscription.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await subscriptionApi.deleteSubscription(id);
      message.success('删除成功');
      loadSubscriptions();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleToggleActive = async (subscription: Subscription) => {
    try {
      await subscriptionApi.updateSubscription(subscription.id, {
        isActive: !subscription.isActive,
      });
      message.success(subscription.isActive ? '已停用' : '已启用');
      loadSubscriptions();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleSync = async (subscriptionId: string) => {
    try {
      setSyncingIds(prev => new Set(prev).add(subscriptionId));
      const result = await subscriptionApi.syncSubscription(subscriptionId);
      message.success(`同步成功：匹配${result.matchedCount}条，新增${result.newCount}条`);
      loadSubscriptions();
    } catch (error: any) {
      message.error(error.message || '同步失败');
    } finally {
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subscriptionId);
        return newSet;
      });
    }
  };

  const handleViewDetail = (subscriptionId: string) => {
    router.push(`/subscriptions/${subscriptionId}`);
  };

  const handleSubmit = async (values: any) => {
    try {
      const keywords = values.keywords 
        ? values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
        : [];
      const tags = values.tags 
        ? values.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        : [];
      const authors = values.authors 
        ? values.authors.split(',').map((a: string) => a.trim()).filter((a: string) => a)
        : [];

      if (editingSubscription) {
        // 更新订阅时，后端期望接收数组格式
        await subscriptionApi.updateSubscription(editingSubscription.id, {
          contentType: values.contentType,
          keywords: keywords, // 直接传递数组
          tags: tags.length > 0 ? tags : undefined, // 直接传递数组
          authors: authors.length > 0 ? authors : undefined, // 直接传递数组
          notifyEnabled: values.notifyEnabled,
          isActive: values.isActive,
        });
        message.success('更新成功');
      } else {
        // 创建订阅时，后端期望接收数组格式，而不是JSON字符串
        await subscriptionApi.createSubscription({
          contentType: values.contentType,
          keywords: keywords, // 直接传递数组
          tags: tags.length > 0 ? tags : undefined, // 直接传递数组
          authors: authors.length > 0 ? authors : undefined, // 直接传递数组
          notifyEnabled: values.notifyEnabled ?? true,
        });
        message.success('创建成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      loadSubscriptions();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <FileTextOutlined />;
      case 'video':
        return <PlayCircleOutlined />;
      case 'repo':
        return <GithubOutlined />;
      case 'huggingface':
        return <RobotOutlined />;
      case 'job':
        return <TeamOutlined />;
      default:
        return <StarOutlined />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      paper: '论文',
      video: '视频',
      repo: 'GitHub项目',
      huggingface: 'HuggingFace模型',
      job: '招聘岗位',
    };
    return labels[type] || type;
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      paper: 'blue',
      video: 'green',
      repo: 'purple',
      huggingface: 'orange',
      job: 'red',
    };
    return colors[type] || 'default';
  };

  // 按类型分组
  const groupedSubscriptions = subscriptions.reduce((acc, sub) => {
    if (!acc[sub.contentType]) {
      acc[sub.contentType] = [];
    }
    acc[sub.contentType].push(sub);
    return acc;
  }, {} as Record<string, Subscription[]>);

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.isActive).length,
    paper: groupedSubscriptions.paper?.length || 0,
    video: groupedSubscriptions.video?.length || 0,
    repo: groupedSubscriptions.repo?.length || 0,
    huggingface: groupedSubscriptions.huggingface?.length || 0,
    job: groupedSubscriptions.job?.length || 0,
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>我的订阅</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>
            管理你的内容订阅，系统会自动为你推送匹配的内容
          </p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.total}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>总订阅数</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {stats.active}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>活跃订阅</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {subscriptions.reduce((sum, s) => sum + (s.newCount || 0), 0)}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>新内容</div>
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                {subscriptions.reduce((sum, s) => sum + (s.totalMatched || 0), 0)}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>总匹配数</div>
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Space wrap>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: 'all', label: '全部' },
                  { key: 'paper', label: '论文', icon: <FileTextOutlined /> },
                  { key: 'video', label: '视频', icon: <PlayCircleOutlined /> },
                  { key: 'repo', label: 'GitHub', icon: <GithubOutlined /> },
                  { key: 'huggingface', label: 'HuggingFace', icon: <RobotOutlined /> },
                  { key: 'job', label: '招聘', icon: <TeamOutlined /> },
                ]}
              />
              
              {groups.length > 0 && (
                <Select
                  placeholder="选择分组"
                  style={{ width: 150 }}
                  allowClear
                  value={selectedGroup}
                  onChange={setSelectedGroup}
                  options={[
                    { value: null, label: '全部分组' },
                    ...groups.map(g => ({ value: g.id, label: g.name })),
                  ]}
                />
              )}
            </Space>

            <Space>
              {selectedSubscriptions.size > 0 && (
                <Badge count={selectedSubscriptions.size} offset={[10, 0]}>
                  <Dropdown menu={{ items: getBatchMenuItems, onClick: ({ key }) => handleBatchAction(key) }}>
                    <Button>
                      批量操作 <MoreOutlined />
                    </Button>
                  </Dropdown>
                </Badge>
              )}
              
              <Button
                icon={viewMode === 'card' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
                onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
              >
                {viewMode === 'card' ? '列表' : '卡片'}
              </Button>
              
              <Button
                icon={<FolderAddOutlined />}
                onClick={handleCreateGroup}
              >
                新建分组
              </Button>
              
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                新建订阅
              </Button>
            </Space>
          </div>
        </Card>

        {/* 订阅列表 */}
        <Spin spinning={loading}>
          {getGroupSubscriptions().length === 0 ? (
            <Card>
              <Empty
                description="暂无订阅"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  创建第一个订阅
                </Button>
              </Empty>
            </Card>
          ) : (
            <>
              {viewMode === 'card' ? (
                <Row gutter={[16, 16]}>
                  {getGroupSubscriptions().map((subscription) => {
                    const keywords = subscription.keywords 
                      ? JSON.parse(subscription.keywords)
                      : [];
                    const tags = subscription.tags 
                      ? JSON.parse(subscription.tags)
                      : [];
                    const authors = subscription.authors 
                      ? JSON.parse(subscription.authors)
                      : [];
                    const isSelected = selectedSubscriptions.has(subscription.id);
                    const group = groups.find(g => g.subscriptionIds.includes(subscription.id));

                    return (
                      <Col xs={24} sm={12} md={8} key={subscription.id}>
                        <Card
                          hoverable
                          style={{ 
                            borderRadius: 12,
                            border: isSelected ? '2px solid #1890ff' : undefined,
                            position: 'relative',
                          }}
                          onClick={() => handleViewDetail(subscription.id)}
                        >
                          <Checkbox
                            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedSubscriptions);
                              if (e.target.checked) {
                                newSelected.add(subscription.id);
                              } else {
                                newSelected.delete(subscription.id);
                              }
                              setSelectedSubscriptions(newSelected);
                            }}
                          />
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Tag 
                              icon={getContentTypeIcon(subscription.contentType)}
                              color={getContentTypeColor(subscription.contentType)}
                              style={{ fontSize: 14, padding: '4px 12px' }}
                            >
                              {getContentTypeLabel(subscription.contentType)}
                            </Tag>
                            <Tag color={subscription.isActive ? 'success' : 'default'}>
                              {subscription.isActive ? '已启用' : '已停用'}
                            </Tag>
                            {group && (
                              <Tag icon={<FolderOutlined />} color={group.color}>
                                {group.name}
                              </Tag>
                            )}
                          </div>

                          {keywords.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <strong>关键词：</strong>
                              <Space size={[4, 4]} wrap>
                                {keywords.slice(0, 3).map((kw: string, idx: number) => (
                                  <Tag key={idx} style={{ fontSize: 11 }}>{kw}</Tag>
                                ))}
                                {keywords.length > 3 && <Tag>+{keywords.length - 3}</Tag>}
                              </Space>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 16, marginTop: 12, color: '#666', fontSize: 12 }}>
                            <span>新内容: <strong style={{ color: '#1890ff' }}>{subscription.newCount || 0}</strong></span>
                            <span>总匹配: <strong>{subscription.totalMatched || 0}</strong></span>
                          </div>

                          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <Button
                              size="small"
                              icon={<SyncOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSync(subscription.id);
                              }}
                              loading={syncingIds.has(subscription.id)}
                            >
                              同步
                            </Button>
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(subscription);
                              }}
                            >
                              编辑
                            </Button>
                            <Popconfirm
                              title="确定要删除这个订阅吗？"
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                handleDelete(subscription.id);
                              }}
                            >
                              <Button 
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {getGroupSubscriptions().map((subscription) => {
                    const keywords = subscription.keywords 
                      ? JSON.parse(subscription.keywords)
                      : [];
                    const tags = subscription.tags 
                      ? JSON.parse(subscription.tags)
                      : [];
                    const authors = subscription.authors 
                      ? JSON.parse(subscription.authors)
                      : [];
                    const isSelected = selectedSubscriptions.has(subscription.id);
                    const group = groups.find(g => g.subscriptionIds.includes(subscription.id));

                    return (
                      <Card
                        key={subscription.id}
                        hoverable
                        style={{ 
                          borderRadius: 12,
                          border: isSelected ? '2px solid #1890ff' : undefined,
                        }}
                        onClick={() => handleViewDetail(subscription.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedSubscriptions);
                              if (e.target.checked) {
                                newSelected.add(subscription.id);
                              } else {
                                newSelected.delete(subscription.id);
                              }
                              setSelectedSubscriptions(newSelected);
                            }}
                          />
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                              <Tag 
                                icon={getContentTypeIcon(subscription.contentType)}
                                color={getContentTypeColor(subscription.contentType)}
                                style={{ fontSize: 14, padding: '4px 12px' }}
                              >
                                {getContentTypeLabel(subscription.contentType)}
                              </Tag>
                              <Tag color={subscription.isActive ? 'success' : 'default'}>
                                {subscription.isActive ? '已启用' : '已停用'}
                              </Tag>
                              {subscription.notifyEnabled && (
                                <Tag icon={<BellOutlined />} color="blue">通知</Tag>
                              )}
                              {subscription.syncEnabled && (
                                <Tag icon={<SyncOutlined />} color="green">同步</Tag>
                              )}
                              {group && (
                                <Tag icon={<FolderOutlined />} color={group.color}>
                                  {group.name}
                                </Tag>
                              )}
                            </div>

                            {keywords.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <strong>关键词：</strong>
                                <Space size={[8, 8]} wrap>
                                  {keywords.map((kw: string, idx: number) => (
                                    <Tag key={idx}>{kw}</Tag>
                                  ))}
                                </Space>
                              </div>
                            )}

                            {tags.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <strong>标签：</strong>
                                <Space size={[8, 8]} wrap>
                                  {tags.map((tag: string, idx: number) => (
                                    <Tag key={idx} color="blue">{tag}</Tag>
                                  ))}
                                </Space>
                              </div>
                            )}

                            {authors.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <strong>作者：</strong>
                                <Space size={[8, 8]} wrap>
                                  {authors.map((author: string, idx: number) => (
                                    <Tag key={idx} color="purple">{author}</Tag>
                                  ))}
                                </Space>
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: 24, marginTop: 12, color: '#666', fontSize: 12 }}>
                              <span>新内容: <strong style={{ color: '#1890ff' }}>{subscription.newCount || 0}</strong></span>
                              <span>总匹配: <strong>{subscription.totalMatched || 0}</strong></span>
                              {subscription.lastSyncAt && (
                                <span>最后同步: {dayjs(subscription.lastSyncAt).format('YYYY-MM-DD HH:mm')}</span>
                              )}
                            </div>
                          </div>

                          <Space direction="vertical">
                            <Button
                              type="link"
                              icon={<SyncOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSync(subscription.id);
                              }}
                              loading={syncingIds.has(subscription.id)}
                            >
                              立即同步
                            </Button>
                            <Button
                              type="link"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(subscription);
                              }}
                            >
                              编辑
                            </Button>
                            <Popconfirm
                              title="确定要删除这个订阅吗？"
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                handleDelete(subscription.id);
                              }}
                            >
                              <Button 
                                type="link" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </>
          )}
        </Spin>

        {/* 订阅推荐 */}
        {subscriptions.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <SubscriptionRecommendations onCreateSubscription={handleSubmit} />
          </div>
        )}

        {/* 创建/编辑订阅弹窗 */}
        <Modal
          title={editingSubscription ? '编辑订阅' : '新建订阅'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="contentType"
              label="内容类型"
              rules={[{ required: true, message: '请选择内容类型' }]}
            >
              <Select placeholder="选择内容类型">
                <Select.Option value="paper">论文</Select.Option>
                <Select.Option value="video">视频</Select.Option>
                <Select.Option value="repo">GitHub项目</Select.Option>
                <Select.Option value="huggingface">HuggingFace模型</Select.Option>
                <Select.Option value="job">招聘岗位</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="keywords"
              label="关键词"
              rules={[
                { required: true, message: '请输入至少一个关键词' },
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === '') {
                      return Promise.reject(new Error('请输入至少一个关键词'));
                    }
                    const keywords = value.split(',').map((k: string) => k.trim()).filter((k: string) => k);
                    if (keywords.length === 0) {
                      return Promise.reject(new Error('请输入至少一个关键词'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              tooltip="多个关键词用逗号分隔，例如：embodied AI, robotics, computer vision"
            >
              <TextArea
                rows={3}
                placeholder="输入关键词，用逗号分隔（必填）"
              />
            </Form.Item>

            <Form.Item
              name="tags"
              label="标签"
              tooltip="多个标签用逗号分隔"
            >
              <Input placeholder="输入标签，用逗号分隔" />
            </Form.Item>

            <Form.Item
              name="authors"
              label="作者（仅论文）"
              tooltip="多个作者用逗号分隔"
            >
              <Input placeholder="输入作者名称，用逗号分隔" />
            </Form.Item>

            <Form.Item
              name="notifyEnabled"
              label="启用通知"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>

            {editingSubscription && (
              <Form.Item
                name="isActive"
                label="启用订阅"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* 创建/编辑分组弹窗 */}
        <Modal
          title={editingGroup ? '编辑分组' : '新建分组'}
          open={groupModalVisible}
          onOk={() => groupForm.submit()}
          onCancel={() => {
            setGroupModalVisible(false);
            groupForm.resetFields();
            setEditingGroup(null);
          }}
          width={500}
        >
          <Form
            form={groupForm}
            layout="vertical"
            onFinish={handleGroupSubmit}
          >
            <Form.Item
              name="name"
              label="分组名称"
              rules={[{ required: true, message: '请输入分组名称' }]}
            >
              <Input placeholder="输入分组名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="分组描述"
            >
              <TextArea rows={3} placeholder="输入分组描述（可选）" />
            </Form.Item>

            <Form.Item
              name="color"
              label="分组颜色"
              initialValue="blue"
            >
              <Select>
                <Select.Option value="blue">蓝色</Select.Option>
                <Select.Option value="green">绿色</Select.Option>
                <Select.Option value="purple">紫色</Select.Option>
                <Select.Option value="orange">橙色</Select.Option>
                <Select.Option value="red">红色</Select.Option>
                <Select.Option value="cyan">青色</Select.Option>
                <Select.Option value="magenta">洋红</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </div>
  );
}
