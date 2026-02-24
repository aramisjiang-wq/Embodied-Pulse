/**
 * 管理端 - 视频管理页面
 * 含数据统计、筛选、表格与表单，统一配色与 UI/UX
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Select,
  App,
  Tooltip,
  Image,
} from 'antd';
import { getProxyImageUrl } from '@/utils/image-proxy';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  RiseOutlined,
  LikeOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import styles from './page.module.css';

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

interface VideoStats {
  total: number;
  newToday: number;
  newThisWeek: number;
}

export default function VideosManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
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
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [form] = Form.useForm();

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get<{ content?: { videos?: VideoStats } }>('/admin/stats');
      if (res.code === 0 && res.data?.content?.videos) {
        setVideoStats(res.data.content.videos);
      }
    } catch {
      setVideoStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos(1);
    loadStats();
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
        const data = response.data as { items?: Video[]; pagination?: { total?: number } };
        setItems(data.items || []);
        setTotal(data.pagination?.total || 0);
        setPage(pageNum);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error: unknown) {
      const err = error as { status?: number; code?: string; response?: { data?: { code?: number; message?: string } }; message?: string };
      console.error('Load videos error:', error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        const errorMessage = err.response?.data?.message || err.message || '加载失败';
        message.error(errorMessage);
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pageAggregate = useMemo(() => {
    let playSum = 0;
    let viewSum = 0;
    let likeSum = 0;
    const byPlatform: Record<string, number> = {};
    items.forEach((v) => {
      playSum += v.playCount || 0;
      viewSum += v.viewCount || 0;
      likeSum += v.likeCount || 0;
      const p = (v.platform || 'other').toLowerCase();
      byPlatform[p] = (byPlatform[p] || 0) + 1;
    });
    return { playSum, viewSum, likeSum, byPlatform };
  }, [items]);

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

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const payload = { ...values };
      const tags = parseJsonField(payload.tags as string);
      if (tags === null) {
        message.error('标签需要是合法的JSON数组');
        return;
      }
      if (tags) payload.tags = tags;

      if (editingItem) {
        await apiClient.put(`/admin/content/videos/${editingItem.id}`, payload);
        message.success('更新成功');
      } else {
        await apiClient.post('/admin/content/videos', payload);
        message.success('创建成功');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadVideos(page);
      loadStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const handleEdit = (record: Video) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      tags: Array.isArray(record.tags) ? JSON.stringify(record.tags) : (record.tags ?? ''),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/videos/${id}`);
      message.success('删除成功');
      loadVideos(page);
      loadStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(err.response?.data?.message || err.message || '删除失败');
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

  const handleSearch = () => loadVideos(1);
  const handleReset = () => {
    setSearchKeyword('');
    setPlatformFilter(undefined);
    loadVideos(1);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return 'red';
      case 'bilibili':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <VideoCameraOutlined className={styles.pageTitleIcon} />
          视频管理
        </h1>
        <Space size="middle">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadVideos(page);
              loadStats();
            }}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              form.resetFields();
              setShowModal(true);
            }}
          >
            新增视频
          </Button>
        </Space>
      </div>

      {/* 数据统计 */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
          <div className={styles.statCardTop}>
            <VideoCameraOutlined className={styles.statCardIcon} style={{ color: 'var(--color-primary)' }} />
            <span className={styles.statCardLabel}>视频总数</span>
          </div>
          <div className={styles.statCardValue}>
            {statsLoading ? '—' : (videoStats?.total ?? total).toLocaleString()}
          </div>
          <div className={styles.statCardSub}>全平台</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <div className={styles.statCardTop}>
            <RiseOutlined className={styles.statCardIcon} style={{ color: 'var(--color-success)' }} />
            <span className={styles.statCardLabel}>今日新增</span>
          </div>
          <div className={styles.statCardValue} style={{ color: 'var(--color-success)' }}>
            {statsLoading ? '—' : `+${(videoStats?.newToday ?? 0).toLocaleString()}`}
          </div>
          <div className={styles.statCardSub}>较昨日</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWarning}`}>
          <div className={styles.statCardTop}>
            <CalendarOutlined className={styles.statCardIcon} style={{ color: 'var(--color-warning)' }} />
            <span className={styles.statCardLabel}>本周新增</span>
          </div>
          <div className={styles.statCardValue} style={{ color: 'var(--color-warning)' }}>
            {statsLoading ? '—' : `+${(videoStats?.newThisWeek ?? 0).toLocaleString()}`}
          </div>
          <div className={styles.statCardSub}>7 天内</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardInfo}`}>
          <div className={styles.statCardTop}>
            <EyeOutlined className={styles.statCardIcon} style={{ color: 'var(--color-info)' }} />
            <span className={styles.statCardLabel}>本页播放量</span>
          </div>
          <div className={styles.statCardValue} style={{ color: 'var(--color-info)' }}>
            {formatNumber(pageAggregate.playSum)}
          </div>
          <div className={styles.statCardSub}>当前 {items.length} 条合计</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <div className={styles.statCardTop}>
            <LikeOutlined className={styles.statCardIcon} style={{ color: '#722ed1' }} />
            <span className={styles.statCardLabel}>本页点赞</span>
          </div>
          <div className={styles.statCardValue} style={{ color: '#722ed1' }}>
            {formatNumber(pageAggregate.likeSum)}
          </div>
          <div className={styles.statCardSub}>当前页合计</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <Input
            placeholder="搜索标题、描述"
            prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="选择平台"
            value={platformFilter}
            onChange={setPlatformFilter}
            style={{ width: 130 }}
            allowClear
          >
            <Select.Option value="bilibili">Bilibili</Select.Option>
            <Select.Option value="youtube">YouTube</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<FilterOutlined />} onClick={handleReset}>
            重置
          </Button>
        </div>
      </div>

      {/* 表格 */}
      {items.length === 0 && !loading ? (
        <div className={styles.emptyWrap}>
          <Empty description="暂无视频数据" />
        </div>
      ) : (
        <div className={styles.tableCard}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            scroll={{ x: 2200 }}
            pagination={{
              current: page,
              pageSize: size,
              total,
              onChange: (p) => loadVideos(p),
              onShowSizeChange: (_current, newSize) => {
                setSize(newSize);
                loadVideos(1, newSize);
              },
              showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条，共 ${t} 条`,
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
                render: (value: string) => (value ? value.substring(0, 8) : '-'),
              },
              {
                title: '封面',
                dataIndex: 'coverUrl',
                width: 100,
                render: (value: string) =>
                  value ? (
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
                  ) : (
                    '-'
                  ),
              },
              {
                title: '标题',
                dataIndex: 'title',
                width: 280,
                ellipsis: { showTitle: false },
                render: (value: string) => (
                  <Tooltip title={removeHtmlTags(value)}>{removeHtmlTags(value)}</Tooltip>
                ),
              },
              {
                title: '平台',
                dataIndex: 'platform',
                width: 90,
                render: (value: string) => (
                  <Tag color={getPlatformColor(value)}>{value?.toUpperCase() || '-'}</Tag>
                ),
              },
              {
                title: '视频ID',
                dataIndex: 'bvid',
                width: 120,
                ellipsis: true,
                render: (value: string, record: Video) => (
                  <Tooltip title={value || record.videoId}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {value || record.videoId?.substring(0, 12)}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: 'UP主',
                dataIndex: 'uploader',
                width: 110,
                ellipsis: true,
                render: (value: string, record: Video) => (
                  <Tooltip title={`${value} (ID: ${record.uploaderId})`}>
                    <Space size={4}>
                      <UserOutlined style={{ color: 'var(--color-primary)' }} />
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
                render: (value: string) =>
                  value ? (
                    <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>
                      <Space size={4}>
                        <CalendarOutlined style={{ color: 'var(--color-success)' }} />
                        <span>{dayjs(value).format('YYYY-MM-DD')}</span>
                      </Space>
                    </Tooltip>
                  ) : (
                    '-'
                  ),
              },
              {
                title: '时长',
                dataIndex: 'duration',
                width: 76,
                sorter: (a: Video, b: Video) => (a.duration || 0) - (b.duration || 0),
                render: (value: number) => (
                  <Space size={4}>
                    <ClockCircleOutlined style={{ color: 'var(--color-warning)' }} />
                    <span>{formatDuration(value)}</span>
                  </Space>
                ),
              },
              {
                title: '播放',
                dataIndex: 'playCount',
                width: 88,
                sorter: (a: Video, b: Video) => (a.playCount || 0) - (b.playCount || 0),
                render: (value: number) => (
                  <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                    {formatNumber(value)}
                  </span>
                ),
              },
              {
                title: '观看',
                dataIndex: 'viewCount',
                width: 88,
                sorter: (a: Video, b: Video) => (a.viewCount || 0) - (b.viewCount || 0),
                render: (value: number) => (
                  <span style={{ color: 'var(--color-info)', fontWeight: 500 }}>
                    {formatNumber(value)}
                  </span>
                ),
              },
              {
                title: '点赞',
                dataIndex: 'likeCount',
                width: 88,
                sorter: (a: Video, b: Video) => (a.likeCount || 0) - (b.likeCount || 0),
                render: (value: number) => (
                  <span style={{ color: '#eb2f96', fontWeight: 500 }}>{formatNumber(value)}</span>
                ),
              },
              {
                title: '收藏',
                dataIndex: 'favoriteCount',
                width: 88,
                sorter: (a: Video, b: Video) => (a.favoriteCount || 0) - (b.favoriteCount || 0),
                render: (value: number) => (
                  <span style={{ color: '#722ed1', fontWeight: 500 }}>
                    {formatNumber(value)}
                  </span>
                ),
              },
              {
                title: '标签',
                dataIndex: 'tags',
                width: 140,
                render: (value: unknown) => {
                  let tags: string[] = [];
                  if (Array.isArray(value)) tags = value;
                  else if (typeof value === 'string' && value) {
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
                        <Tag key={idx} style={{ fontSize: 11, margin: 0 }}>
                          {tag}
                        </Tag>
                      ))}
                      {tags.length > 3 && (
                        <Tag color="default" style={{ fontSize: 11, margin: 0 }}>
                          +{tags.length - 3}
                        </Tag>
                      )}
                    </Space>
                  ) : (
                    '-'
                  );
                },
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 110,
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
                width: 120,
                fixed: 'right',
                render: (_: unknown, record: Video) => (
                  <Space size="small">
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size="small"
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确认删除？"
                      description="删除后无法恢复"
                      onConfirm={() => handleDelete(record.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
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
        width={640}
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="视频标题" />
          </Form.Item>
          <Form.Item name="platform" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
            <Select
              options={[
                { value: 'youtube', label: 'YouTube' },
                { value: 'bilibili', label: 'Bilibili' },
              ]}
            />
          </Form.Item>
          <Form.Item name="videoId" label="视频ID" rules={[{ required: true, message: '请输入视频ID' }]}>
            <Input placeholder="YouTube: dQw4w9WgXcQ 或 Bilibili: BV1xx411c7mu" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="视频描述" />
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
          <Form.Item
            name="tags"
            label="标签(JSON数组)"
            tooltip='例如: ["教程", "机器人"]'
          >
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
