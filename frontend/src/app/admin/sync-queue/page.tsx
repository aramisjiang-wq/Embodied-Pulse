'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Input, App } from 'antd';
import { ReloadOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { syncApi } from '@/lib/api/sync';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './page.module.css';

dayjs.extend(relativeTime);

export default function AdminSyncQueuePage() {
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { message } = App.useApp();

  useEffect(() => {
    loadSyncQueue();
  }, []);

  const loadSyncQueue = async () => {
    setLoading(true);
    try {
      const data = await syncApi.getSyncQueue();
      setSyncQueue(Array.isArray(data) ? data : []);
    } catch (error: any) {
      message.error(error.message || '加载同步队列失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await syncApi.retrySyncTask(id);
      message.success('重试成功');
      loadSyncQueue();
    } catch (error: any) {
      message.error(error.message || '重试失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条同步任务吗？',
      onOk: async () => {
        try {
          await syncApi.deleteSyncTask(id);
          message.success('删除成功');
          loadSyncQueue();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'blue', text: '待处理' },
      running: { color: 'processing', text: '运行中' },
      success: { color: 'success', text: '成功' },
      failed: { color: 'error', text: '失败' },
      cancelled: { color: 'default', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 120,
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        return getStatusTag(status);
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number) => {
        return `${progress || 0}%`;
      },
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      render: (error: string) => {
        return error || '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => {
        return dayjs(date).fromNow();
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        return (
          <Space>
            {record.status === 'failed' && (
              <Button type="link" icon={<ReloadOutlined />} onClick={() => handleRetry(record.id)}>
                重试
              </Button>
            )}
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  const filteredData = syncQueue.filter((item) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      item.dataSource?.toLowerCase().includes(searchLower) ||
      item.taskType?.toLowerCase().includes(searchLower) ||
      item.status?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>同步队列</h1>
        <Space>
          <Input
            placeholder="搜索数据源、任务类型、状态"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadSyncQueue}>
            刷新
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
}
