/**
 * 管理端 - 招聘岗位管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Button, Space, Table, Modal, Form, Input, InputNumber, Tag, Popconfirm, Empty, Select, App, Card } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined, SyncOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import { syncApi } from '@/lib/api/sync';

const { TextArea } = Input;

export default function JobsManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadJobs(1);
  }, []);

  const loadJobs = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/jobs', {
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
      console.error('Load jobs error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
        // API客户端会自动跳转，这里只显示错误消息
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

      const tags = parseJsonField(payload.tags);
      if (tags === null) {
        message.error('标签需要是合法的JSON数组');
        return;
      }
      if (tags) payload.tags = tags;

      if (editingItem) {
        await apiClient.put(`/admin/content/jobs/${editingItem.id}`, payload);
        message.success('更新成功!');
      } else {
        await apiClient.post('/admin/content/jobs', payload);
        message.success('创建成功!');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadJobs(page);
    } catch (error: any) {
      console.error('Create/Update job error:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      tags: Array.isArray(record.tags) ? JSON.stringify(record.tags) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/jobs/${id}`);
      message.success('删除成功');
      loadJobs(page);
    } catch (error: any) {
      console.error('Delete job error:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      message.error(errorMessage);
    }
  };

  const handleSyncJobs = async () => {
    setSyncing(true);
    try {
      const result = await syncApi.syncJobs({ maxResults: 200 });
      
      if (result && !result.success) {
        const errorMsg = result.message || 'GitHub岗位同步失败';
        message.error(errorMsg.replace(/\n/g, ' '), 8);
        return;
      }
      
      message.success(`同步完成：成功 ${result.synced} 条，失败 ${result.errors} 条`);
      loadJobs(page);
    } catch (error: any) {
      console.error('Sync jobs error:', error);
      const errorMessage = error.response?.data?.message || error.message || '同步失败';
      message.error(errorMessage, 8);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          招聘岗位管理
        </h1>
        <Space>
          <Button 
            icon={<SyncOutlined />} 
            onClick={handleSyncJobs}
            loading={syncing}
          >
            从GitHub同步
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setShowModal(true);
          }}>
            新增岗位
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }} size="small">
        <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
          💡 点击"从GitHub同步"按钮，系统将自动从 
          <a href="https://github.com/StarCycle/Awesome-Embodied-AI-Job" target="_blank" rel="noopener noreferrer">
            StarCycle/Awesome-Embodied-AI-Job
          </a> 
          仓库抓取最新的岗位信息。系统每天凌晨3点会自动同步。
        </p>
      </Card>

      {items.length === 0 && !loading ? (
        <Empty description="暂无数据" style={{ padding: '40px 0' }} />
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
            onChange: (p) => loadJobs(p),
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          columns={[
            { title: '岗位名称', dataIndex: 'title', width: 250, ellipsis: true },
            { title: '公司名称', dataIndex: 'company', width: 200 },
            { title: '工作地点', dataIndex: 'location', width: 150, render: (value: string) => value || '-' },
            {
              title: '薪资范围',
              width: 150,
              render: (_: any, record: any) =>
                record.salaryMin && record.salaryMax 
                  ? `${record.salaryMin}K-${record.salaryMax}K` 
                  : '面议',
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (value: string) => (
                <Tag color={value === 'open' ? 'green' : 'red'}>
                  {value === 'open' ? '招聘中' : '已关闭'}
                </Tag>
              ),
            },
            {
              title: '标签',
              dataIndex: 'tags',
              width: 200,
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
                  <Space size={[0, 8]} wrap>
                    {tags.map((tag: string, idx: number) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </Space>
                ) : '-';
              },
            },
            {
              title: '操作',
              width: 120,
              fixed: 'right',
              render: (_: any, record: any) => (
                <Space>
                  <Button 
                    type="link" 
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    编辑
                  </Button>
                  <Popconfirm 
                    title="确认删除?" 
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      )}

      <Modal
        title={editingItem ? '编辑招聘岗位' : '新增招聘岗位'}
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
          <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="company" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="工作地点">
            <Input placeholder="北京、上海、远程..." />
          </Form.Item>
          <Form.Item name="salaryMin" label="最低薪资(K)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="salaryMax" label="最高薪资(K)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="岗位描述">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="tags" label="标签(JSON数组)"
            tooltip='例如: ["机器人", "Python"]'>
            <Input placeholder='["机器人", "Python"]' />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="open">
            <Select options={[
              { value: 'open', label: '招聘中' },
              { value: 'closed', label: '已关闭' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingItem ? '更新岗位' : '创建岗位'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
