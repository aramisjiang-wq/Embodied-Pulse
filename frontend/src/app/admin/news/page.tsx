/**
 * 管理端 - 新闻管理页面
 * 支持富文本编辑
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  Tag,
  Popconfirm,
  Empty,
  App,
  Switch,
  Pagination,
  DatePicker,
  Card,
  Spin,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, PushpinOutlined, EyeOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import PageContainer from '@/components/PageContainer';
import RichTextEditor from '@/components/RichTextEditor';
import dayjs from 'dayjs';
import styles from './page.module.css';

interface DailyNews {
  id: string;
  date: string;
  title: string;
  content: string;
  isPinned: boolean | number;
  pinnedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNewsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [editingItem, setEditingItem] = useState<DailyNews | null>(null);
  const [items, setItems] = useState<DailyNews[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadContent(1);
  }, []);

  const loadContent = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/content/news', {
        params: { page: pageNum, size },
      });
      const data = response.data as { items?: DailyNews[]; pagination?: { total?: number } };
      setItems(data.items || []);
      setTotal(data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Load content error:', error);
      if (
        error.status === 401 ||
        error.code === 'UNAUTHORIZED' ||
        error.response?.data?.code === 1002 ||
        error.response?.data?.code === 1003
      ) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (
        error.code === 'CONNECTION_REFUSED' ||
        error.code === 'TIMEOUT' ||
        error.code === 'NETWORK_ERROR'
      ) {
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

  const handleCreate = async (values: any) => {
    try {
      const submitData = {
        ...values,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
      };
      await apiClient.post('/admin/content/news', submitData);
      message.success('创建成功');
      setShowModal(false);
      form.resetFields();
      loadContent(1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '创建失败';
      message.error(errorMessage);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingItem) return;
    try {
      const submitData = {
        ...values,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
      };
      await apiClient.put(`/admin/content/news/${editingItem.id}`, submitData);
      message.success('更新成功');
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadContent(page);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '更新失败';
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/news/${id}`);
      message.success('删除成功');
      loadContent(page);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      message.error(errorMessage);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await apiClient.put(`/admin/content/news/${id}/pin`);
      message.success('操作成功');
      loadContent(page);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const openEditModal = (item: DailyNews) => {
    setEditingItem(item);
    form.setFieldsValue({
      date: dayjs(item.date),
      title: item.title,
      content: item.content,
      isPinned: item.isPinned,
    });
    setShowModal(true);
  };

  const openPreview = (content: string) => {
    setPreviewContent(content);
    setShowPreviewModal(true);
  };

  const getDefaultTitle = () => {
    const now = dayjs();
    return `具身智能领域动态-${now.format('YYYY年M月D日')}`;
  };

  const stripHtml = (html: string, maxLength: number = 50) => {
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      render: (value: string) => (
        <Space>
          <span style={{ color: '#8c8c8c' }}>{stripHtml(value, 30)}</span>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openPreview(value)}
          />
        </Space>
      ),
    },
    {
      title: '置顶',
      dataIndex: 'isPinned',
      key: 'isPinned',
      width: 100,
      render: (value: boolean | number, record: DailyNews) => (
        <Switch checked={!!value} onChange={() => handleTogglePin(record.id)} />
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (value: number) => value || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: DailyNews) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此新闻吗？"
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
    <PageContainer loading={loading && items.length === 0}>
      <Card className={styles.mainCard}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>每日新闻</h1>
            <span className={styles.pageSubtitle}>管理具身智能领域每日动态</span>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              form.resetFields();
              form.setFieldsValue({
                date: dayjs(),
                title: getDefaultTitle(),
              });
              setShowModal(true);
            }}
          >
            新增新闻
          </Button>
        </div>

        {items.length === 0 && !loading ? (
          <Empty description="暂无新闻" className={styles.emptyState} />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <Table
                rowKey="id"
                loading={loading}
                dataSource={items}
                columns={columns}
                pagination={false}
                scroll={{ x: 1100 }}
              />
            </div>
            {total > size && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  current={page}
                  pageSize={size}
                  total={total}
                  onChange={(p) => loadContent(p)}
                  showSizeChanger={false}
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        title={editingItem ? '编辑新闻' : '新增新闻'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={900}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form
          form={form}
          onFinish={editingItem ? handleUpdate : handleCreate}
          layout="vertical"
          initialValues={{ date: dayjs(), title: getDefaultTitle() }}
        >
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="如：具身智能领域动态-2026年2月24日" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <RichTextEditor
              height={400}
              placeholder="支持富文本编辑，可插入图片、链接、表格等"
            />
          </Form.Item>
          <Form.Item name="isPinned" valuePropName="checked">
            <Tag color="blue" icon={<PushpinOutlined />}>置顶显示</Tag>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="内容预览"
        open={showPreviewModal}
        onCancel={() => setShowPreviewModal(false)}
        footer={null}
        width={800}
      >
        <div
          style={{
            padding: 16,
            maxHeight: 500,
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
          }}
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </Modal>
    </PageContainer>
  );
}
