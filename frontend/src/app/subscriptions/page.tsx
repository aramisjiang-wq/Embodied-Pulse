'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import {
  Switch, Modal, Form, Input, Select, App, Card,
  Dropdown, MenuProps, Badge, Checkbox, Popconfirm, Spin, Button,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
  SyncOutlined,
  MoreOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  StarOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { subscriptionApi, Subscription } from '@/lib/api/subscription';
import dayjs from 'dayjs';
import { SubscriptionRecommendations } from '@/components/SubscriptionRecommendations';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const { TextArea } = Input;

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'paper', label: '论文', icon: <FileTextOutlined /> },
  { key: 'video', label: '视频', icon: <PlayCircleOutlined /> },
  { key: 'repo', label: 'GitHub', icon: <GithubOutlined /> },
  { key: 'huggingface', label: 'HF 模型', icon: <RobotOutlined /> },
  { key: 'job', label: '招聘', icon: <TeamOutlined /> },
];

type TypeConfigEntry = { label: string; icon: React.ReactNode; cls: string };

const TYPE_CONFIG: Record<string, TypeConfigEntry> = {
  paper: { label: '论文', icon: <FileTextOutlined />, cls: styles.typePaper },
  video: { label: '视频', icon: <PlayCircleOutlined />, cls: styles.typeVideo },
  repo: { label: 'GitHub', icon: <GithubOutlined />, cls: styles.typeRepo },
  huggingface: { label: 'HF 模型', icon: <RobotOutlined />, cls: styles.typeHF },
  job: { label: '招聘', icon: <TeamOutlined />, cls: styles.typeJob },
};

export default function SubscriptionsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [form] = Form.useForm();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }
    loadSubscriptions();
  }, [hydrated, user, activeTab]);

  const loadSubscriptions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, size: 100 };
      if (activeTab !== 'all') params.contentType = activeTab;
      const data = await subscriptionApi.getSubscriptions(params);
      let list: Subscription[] = [];
      if (data && Array.isArray(data.items)) list = data.items;
      else if (Array.isArray(data)) list = data;
      setSubscriptions(list);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
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
          message.success('批量同步完成');
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
      }
      setSelectedSubscriptions(new Set());
      loadSubscriptions();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const batchMenuItems: MenuProps['items'] = [
    { key: 'sync', label: '立即同步', icon: <SyncOutlined /> },
    { key: 'activate', label: '批量启用', icon: <BellOutlined /> },
    { key: 'deactivate', label: '批量停用' },
    { type: 'divider' },
    { key: 'delete', label: '批量删除', icon: <DeleteOutlined />, danger: true },
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
      message.success('已删除');
      loadSubscriptions();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleSync = async (subscriptionId: string) => {
    try {
      setSyncingIds(prev => new Set(prev).add(subscriptionId));
      const result = await subscriptionApi.syncSubscription(subscriptionId);
      message.success(`同步完成：匹配 ${result.matchedCount} 条，新增 ${result.newCount} 条`);
      loadSubscriptions();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '同步失败');
    } finally {
      setSyncingIds(prev => {
        const s = new Set(prev);
        s.delete(subscriptionId);
        return s;
      });
    }
  };

  const handleViewDetail = (id: string) => {
    router.push(`/subscriptions/${id}`);
  };

  const handleSubmit = async (values: {
    contentType: string;
    keywords: string | string[];
    tags?: string | string[];
    authors?: string | string[];
    notifyEnabled?: boolean;
    isActive?: boolean;
  }) => {
    try {
      const keywords = Array.isArray(values.keywords)
        ? values.keywords
        : values.keywords
          ? values.keywords.split(',').map(k => k.trim()).filter(k => k)
          : [];
      const tags = Array.isArray(values.tags)
        ? values.tags
        : values.tags
          ? values.tags.split(',').map(t => t.trim()).filter(t => t)
          : [];
      const authors = Array.isArray(values.authors)
        ? values.authors
        : values.authors
          ? values.authors.split(',').map(a => a.trim()).filter(a => a)
          : [];

      const contentType = values.contentType as 'paper' | 'video' | 'repo' | 'job' | 'huggingface' | 'post';
      if (editingSubscription) {
        await subscriptionApi.updateSubscription(editingSubscription.id, {
          contentType,
          keywords,
          tags,
          authors,
          notifyEnabled: values.notifyEnabled,
          isActive: values.isActive,
        });
        message.success('更新成功');
      } else {
        await subscriptionApi.createSubscription({
          contentType,
          keywords,
          tags,
          authors,
          notifyEnabled: values.notifyEnabled ?? true,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      loadSubscriptions();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedSubscriptions);
    checked ? next.add(id) : next.delete(id);
    setSelectedSubscriptions(next);
  };

  if (!user) return null;

  const displayedSubs = subscriptions;
  const totalNew = subscriptions.reduce((sum, s) => sum + (s.newCount || 0), 0);
  const totalMatched = subscriptions.reduce((sum, s) => sum + (s.totalMatched || 0), 0);
  const activeCount = subscriptions.filter(s => s.isActive).length;

  return (
    <PageContainer loading={loading && subscriptions.length === 0}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>订阅管理</h1>
            <p className={styles.pageDesc}>自动追踪并推送匹配你兴趣的最新内容</p>
          </div>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <PlusOutlined /> 新建订阅
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsBar}>
          {[
            { value: subscriptions.length, label: '全部订阅' },
            { value: activeCount, label: '已启用', cls: styles.statGreen },
            { value: totalNew, label: '新内容', cls: styles.statBlue },
            { value: totalMatched, label: '总匹配' },
          ].map(({ value, label, cls }) => (
            <div key={label} className={styles.statItem}>
              <span className={`${styles.statValue}${cls ? ' ' + cls : ''}`}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filterTabs}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                className={`${styles.filterTab}${activeTab === tab.key ? ' ' + styles.filterTabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.toolbarRight}>
            {selectedSubscriptions.size > 0 && (
              <Badge count={selectedSubscriptions.size} size="small">
                <Dropdown menu={{ items: batchMenuItems, onClick: ({ key }) => handleBatchAction(key) }}>
                  <Button size="small">批量操作 <MoreOutlined /></Button>
                </Dropdown>
              </Badge>
            )}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewToggleBtn}${viewMode === 'card' ? ' ' + styles.viewToggleBtnActive : ''}`}
                onClick={() => setViewMode('card')}
                title="卡片视图"
              >
                <AppstoreOutlined />
              </button>
              <button
                className={`${styles.viewToggleBtn}${viewMode === 'list' ? ' ' + styles.viewToggleBtnActive : ''}`}
                onClick={() => setViewMode('list')}
                title="列表视图"
              >
                <UnorderedListOutlined />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <Spin spinning={loading}>
          {displayedSubs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><StarOutlined /></div>
              <p className={styles.emptyTitle}>还没有订阅</p>
              <p className={styles.emptyDesc}>创建订阅后，系统会自动追踪并推送匹配的内容</p>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                <PlusOutlined /> 创建第一个订阅
              </button>
            </div>
          ) : viewMode === 'card' ? (
            <div className={styles.cardGrid}>
              {displayedSubs.map(sub => {
                const keywords: string[] = sub.keywords ? JSON.parse(sub.keywords) : [];
                const isSelected = selectedSubscriptions.has(sub.id);
                const tc = TYPE_CONFIG[sub.contentType];

                return (
                  <div
                    key={sub.id}
                    className={`${styles.subCard}${isSelected ? ' ' + styles.subCardSelected : ''}`}
                    onClick={() => handleViewDetail(sub.id)}
                  >
                    <div
                      className={styles.cardCheckboxWrap}
                      onClick={e => e.stopPropagation()}
                    >
                      <Checkbox
                        className={styles.cardCheckbox}
                        checked={isSelected}
                        onChange={e => toggleSelect(sub.id, e.target.checked)}
                      />
                    </div>

                    <div className={styles.cardHead}>
                      {tc && (
                        <span className={`${styles.typeBadge} ${tc.cls}`}>
                          {tc.icon}&nbsp;{tc.label}
                        </span>
                      )}
                      <span className={styles.cardStatus}>
                        <span className={`${styles.statusDot} ${sub.isActive ? styles.dotActive : styles.dotInactive}`} />
                        <span className={styles.statusText}>{sub.isActive ? '运行中' : '已停用'}</span>
                      </span>
                    </div>

                    <div className={styles.keywordsArea}>
                      {keywords.slice(0, 4).map((kw, i) => (
                        <span key={i} className={styles.kwTag}>{kw}</span>
                      ))}
                      {keywords.length > 4 && <span className={styles.kwMore}>+{keywords.length - 4}</span>}
                      {keywords.length === 0 && <span className={styles.kwEmpty}>暂无关键词</span>}
                    </div>

                    <div className={styles.cardFoot}>
                      <div className={styles.cardMetrics}>
                        <span className={styles.metric}>
                          <span className={`${styles.metricVal}${(sub.newCount || 0) > 0 ? ' ' + styles.metricNew : ''}`}>
                            {sub.newCount || 0}
                          </span>
                          <span className={styles.metricLbl}>新</span>
                        </span>
                        <span className={styles.metricDiv} />
                        <span className={styles.metric}>
                          <span className={styles.metricVal}>{sub.totalMatched || 0}</span>
                          <span className={styles.metricLbl}>匹配</span>
                        </span>
                      </div>

                      <div className={styles.cardActs} onClick={e => e.stopPropagation()}>
                        <button
                          className={styles.actBtn}
                          onClick={() => handleSync(sub.id)}
                          title="立即同步"
                          disabled={syncingIds.has(sub.id)}
                        >
                          <SyncOutlined spin={syncingIds.has(sub.id)} />
                        </button>
                        <button
                          className={styles.actBtn}
                          onClick={() => handleEdit(sub)}
                          title="编辑"
                        >
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="确定要删除这个订阅吗？"
                          onConfirm={() => handleDelete(sub.id)}
                        >
                          <button
                            className={`${styles.actBtn} ${styles.actBtnDanger}`}
                            onClick={e => e.stopPropagation()}
                            title="删除"
                          >
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.listContainer}>
              {displayedSubs.map(sub => {
                const keywords: string[] = sub.keywords ? JSON.parse(sub.keywords) : [];
                const isSelected = selectedSubscriptions.has(sub.id);
                const tc = TYPE_CONFIG[sub.contentType];

                return (
                  <div
                    key={sub.id}
                    className={`${styles.listItem}${isSelected ? ' ' + styles.listItemSelected : ''}`}
                    onClick={() => handleViewDetail(sub.id)}
                  >
                    <div onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={e => toggleSelect(sub.id, e.target.checked)}
                      />
                    </div>

                    {tc && (
                      <span className={`${styles.typeBadge} ${tc.cls}`}>
                        {tc.icon}&nbsp;{tc.label}
                      </span>
                    )}

                    <span className={`${styles.statusDot} ${sub.isActive ? styles.dotActive : styles.dotInactive}`} />

                    <div className={styles.listKeywords}>
                      {keywords.slice(0, 6).map((kw, i) => (
                        <span key={i} className={styles.kwTag}>{kw}</span>
                      ))}
                      {keywords.length > 6 && <span className={styles.kwMore}>+{keywords.length - 6}</span>}
                      {keywords.length === 0 && <span className={styles.kwEmpty}>暂无关键词</span>}
                    </div>

                    <div className={styles.listMetrics}>
                      {(sub.newCount || 0) > 0 && (
                        <span className={styles.newBadge}>{sub.newCount} 新</span>
                      )}
                      <span className={styles.listStat}>{sub.totalMatched || 0} 匹配</span>
                      {sub.lastSyncAt && (
                        <span className={styles.listDate}>{dayjs(sub.lastSyncAt).format('MM-DD HH:mm')}</span>
                      )}
                    </div>

                    <div className={styles.listActs} onClick={e => e.stopPropagation()}>
                      <button
                        className={styles.actBtn}
                        onClick={() => handleSync(sub.id)}
                        title="同步"
                        disabled={syncingIds.has(sub.id)}
                      >
                        <SyncOutlined spin={syncingIds.has(sub.id)} />
                      </button>
                      <button
                        className={styles.actBtn}
                        onClick={() => handleEdit(sub)}
                        title="编辑"
                      >
                        <EditOutlined />
                      </button>
                      <Popconfirm
                        title="确定删除？"
                        onConfirm={() => handleDelete(sub.id)}
                      >
                        <button
                          className={`${styles.actBtn} ${styles.actBtnDanger}`}
                          onClick={e => e.stopPropagation()}
                          title="删除"
                        >
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Spin>

        {/* Recommendations */}
        {subscriptions.length > 0 && (
          <div className={styles.recsSection}>
            <Card styles={{ body: { padding: '20px 24px' } }}>
              <SubscriptionRecommendations
                onCreateSubscription={async (data) => {
                  await handleSubmit({
                    contentType: data.contentType,
                    keywords: data.keywords,
                    tags: data.tags,
                    authors: data.authors,
                    notifyEnabled: data.notifyEnabled ?? true,
                  });
                }}
              />
            </Card>
          </div>
        )}

        {/* Create / Edit Subscription Modal */}
        <Modal
          title={editingSubscription ? '编辑订阅' : '新建订阅'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => { setModalVisible(false); form.resetFields(); }}
          width={560}
          okText="确认"
          cancelText="取消"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ paddingTop: 8 }}>
            <Form.Item
              name="contentType"
              label="内容类型"
              rules={[{ required: true, message: '请选择内容类型' }]}
            >
              <Select placeholder="选择内容类型">
                <Select.Option value="paper">论文</Select.Option>
                <Select.Option value="video">视频</Select.Option>
                <Select.Option value="repo">GitHub 项目</Select.Option>
                <Select.Option value="huggingface">HuggingFace 模型</Select.Option>
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
                    if (!value?.trim()) return Promise.reject(new Error('请输入至少一个关键词'));
                    const kws = value.split(',').map((k: string) => k.trim()).filter((k: string) => k);
                    return kws.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('请输入至少一个关键词'));
                  },
                },
              ]}
              tooltip="多个关键词用逗号分隔，例如：embodied AI, robotics"
            >
              <TextArea rows={3} placeholder="输入关键词，用逗号分隔（必填）" />
            </Form.Item>

            <Form.Item name="tags" label="标签" tooltip="多个标签用逗号分隔">
              <Input placeholder="输入标签，用逗号分隔" />
            </Form.Item>

            <Form.Item name="authors" label="作者（仅论文）" tooltip="多个作者用逗号分隔">
              <Input placeholder="输入作者名称，用逗号分隔" />
            </Form.Item>

            <Form.Item name="notifyEnabled" label="启用通知" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>

            {editingSubscription && (
              <Form.Item name="isActive" label="启用订阅" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
          </Form>
        </Modal>

      </div>
    </PageContainer>
  );
}
