/**
 * 管理端 - 论文管理页面
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
  InputNumber, 
  DatePicker, 
  Tag, 
  Popconfirm, 
  Empty, 
  App, 
  Card, 
  Row, 
  Col,
  Tooltip,
  Badge,
  Descriptions,
  Collapse,
  Typography,
  Statistic
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  EyeOutlined, 
  HeartOutlined, 
  ShareAltOutlined,
  FileTextOutlined,
  LinkOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  FireOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

export default function PapersManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    loadPapers(1);
  }, []);

  const loadPapers = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/papers', {
        params: { page: pageNum, size },
      });
      if (response.code === 0) {
        setItems(response.data.items || []);
        setTotal(response.data.pagination?.total || 0);
        setPage(pageNum);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error: any) {
      console.error('Load papers error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        const errorMessage = error.response?.data?.message || error.message || '加载失败';
        message.error(errorMessage);
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const parseJsonField = (value?: string) => {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const payload = { ...values };

      if (payload.publishedDate) {
        payload.publishedDate = payload.publishedDate.toISOString();
      }

      const authors = parseJsonField(payload.authors);
      const categories = parseJsonField(payload.categories);
      if (authors === null || categories === null) {
        message.error('作者或分类需要是合法的JSON数组');
        return;
      }
      if (authors) payload.authors = authors;
      if (categories) payload.categories = categories;

      if (editingItem) {
        await apiClient.put(`/admin/content/papers/${editingItem.id}`, payload);
        message.success('更新成功!');
      } else {
        await apiClient.post('/admin/content/papers', payload);
        message.success('创建成功!');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadPapers(page);
    } catch (error: any) {
      console.error('Create/Update paper error:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      publishedDate: record.publishedDate ? dayjs(record.publishedDate) : null,
      authors: Array.isArray(record.authors) ? JSON.stringify(record.authors) : '',
      categories: Array.isArray(record.categories) ? JSON.stringify(record.categories) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/papers/${id}`);
      message.success('删除成功');
      loadPapers(page);
    } catch (error: any) {
      console.error('Delete paper error:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      message.error(errorMessage);
    }
  };

  const formatAuthors = (value: any) => {
    let authors: string[] = [];
    if (Array.isArray(value)) {
      authors = value;
    } else if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        authors = Array.isArray(parsed) ? parsed : [];
      } catch {
        authors = [];
      }
    }
    return authors.length > 0 ? (
      <Tooltip title={authors.join(', ')}>
        <Space size={[0, 4]} wrap>
          {authors.slice(0, 3).map((author: string, idx: number) => (
            <Tag key={idx} icon={<TeamOutlined />} color="blue" style={{ margin: 2 }}>
              {author}
            </Tag>
          ))}
          {authors.length > 3 && (
            <Tag color="default">+{authors.length - 3}</Tag>
          )}
        </Space>
      </Tooltip>
    ) : '-';
  };

  const formatCategories = (value: any) => {
    let categories: string[] = [];
    if (Array.isArray(value)) {
      categories = value;
    } else if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        categories = Array.isArray(parsed) ? parsed : [];
      } catch {
        categories = [];
      }
    }
    return categories.length > 0 ? (
      <Space size={[0, 4]} wrap>
        {categories.map((cat: string, idx: number) => (
          <Tag key={idx} icon={<BookOutlined />} color="purple" style={{ margin: 2 }}>
            {cat}
          </Tag>
        ))}
      </Space>
    ) : '-';
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const getRelativeTime = (date: string) => {
    if (!date) return '-';
    return dayjs(date).fromNow();
  };

  const expandedRowRender = (record: any) => {
    const authors = Array.isArray(record.authors) ? record.authors : 
                   (typeof record.authors === 'string' ? parseJsonField(record.authors) : []);
    const categories = Array.isArray(record.categories) ? record.categories : 
                      (typeof record.categories === 'string' ? parseJsonField(record.categories) : []);

    return (
      <Card 
        size="small" 
        variant="outlined"
        style={{ 
          background: '#fafafa',
          margin: '-12px -16px',
          padding: '16px'
        }}
      >
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="arXiv ID" span={1}>
            {record.arxivId ? (
              <Space>
                <Text code>{record.arxivId}</Text>
                <a 
                  href={`https://arxiv.org/abs/${record.arxivId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <LinkOutlined />
                </a>
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="PDF链接" span={1}>
            {record.pdfUrl ? (
              <a 
                href={record.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <FileTextOutlined />
                <Text>查看PDF</Text>
              </a>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="摘要" span={2}>
            {record.abstract ? (
              <Paragraph 
                ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                style={{ margin: 0 }}
              >
                {record.abstract}
              </Paragraph>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完整作者列表" span={2}>
            {authors && authors.length > 0 ? (
              <Space size={[0, 4]} wrap>
                {authors.map((author: string, idx: number) => (
                  <Tag key={idx} color="blue">
                    {author}
                  </Tag>
                ))}
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完整分类列表" span={2}>
            {categories && categories.length > 0 ? (
              <Space size={[0, 4]} wrap>
                {categories.map((cat: string, idx: number) => (
                  <Tag key={idx} color="purple">
                    {cat}
                  </Tag>
                ))}
              </Space>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={1}>
            <Space>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
              <Text>{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间" span={1}>
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text>{dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const columns = [
    {
      title: '论文标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      fixed: 'left' as const,
      render: (title: string, record: any) => (
        <div style={{ maxWidth: 280 }}>
          <Tooltip title={title}>
            <Text strong ellipsis style={{ fontSize: 14 }}>
              {title}
            </Text>
          </Tooltip>
          {record.arxivId && (
            <div style={{ marginTop: 4 }}>
              <Tag color="cyan" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                {record.arxivId}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'authors',
      key: 'authors',
      width: 220,
      render: formatAuthors,
    },
    {
      title: '会议/期刊',
      dataIndex: 'venue',
      key: 'venue',
      width: 140,
      render: (venue: string) => venue ? (
        <Tag icon={<BookOutlined />} color="orange">
          {venue}
        </Tag>
      ) : '-',
    },
    {
      title: '发布日期',
      dataIndex: 'publishedDate',
      key: 'publishedDate',
      width: 130,
      sorter: (a: any, b: any) => 
        new Date(a.publishedDate || 0).getTime() - new Date(b.publishedDate || 0).getTime(),
      render: (date: string) => {
        if (!date) return '-';
        return (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 13 }}>
                {dayjs(date).format('YYYY-MM-DD')}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {getRelativeTime(date)}
              </Text>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '引用数',
      dataIndex: 'citationCount',
      key: 'citationCount',
      width: 100,
      sorter: (a: any, b: any) => (a.citationCount || 0) - (b.citationCount || 0),
      render: (count: number) => (
        <Badge 
          count={formatNumber(count || 0)} 
          showZero 
          style={{ 
            backgroundColor: count > 100 ? '#ff4d4f' : count > 10 ? '#faad14' : '#52c41a',
            fontSize: 13,
            padding: '0 8px'
          }}
        />
      ),
    },
    {
      title: '分类',
      dataIndex: 'categories',
      key: 'categories',
      width: 180,
      render: formatCategories,
    },
    {
      title: '互动数据',
      key: 'stats',
      width: 140,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={4}>
          <Row gutter={8} align="middle">
            <Col span={8}>
              <Tooltip title="浏览量">
                <Space size={4}>
                  <EyeOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                  <Text style={{ fontSize: 12 }}>{formatNumber(record.viewCount || 0)}</Text>
                </Space>
              </Tooltip>
            </Col>
            <Col span={8}>
              <Tooltip title="收藏数">
                <Space size={4}>
                  <HeartOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                  <Text style={{ fontSize: 12 }}>{formatNumber(record.favoriteCount || 0)}</Text>
                </Space>
              </Tooltip>
            </Col>
            <Col span={8}>
              <Tooltip title="分享数">
                <Space size={4}>
                  <ShareAltOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                  <Text style={{ fontSize: 12 }}>{formatNumber(record.shareCount || 0)}</Text>
                </Space>
              </Tooltip>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: '0 4px' }}
          >
            编辑
          </Button>
          <Popconfirm 
            title="确认删除该论文?" 
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card 
        variant="outlined"
        style={{ 
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space align="center">
            <FileTextOutlined style={{ fontSize: 28, color: '#1890ff' }} />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                论文管理
              </h1>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {total} 篇论文
              </Text>
            </div>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingItem(null);
              form.resetFields();
              setShowModal(true);
            }}
            size="large"
            style={{ borderRadius: 6 }}
          >
            新增论文
          </Button>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="总论文数"
                value={total}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 24 }}
                suffix={<span style={{ fontSize: 12, color: '#999' }}>篇</span>}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="总浏览量"
                value={items.reduce((sum, item) => sum + (item.viewCount || 0), 0)}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 24 }}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="总收藏数"
                value={items.reduce((sum, item) => sum + (item.favoriteCount || 0), 0)}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#eb2f96', fontSize: 24 }}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="总分享数"
                value={items.reduce((sum, item) => sum + (item.shareCount || 0), 0)}
                prefix={<ShareAltOutlined />}
                valueStyle={{ color: '#fa8c16', fontSize: 24 }}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="平均引用数"
                value={items.length > 0 ? Math.round(items.reduce((sum, item) => sum + (item.citationCount || 0), 0) / items.length) : 0}
                valueStyle={{ color: '#722ed1', fontSize: 24 }}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="有PDF链接"
                value={items.filter(item => item.pdfUrl).length}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#13c2c2', fontSize: 24 }}
                suffix={<span style={{ fontSize: 12, color: '#999' }}>篇</span>}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="本月论文"
                value={items.filter(item => {
                  if (!item.publishedDate) return false;
                  return dayjs(item.publishedDate).isSame(dayjs(), 'month');
                }).length}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 20 }}
                suffix={<span style={{ fontSize: 12, color: '#999' }}>篇</span>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="本月新增"
                value={items.filter(item => {
                  if (!item.createdAt) return false;
                  return dayjs(item.createdAt).isSame(dayjs(), 'month');
                }).length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
                suffix={<span style={{ fontSize: 12, color: '#999' }}>篇</span>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="高引用论文"
                value={items.filter(item => (item.citationCount || 0) >= 100).length}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                suffix={<span style={{ fontSize: 12, color: '#999' }}>篇</span>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="高浏览论文"
                value={items.filter(item => (item.viewCount || 0) >= 1000).length}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#eb2f96', fontSize: 20 }}
                suffix={<span style={{ fontSize: 12, color: '#999' }}>篇</span>}
              />
            </Card>
          </Col>
        </Row>

        {items.length === 0 && !loading ? (
          <Empty 
            description="暂无论文数据" 
            style={{ padding: '60px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize: size,
              total,
              onChange: (p) => loadPapers(p),
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              showSizeChanger: false,
              showQuickJumper: true,
              style: { marginTop: 16 },
            }}
            columns={columns}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button 
                  type="link" 
                  size="small"
                  onClick={(e) => onExpand(record, e)}
                  style={{ padding: '0 4px' }}
                >
                  {expanded ? '收起' : '展开详情'}
                </Button>
              ),
            }}
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
            style={{
              fontSize: 13,
            }}
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>{editingItem ? '编辑论文' : '新增论文'}</span>
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                name="title" 
                label="论文标题" 
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入论文标题" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="arxivId" 
                label="arXiv ID"
                tooltip="例如: 2301.00001"
              >
                <Input placeholder="2301.00001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="venue" 
                label="会议/期刊"
              >
                <Input placeholder="例如: CVPR, NeurIPS" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="authors" 
                label="作者列表" 
                tooltip='JSON数组格式，例如: ["作者1", "作者2"]'
                rules={[{ required: true, message: '请输入作者列表' }]}
              >
                <Input 
                  placeholder='["Author 1", "Author 2"]' 
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="categories" 
                label="分类列表"
                tooltip='JSON数组格式，例如: ["cs.AI", "cs.RO"]'
                rules={[{ required: true, message: '请输入分类列表' }]}
              >
                <Input 
                  placeholder='["cs.AI", "cs.RO"]' 
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="publishedDate" 
                label="发布日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="citationCount" 
                label="引用数"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                name="pdfUrl" 
                label="PDF链接"
              >
                <Input 
                  placeholder="https://arxiv.org/pdf/2301.00001.pdf" 
                  prefix={<LinkOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item 
                name="abstract" 
                label="论文摘要"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入论文摘要..."
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              style={{ borderRadius: 6 }}
            >
              {editingItem ? '更新论文' : '创建论文'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
        .ant-table-expanded-row > td {
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
}
