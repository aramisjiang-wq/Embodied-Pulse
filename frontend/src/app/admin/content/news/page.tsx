/**
 * 管理端 - 新闻管理页面
 * 支持人工配置新闻内容
 */

'use client';

import { useEffect, useState } from 'react';
import { Button, Space, Table, Modal, Form, Input, DatePicker, Tag, Popconfirm, Empty, Select, App, Card, Divider, Typography, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, LinkOutlined, GlobalOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface NewsItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  score?: string;
  platform: string;
  publishedDate: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function NewsManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();
  const [platformFilter, setPlatformFilter] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const platformOptions = [
    { value: 'manual', label: '人工配置', color: 'green' },
    { value: 'baidu', label: '百度', color: 'blue' },
    { value: 'weibo', label: '微博', color: 'red' },
    { value: 'zhihu', label: '知乎', color: 'blue' },
    { value: 'bilibili', label: 'Bilibili', color: 'pink' },
    { value: 'douban', label: '豆瓣', color: 'green' },
    { value: 'juejin', label: '掘金', color: 'blue' },
    { value: '36kr', label: '36氪', color: 'blue' },
    { value: 'other', label: '其他', color: 'default' },
  ];

  const getPlatformLabel = (platform: string): string => {
    return platformOptions.find(p => p.value === platform)?.label || platform;
  };

  const getPlatformColor = (platform: string): string => {
    return platformOptions.find(p => p.value === platform)?.color || 'default';
  };

  useEffect(() => {
    loadNews(1);
  }, []);

  const loadNews = async (pageNum: number) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, size, sort: 'latest' };
      if (platformFilter) {
        params.platform = platformFilter;
      }
      if (keyword) {
        params.keyword = keyword;
      }
      const response = await apiClient.get('/admin/content/news', { params });
      if (response.code === 0) {
        setItems(response.data.items || []);
        setTotal(response.data.pagination?.total || 0);
        setPage(pageNum);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error: any) {
      console.error('Load news error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED') {
        message.error('未登录或登录已过期，请重新登录');
      } else {
        message.error(error.message || '加载失败');
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = { ...values };

      if (payload.publishedDate) {
        payload.publishedDate = payload.publishedDate.toISOString();
      }

      if (editingItem) {
        await apiClient.put(`/admin/content/news/${editingItem.id}`, payload);
        message.success('更新成功!');
      } else {
        await apiClient.post('/admin/content/news', payload);
        message.success('创建成功!');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadNews(page);
    } catch (error: any) {
      console.error('Create/Update news error:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/news/${id}`);
      message.success('删除成功!');
      loadNews(page);
    } catch (error: any) {
      console.error('Delete news error:', error);
      message.error(error.message || '删除失败');
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      platform: item.platform,
      title: item.title,
      url: item.url,
      score: item.score,
      description: item.description,
      publishedDate: item.publishedDate ? dayjs(item.publishedDate) : null,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      platform: 'manual',
      publishedDate: dayjs(),
    });
    setShowModal(true);
  };

  return (
    <div>
      <Card variant="borderless" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>新闻管理</Title>
            <Text type="secondary">人工配置具身智能相关新闻资讯，支持添加、编辑和删除操作</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew} size="large">
            添加新闻
          </Button>
        </div>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索新闻标题或描述"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => loadNews(1)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="筛选平台"
            value={platformFilter}
            onChange={(value) => {
              setPlatformFilter(value);
              setPage(1);
            }}
            style={{ width: 150 }}
            allowClear
          >
            {platformOptions.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>
                <Tag color={opt.color} style={{ marginRight: 0 }}>{opt.label}</Tag>
              </Select.Option>
            ))}
          </Select>
          <Button onClick={() => {
            setKeyword('');
            setPlatformFilter(undefined);
            loadNews(1);
          }}>
            重置
          </Button>
          <Button type="primary" onClick={() => loadNews(1)}>
            搜索
          </Button>
        </Space>
      </Card>

      {items.length === 0 && !loading ? (
        <Card>
          <Empty 
            description={
              <span style={{ color: '#6b7280' }}>
                暂无新闻数据，点击右上角"添加新闻"按钮开始配置
              </span>
            } 
            style={{ padding: '60px 0' }}
          />
        </Card>
      ) : (
        <Card>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize: size,
              total,
              onChange: (p) => loadNews(p),
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            columns={[
              { 
                title: '标题', 
                dataIndex: 'title', 
                key: 'title', 
                width: 300, 
                ellipsis: true,
                render: (title: string, record: NewsItem) => (
                  <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    {title}
                  </a>
                )
              },
              { 
                title: '来源', 
                dataIndex: 'platform', 
                key: 'platform', 
                width: 100,
                render: (platform: string) => (
                  <Tag color={getPlatformColor(platform)}>{getPlatformLabel(platform)}</Tag>
                )
              },
              { 
                title: '描述', 
                dataIndex: 'description', 
                key: 'description', 
                width: 200,
                ellipsis: true,
                render: (desc: string) => desc || '-'
              },
              { 
                title: '热度', 
                dataIndex: 'score', 
                key: 'score', 
                width: 80,
                render: (score: string) => score ? (
                  <Tag color="orange" icon={<FireOutlined />}>{score}</Tag>
                ) : '-'
              },
              { 
                title: '浏览', 
                dataIndex: 'viewCount', 
                key: 'viewCount', 
                width: 80,
                render: (count: number) => count || 0
              },
              { 
                title: '收藏', 
                dataIndex: 'favoriteCount', 
                key: 'favoriteCount', 
                width: 80 
              },
              { 
                title: '发布时间', 
                dataIndex: 'publishedDate', 
                key: 'publishedDate', 
                width: 120,
                render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
              },
              {
                title: '操作',
                key: 'action',
                width: 150,
                fixed: 'right',
                render: (_: any, record: NewsItem) => (
                  <Space>
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                      />
                    </Tooltip>
                    <Tooltip title="查看原文">
                      <Button
                        type="text"
                        icon={<LinkOutlined />}
                        onClick={() => window.open(record.url, '_blank')}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确定要删除这条新闻吗？"
                      onConfirm={() => handleDelete(record.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Modal
        title={
          <Space>
            <GlobalOutlined />
            <span>{editingItem ? '编辑新闻' : '添加新闻'}</span>
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={700}
        okText={editingItem ? '保存' : '添加'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ platform: 'manual', publishedDate: dayjs() }}
        >
          <Form.Item
            label="新闻标题"
            name="title"
            rules={[{ required: true, message: '请输入新闻标题' }]}
          >
            <Input placeholder="输入新闻标题" maxLength={200} showCount />
          </Form.Item>
          
          <Form.Item
            label="原文链接"
            name="url"
            rules={[
              { required: true, message: '请输入原文链接' }, 
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input 
              placeholder="https://..." 
              prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
            />
          </Form.Item>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="来源平台"
              name="platform"
              rules={[{ required: true, message: '请选择来源平台' }]}
              style={{ width: 200 }}
            >
              <Select placeholder="选择平台">
                {platformOptions.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color} style={{ marginRight: 0 }}>{opt.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              label="发布时间"
              name="publishedDate"
              style={{ width: 200 }}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                prefix={<CalendarOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>
            
            <Form.Item
              label="热度评分"
              name="score"
              style={{ width: 150 }}
            >
              <Input placeholder="可选" maxLength={20} />
            </Form.Item>
          </Space>
          
          <Form.Item
            label="新闻描述"
            name="description"
          >
            <TextArea 
              rows={4} 
              placeholder="输入新闻摘要或描述（可选）" 
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
