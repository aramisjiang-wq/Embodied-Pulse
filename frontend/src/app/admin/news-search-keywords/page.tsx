/**
 * 新闻搜索关键词管理页面
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Tag,
  Popconfirm,
  Switch,
  Select,
  InputNumber,
  App,
  Tooltip,
  Card,
  Statistic,
  Row,
  Col,
  Upload,
  Alert,
  Tabs,
  List,
  Avatar,
  Typography,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  UserOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { newsSearchKeywordApi } from '@/lib/api/news-search-keyword';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const CATEGORIES = [
  { value: '核心概念', label: '核心概念' },
  { value: '技术相关', label: '技术相关' },
  { value: '应用场景', label: '应用场景' },
  { value: '学习方法', label: '学习方法' },
  { value: '任务类型', label: '任务类型' },
  { value: '人群关注', label: '人群关注' },
];

const SOURCE_TYPES = [
  { value: 'admin', label: '管理员创建' },
  { value: 'user', label: '用户订阅' },
];

interface NewsSearchKeyword {
  id: string;
  keyword: string;
  category?: string;
  sourceType: string;
  isActive: boolean;
  priority: number;
  description?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
  newsCount?: number;
}

interface News {
  id: string;
  title: string;
  description: string;
  platform: string;
  url: string;
  publishedDate: string;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
}

export default function NewsSearchKeywordsPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<NewsSearchKeyword[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterSourceType, setFilterSourceType] = useState<string | undefined>(undefined);
  const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>(undefined);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentKeyword, setCurrentKeyword] = useState<NewsSearchKeyword | null>(null);
  const [form] = Form.useForm();
  const [syncLoading, setSyncLoading] = useState(false);

  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [newsTotal, setNewsTotal] = useState(0);
  const [newsPage, setNewsPage] = useState(1);
  const [currentKeywordId, setCurrentKeywordId] = useState<string | null>(null);

  const keywordsList = keywords || [];

  const loadKeywords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await newsSearchKeywordApi.getAllKeywords({
        page,
        size,
        keyword: searchKeyword || undefined,
        category: filterCategory,
        sourceType: filterSourceType,
        isActive: filterIsActive,
      });
      
      setKeywords(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (error: any) {
      messageApi.error('加载关键词失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, [page, size, searchKeyword, filterCategory, filterSourceType, filterIsActive]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const loadKeywordNews = async (keywordId: string, pageNum: number = 1) => {
    try {
      setNewsLoading(true);
      const response = await newsSearchKeywordApi.getKeywordNews(keywordId, { page: pageNum, size: 10 });
      setRelatedNews(response.data?.items || []);
      setNewsTotal(response.data?.pagination?.total || 0);
      setNewsPage(pageNum);
    } catch (error: any) {
      messageApi.error('加载相关新闻失败: ' + (error.message || '未知错误'));
    } finally {
      setNewsLoading(false);
    }
  };

  const handleSyncLatestNews = async () => {
    setSyncLoading(true);
    const hideLoading = messageApi.loading('正在从多个新闻源拉取最新新闻，这可能需要一些时间...', 0);
    
    try {
      const response = await newsSearchKeywordApi.syncLatestNews(24);
      hideLoading();
      
      if (response.code === 0) {
        const { results, keywords: syncedKeywords } = response.data?.data || {};
        const hotNewsSynced = results?.hotNews?.synced || 0;
        const techNewsSynced = results?.techNews?.synced || 0;
        const kr36NewsSynced = results?.kr36?.synced || 0;
        const totalSynced = response.data?.data?.total || 0;
        
        messageApi.success(`成功从 ${syncedKeywords?.length || 0} 个关键词同步 ${totalSynced} 条新闻（热点新闻: ${hotNewsSynced} 条，科技新闻: ${techNewsSynced} 条，36kr: ${kr36NewsSynced} 条）`);
        await loadKeywords();
      } else {
        messageApi.error(response.message || '同步失败');
      }
    } catch (error: any) {
      hideLoading();
      messageApi.error('同步最新新闻失败: ' + (error.message || '未知错误'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSearchNewsByAllKeywords = async () => {
    setSyncLoading(true);
    const hideLoading = messageApi.loading('正在根据所有启用的关键词搜索新闻，这可能需要一些时间...', 0);
    
    try {
      const response = await newsSearchKeywordApi.searchNewsByAllKeywords({
        includeHotNews: true,
        includeTechNews: true,
        includeKr36: true,
        hotNewsPlatforms: 'baidu,weibo,zhihu',
        maxResultsPerSource: 50,
      });
      hideLoading();
      
      if (response.code === 0) {
        const { results, keywords: syncedKeywords } = response.data?.data || {};
        const hotNewsSynced = results?.hotNews?.synced || 0;
        const techNewsSynced = results?.techNews?.synced || 0;
        const kr36NewsSynced = results?.kr36?.synced || 0;
        const totalSynced = response.data?.data?.total || 0;
        
        messageApi.success(`成功从 ${syncedKeywords?.length || 0} 个关键词搜索到 ${totalSynced} 条新闻（热点新闻: ${hotNewsSynced} 条，科技新闻: ${techNewsSynced} 条，36kr: ${kr36NewsSynced} 条）`);
        await loadKeywords();
      } else {
        messageApi.error(response.message || '搜索失败');
      }
    } catch (error: any) {
      hideLoading();
      messageApi.error('搜索新闻失败: ' + (error.message || '未知错误'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSearchNewsByKeywords = async () => {
    const activeKeywords = keywordsList.filter(k => k.isActive).map(k => k.keyword);
    
    if (activeKeywords.length === 0) {
      messageApi.warning('没有启用的关键词，请先启用一些关键词');
      return;
    }
    setSyncLoading(true);
    const hideLoading = messageApi.loading(`正在根据 ${activeKeywords.length} 个关键词搜索新闻，这可能需要一些时间...`, 0);
    
    try {
      const response = await newsSearchKeywordApi.searchNewsByKeywords(activeKeywords, {
        includeHotNews: true,
        includeTechNews: true,
        includeKr36: true,
        hotNewsPlatforms: ['baidu', 'weibo', 'zhihu'],
        maxResultsPerSource: 50,
      });
      hideLoading();
      
      if (response.code === 0) {
        const { results } = response.data?.data || {};
        const hotNewsSynced = results?.hotNews?.synced || 0;
        const techNewsSynced = results?.techNews?.synced || 0;
        const kr36NewsSynced = results?.kr36?.synced || 0;
        const totalSynced = response.data?.data?.total || 0;
        
        messageApi.success(`成功从 ${activeKeywords.length} 个关键词搜索到 ${totalSynced} 条相关新闻（热点新闻: ${hotNewsSynced} 条，科技新闻: ${techNewsSynced} 条，36kr: ${kr36NewsSynced} 条）`);
        await loadKeywords();
      } else {
        messageApi.error(response.message || '搜索失败');
      }
    } catch (error: any) {
      hideLoading();
      messageApi.error('搜索新闻失败: ' + (error.message || '未知错误'));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setCurrentKeyword(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (keyword: NewsSearchKeyword) => {
    setModalMode('edit');
    setCurrentKeyword(keyword);
    form.setFieldsValue({
      keyword: keyword.keyword,
      category: keyword.category,
      sourceType: keyword.sourceType,
      isActive: keyword.isActive,
      priority: keyword.priority,
      description: keyword.description,
      tags: keyword.tags ? JSON.parse(keyword.tags) : [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await newsSearchKeywordApi.deleteKeyword(id);
      messageApi.success('删除成功');
      loadKeywords();
    } catch (error: any) {
      messageApi.error('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        tags: values.tags ? JSON.stringify(values.tags) : undefined,
      };

      if (modalMode === 'create') {
        await newsSearchKeywordApi.createKeyword(data);
        messageApi.success('创建成功');
      } else {
        await newsSearchKeywordApi.updateKeyword(currentKeyword!.id, data);
        messageApi.success('更新成功');
      }
      setModalVisible(false);
      loadKeywords();
    } catch (error: any) {
      messageApi.error((modalMode === 'create' ? '创建' : '更新') + '失败: ' + (error.message || '未知错误'));
    }
  };

  const handleViewNews = async (keyword: NewsSearchKeyword) => {
    setCurrentKeywordId(keyword.id);
    setNewsModalVisible(true);
    await loadKeywordNews(keyword.id);
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 120,
      fixed: 'left' as const,
      render: (text: string, record: NewsSearchKeyword) => (
        <Space size={4}>
          <Text strong style={{ fontSize: 13, color: record.isActive ? '#1890ff' : '#999' }}>
            {text}
          </Text>
          {!record.isActive && <Tag color="red" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>已禁用</Tag>}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (text: string | null) => text ? <Tag color="blue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{text}</Tag> : <span style={{ fontSize: 12, color: '#999' }}>-</span>,
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 80,
      render: (text: string) => (
        <Tag color={text === 'admin' ? 'green' : 'orange'} style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
          {text === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 70,
      sorter: (a: NewsSearchKeyword, b: NewsSearchKeyword) => a.priority - b.priority,
      render: (text: number) => <Tag color="purple" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{text}</Tag>,
    },
    {
      title: '相关新闻',
      dataIndex: 'newsCount',
      key: 'newsCount',
      width: 90,
      sorter: (a: any, b: any) => (a.newsCount || 0) - (b.newsCount || 0),
      render: (text: number, record: NewsSearchKeyword) => (
        <Space size={4}>
          <Tag color={text > 0 ? 'green' : 'default'} style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{text || 0}</Tag>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewNews(record)}
            style={{ padding: 0 }}
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: NewsSearchKeyword) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={(checked) => {
            newsSearchKeywordApi.updateKeyword(record.id, { isActive: checked })
              .then(() => {
                messageApi.success('状态更新成功');
                setTimeout(() => loadKeywords(), 0);
              })
              .catch((error: any) => {
                messageApi.error('状态更新失败: ' + (error.message || '未知错误'));
              });
          }}
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 150,
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description || '-'}>
          <span style={{ color: '#666', fontSize: 12 }}>
            {description || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      sorter: (a: NewsSearchKeyword, b: NewsSearchKeyword) => 
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ fontSize: 12 }}>{dayjs(text).format('MM-DD HH:mm')}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: NewsSearchKeyword) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个关键词吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const newsColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedDate',
      key: 'publishedDate',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '浏览',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
    },
    {
      title: '收藏',
      dataIndex: 'favoriteCount',
      key: 'favoriteCount',
      width: 80,
    },
    {
      title: '分享',
      dataIndex: 'shareCount',
      key: 'shareCount',
      width: 80,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="总关键词数"
                  value={total}
                  prefix={<UnorderedListOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="活跃关键词"
                  value={keywordsList.filter(k => k.isActive).length}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="管理员创建"
                  value={keywordsList.filter(k => k.sourceType === 'admin').length}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="用户订阅"
                  value={keywordsList.filter(k => k.sourceType === 'user').length}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>个</span>}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="总相关新闻"
                  value={keywordsList.reduce((sum, k) => sum + (k.newsCount || 0), 0)}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#eb2f96', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>条</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="平均新闻数"
                  value={keywordsList.length > 0 ? Math.round(keywordsList.reduce((sum, k) => sum + (k.newsCount || 0), 0) / keywordsList.length) : 0}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#13c2c2', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>条</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="核心概念"
                  value={keywordsList.filter(k => k.category === '核心概念').length}
                  valueStyle={{ color: '#1890ff', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="高优先级"
                  value={keywordsList.filter(k => k.priority >= 80).length}
                  valueStyle={{ color: '#eb2f96', fontSize: 20 }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>个</span>}
                />
              </Card>
            </Col>
          </Row>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="搜索关键词"
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="分类"
                value={filterCategory}
                onChange={setFilterCategory}
                style={{ width: 120 }}
                allowClear
              >
                {CATEGORIES.map(cat => (
                  <Select.Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="来源"
                value={filterSourceType}
                onChange={setFilterSourceType}
                style={{ width: 120 }}
                allowClear
              >
                {SOURCE_TYPES.map(type => (
                  <Select.Option key={type.value} value={type.value}>
                    {type.label}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="状态"
                value={filterIsActive}
                onChange={setFilterIsActive}
                style={{ width: 100 }}
                allowClear
              >
                <Select.Option value={true}>启用</Select.Option>
                <Select.Option value={false}>禁用</Select.Option>
              </Select>
            </Space>
            <Space>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSearchNewsByAllKeywords}
                loading={syncLoading}
              >
                一键启动所有关键词
              </Button>
              <Button
                type="default"
                icon={<CloudDownloadOutlined />}
                onClick={handleSyncLatestNews}
                loading={syncLoading}
              >
                一键拉取最新新闻
              </Button>
              <Button
                type="default"
                icon={<SearchOutlined />}
                onClick={handleSearchNewsByKeywords}
                loading={syncLoading}
              >
                根据关键词搜索新闻
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                新增关键词
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadKeywords}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={keywords}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{
              current: page,
              pageSize: size,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, size) => {
                setPage(page);
                setSize(size);
              },
              pageSizeOptions: ['20', '50', '100', '200'],
            }}
            size="small"
          />
        </Space>
      </Card>

      <Modal
        title={modalMode === 'create' ? '新增关键词' : '编辑关键词'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="关键词"
            name="keyword"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="请输入关键词" />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Select placeholder="请选择分类" allowClear>
              {CATEGORIES.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="来源" name="sourceType" initialValue="admin">
            <Select>
              {SOURCE_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="优先级" name="priority" initialValue={0}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item label="标签" name="tags">
            <Select mode="tags" placeholder="请输入标签" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="相关新闻"
        open={newsModalVisible}
        onCancel={() => setNewsModalVisible(false)}
        width={1000}
        footer={null}
        destroyOnHidden
      >
        <Table
          columns={newsColumns}
          dataSource={relatedNews}
          rowKey="id"
          loading={newsLoading}
          pagination={{
            current: newsPage,
            pageSize: 10,
            total: newsTotal,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => loadKeywordNews(currentKeywordId!, page),
          }}
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  );
}
