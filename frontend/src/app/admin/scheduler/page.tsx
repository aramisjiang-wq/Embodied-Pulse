'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Switch, Tag, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

export default function AdminSchedulerPage() {
  const [schedulers, setSchedulers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScheduler, setEditingScheduler] = useState<any>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    loadSchedulers();
  }, []);

  const loadSchedulers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/scheduler');
      const data = await response.json();
      if (data.code === 0) {
        setSchedulers(Array.isArray(data.data) ? data.data : []);
      } else {
        message.error(data.message || '加载调度器失败');
      }
    } catch (error: any) {
      message.error(error.message || '加载调度器失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingScheduler(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (scheduler: any) => {
    setEditingScheduler(scheduler);
    form.setFieldsValue({
      name: scheduler.name,
      taskType: scheduler.taskType,
      cronExpression: scheduler.cronExpression,
      params: scheduler.params,
      isActive: scheduler.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个调度任务吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/admin/scheduler/${id}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (data.code === 0) {
            message.success('删除成功');
            loadSchedulers();
          } else {
            message.error(data.message || '删除失败');
          }
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/scheduler/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      const data = await response.json();
      if (data.code === 0) {
        message.success(isActive ? '已启动' : '已停止');
        loadSchedulers();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        name: values.name,
        taskType: values.taskType,
        cronExpression: values.cronExpression,
        params: values.params,
        isActive: values.isActive,
      };

      const url = editingScheduler
        ? `/api/admin/scheduler/${editingScheduler.id}`
        : '/api/admin/scheduler';
      const method = editingScheduler ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.code === 0) {
        message.success(editingScheduler ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadSchedulers();
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const getTaskTypeTag = (taskType: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      sync_arxiv: { color: 'blue', text: '同步arXiv' },
      sync_github: { color: 'green', text: '同步GitHub' },
      sync_huggingface: { color: 'purple', text: '同步HuggingFace' },
      sync_bilibili: { color: 'pink', text: '同步Bilibili' },
      sync_youtube: { color: 'orange', text: '同步YouTube' },
      sync_jobs: { color: 'cyan', text: '同步岗位' },
      sync_news: { color: 'red', text: '同步新闻' },
    };
    const config = typeMap[taskType] || { color: 'default', text: taskType };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 150,
      render: (taskType: string) => {
        return getTaskTypeTag(taskType);
      },
    },
    {
      title: 'Cron表达式',
      dataIndex: 'cronExpression',
      key: 'cronExpression',
      width: 150,
    },
    {
      title: '参数',
      dataIndex: 'params',
      key: 'params',
      ellipsis: true,
      render: (params: any) => {
        if (!params) return '-';
        try {
          return typeof params === 'string' ? params : JSON.stringify(params);
        } catch {
          return '-';
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => {
        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? '运行中' : '已停止'}
          </Tag>
        );
      },
    },
    {
      title: '下次执行',
      dataIndex: 'nextRunAt',
      key: 'nextRunAt',
      width: 180,
      render: (date: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      title: '上次执行',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 180,
      render: (date: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
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
      title: '操作',
      key: 'actions',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        return (
          <Space>
            <Button
              type="link"
              icon={record.isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggle(record.id, !record.isActive)}
            >
              {record.isActive ? '停止' : '启动'}
            </Button>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>调度器管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建调度任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={schedulers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingScheduler ? '编辑调度任务' : '新建调度任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="任务名称"
            name="name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            label="任务类型"
            name="taskType"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select placeholder="请选择任务类型">
              <Option value="sync_arxiv">同步arXiv</Option>
              <Option value="sync_github">同步GitHub</Option>
              <Option value="sync_huggingface">同步HuggingFace</Option>
              <Option value="sync_bilibili">同步Bilibili</Option>
              <Option value="sync_youtube">同步YouTube</Option>
              <Option value="sync_jobs">同步岗位</Option>
              <Option value="sync_news">同步新闻</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Cron表达式"
            name="cronExpression"
            rules={[{ required: true, message: '请输入Cron表达式' }]}
            extra="例如: 0 0 * * * 表示每天0点执行"
          >
            <Input placeholder="请输入Cron表达式" />
          </Form.Item>

          <Form.Item
            label="参数"
            name="params"
            extra='JSON格式的参数，例如: {"query": "robotics", "maxResults": 100}'
          >
            <Input.TextArea rows={4} placeholder="请输入参数（JSON格式）" />
          </Form.Item>

          <Form.Item label="是否启用" name="isActive" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
