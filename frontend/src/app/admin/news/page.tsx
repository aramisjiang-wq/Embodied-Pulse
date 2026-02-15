'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Tag, Popconfirm, Card, Row, Col, Statistic, Tabs, type TableProps, App } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SyncOutlined, FilterOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

interface NewsItem {
  id: string;
  platform: string;
  title: string;
  url: string;
  score?: string;
  description?: string;
  publishedDate?: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
}

interface KeywordFilter {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  excludeKeywords: string[];
  matchType: 'all' | 'any';
  caseSensitive: boolean;
  isActive: boolean;
  priority: number;
  applyToPlatform?: string;
}

export default function NewsManagementPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [scrapeModalVisible, setScrapeModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<KeywordFilter[]>([]);
  const [filterForm, setFilterForm] = useState<Partial<KeywordFilter>>({});
  const [scrapeForm, setScrapeForm] = useState({ platform: 'all', keyword: '', limit: 50 });
  const [stats, setStats] = useState({ total: 0, byPlatform: [] as any[] });
  const [activeTab, setActiveTab] = useState('news');
  const { message } = App.useApp();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchNews();
    fetchFilters();
    fetchStats();
  }, [pagination.current]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/news`, {
        params: {
          page: pagination.current,
          size: pagination.pageSize,
        },
      });

      if (response.data.code === 0) {
        setNews(Array.isArray(response.data.data) ? response.data.data : []);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
        });
      } else {
        message.error(response.data.message || '获取新闻列表失败');
        setNews([]);
        setPagination({
          ...pagination,
          total: 0,
        });
      }
    } catch (error) {
      message.error('获取新闻列表失败');
      setNews([]);
      setPagination({
        ...pagination,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/news/filters`);
      if (response.data.code === 0) {
        setFilters(Array.isArray(response.data) ? response.data : []);
      } else {
        message.error(response.data.message || '获取过滤规则失败');
        setFilters([]);
      }
    } catch (error) {
      message.error('获取过滤规则失败');
      setFilters([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/news/stats`);
      if (response.data.code === 0) {
        setStats(response.data || { total: 0, byPlatform: [] });
      } else {
        message.error(response.data.message || '获取统计数据失败');
        setStats({ total: 0, byPlatform: [] });
      }
    } catch (error) {
      message.error('获取统计数据失败');
      setStats({ total: 0, byPlatform: [] });
    }
  };

  const handleScrape = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/admin/news/scrape`, scrapeForm);
      
      if (response.data.code === 0) {
        message.success(`成功抓取 ${response.data.scraped} 条新闻，保存 ${response.data.saved} 条`);
        setScrapeModalVisible(false);
        fetchNews();
        fetchStats();
      } else {
        message.error(response.data.message || '抓取失败');
      }
    } catch (error) {
      message.error('抓取新闻失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/admin/news/${id}`);
      
      if (response.data.code === 0) {
        message.success('删除成功');
        fetchNews();
        fetchStats();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的新闻');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/admin/news/batch-delete`, { ids: selectedRowKeys });
      
      if (response.data.code === 0) {
        message.success(`成功删除 ${response.data.count} 条新闻`);
        setSelectedRowKeys([]);
        fetchNews();
        fetchStats();
      } else {
        message.error(response.data.message || '批量删除失败');
      }
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleCreateFilter = async () => {
    try {
      const response = await axios.post(`${API_BASE}/api/admin/news/filters`, filterForm);
      
      if (response.data.code === 0) {
        message.success('创建过滤规则成功');
        setFilterModalVisible(false);
        setFilterForm({});
        fetchFilters();
      } else {
        message.error(response.data.message || '创建失败');
      }
    } catch (error) {
      message.error('创建过滤规则失败');
    }
  };

  const handleUpdateFilter = async (id: string) => {
    try {
      const response = await axios.put(`${API_BASE}/api/admin/news/filters/${id}`, filterForm);
      
      if (response.data.code === 0) {
        message.success('更新过滤规则成功');
        setFilterModalVisible(false);
        setFilterForm({});
        fetchFilters();
      } else {
        message.error(response.data.message || '更新失败');
      }
    } catch (error) {
      message.error('更新过滤规则失败');
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/admin/news/filters/${id}`);
      
      if (response.data.code === 0) {
        message.success('删除过滤规则成功');
        fetchFilters();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除过滤规则失败');
    }
  };

  const handleTestFilter = async () => {
    if (!filterForm.keywords || filterForm.keywords.length === 0) {
      message.warning('请输入关键词');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/admin/news/filters/test`, {
        title: '测试新闻标题',
        description: '测试新闻描述内容',
        keywords: filterForm.keywords,
        excludeKeywords: filterForm.excludeKeywords || [],
        matchType: filterForm.matchType || 'all',
        caseSensitive: filterForm.caseSensitive || false,
      });
      
      if (response.data.code === 0) {
        if (response.data.matched) {
          message.warning(`匹配过滤规则：${response.data.filterName}`);
        } else {
          message.success('未匹配任何过滤规则');
        }
      }
    } catch (error) {
      message.error('测试失败');
    }
  };

  const columns: TableProps<NewsItem>['columns'] = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => {
        const colorMap: Record<string, string> = {
          baidu: '#2932e1',
          weibo: '#e6162d',
          zhihu: '#0084ff',
          bilibili: '#fb7299',
        };
        return <Tag color={colorMap[platform] || 'default'}>{platform}</Tag>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      ellipsis: true,
    },
    {
      title: '热度',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a: NewsItem, b: NewsItem) => {
        const scoreA = parseInt(a.score || '0');
        const scoreB = parseInt(b.score || '0');
        return scoreB - scoreA;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 400,
      ellipsis: true,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedDate',
      key: 'publishedDate',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
    },
    {
      title: '收藏量',
      dataIndex: 'favoriteCount',
      key: 'favoriteCount',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: NewsItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => window.open(record.url, '_blank')}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这条新闻吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filterColumns: TableProps<KeywordFilter>['columns'] = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: '包含关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 300,
      render: (keywords: string[]) => (
        <Space wrap>
          {keywords.map(keyword => <Tag key={keyword}>{keyword}</Tag>)}
        </Space>
      ),
    },
    {
      title: '排除关键词',
      dataIndex: 'excludeKeywords',
      key: 'excludeKeywords',
      width: 300,
      render: (keywords: string[]) => (
        <Space wrap>
          {keywords.map(keyword => <Tag key={keyword} color="red">{keyword}</Tag>)}
        </Space>
      ),
    },
    {
      title: '匹配方式',
      dataIndex: 'matchType',
      key: 'matchType',
      width: 120,
      render: (type: string) => type === 'all' ? '全部匹配' : '任一匹配',
    },
    {
      title: '适用平台',
      dataIndex: 'applyToPlatform',
      key: 'applyToPlatform',
      width: 120,
      render: (platform: string) => platform || '全部',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: KeywordFilter) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setFilterForm(record);
              setFilterModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条过滤规则吗？"
            onConfirm={() => handleDeleteFilter(record.id)}
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
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总新闻数"
              value={stats.total}
              prefix={<FilterOutlined />}
            />
          </Card>
        </Col>
        {stats.byPlatform.map((item: any) => (
          <Col span={6} key={item.platform}>
            <Card>
              <Statistic
                title={item.platform}
                value={item.count}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={
          <Space>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => setScrapeModalVisible(true)}
            >
              抓取新闻
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 条新闻吗？`}
                onConfirm={handleBatchDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
        items={[
          {
            key: 'news',
            label: '新闻列表',
            children: (
              <div>
                <Table
                  columns={columns}
                  dataSource={news}
                  loading={loading}
                  rowKey="id"
                  locale={{ emptyText: loading ? '加载中...' : '暂无数据' }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                  }}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
                  }}
                  scroll={{ x: 1200 }}
                />
              </div>
            ),
          },
          {
            key: 'filters',
            label: '关键词过滤',
            children: (
              <>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setFilterForm({});
                      setFilterModalVisible(true);
                    }}
                  >
                    新建规则
                  </Button>
                </div>
                <Table
                  columns={filterColumns}
                  dataSource={filters}
                  rowKey="id"
                  locale={{ emptyText: '暂无过滤规则' }}
                  pagination={false}
                  scroll={{ x: 1200 }}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="抓取新闻"
        open={scrapeModalVisible}
        onCancel={() => setScrapeModalVisible(false)}
        onOk={handleScrape}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="平台">
            <Select
              value={scrapeForm.platform}
              onChange={(value) => setScrapeForm({ ...scrapeForm, platform: value })}
            >
              <Select.Option value="all">全部平台</Select.Option>
              <Select.Option value="baidu">百度</Select.Option>
              <Select.Option value="weibo">微博</Select.Option>
              <Select.Option value="zhihu">知乎</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="关键词">
            <Input
              placeholder="输入关键词（可选）"
              value={scrapeForm.keyword}
              onChange={(e) => setScrapeForm({ ...scrapeForm, keyword: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="数量限制">
            <Input
              type="number"
              placeholder="输入抓取数量限制"
              value={scrapeForm.limit}
              onChange={(e) => setScrapeForm({ ...scrapeForm, limit: parseInt(e.target.value) })}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={filterForm.id ? '编辑过滤规则' : '新建过滤规则'}
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        width={800}
        footer={[
          <Button key="test" onClick={handleTestFilter}>
            测试
          </Button>,
          <Button key="cancel" onClick={() => setFilterModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              if (filterForm.id) {
                handleUpdateFilter(filterForm.id);
              } else {
                handleCreateFilter();
              }
            }}
          >
            {filterForm.id ? '更新' : '创建'}
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="规则名称" required>
            <Input
              placeholder="输入规则名称"
              value={filterForm.name}
              onChange={(e) => setFilterForm({ ...filterForm, name: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea
              placeholder="输入规则描述"
              value={filterForm.description}
              onChange={(e) => setFilterForm({ ...filterForm, description: e.target.value })}
              rows={2}
            />
          </Form.Item>
          <Form.Item label="包含关键词" required>
            <Select
              mode="tags"
              placeholder="输入包含的关键词"
              value={filterForm.keywords}
              onChange={(value) => setFilterForm({ ...filterForm, keywords: value })}
              options={[
                { label: '具身智能', value: '具身智能' },
                { label: '机器人', value: '机器人' },
                { label: 'AI', value: 'AI' },
                { label: '大模型', value: '大模型' },
                { label: 'ChatGPT', value: 'ChatGPT' },
                { label: 'GPT', value: 'GPT' },
              ]}
            />
          </Form.Item>
          <Form.Item label="排除关键词">
            <Select
              mode="tags"
              placeholder="输入排除的关键词"
              value={filterForm.excludeKeywords}
              onChange={(value) => setFilterForm({ ...filterForm, excludeKeywords: value })}
              options={[
                { label: '广告', value: '广告' },
                { label: '推广', value: '推广' },
                { label: '营销', value: '营销' },
                { label: '软文', value: '软文' },
              ]}
            />
          </Form.Item>
          <Form.Item label="匹配方式">
            <Select
              value={filterForm.matchType}
              onChange={(value) => setFilterForm({ ...filterForm, matchType: value })}
            >
              <Select.Option value="all">全部匹配</Select.Option>
              <Select.Option value="any">任一匹配</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="适用平台">
            <Select
              value={filterForm.applyToPlatform}
              onChange={(value) => setFilterForm({ ...filterForm, applyToPlatform: value })}
            >
              <Select.Option value="all">全部平台</Select.Option>
              <Select.Option value="baidu">百度</Select.Option>
              <Select.Option value="weibo">微博</Select.Option>
              <Select.Option value="zhihu">知乎</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="区分大小写">
            <Switch
              checked={filterForm.caseSensitive}
              onChange={(checked) => setFilterForm({ ...filterForm, caseSensitive: checked })}
            />
          </Form.Item>
          <Form.Item label="优先级">
            <Input
              type="number"
              placeholder="输入优先级（数字越大优先级越高）"
              value={filterForm.priority}
              onChange={(e) => setFilterForm({ ...filterForm, priority: parseInt(e.target.value) })}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Switch
              checked={filterForm.isActive}
              onChange={(checked) => setFilterForm({ ...filterForm, isActive: checked })}
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
