/**
 * 管理端 - 内容管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Tabs, Button, Space, Table, Modal, Form, Input, InputNumber, DatePicker, Tag, Popconfirm, Select, Empty, App } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function AdminContentPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('papers');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadContent(1);
  }, [activeTab]);

  const loadContent = async (pageNum: number) => {
    setLoading(true);
    try {
      // 根据不同的tab使用不同的API路径
      let apiPath = '';
      if (activeTab === 'papers') {
        apiPath = '/papers';
      } else if (activeTab === 'videos') {
        apiPath = '/videos';
      } else if (activeTab === 'repos') {
        apiPath = '/repos';
      } else if (activeTab === 'jobs') {
        apiPath = '/jobs';
      } else if (activeTab === 'banners') {
        apiPath = '/banners';
      } else if (activeTab === 'huggingface') {
        apiPath = '/huggingface';
      } else if (activeTab === 'news') {
        apiPath = '/news';
      } else {
        message.error('不支持的内容类型');
        return;
      }

      const response = await apiClient.get(apiPath, {
        params: { page: pageNum, size },
      });
      setItems(response.data.items || []);
      setTotal(response.data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Load content error:', error);
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
    if (!value) {
      return undefined;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const payload = { ...values };
      
      // 处理日期字段
      if (payload.publishedDate) {
        payload.publishedDate = payload.publishedDate.toISOString();
      }
      if (payload.lastModified) {
        payload.lastModified = payload.lastModified.toISOString();
      }
      if (payload.createdDate) {
        payload.createdDate = payload.createdDate.toISOString();
      }
      if (payload.updatedDate) {
        payload.updatedDate = payload.updatedDate.toISOString();
      }

      // 处理JSON字段
      if (activeTab === 'papers') {
        const authors = parseJsonField(payload.authors);
        const categories = parseJsonField(payload.categories);
        if (authors === null || categories === null) {
          message.error('作者或分类需要是合法的JSON数组');
          return;
        }
        if (authors) payload.authors = authors;
        if (categories) payload.categories = categories;
      }

      if (activeTab === 'videos') {
        const tags = parseJsonField(payload.tags);
        if (tags === null) {
          message.error('标签需要是合法的JSON数组');
          return;
        }
        if (tags) payload.tags = tags;
      }

      if (activeTab === 'repos') {
        const topics = parseJsonField(payload.topics);
        if (topics === null) {
          message.error('Topics需要是合法的JSON数组');
          return;
        }
        if (topics) payload.topics = topics;
      }

      if (activeTab === 'jobs') {
        const tags = parseJsonField(payload.tags);
        if (tags === null) {
          message.error('标签需要是合法的JSON数组');
          return;
        }
        if (tags) payload.tags = tags;
      }

      if (activeTab === 'huggingface') {
        const tags = parseJsonField(payload.tags);
        if (tags === null) {
          message.error('标签需要是合法的JSON数组');
          return;
        }
        if (tags) payload.tags = tags;
      }
      
      // 如果是编辑模式，使用PUT请求
      if (editingItem) {
        await apiClient.put(`/admin/content/${activeTab}/${editingItem.id}`, payload);
        message.success('更新成功');
        setEditingItem(null);
      } else {
        // 创建模式，使用POST请求
        await apiClient.post(`/admin/content/${activeTab}`, payload);
        message.success('创建成功');
      }
      
      setShowModal(false);
      form.resetFields();
      loadContent(page);
    } catch (error: any) {
      console.error('Create/Update content error:', error);
      const errorMessage = error.response?.data?.message || error.message || (editingItem ? '更新失败' : '创建失败');
      message.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/${activeTab}/${id}`);
      message.success('删除成功');
      loadContent(1);
    } catch (error: any) {
      console.error('Delete content error:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      message.error(errorMessage);
    }
  };

  const renderPaperForm = () => (
    <Form form={form} onFinish={handleCreate} layout="vertical">
      <Form.Item name="title" label="标题" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="authors" label="作者(JSON数组)">
        <Input placeholder='["作者1", "作者2"]' />
      </Form.Item>
      <Form.Item name="abstract" label="摘要">
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item name="pdfUrl" label="PDF链接">
        <Input />
      </Form.Item>
      <Form.Item name="arxivId" label="arXiv ID">
        <Input />
      </Form.Item>
      <Form.Item name="venue" label="会议/期刊">
        <Input />
      </Form.Item>
      <Form.Item name="publishedDate" label="发布日期">
        <DatePicker />
      </Form.Item>
      <Form.Item name="citationCount" label="引用数">
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item name="categories" label="分类(JSON数组)">
        <Input placeholder='["cs.AI", "cs.RO"]' />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          {editingItem ? '更新论文' : '创建论文'}
        </Button>
      </Form.Item>
    </Form>
  );

  const renderVideoForm = () => (
    <Form form={form} onFinish={handleCreate} layout="vertical">
      <Form.Item name="title" label="标题" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
        <Input placeholder="bilibili 或 youtube" />
      </Form.Item>
      <Form.Item name="videoId" label="视频ID" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item name="coverUrl" label="封面URL">
        <Input />
      </Form.Item>
      <Form.Item name="uploader" label="UP主">
        <Input />
      </Form.Item>
      <Form.Item name="duration" label="时长(秒)">
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item name="tags" label="标签(JSON数组)">
        <Input placeholder='["教程", "机器人"]' />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          创建视频
        </Button>
      </Form.Item>
    </Form>
  );

  const renderJobForm = () => (
    <Form form={form} onFinish={handleCreate} layout="vertical">
      <Form.Item name="title" label="岗位名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="company" label="公司名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="location" label="工作地点">
        <Input />
      </Form.Item>
      <Form.Item name="salaryMin" label="最低薪资(K)">
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item name="salaryMax" label="最高薪资(K)">
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item name="description" label="岗位描述">
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item name="requirements" label="任职要求">
        <TextArea rows={3} />
      </Form.Item>
      <Form.Item name="tags" label="标签(JSON数组)">
        <Input placeholder='["机器人", "Python"]' />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          创建岗位
        </Button>
      </Form.Item>
    </Form>
  );

  const renderRepoForm = () => (
    <Form form={form} onFinish={handleCreate} layout="vertical">
      <Form.Item name="repoId" label="Repo ID" rules={[{ required: true }]}>
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="fullName" label="完整名称" rules={[{ required: true }]}>
        <Input placeholder="owner/name" />
      </Form.Item>
      <Form.Item name="name" label="项目名" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="owner" label="Owner">
        <Input />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <TextArea rows={3} />
      </Form.Item>
      <Form.Item name="language" label="语言">
        <Input />
      </Form.Item>
      <Form.Item name="starsCount" label="Stars">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="forksCount" label="Forks">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="issuesCount" label="Issues">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="topics" label="Topics(JSON数组)">
        <Input placeholder='["robotics", "ai"]' />
      </Form.Item>
      <Form.Item name="createdDate" label="创建日期">
        <DatePicker />
      </Form.Item>
      <Form.Item name="updatedDate" label="更新日期">
        <DatePicker />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          创建项目
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>内容管理</h1>
        <Button type="primary" onClick={() => setShowModal(true)}>
          新增内容
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          { key: 'banners', label: 'Banner' },
          { key: 'papers', label: '论文' },
          { key: 'videos', label: '视频' },
          { key: 'repos', label: 'GitHub项目' },
          { key: 'huggingface', label: 'HuggingFace' },
          { key: 'jobs', label: '招聘岗位' },
          { key: 'news', label: '新闻' },
        ]}
      />

      {items.length === 0 && !loading ? (
        <Empty description="暂无数据" style={{ padding: '40px 0' }} />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p) => loadContent(p),
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        columns={[
          ...(activeTab === 'papers'
            ? [
                { title: '标题', dataIndex: 'title' },
                {
                  title: '作者',
                  dataIndex: 'authors',
                  render: (value: any) => {
                    let authors: string[] = [];
                    if (Array.isArray(value)) {
                      authors = value;
                    } else if (typeof value === 'string' && value) {
                      try {
                        const parsed = JSON.parse(value);
                        authors = Array.isArray(parsed) ? parsed : [];
                      } catch {
                        authors = [];
                      }
                    }
                    return authors.length > 0 ? authors.join(', ') : '-';
                  },
                },
                { title: '会议', dataIndex: 'venue' },
                {
                  title: '日期',
                  dataIndex: 'publishedDate',
                  render: (value: string) => (value ? new Date(value).toLocaleDateString() : '-'),
                },
                { title: '引用', dataIndex: 'citationCount' },
              ]
            : []),
          ...(activeTab === 'videos'
            ? [
                { title: '标题', dataIndex: 'title' },
                { title: '平台', dataIndex: 'platform' },
                { title: 'UP主', dataIndex: 'uploader' },
                { title: '播放', dataIndex: 'playCount' },
              ]
            : []),
          ...(activeTab === 'repos'
            ? [
                { title: '项目', dataIndex: 'fullName' },
                { title: '语言', dataIndex: 'language', render: (value: string) => value || '-' },
                { title: 'Stars', dataIndex: 'starsCount' },
                { title: 'Forks', dataIndex: 'forksCount' },
              ]
            : []),
          ...(activeTab === 'banners'
            ? [
                { title: '标题', dataIndex: 'title' },
                {
                  title: '图片',
                  dataIndex: 'imageUrl',
                  render: (value: string) => value ? <a href={value} target="_blank" rel="noreferrer">查看</a> : '-',
                },
                { title: '跳转链接', dataIndex: 'linkUrl', render: (value: string) => value || '-' },
                { title: '排序', dataIndex: 'sortOrder' },
                {
                  title: '状态',
                  dataIndex: 'isActive',
                  render: (value: boolean) => (
                    <Tag color={value ? 'green' : 'red'}>{value ? '启用' : '停用'}</Tag>
                  ),
                },
              ]
            : []),
          ...(activeTab === 'huggingface'
            ? [
                { title: '模型', dataIndex: 'fullName' },
                { title: '任务', dataIndex: 'task', render: (value: string) => value || '-' },
                { title: '下载', dataIndex: 'downloads' },
                { title: '点赞', dataIndex: 'likes' },
              ]
            : []),
          ...(activeTab === 'jobs'
            ? [
                { title: '岗位', dataIndex: 'title' },
                { title: '公司', dataIndex: 'company' },
                { title: '地点', dataIndex: 'location', render: (value: string) => value || '-' },
                {
                  title: '薪资',
                  render: (_: any, record: any) =>
                    record.salaryMin && record.salaryMax ? `${record.salaryMin}K-${record.salaryMax}K` : '面议',
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => (
                    <Tag color={value === 'open' ? 'green' : 'red'}>{value === 'open' ? '招聘中' : '已关闭'}</Tag>
                  ),
                },
              ]
            : []),
          ...(activeTab === 'news'
            ? [
                { title: '标题', dataIndex: 'title', width: 300, ellipsis: true },
                { 
                  title: '平台', 
                  dataIndex: 'platform', 
                  width: 100,
                  render: (platform: string) => <Tag color="blue">{platform}</Tag>
                },
                { 
                  title: '热度评分', 
                  dataIndex: 'score', 
                  width: 100,
                  render: (score: string) => score ? <Tag color="orange">{score}</Tag> : '-'
                },
                { title: '浏览量', dataIndex: 'viewCount', width: 80 },
                { title: '收藏数', dataIndex: 'favoriteCount', width: 80 },
              ]
            : []),
          {
            title: '操作',
            width: 120,
            render: (_: any, record: any) => (
              <Space>
                <Button 
                  type="link" 
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingItem(record);
                    // 填充表单数据
                    const formData: any = { ...record };
                    // 处理JSON字段 - 转换为字符串格式用于表单显示
                    if (formData.authors && typeof formData.authors === 'string') {
                      try {
                        const authors = JSON.parse(formData.authors);
                        formData.authors = Array.isArray(authors) ? JSON.stringify(authors) : formData.authors;
                      } catch {}
                    }
                    if (formData.categories && typeof formData.categories === 'string') {
                      try {
                        const categories = JSON.parse(formData.categories);
                        formData.categories = Array.isArray(categories) ? JSON.stringify(categories) : formData.categories;
                      } catch {}
                    }
                    if (formData.tags && typeof formData.tags === 'string') {
                      try {
                        const tags = JSON.parse(formData.tags);
                        formData.tags = Array.isArray(tags) ? JSON.stringify(tags) : formData.tags;
                      } catch {}
                    }
                    if (formData.topics && typeof formData.topics === 'string') {
                      try {
                        const topics = JSON.parse(formData.topics);
                        formData.topics = Array.isArray(topics) ? JSON.stringify(topics) : formData.topics;
                      } catch {}
                    }
                    // 处理日期字段
                    if (formData.publishedDate) {
                      formData.publishedDate = dayjs(formData.publishedDate);
                    }
                    if (formData.lastModified) {
                      formData.lastModified = dayjs(formData.lastModified);
                    }
                    if (formData.createdDate) {
                      formData.createdDate = dayjs(formData.createdDate);
                    }
                    if (formData.updatedDate) {
                      formData.updatedDate = dayjs(formData.updatedDate);
                    }
                    form.setFieldsValue(formData);
                    setShowModal(true);
                  }}
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
        title={`${editingItem ? '编辑' : '新增'}${activeTab === 'banners' ? 'Banner' : activeTab === 'papers' ? '论文' : activeTab === 'videos' ? '视频' : activeTab === 'repos' ? 'GitHub项目' : activeTab === 'huggingface' ? 'HuggingFace模型' : activeTab === 'news' ? '新闻' : '岗位'}`}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {activeTab === 'papers' && renderPaperForm()}
        {activeTab === 'videos' && renderVideoForm()}
        {activeTab === 'jobs' && renderJobForm()}
        {activeTab === 'repos' && renderRepoForm()}
        {activeTab === 'news' && (
          <Form form={form} onFinish={handleCreate} layout="vertical">
            <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
              <Select placeholder="选择平台">
                <Select.Option value="baidu">百度</Select.Option>
                <Select.Option value="weibo">微博</Select.Option>
                <Select.Option value="zhihu">知乎</Select.Option>
                <Select.Option value="bilibili">Bilibili</Select.Option>
                <Select.Option value="douban">豆瓣</Select.Option>
                <Select.Option value="juejin">掘金</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input placeholder="新闻标题" />
            </Form.Item>
            <Form.Item name="url" label="URL" rules={[{ required: true }, { type: 'url', message: '请输入有效的URL' }]}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="score" label="热度评分">
              <Input placeholder="热度评分（可选）" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={4} placeholder="新闻描述（可选）" />
            </Form.Item>
            <Form.Item name="publishedDate" label="发布时间">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                创建新闻
              </Button>
            </Form.Item>
          </Form>
        )}
        {activeTab === 'banners' && (
          <Form form={form} onFinish={handleCreate} layout="vertical">
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="imageUrl" label="图片链接" rules={[{ required: true }]}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="linkUrl" label="跳转链接">
              <Input placeholder="/huggingface" />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="isActive" label="启用">
              <Select options={[{ value: true, label: '启用' }, { value: false, label: '停用' }]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                创建Banner
              </Button>
            </Form.Item>
          </Form>
        )}
        {activeTab === 'huggingface' && (
          <Form form={form} onFinish={handleCreate} layout="vertical">
            <Form.Item name="hfId" label="HF ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="fullName" label="完整名称" rules={[{ required: true }]}>
              <Input placeholder="author/model" />
            </Form.Item>
            <Form.Item name="name" label="模型名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="author" label="作者">
              <Input />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item name="task" label="任务">
              <Input />
            </Form.Item>
            <Form.Item name="license" label="License">
              <Input />
            </Form.Item>
            <Form.Item name="downloads" label="下载量">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="likes" label="点赞数">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="tags" label="标签(JSON数组)">
              <Input placeholder='["llm", "robotics"]' />
            </Form.Item>
            <Form.Item name="lastModified" label="最后更新">
              <DatePicker />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                创建模型
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
