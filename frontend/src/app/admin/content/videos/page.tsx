/**
 * 管理端 - 视频管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Button, Space, Table, Modal, Form, Input, InputNumber, DatePicker, Tag, Popconfirm, Empty, Select, App, Card, Row, Col, Statistic, Tooltip, Image, Badge } from 'antd';
import { getProxyImageUrl } from '@/utils/image-proxy';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, FilterOutlined, VideoCameraOutlined, FireOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Video {
  id: string;
  title: string;
  platform: string;
  videoId: string;
  bvid?: string;
  description?: string;
  coverUrl?: string;
  duration?: number;
  uploader?: string;
  uploaderId?: string;
  publishedDate?: string;
  playCount: number;
  likeCount: number;
  viewCount: number;
  favoriteCount: number;
  tags?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VideosManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Video | null>(null);
  const [items, setItems] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadVideos(1);
  }, []);

  const loadVideos = async (pageNum: number, pageSize?: number) => {
    setLoading(true);
    const currentSize = pageSize || size;
    try {
      const response = await apiClient.get('/videos', {
        params: { 
          page: pageNum, 
          size: currentSize,
          keyword: searchKeyword || undefined,
          platform: platformFilter,
        },
      });
      if (response.code === 0) {
        setItems(response.data.items || []);
        setTotal(response.data.pagination?.total || 0);
        setPage(pageNum);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error: any) {
      console.error('Load videos error:', error);
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

  const removeHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const handleCreate = async (values: any) => {
    try {
      const payload = { ...values };

      const tags = parseJsonField(payload.tags);
      if (tags === null) {
        message.error('标签需要是合法的JSON数组');
        return;
      }
      if (tags) payload.tags = tags;

      if (editingItem) {
        await apiClient.put(`/admin/content/videos/${editingItem.id}`, payload);
        message.success('更新成功!');
      } else {
        await apiClient.post('/admin/content/videos', payload);
        message.success('创建成功!');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadVideos(page);
    } catch (error: any) {
      console.error('Create/Update video error:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const handleEdit = (record: Video) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      tags: Array.isArray(record.tags) ? JSON.stringify(record.tags) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/videos/${id}`);
      message.success('删除成功');
      loadVideos(page);
    } catch (error: any) {
      console.error('Delete video error:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      message.error(errorMessage);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const handleSearch = () => {
    loadVideos(1);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setPlatformFilter(undefined);
    loadVideos(1);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube': return 'red';
      case 'bilibili': return 'blue';
      default: return 'default';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube': return '📺';
      case 'bilibili': return '📺';
      default: return '🎬';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>视频管理</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadVideos(page)}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setShowModal(true);
          }}>
            新增视频
          </Button>
        </Space>
      </div>


      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索标题、描述"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择平台"
            value={platformFilter}
            onChange={setPlatformFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="bilibili">Bilibili</Select.Option>
            <Select.Option value="youtube">YouTube</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button icon={<FilterOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {items.length === 0 && !loading ? (
        <Empty description="暂无数据" style={{ padding: '40px 0' }} />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          scroll={{ x: 2400 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p) => {
              loadVideos(p);
            },
            onShowSizeChange: (current, newSize) => {
              setSize(newSize);
              loadVideos(1, newSize);
            },
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          size="middle"
          columns={[
            { 
              title: 'ID', 
              dataIndex: 'id', 
              width: 80,
              ellipsis: true,
              render: (value: string) => value ? value.substring(0, 8) : '-',
            },
            { 
              title: '封面', 
              dataIndex: 'coverUrl', 
              width: 100,
              render: (value: string) => value ? (
                <Image
                  src={getProxyImageUrl(value)}
                  alt="封面"
                  width={80}
                  height={45}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  preview={{
                    visible: previewVisible,
                    src: getProxyImageUrl(previewImage),
                    onVisibleChange: (vis) => {
                      setPreviewVisible(vis);
                      setPreviewImage(value);
                    },
                  }}
                />
              ) : '-',
            },
            { 
              title: '标题', 
              dataIndex: 'title', 
              width: 280,
              ellipsis: { showTitle: false },
              render: (value: string) => (
                <Tooltip title={removeHtmlTags(value)}>
                  {removeHtmlTags(value)}
                </Tooltip>
              ),
            },
            { 
              title: '平台', 
              dataIndex: 'platform', 
              width: 90,
              render: (value: string) => (
                <Tag color={getPlatformColor(value)} icon={<span>{getPlatformIcon(value)}</span>}>
                  {value?.toUpperCase() || '-'}
                </Tag>
              ),
            },
            { 
              title: '视频ID', 
              dataIndex: 'bvid', 
              width: 130,
              ellipsis: true,
              render: (value: string, record: Video) => (
                <Tooltip title={value || record.videoId}>
                  <span style={{ fontFamily: 'monospace' }}>
                    {value || record.videoId?.substring(0, 12)}
                  </span>
                </Tooltip>
              ),
            },
            { 
              title: 'UP主', 
              dataIndex: 'uploader', 
              width: 120,
              ellipsis: true,
              render: (value: string, record: Video) => (
                <Tooltip title={`${value} (ID: ${record.uploaderId})`}>
                  <Space size={4}>
                    <UserOutlined style={{ color: '#1890ff' }} />
                    <span>{value || '-'}</span>
                  </Space>
                </Tooltip>
              ),
            },
            { 
              title: '发布时间', 
              dataIndex: 'publishedDate', 
              width: 150,
              sorter: (a: Video, b: Video) => 
                new Date(a.publishedDate || 0).getTime() - new Date(b.publishedDate || 0).getTime(),
              render: (value: string) => value ? (
                <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>
                  <Space size={4}>
                    <CalendarOutlined style={{ color: '#52c41a' }} />
                    <span>{dayjs(value).format('YYYY-MM-DD HH:mm:ss')}</span>
                  </Space>
                </Tooltip>
              ) : '-',
            },
            { 
              title: '时长', 
              dataIndex: 'duration', 
              width: 80,
              sorter: (a: Video, b: Video) => (a.duration || 0) - (b.duration || 0),
              render: (value: number) => (
                <Tooltip title={`${value}秒`}>
                  <Space size={4}>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                    <span>{formatDuration(value)}</span>
                  </Space>
                </Tooltip>
              ),
            },
            { 
              title: '播放量', 
              dataIndex: 'playCount', 
              width: 100,
              sorter: (a: Video, b: Video) => (a.playCount || 0) - (b.playCount || 0),
              render: (value: number) => (
                <Badge count={formatNumber(value)} showZero color="#52c41a" />
              ),
            },
            { 
              title: '观看数', 
              dataIndex: 'viewCount', 
              width: 100,
              sorter: (a: Video, b: Video) => (a.viewCount || 0) - (b.viewCount || 0),
              render: (value: number) => (
                <Badge count={formatNumber(value)} showZero color="#fa8c16" />
              ),
            },
            { 
              title: '点赞数', 
              dataIndex: 'likeCount', 
              width: 100,
              sorter: (a: Video, b: Video) => (a.likeCount || 0) - (b.likeCount || 0),
              render: (value: number) => (
                <Badge count={formatNumber(value)} showZero color="#eb2f96" />
              ),
            },
            { 
              title: '收藏数', 
              dataIndex: 'favoriteCount', 
              width: 100,
              sorter: (a: Video, b: Video) => (a.favoriteCount || 0) - (b.favoriteCount || 0),
              render: (value: number) => (
                <Badge count={formatNumber(value)} showZero color="#722ed1" />
              ),
            },
            {
              title: '标签',
              dataIndex: 'tags',
              width: 150,
              render: (value: any) => {
                let tags: string[] = [];
                if (Array.isArray(value)) {
                  tags = value;
                } else if (typeof value === 'string' && value) {
                  try {
                    const parsed = JSON.parse(value);
                    tags = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    tags = [];
                  }
                }
                return tags.length > 0 ? (
                  <Space size={[0, 4]} wrap>
                    {tags.slice(0, 3).map((tag: string, idx: number) => (
                      <Tag key={idx} color="blue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{tag}</Tag>
                    ))}
                    {tags.length > 3 && (
                      <Tag color="default" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>+{tags.length - 3}</Tag>
                    )}
                  </Space>
                ) : '-';
              },
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              width: 150,
              sorter: (a: Video, b: Video) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              render: (value: string) => (
                <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>
                  {dayjs(value).format('MM-DD HH:mm')}
                </Tooltip>
              ),
            },
            {
              title: '操作',
              width: 140,
              fixed: 'right',
              render: (_: any, record: Video) => (
                <Space>
                  <Tooltip title="编辑">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                      size="small"
                    />
                  </Tooltip>
                  <Popconfirm 
                    title="确认删除?" 
                    description="删除后无法恢复"
                    onConfirm={() => handleDelete(record.id)}
                    okText="确认"
                    cancelText="取消"
                  >
                    <Tooltip title="删除">
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      )}

      <Modal
        title={editingItem ? '编辑视频' : '新增视频'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="视频标题" />
          </Form.Item>
          <Form.Item name="platform" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
            <Select options={[
              { value: 'youtube', label: 'YouTube' },
              { value: 'bilibili', label: 'Bilibili' },
            ]} />
          </Form.Item>
          <Form.Item name="videoId" label="视频ID" rules={[{ required: true, message: '请输入视频ID' }]}>
            <Input placeholder="YouTube: dQw4w9WgXcQ 或 Bilibili: BV1xx411c7mu" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="视频描述" />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="uploader" label="UP主">
            <Input placeholder="UP主名称" />
          </Form.Item>
          <Form.Item name="duration" label="时长(秒)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="视频时长（秒）" />
          </Form.Item>
          <Form.Item name="tags" label="标签(JSON数组)"
            tooltip='例如: ["教程", "机器人"]'>
            <Input placeholder='["教程", "机器人"]' />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingItem ? '更新视频' : '创建视频'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
