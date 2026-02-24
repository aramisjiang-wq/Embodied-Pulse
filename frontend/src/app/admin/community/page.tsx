/**
 * 管理端 - 市集管理页面
 * 金融科技风格设计，与用户管理页面风格统一
 */

'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, App, Select, Empty, Tag, Avatar, Tooltip } from 'antd';
import {
  DeleteOutlined,
  UndoOutlined,
  PushpinOutlined,
  StarOutlined,
  FileTextOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { adminApi } from '@/lib/api/admin';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import styles from './page.module.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type PostItem = {
  id: string;
  title?: string;
  content?: string;
  contentType?: string;
  status?: string;
  isTop?: boolean;
  isFeatured?: boolean;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  createdAt?: string;
  user?: { id: string; username?: string; avatarUrl?: string };
  [key: string]: unknown;
};

type ApiError = {
  status?: number;
  code?: string;
  message?: string;
  response?: { data?: { code?: number; message?: string } };
};

function normalizeError(error: unknown): ApiError {
  return typeof error === 'object' && error !== null ? (error as ApiError) : {};
}

const PAGINATION_SIZE = 20;

export default function AdminCommunityPage() {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stats, setStats] = useState<{
    totalPosts: number;
    activePosts: number;
    deletedPosts: number;
    pinnedPosts: number;
    featuredPosts: number;
    todayNewPosts: number;
    totalComments: number;
  }>({
    totalPosts: 0,
    activePosts: 0,
    deletedPosts: 0,
    pinnedPosts: 0,
    featuredPosts: 0,
    todayNewPosts: 0,
    totalComments: 0,
  });
  const { message } = App.useApp();

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminApi.getCommunityStats();
      setStats({
        totalPosts: data?.totalPosts ?? 0,
        activePosts: data?.activePosts ?? 0,
        deletedPosts: data?.deletedPosts ?? 0,
        pinnedPosts: data?.pinnedPosts ?? 0,
        featuredPosts: data?.featuredPosts ?? 0,
        todayNewPosts: data?.todayNewPosts ?? 0,
        totalComments: data?.totalComments ?? 0,
      });
    } catch (e) {
      console.error('Load community stats error:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [statusFilter]);

  const loadPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const params: { page: number; size: number; sort: 'hot' | 'latest'; status?: string } = {
        page: pageNum,
        size: PAGINATION_SIZE,
        sort: 'latest',
      };
      if (statusFilter) params.status = statusFilter;
      const { items, pagination } = await adminApi.getCommunityPosts(params);
      setPosts(Array.isArray(items) ? (items as PostItem[]) : []);
      setTotal(Number(pagination?.total) ?? 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Load posts error:', error);
      setPosts([]);
      setTotal(0);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(err.message || err.response?.data?.message || '加载失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { default: apiClient } = await import('@/lib/api/client');
      await apiClient.delete(`/admin/posts/${postId}`);
      message.success('删除成功');
      loadPosts(page);
      loadStats();
    } catch (error) {
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED') message.error('未登录或登录已过期，请重新登录');
      else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') message.error('后端服务未运行');
      else message.error(err.message || '删除失败');
    }
  };

  const handleRestore = async (postId: string) => {
    try {
      const { default: apiClient } = await import('@/lib/api/client');
      await apiClient.post(`/admin/posts/${postId}/restore`);
      message.success('恢复成功');
      loadPosts(page);
      loadStats();
    } catch (error) {
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED') message.error('未登录或登录已过期，请重新登录');
      else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') message.error('后端服务未运行');
      else message.error(err.message || '恢复失败');
    }
  };

  const handlePin = async (postId: string, isTop: boolean) => {
    try {
      const { default: apiClient } = await import('@/lib/api/client');
      await apiClient.post(`/admin/posts/${postId}/pin`, { isTop });
      message.success(isTop ? '置顶成功' : '取消置顶成功');
      loadPosts(page);
      loadStats();
    } catch (error) {
      const err = normalizeError(error);
      message.error(err.message || '操作失败');
    }
  };

  const handleFeature = async (postId: string, isFeatured: boolean) => {
    try {
      const { default: apiClient } = await import('@/lib/api/client');
      await apiClient.post(`/admin/posts/${postId}/feature`, { isFeatured });
      message.success(isFeatured ? '加精成功' : '取消加精成功');
      loadPosts(page);
      loadStats();
    } catch (error) {
      const err = normalizeError(error);
      message.error(err.message || '操作失败');
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return dayjs(d).format('YYYY-MM-DD HH:mm');
    } catch {
      return '-';
    }
  };

  const statCards = [
    { key: 'totalPosts', label: '总帖子', icon: <FileTextOutlined />, colorClass: styles.statIconBlue },
    { key: 'activePosts', label: '正常', icon: <FileTextOutlined />, colorClass: styles.statIconGreen },
    { key: 'deletedPosts', label: '已删除', icon: <DeleteOutlined />, colorClass: styles.statIconRed },
    { key: 'todayNewPosts', label: '今日新增', icon: <ClockCircleOutlined />, colorClass: styles.statIconOrange },
    { key: 'pinnedPosts', label: '置顶', icon: <PushpinOutlined />, colorClass: styles.statIconGold },
    { key: 'featuredPosts', label: '加精', icon: <StarOutlined />, colorClass: styles.statIconCyan },
    { key: 'totalComments', label: '评论总数', icon: <MessageOutlined />, colorClass: styles.statIconPurple },
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* 页面顶部 */}
      <div className={styles.pageTop}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>市集管理</h1>
          <p className={styles.pageSubtitle}>管理社区帖子 · 共 {total.toLocaleString()} 条帖子</p>
        </div>

        <div className={styles.filterBar}>
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v ?? '')}
            allowClear
            options={[
              { value: 'active', label: '正常' },
              { value: 'deleted', label: '已删除' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => { loadPosts(page); loadStats(); }}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsGrid}>
        {statCards.map((stat) => (
          <div key={stat.key} className={styles.statCard}>
            <div className={`${styles.statIconWrap} ${stat.colorClass}`}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {statsLoading ? '—' : stats[stat.key as keyof typeof stats].toLocaleString()}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 数据表格 */}
      <div className={styles.tableWrapper}>
        <Table<PostItem>
          rowKey="id"
          loading={loading}
          dataSource={posts}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: PAGINATION_SIZE,
            total,
            onChange: (p) => loadPosts(p),
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: false,
            style: { padding: '12px 16px', margin: 0 },
          }}
          locale={{ emptyText: <Empty description="暂无帖子" className={styles.emptyWrap} /> }}
          columns={[
            {
              title: '帖子',
              key: 'title',
              width: 300,
              render: (_, record) => (
                <div>
                  {record.title && (
                    <div style={{ marginBottom: 4 }}>
                      <Link href={`/community/${record.id}`} target="_blank" className={styles.link}>
                        {record.title}
                      </Link>
                    </div>
                  )}
                  <div className={styles.contentPreview}>
                    {record.content?.substring(0, 100)}
                  </div>
                </div>
              ),
            },
            {
              title: '作者',
              key: 'user',
              width: 160,
              render: (_, record) => (
                <div className={styles.userCell}>
                  <Avatar
                    size={32}
                    src={record.user?.avatarUrl}
                    icon={<UserOutlined />}
                    style={{ background: '#1677ff', flexShrink: 0 }}
                  />
                  <div className={styles.userMeta}>
                    <div className={styles.userName}>{record.user?.username ?? '—'}</div>
                  </div>
                </div>
              ),
            },
            {
              title: '类型',
              dataIndex: 'contentType',
              width: 80,
              render: (v: string) => <Tag color="blue">{v || '讨论'}</Tag>,
            },
            {
              title: '数据',
              key: 'stats',
              width: 120,
              render: (_, record) => (
                <Space size={8} style={{ fontSize: 12 }}>
                  <Tooltip title="浏览">
                    <span style={{ color: '#8c8c8c' }}>
                      <EyeOutlined /> {record.viewCount ?? 0}
                    </span>
                  </Tooltip>
                  <Tooltip title="点赞">
                    <span style={{ color: '#8c8c8c' }}>
                      <LikeOutlined /> {record.likeCount ?? 0}
                    </span>
                  </Tooltip>
                  <Tooltip title="评论">
                    <span style={{ color: '#8c8c8c' }}>
                      <MessageOutlined /> {record.commentCount ?? 0}
                    </span>
                  </Tooltip>
                </Space>
              ),
            },
            {
              title: '状态',
              key: 'status',
              width: 140,
              render: (_, record) => (
                <Space size={4} wrap>
                  <span className={record.status === 'active' ? styles.statusActive : styles.statusBanned}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {record.status === 'active' ? '正常' : '已删除'}
                  </span>
                  {record.isTop && <Tag color="gold" icon={<PushpinOutlined />}>置顶</Tag>}
                  {record.isFeatured && <Tag color="gold" icon={<StarOutlined />}>加精</Tag>}
                </Space>
              ),
            },
            {
              title: '发布时间',
              dataIndex: 'createdAt',
              width: 140,
              render: (date: string) => (
                <Tooltip title={formatDate(date)}>
                  <span style={{ fontSize: 12, color: '#595959' }}>
                    {date ? dayjs(date).fromNow() : '-'}
                  </span>
                </Tooltip>
              ),
            },
            {
              title: '操作',
              key: 'action',
              width: 200,
              fixed: 'right',
              render: (_, record) => (
                <div className={styles.actionCell}>
                  {record.status === 'active' ? (
                    <>
                      <Popconfirm title="确认删除该帖子？" onConfirm={() => handleDelete(record.id)}>
                        <Button size="small" className={styles.btnDanger} icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                      <Button
                        size="small"
                        className={styles.btnGhost}
                        icon={<PushpinOutlined />}
                        onClick={() => handlePin(record.id, !record.isTop)}
                      >
                        {record.isTop ? '取消置顶' : '置顶'}
                      </Button>
                      <Button
                        size="small"
                        className={styles.btnGhost}
                        icon={<StarOutlined />}
                        onClick={() => handleFeature(record.id, !record.isFeatured)}
                      >
                        {record.isFeatured ? '取消加精' : '加精'}
                      </Button>
                    </>
                  ) : (
                    <Button size="small" className={styles.btnGhost} icon={<UndoOutlined />} onClick={() => handleRestore(record.id)}>
                      恢复
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
