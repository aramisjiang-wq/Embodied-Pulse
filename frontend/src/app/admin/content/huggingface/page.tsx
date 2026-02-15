/**
 * 管理端 - HuggingFace作者订阅管理页面
 * 支持订阅作者，自动同步作者的新模型
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Button, 
  Space, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Tag, 
  Popconfirm, 
  Empty, 
  App, 
  Card, 
  Row, 
  Col,
  Switch,
  Spin,
  Select,
  Tooltip,
  Statistic,
  Badge,
} from 'antd';
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
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';

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

export default function HuggingFaceAuthorSubscriptionPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<HuggingFaceAuthorSubscription[]>([]);
  const [form] = Form.useForm();
  const [tagsForm] = Form.useForm();
  const [authorUrl, setAuthorUrl] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<HuggingFaceAuthorSubscription | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

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
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        messageApi.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        messageApi.error('后端服务未运行，请确保后端服务已启动');
      } else {
        messageApi.error(error.response?.data?.message || error.message || '加载失败');
      }
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

  const handleDelete = async (id: string) => {
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

  const columns = [
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
            onConfirm={() => handleDelete(record.id)}
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>HuggingFace 作者订阅</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadSubscriptions()}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setAuthorUrl('');
            form.resetFields();
            setShowModal(true);
          }}>
            新增订阅
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
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
          columns={columns}
        />
      )}

      <Modal
        title="新增订阅"
        open={showModal}
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
    </div>
  );
}
