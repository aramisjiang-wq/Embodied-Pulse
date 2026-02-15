'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Switch, DatePicker, Tag, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { announcementApi } from '@/lib/api/announcement';
import { Announcement } from '@/lib/api/types';
import dayjs from 'dayjs';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementApi.getAnnouncements();
      
      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setAnnouncements([]);
        return;
      }
      
      setAnnouncements(data.items);
    } catch (error: any) {
      console.error('Load announcements error:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.setFieldsValue({
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive,
      startDate: announcement.startDate ? dayjs(announcement.startDate) : null,
      endDate: announcement.endDate ? dayjs(announcement.endDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条公告吗？',
      onOk: async () => {
        try {
          await announcementApi.deleteAnnouncement(id);
          message.success('删除成功');
          loadAnnouncements();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        title: values.title,
        content: values.content,
        isActive: values.isActive,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      if (editingAnnouncement) {
        await announcementApi.updateAnnouncement(editingAnnouncement.id, data);
        message.success('更新成功');
      } else {
        await announcementApi.createAnnouncement(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadAnnouncements();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => {
        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? '启用' : '禁用'}
          </Tag>
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 180,
      render: (date: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';
      },
    },
    {
      title: '结束时间',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 180,
      render: (date: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        return dayjs(date).format('YYYY-MM-DD HH:mm');
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Announcement) => {
        return (
          <Space>
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>公告管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建公告
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={announcements}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingAnnouncement ? '编辑公告' : '新建公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入公告内容" />
          </Form.Item>

          <Form.Item label="是否启用" name="isActive" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item label="开始时间" name="startDate">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="结束时间" name="endDate">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
