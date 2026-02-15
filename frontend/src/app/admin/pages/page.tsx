'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Switch, InputNumber, App, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { customPageApi, CustomPage } from '@/lib/api/custom-page';

const { TextArea } = Input;
const { Title } = Typography;

export default function AdminPagesPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomPage[]>([]);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const loadData = useCallback(async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const result = await customPageApi.adminList({ page, size });
      setData(result.items || []);
      setPagination(prev => ({
        ...prev,
        page,
        size,
        total: result.pagination?.total || 0,
      }));
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setEditingPage(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: CustomPage) => {
    setEditingPage(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await customPageApi.delete(id);
      if (success) {
        message.success('删除成功');
        loadData(pagination.page, pagination.size);
      } else {
        message.error('删除失败');
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let success = false;
      
      if (editingPage) {
        const result = await customPageApi.update(editingPage.id, values);
        success = !!result;
      } else {
        const result = await customPageApi.create(values);
        success = !!result;
      }

      if (success) {
        message.success(editingPage ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadData(pagination.page, pagination.size);
      } else {
        message.error(editingPage ? '更新失败' : '创建失败');
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setPreviewVisible(true);
  };

  const columns = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: CustomPage) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handlePreview(record.content)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此页面吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>自定义页面管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建页面
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.size,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => loadData(page, size),
          }}
        />
      </Card>

      <Modal
        title={editingPage ? '编辑页面' : '新建页面'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="slug"
            label="Slug（URL路径）"
            rules={[
              { required: true, message: '请输入Slug' },
              { pattern: /^[a-z0-9-]+$/, message: 'Slug只能包含小写字母、数字和连字符' },
            ]}
          >
            <Input placeholder="例如: about, contact, faq" disabled={!!editingPage} />
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="页面标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容（支持HTML）"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea
              rows={12}
              placeholder="支持HTML富文本内容"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            tooltip="数字越小越靠前"
          >
            <InputNumber min={0} max={999} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="内容预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div 
          style={{ padding: 16, maxHeight: 500, overflow: 'auto' }}
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </Modal>
    </div>
  );
}
