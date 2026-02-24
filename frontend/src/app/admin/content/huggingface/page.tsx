/**
 * 管理端 - HuggingFace模型管理页面
 * 支持订阅作者，自动同步作者的新模型
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Button, 
  Space, 
  Table, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Tag, 
  Popconfirm, 
  Empty, 
  App, 
  Card, 
  Row, 
  Col,
  Switch,
  Select,
  Tooltip,
  Statistic,
  Badge,
  Tabs,
  Drawer,
  Descriptions,
  Typography,
  DatePicker,
  Divider,
  message,
} from 'antd';

const { TextArea } = Input;
import { 
  PlusOutlined, 
  RobotOutlined, 
  SearchOutlined, 
  ClearOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  LinkOutlined,
  TagOutlined,
  FireOutlined,
  DownloadOutlined,
  HeartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import type { HuggingFaceModel } from '@/lib/api/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './page.module.css';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface HuggingFaceAuthorSubscription {
  id: string;
  author: string;
  authorUrl: string;
  isActive: boolean;
  modelCount: number;
  tags?: string[];
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TAG_COLORS = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
];

const PREDEFINED_TAGS = [
  '机器人',
  '具身智能',
  '计算机视觉',
  '深度学习',
  '强化学习',
  '自然语言处理',
  '多模态',
  '大模型',
  '仿真',
  '控制',
  '导航',
  '抓取',
  '操作',
  '学术',
  '工业',
  '服务',
  '教育',
  '医疗',
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'model', label: '模型', icon: <RobotOutlined /> },
  { value: 'dataset', label: '数据集', icon: <DatabaseOutlined /> },
  { value: 'space', label: 'Space', icon: <AppstoreOutlined /> },
];

const TASK_OPTIONS = [
  'text-to-image',
  'image-to-text',
  'text-to-video',
  'image-classification',
  'object-detection',
  'semantic-segmentation',
  'instance-segmentation',
  'text-generation',
  'fill-mask',
  'translation',
  'summarization',
  'question-answering',
  'token-classification',
  'sequence-classification',
  'robotics',
  'reinforcement-learning',
  'others',
];

const SORT_OPTIONS = [
  { value: 'latest', label: '最新更新' },
  { value: 'downloads', label: '下载最多' },
  { value: 'likes', label: '点赞最多' },
  { value: 'hot', label: '热门' },
];

export default function HuggingFaceAuthorSubscriptionPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [subscriptions, setSubscriptions] = useState<HuggingFaceAuthorSubscription[]>([]);
  const [form] = Form.useForm();
  const [tagsForm] = Form.useForm();
  const [modelForm] = Form.useForm();
  const [authorUrl, setAuthorUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<HuggingFaceAuthorSubscription | null>(null);

  // 模型列表（完整CRUD）
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsPagination, setModelsPagination] = useState({ page: 1, size: 20, total: 0 });
  const [activeTab, setActiveTab] = useState<string>('models');
  
  // 搜索和筛选
  const [keyword, setKeyword] = useState('');
  const [inputKeyword, setInputKeyword] = useState('');
  const [taskFilter, setTaskFilter] = useState<string | undefined>();
  const [contentTypeFilter, setContentTypeFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string>('latest');
  
  // 编辑状态
  const [editingModel, setEditingModel] = useState<HuggingFaceModel | null>(null);
  const [viewingModel, setViewingModel] = useState<HuggingFaceModel | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'models') {
      loadModels();
    }
  }, [activeTab, modelsPagination.page, modelsPagination.size, taskFilter, contentTypeFilter, sortBy]);

  // 当keyword变化时重新加载
  useEffect(() => {
    if (activeTab === 'models') {
      loadModels(1, keyword);
    }
  }, [keyword]);

  const loadModels = useCallback(async (pageNum = modelsPagination.page, searchKeyword = keyword) => {
    setModelsLoading(true);
    try {
      const params: Record<string, string | number> = { 
        page: pageNum, 
        size: modelsPagination.size,
        sort: sortBy,
      };
      if (searchKeyword) params.keyword = searchKeyword;
      if (taskFilter) params.task = taskFilter;
      if (contentTypeFilter) params.contentType = contentTypeFilter;

      const response: any = await apiClient.get('/admin/huggingface-models', { params });
      if (response.code === 0 && response.data) {
        setModels(Array.isArray(response.data.items) ? response.data.items : []);
        const pagination = response.data.pagination;
        if (pagination) {
          setModelsPagination(prev => ({
            ...prev,
            page: pageNum,
            total: pagination.total ?? prev.total,
          }));
        }
      } else {
        setModels([]);
      }
    } catch (error: any) {
      console.error('Load models error:', error);
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, [modelsPagination.page, modelsPagination.size, keyword, taskFilter, contentTypeFilter, sortBy]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.get('/admin/huggingface-authors');
      if (response.code === 0) {
        setSubscriptions(Array.isArray(response.data) ? response.data : []);
      } else {
        messageApi.error(response.message || '加载失败');
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error('Load subscriptions error:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const parseAuthorFromUrl = (url: string): string | null => {
    if (!url.trim()) return null;
    
    const patterns = [
      /^https?:\/\/huggingface\.co\/([^\/\?#]+)/i,
      /^([^\/\s]+)$/i,
    ];
    for (const pattern of patterns) {
      const match = url.trim().match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const handleAddSubscription = async () => {
    try {
      const values = await form.validateFields();
      let author = values.author;
      let authorUrl = values.authorUrl || `https://huggingface.co/${author}`;

      if (values.authorUrl) {
        const parsedAuthor = parseAuthorFromUrl(values.authorUrl);
        if (parsedAuthor) {
          author = parsedAuthor;
          authorUrl = values.authorUrl;
        }
      }

      const response: any = await apiClient.post('/admin/huggingface-authors', {
        author,
        authorUrl,
      });

      if (response.code === 0) {
        messageApi.success('订阅添加成功');
        setShowModal(false);
        form.resetFields();
        setAuthorUrl('');
        loadSubscriptions();
      } else {
        messageApi.error(response.message || '添加失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      console.error('Add subscription error:', error);
      if (error.response?.data?.code === 6003) {
        messageApi.error('该作者已订阅');
      } else {
        messageApi.error(error.response?.data?.message || error.message || '添加失败');
      }
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const response: any = await apiClient.delete(`/admin/huggingface-authors/${id}`);
      if (response.code === 0) {
        messageApi.success('订阅删除成功');
        loadSubscriptions();
      } else {
        messageApi.error(response.message || '删除失败');
      }
    } catch (error: any) {
      console.error('Delete subscription error:', error);
      messageApi.error(error.response?.data?.message || error.message || '删除失败');
    }
  };

  const handleSync = async (subscription: HuggingFaceAuthorSubscription) => {
    setSyncingId(subscription.id);
    try {
      const response: any = await apiClient.post(`/admin/huggingface-authors/${subscription.id}/sync?limit=100`);

      if (response.code === 0) {
        messageApi.success(
          `同步完成：成功 ${response.data.synced} 个，失败 ${response.data.errors} 个`
        );
        loadSubscriptions();
      } else {
        messageApi.error(response.message || '同步失败');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      messageApi.error(error.response?.data?.message || error.message || '同步失败');
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleStatus = async (subscription: HuggingFaceAuthorSubscription) => {
    try {
      const response: any = await apiClient.patch(`/admin/huggingface-authors/${subscription.id}/toggle`, {
        isActive: !subscription.isActive,
      });

      if (response.code === 0) {
        messageApi.success(subscription.isActive ? '订阅已禁用' : '订阅已启用');
        loadSubscriptions();
      } else {
        messageApi.error(response.message || '操作失败');
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      messageApi.error(error.response?.data?.message || error.message || '操作失败');
    }
  };

  const handleUpdateTags = async () => {
    try {
      const values = await tagsForm.validateFields();
      const response: any = await apiClient.put(`/admin/huggingface-authors/${editingSubscription?.id}/tags`, {
        tags: values.tags || [],
      });

      if (response.code === 0) {
        messageApi.success('标签更新成功');
        setShowTagsModal(false);
        setEditingSubscription(null);
        tagsForm.resetFields();
        loadSubscriptions();
      } else {
        messageApi.error(response.message || '更新失败');
      }
    } catch (error: any) {
      console.error('Update tags error:', error);
      messageApi.error(error.response?.data?.message || error.message || '更新失败');
    }
  };

  const openTagsModal = (subscription: HuggingFaceAuthorSubscription) => {
    setEditingSubscription(subscription);
    tagsForm.setFieldsValue({
      tags: subscription.tags || [],
    });
    setShowTagsModal(true);
  };

  // ==================== 模型CRUD操作 ====================
  
  const handleSearch = () => {
    setKeyword(inputKeyword);
  };

  const handleReset = () => {
    setInputKeyword('');
    setKeyword('');
    setTaskFilter(undefined);
    setContentTypeFilter(undefined);
    setSortBy('latest');
    setModelsPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateModel = async (values: Record<string, unknown>) => {
    try {
      const payload: Record<string, unknown> = { ...values };
      
      if (values.lastModified) {
        payload.lastModified = (values.lastModified as dayjs.Dayjs).toISOString();
      }

      if (editingModel) {
        await apiClient.put(`/admin/huggingface-models/${editingModel.id}`, payload);
        messageApi.success('模型更新成功');
      } else {
        await apiClient.post('/admin/huggingface-models', payload);
        messageApi.success('模型创建成功');
      }
      
      setShowModal(false);
      setEditingModel(null);
      modelForm.resetFields();
      loadModels(modelsPagination.page);
    } catch (error: any) {
      console.error('Create/Update model error:', error);
      messageApi.error(error.response?.data?.message || error.message || '操作失败');
    }
  };

  const handleEditModel = (record: HuggingFaceModel) => {
    setEditingModel(record);
    modelForm.setFieldsValue({
      ...record,
      lastModified: record.lastModified ? dayjs(record.lastModified) : null,
      tags: record.tags ? (Array.isArray(record.tags) ? record.tags : String(record.tags).split(',')) : [],
    });
    setShowModal(true);
  };

  const handleViewModel = (record: HuggingFaceModel) => {
    setViewingModel(record);
    setShowDrawer(true);
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await apiClient.delete(`/admin/huggingface-models/${id}`);
      messageApi.success('删除成功');
      loadModels(modelsPagination.page);
    } catch (error: any) {
      console.error('Delete model error:', error);
      messageApi.error(error.response?.data?.message || error.message || '删除失败');
    }
  };

  const openCreateModelModal = () => {
    setEditingModel(null);
    modelForm.resetFields();
    setShowModal(true);
  };

  // ==================== 工具函数 ====================

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return dayjs(d).format('YYYY-MM-DD HH:mm:ss');
    } catch {
      return '-';
    }
  };

  const getTagColor = (tag: string, index: number) => {
    return TAG_COLORS[index % TAG_COLORS.length];
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const getContentTypeTag = (type?: string) => {
    switch (type) {
      case 'model': return <Tag icon={<RobotOutlined />} color="blue">模型</Tag>;
      case 'dataset': return <Tag icon={<DatabaseOutlined />} color="green">数据集</Tag>;
      case 'space': return <Tag icon={<AppstoreOutlined />} color="purple">Space</Tag>;
      default: return <Tag>未知</Tag>;
    }
  };

  // ==================== 表格列定义 ====================

  const modelColumns = [
    {
      title: '模型',
      key: 'model',
      width: 280,
      render: (_: unknown, record: HuggingFaceModel) => (
        <div className={styles.titleCell}>
          <Text strong className={styles.titleText} onClick={() => handleViewModel(record)}>
            {record.fullName}
          </Text>
          <div className={styles.titleMeta}>
            {record.description && (
              <Text type="secondary" className={styles.abstractPreview}>
                {record.description.slice(0, 80)}
                {record.description.length > 80 ? '…' : ''}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 90,
      render: (type: string) => getContentTypeTag(type),
    },
    {
      title: '任务',
      dataIndex: 'task',
      key: 'task',
      width: 140,
      render: (task: string) => task ? <Tag>{task}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (author: string) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text>{author || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '下载/点赞',
      key: 'stats',
      width: 100,
      render: (_: unknown, record: HuggingFaceModel) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <DownloadOutlined style={{ color: '#1890ff', fontSize: 11 }} />
            <Text style={{ fontSize: 12 }}>{formatNumber(record.downloads || 0)}</Text>
          </Space>
          <Space size={4}>
            <HeartOutlined style={{ color: '#f5222d', fontSize: 11 }} />
            <Text style={{ fontSize: 12 }}>{formatNumber(record.likes || 0)}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 160,
      sorter: (a: HuggingFaceModel, b: HuggingFaceModel) => 
        new Date(a.lastModified || 0).getTime() - new Date(b.lastModified || 0).getTime(),
      render: (date: string) => {
        if (!date) return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{dayjs(date).format('YYYY-MM-DD')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).fromNow()}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: HuggingFaceModel) => (
        <Space size={0} direction="vertical">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewModel(record)}
            className={styles.actionBtn}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditModel(record)}
            className={styles.actionBtn}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该模型?"
            description="删除后数据将无法恢复"
            onConfirm={() => handleDeleteModel(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className={styles.actionBtn}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const authorColumns = [
    {
      title: '作者',
      key: 'author',
      width: 150,
      render: (_: any, record: HuggingFaceAuthorSubscription) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <strong>{record.author}</strong>
        </Space>
      ),
    },
    {
      title: '作者主页',
      dataIndex: 'authorUrl',
      key: 'authorUrl',
      width: 200,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
          <LinkOutlined /> {url}
        </a>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[], record: HuggingFaceAuthorSubscription) => (
        <Space size={[0, 4]} wrap>
          {tags && tags.length > 0 ? (
            tags.map((tag, index) => (
              <Tag 
                key={tag} 
                color={getTagColor(tag, index)}
                style={{ fontSize: 12 }}
              >
                {tag}
              </Tag>
            ))
          ) : (
            <Button 
              type="link" 
              size="small" 
              icon={<TagOutlined />}
              onClick={() => openTagsModal(record)}
            >
              添加标签
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '模型数量',
      dataIndex: 'modelCount',
      key: 'modelCount',
      width: 100,
      sorter: (a: HuggingFaceAuthorSubscription, b: HuggingFaceAuthorSubscription) => a.modelCount - b.modelCount,
      render: (count: number) => (
        <Badge count={count} showZero color="#52c41a" />
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncAt',
      key: 'lastSyncAt',
      width: 160,
      sorter: (a: HuggingFaceAuthorSubscription, b: HuggingFaceAuthorSubscription) => 
        (a.lastSyncAt?.getTime() || 0) - (b.lastSyncAt?.getTime() || 0),
      render: (date: string | Date | null) => (
        <Tooltip title={formatDate(date)}>
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#52c41a' }} />
            <span>{formatDate(date)}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: HuggingFaceAuthorSubscription) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: HuggingFaceAuthorSubscription) => (
        <Space>
          <Tooltip title="编辑标签">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openTagsModal(record)}
            />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            loading={syncingId === record.id}
            onClick={() => handleSync(record)}
            disabled={!record.isActive}
          >
            同步
          </Button>
          <Popconfirm
            title="确认删除此订阅?"
            description="删除后不会影响已同步的模型"
            onConfirm={() => handleDeleteSubscription(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 统计数据
  const statsData = [
    {
      label: '模型总数',
      value: modelsPagination.total,
      suffix: '个',
      color: '#1677ff',
      icon: <RobotOutlined />,
    },
    {
      label: '数据集',
      value: models.filter(m => m.contentType === 'dataset').length,
      suffix: '个',
      color: '#13c2c2',
      icon: <DatabaseOutlined />,
    },
    {
      label: 'Spaces',
      value: models.filter(m => m.contentType === 'space').length,
      suffix: '个',
      color: '#722ed1',
      icon: <AppstoreOutlined />,
    },
    {
      label: '本月新增',
      value: models.filter(m => m.createdAt ? dayjs(m.createdAt).isSame(dayjs(), 'month') : false).length,
      suffix: '个',
      color: '#52c41a',
      icon: <ClockCircleOutlined />,
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <RobotOutlined />
          </div>
          <div>
            <h1 className={styles.pageTitle}>HuggingFace 管理</h1>
            <Text type="secondary" className={styles.pageSubtitle}>
              共 <strong>{modelsPagination.total}</strong> 个模型收录
            </Text>
          </div>
          <div className={styles.statsInline}>
            {statsData.map((s) => (
              <div key={s.label} className={styles.statBadge}>
                <span className={styles.statIcon} style={{ color: s.color }}>
                  {s.icon}
                </span>
                <span className={styles.statValue} style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <Space>
          {activeTab === 'authors' && (
            <>
              <Button icon={<ReloadOutlined />} onClick={() => loadSubscriptions()}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setAuthorUrl('');
                form.resetFields();
                setShowModal(true);
              }}>
                新增订阅
              </Button>
            </>
          )}
          {activeTab === 'models' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModelModal}>
              新增模型
            </Button>
          )}
        </Space>
      </div>

      <Divider className={styles.headerDivider} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'models',
            label: '模型列表',
            children: (
              <>
                <div className={styles.toolbar}>
                  <Space size={8} wrap>
                    <Input
                      placeholder="搜索模型名称、描述…"
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      value={inputKeyword}
                      onChange={(e) => setInputKeyword(e.target.value)}
                      onPressEnter={handleSearch}
                      allowClear
                      onClear={() => {
                        setInputKeyword('');
                        setKeyword('');
                      }}
                      className={styles.searchInput}
                    />
                    <Select
                      placeholder="内容类型"
                      value={contentTypeFilter}
                      onChange={setContentTypeFilter}
                      allowClear
                      className={styles.filterSelect}
                      options={CONTENT_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    />
                    <Select
                      placeholder="任务类型"
                      value={taskFilter}
                      onChange={setTaskFilter}
                      allowClear
                      className={styles.filterSelect}
                      options={TASK_OPTIONS.map(t => ({ value: t, label: t }))}
                    />
                    <Select
                      value={sortBy}
                      onChange={setSortBy}
                      className={styles.sortSelect}
                      options={SORT_OPTIONS}
                    />
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                    >
                      搜索
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                    >
                      重置
                    </Button>
                  </Space>
                </div>

                {models.length === 0 && !modelsLoading ? (
                  <Empty description="暂无模型数据" style={{ padding: '40px 0' }} />
                ) : (
                  <Table
                    rowKey="id"
                    loading={modelsLoading}
                    dataSource={models}
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: modelsPagination.page,
                      pageSize: modelsPagination.size,
                      total: modelsPagination.total,
                      showTotal: (total) => `共 ${total} 条`,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      onChange: (page, size) => setModelsPagination(prev => ({ ...prev, page, size: size || prev.size })),
                    }}
                    size="middle"
                    columns={modelColumns}
                    onRow={(record) => ({
                      onDoubleClick: () => handleViewModel(record),
                    })}
                  />
                )}
              </>
            ),
          },
          {
            key: 'authors',
            label: '作者订阅',
            children: (
              <>
                <Row gutter={16} className={styles.statsRow}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总订阅数"
              value={subscriptions.length}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总模型数"
              value={subscriptions.reduce((sum, item) => sum + (item.modelCount || 0), 0)}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => formatNumber(Number(value))}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用订阅"
              value={subscriptions.filter(s => s.isActive).length}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="有标签作者"
              value={subscriptions.filter(s => s.tags && s.tags.length > 0).length}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {subscriptions.length === 0 && !loading ? (
        <Empty description="暂无订阅" style={{ padding: '40px 0' }} />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={subscriptions}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="middle"
          columns={authorColumns}
        />
      )}
              </>
            ),
          },
        ]}
      />

      {/* 新增/编辑订阅弹窗 */}
      <Modal
        title="新增订阅"
        open={showModal && !editingModel && activeTab === 'authors'}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setAuthorUrl('');
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleAddSubscription} layout="vertical">
          <Form.Item
            name="author"
            label="作者名称"
            rules={[{ required: true, message: '请输入作者名称' }]}
          >
            <Input placeholder="例如: akhaliq" />
          </Form.Item>
          <Form.Item
            name="authorUrl"
            label="作者主页URL（可选）"
          >
            <Input
              placeholder="https://huggingface.co/akhaliq"
              value={authorUrl}
              onChange={(e) => setAuthorUrl(e.target.value)}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={() => setAuthorUrl('')}
                />
              }
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加订阅
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑标签弹窗 */}
      <Modal
        title={`编辑标签 - ${editingSubscription?.author}`}
        open={showTagsModal}
        onCancel={() => {
          setShowTagsModal(false);
          setEditingSubscription(null);
          tagsForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={tagsForm} onFinish={handleUpdateTags} layout="vertical">
          <Form.Item
            name="tags"
            label="标签"
            tooltip="为作者添加标签，便于分类和管理"
          >
            <Select
              mode="tags"
              placeholder="选择或输入标签"
              style={{ width: '100%' }}
              options={PREDEFINED_TAGS.map(tag => ({ label: tag, value: tag }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存标签
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增/编辑模型弹窗 */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1677ff' }} />
            <span>{editingModel ? '编辑模型' : '新增模型'}</span>
          </Space>
        }
        open={showModal && (activeTab === 'models' || !!editingModel)}
        onCancel={() => {
          setShowModal(false);
          setEditingModel(null);
          modelForm.resetFields();
        }}
        footer={null}
        width={720}
        destroyOnHidden
        className={styles.modal}
      >
        <Divider style={{ margin: '12px 0 20px' }} />
        <Form 
          form={modelForm} 
          onFinish={handleCreateModel} 
          layout="vertical" 
          requiredMark="optional"
        >
          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              基本信息
            </Text>
            <Form.Item
              name="fullName"
              label="完整名称"
              rules={[{ required: true, message: '请输入模型完整名称（格式：author/model-name）' }]}
            >
              <Input placeholder="例如: stabilityai/stable-diffusion-2-1" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea
                rows={3}
                placeholder="请输入模型描述（可选）"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </div>

          <Divider dashed style={{ margin: '4px 0 16px' }} />

          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              分类信息
            </Text>
            <div className={styles.formRow}>
              <Form.Item name="contentType" label="内容类型" style={{ flex: 1 }}>
                <Select
                  placeholder="选择内容类型"
                  options={[
                    { value: 'model', label: '模型' },
                    { value: 'dataset', label: '数据集' },
                    { value: 'space', label: 'Space' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="task" label="任务类型" style={{ flex: 1 }}>
                <Select
                  placeholder="选择任务类型"
                  allowClear
                  options={TASK_OPTIONS.map(t => ({ value: t, label: t }))}
                />
              </Form.Item>
            </div>
            <div className={styles.formRow}>
              <Form.Item name="author" label="作者" style={{ flex: 1 }}>
                <Input placeholder="例如: stabilityai" />
              </Form.Item>
              <Form.Item name="license" label="许可证" style={{ flex: 1 }}>
                <Input placeholder="例如: openrail++" />
              </Form.Item>
            </div>
            <Form.Item name="tags" label="标签">
              <Select
                mode="tags"
                placeholder="输入标签后按 Enter 添加"
                tokenSeparators={[',']}
                open={false}
              />
            </Form.Item>
          </div>

          <Divider dashed style={{ margin: '4px 0 16px' }} />

          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              统计数据
            </Text>
            <div className={styles.formRow}>
              <Form.Item name="downloads" label="下载量" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
              <Form.Item name="likes" label="点赞数" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </div>
            <Form.Item name="lastModified" label="最后更新时间">
              <DatePicker style={{ width: '100%' }} showTime placeholder="选择更新时间" />
            </Form.Item>
          </div>

          <div className={styles.formFooter}>
            <Button
              onClick={() => {
                setShowModal(false);
                setEditingModel(null);
                modelForm.resetFields();
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" icon={editingModel ? <EditOutlined /> : <PlusOutlined />}>
              {editingModel ? '保存修改' : '创建模型'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 模型详情抽屉 */}
      <Drawer
        title={
          <Space>
            <RobotOutlined style={{ color: '#1677ff' }} />
            <span className={styles.drawerTitle}>模型详情</span>
          </Space>
        }
        open={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setViewingModel(null);
        }}
        width={600}
        extra={
          viewingModel && (
            <Space>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setShowDrawer(false);
                  handleEditModel(viewingModel);
                }}
              >
                编辑
              </Button>
            </Space>
          )
        }
      >
        {viewingModel && (
          <div className={styles.drawerContent}>
            <h2 className={styles.drawerPaperTitle}>{viewingModel.fullName}</h2>

            <div className={styles.drawerMeta}>
              {getContentTypeTag(viewingModel.contentType)}
              {viewingModel.task && <Tag>{viewingModel.task}</Tag>}
              {viewingModel.license && <Tag color="orange">{viewingModel.license}</Tag>}
            </div>

            <Divider className={styles.drawerDivider} />

            {viewingModel.description && (
              <div className={styles.drawerSection}>
                <Text type="secondary" className={styles.sectionLabel}>
                  描述
                </Text>
                <Text className={styles.abstractText}>
                  {viewingModel.description}
                </Text>
              </div>
            )}

            <div className={styles.drawerSection}>
              <Text type="secondary" className={styles.sectionLabel}>
                标签
              </Text>
              <Space size={[6, 6]} wrap>
                {viewingModel.tags && viewingModel.tags.length > 0 ? (
                  (Array.isArray(viewingModel.tags) ? viewingModel.tags : String(viewingModel.tags).split(',')).map((t: string, i: number) => (
                    <Tag key={i} color={getTagColor(t, i)}>
                      {t}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </Space>
            </div>

            <Divider className={styles.drawerDivider} />

            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="作者">
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  {viewingModel.author || '—'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="许可证">
                {viewingModel.license || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="下载量">
                <Space size={4}>
                  <DownloadOutlined style={{ color: '#1890ff' }} />
                  {formatNumber(viewingModel.downloads || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="点赞数">
                <Space size={4}>
                  <HeartOutlined style={{ color: '#f5222d' }} />
                  {formatNumber(viewingModel.likes || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="浏览量">
                <Space size={4}>
                  <EyeOutlined style={{ color: '#52c41a' }} />
                  {formatNumber(viewingModel.viewCount || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="收藏数">
                <Space size={4}>
                  <FireOutlined style={{ color: '#fa8c16' }} />
                  {formatNumber(viewingModel.favoriteCount || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>
                {viewingModel.lastModified ? dayjs(viewingModel.lastModified).format('YYYY-MM-DD HH:mm:ss') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="收录时间" span={2}>
                {viewingModel.createdAt ? dayjs(viewingModel.createdAt).format('YYYY-MM-DD HH:mm:ss') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新" span={2}>
                {viewingModel.updatedAt ? dayjs(viewingModel.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '—'}
              </Descriptions.Item>
            </Descriptions>

            {viewingModel.author && (
              <div className={styles.drawerSection} style={{ marginTop: 16 }}>
                <a
                  href={
                    (() => {
                      const contentType = viewingModel.contentType || 'model';
                      if (contentType === 'dataset') {
                        return `https://huggingface.co/datasets/${viewingModel.fullName}`;
                      } else if (contentType === 'space') {
                        return `https://huggingface.co/spaces/${viewingModel.fullName}`;
                      }
                      return `https://huggingface.co/${viewingModel.fullName}`;
                    })()
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfLink}
                >
                  <LinkOutlined />
                  在 HuggingFace 查看
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
