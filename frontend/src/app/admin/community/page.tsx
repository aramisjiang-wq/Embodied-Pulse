/**
 * 管理端 - 市集管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Modal, Select, App } from 'antd';
import { DeleteOutlined, UndoOutlined, PushpinOutlined, StarOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import Link from 'next/link';

export default function AdminCommunityPage() {
  const [loading, setLoading] = useState(false);
  type PostItem = { id: string; [key: string]: unknown };
  type ApiError = { status?: number; code?: string; message?: string; response?: { data?: { code?: number; message?: string } } };
  const normalizeError = (error: unknown): ApiError => (
    typeof error === 'object' && error !== null ? (error as ApiError) : {}
  );
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { message } = App.useApp();

  useEffect(() => {
    loadPosts(1);
  }, [statusFilter]);

  type PostListResponse = { items: PostItem[]; pagination?: { total?: number } };

  const loadPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pageNum, size, sort: 'latest' };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await apiClient.get<PostListResponse>('/posts', { params });
      
      if (!response || !response.data || !response.data.items) {
        console.error('Invalid data structure:', response);
        setPosts([]);
        setTotal(0);
        return;
      }
      
      setPosts(response.data.items);
      setTotal(response.data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: unknown) {
      console.error('Load posts error:', error);
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await apiClient.delete(`/admin/posts/${postId}`);
      message.success('删除成功');
      loadPosts(page);
    } catch (error: unknown) {
      console.error('Delete post error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(err.message || err.response?.data?.message || '删除失败');
      }
    }
  };

  const handleRestore = async (postId: string) => {
    try {
      await apiClient.post(`/admin/posts/${postId}/restore`);
      message.success('恢复成功');
      loadPosts(page);
    } catch (error: unknown) {
      console.error('Restore post error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(err.message || err.response?.data?.message || '恢复失败');
      }
    }
  };

  const handlePin = async (postId: string, isTop: boolean) => {
    try {
      await apiClient.post(`/admin/posts/${postId}/pin`, { isTop });
      message.success(isTop ? '置顶成功' : '取消置顶成功');
      loadPosts(page);
    } catch (error: unknown) {
      console.error('Pin post error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(err.message || err.response?.data?.message || '操作失败');
      }
    }
  };

  const handleFeature = async (postId: string, isFeatured: boolean) => {
    try {
      await apiClient.post(`/admin/posts/${postId}/feature`, { isFeatured });
      message.success(isFeatured ? '加精成功' : '取消加精成功');
      loadPosts(page);
    } catch (error: unknown) {
      console.error('Feature post error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(err.message || err.response?.data?.message || '操作失败');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>市集管理</h1>
        <Select
          placeholder="筛选状态"
          style={{ width: 150 }}
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value)}
          allowClear
        >
          <Select.Option value="active">正常</Select.Option>
          <Select.Option value="deleted">已删除</Select.Option>
        </Select>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={posts}
        pagination={{
          current: page,
          pageSize: size,
          total,
          onChange: (p) => loadPosts(p),
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        columns={[
          {
            title: '标题/内容',
            key: 'title',
            width: 300,
            render: (_: any, record: any) => (
              <div>
                {record.title && (
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    <Link href={`/community/${record.id}`} target="_blank">
                      {record.title}
                    </Link>
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.content?.substring(0, 100)}
                </div>
              </div>
            ),
          },
          {
            title: '作者',
            key: 'user',
            width: 120,
            render: (_: any, record: any) => record.user?.username || '匿名',
          },
          {
            title: '类型',
            dataIndex: 'contentType',
            width: 100,
            render: (value: string) => <Tag color="blue">{value || '讨论'}</Tag>,
          },
          {
            title: '数据',
            key: 'stats',
            width: 150,
            render: (_: any, record: any) => (
              <div style={{ fontSize: 12 }}>
                {record.viewCount && record.viewCount > 0 && <div>👁️ {record.viewCount}</div>}
                {record.likeCount && record.likeCount > 0 && <div>👍 {record.likeCount}</div>}
                {record.commentCount && record.commentCount > 0 && <div>💬 {record.commentCount}</div>}
              </div>
            ),
          },
          {
            title: '状态',
            key: 'status',
            width: 120,
            render: (_: any, record: any) => (
              <Space direction="vertical" size="small">
                <Tag color={record.status === 'active' ? 'green' : 'red'}>
                  {record.status === 'active' ? '正常' : '已删除'}
                </Tag>
                {record.isTop && <Tag color="orange" icon={<PushpinOutlined />}>置顶</Tag>}
                {record.isFeatured && <Tag color="gold" icon={<StarOutlined />}>加精</Tag>}
              </Space>
            ),
          },
          {
            title: '发布时间',
            dataIndex: 'createdAt',
            width: 160,
            render: (date: string) => new Date(date).toLocaleString('zh-CN'),
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: any, record: any) => (
              <Space direction="vertical" size="small">
                {record.status === 'active' ? (
                  <>
                    <Popconfirm
                      title="确认删除该帖子？"
                      onConfirm={() => handleDelete(record.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                    <Space>
                      <Button
                        size="small"
                        type={record.isTop ? 'primary' : 'default'}
                        icon={<PushpinOutlined />}
                        onClick={() => handlePin(record.id, !record.isTop)}
                      >
                        {record.isTop ? '取消置顶' : '置顶'}
                      </Button>
                      <Button
                        size="small"
                        type={record.isFeatured ? 'primary' : 'default'}
                        icon={<StarOutlined />}
                        onClick={() => handleFeature(record.id, !record.isFeatured)}
                      >
                        {record.isFeatured ? '取消加精' : '加精'}
                      </Button>
                    </Space>
                  </>
                ) : (
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={() => handleRestore(record.id)}
                  >
                    恢复
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
