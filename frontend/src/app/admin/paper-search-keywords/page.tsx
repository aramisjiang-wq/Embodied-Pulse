/**
 * 论文搜索关键词管理页面
 */

'use client';

import { useState, useEffect } from 'react';
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
  message,
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
  Badge,
  Progress,
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
  FireOutlined,
  StarOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
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

interface PaperSearchKeyword {
  id: string;
  keyword: string;
  category: string | null;
  sourceType: string;
  isActive: boolean;
  priority: number;
  description: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  paperCount?: number;
}

interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedDate: string;
  arxivId: string | null;
  pdfUrl: string | null;
  citationCount: number;
  viewCount: number;
  favoriteCount: number;
}

export default function PaperSearchKeywordsPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<PaperSearchKeyword[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<PaperSearchKeyword | null>(null);
  const [form] = Form.useForm();
  const [exportLoading, setExportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [papersModalVisible, setPapersModalVisible] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<PaperSearchKeyword | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersPage, setPapersPage] = useState(1);
  const [papersPageSize] = useState(10);
  const [papersTotal, setPapersTotal] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    loadKeywords();
  }, [page, pageSize, categoryFilter, sourceTypeFilter, statusFilter, searchKeyword]);

  type KeywordListResponse = { items: PaperSearchKeyword[]; pagination: { total: number } };

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<KeywordListResponse>('/admin/paper-search-keywords', {
        params: {
          page,
          size: pageSize,
          category: categoryFilter || undefined,
          sourceType: sourceTypeFilter || undefined,
          isActive: statusFilter,
          keyword: searchKeyword || undefined,
        },
      });

      const items = response.data.items || [];
      
      const itemsWithPaperCount = await Promise.all(
        items.map(async (item: PaperSearchKeyword) => {
          try {
            const countResponse = await apiClient.get<{ count: number }>(`/admin/paper-search-keywords/${item.id}/papers/count`);
            return {
              ...item,
              paperCount: countResponse.data.count || 0,
            };
          } catch {
            return {
              ...item,
              paperCount: 0,
            };
          }
        })
      );
      
      setKeywords(itemsWithPaperCount);
      setTotal(response.data.pagination.total || 0);
    } catch (error: any) {
      console.error('Load keywords error:', error);
      messageApi.error(error.message || '加载失败');
      setKeywords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await apiClient.get<KeywordListResponse>('/admin/paper-search-keywords', {
        params: {
          page: 1,
          size: 10000,
          category: categoryFilter || undefined,
          sourceType: sourceTypeFilter || undefined,
          isActive: statusFilter,
          keyword: searchKeyword || undefined,
        },
      });

      const items = response.data.items || [];
      
      const csvContent = [
        ['关键词', '分类', '来源类型', '状态', '优先级', '描述', '标签', '创建时间'].join(','),
        ...items.map((item: PaperSearchKeyword) => [
          item.keyword,
          item.category || '',
          item.sourceType === 'admin' ? '管理员创建' : '用户订阅',
          item.isActive ? '启用' : '禁用',
          item.priority,
          item.description || '',
          item.tags || '',
          dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        ].join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `paper-search-keywords-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
      link.click();
      
      messageApi.success('导出成功');
    } catch (error: any) {
      console.error('Export error:', error);
      messageApi.error(error.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    if (importFileList.length === 0) {
      messageApi.warning('请选择文件');
      return;
    }

    const file = importFileList[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const keywords: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const columns = line.split(',');
          if (columns.length >= 1) {
            const keyword = columns[0].trim();
            if (keyword) {
              keywords.push({
                keyword,
                category: columns[1]?.trim() || undefined,
                sourceType: columns[2]?.trim() === '管理员创建' ? 'admin' : 'user',
                priority: parseInt(columns[4]?.trim()) || 0,
                description: columns[5]?.trim() || undefined,
              });
            }
          }
        }

        if (keywords.length === 0) {
          messageApi.warning('文件中没有有效数据');
          return;
        }

        await apiClient.post('/admin/paper-search-keywords/batch', { keywords });
        messageApi.success(`成功导入 ${keywords.length} 个关键词`);
        setImportModalVisible(false);
        setImportFileList([]);
        loadKeywords();
      } catch (error: any) {
        console.error('Import error:', error);
        messageApi.error(error.message || '导入失败');
      }
    };
    
    reader.readAsText(file.originFileObj);
  };

  const handleCreate = () => {
    setEditingKeyword(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (keyword: PaperSearchKeyword) => {
    setEditingKeyword(keyword);
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
      await apiClient.delete(`/admin/paper-search-keywords/${id}`);
      messageApi.success('删除成功');
      loadKeywords();
    } catch (error: any) {
      console.error('Delete error:', error);
      messageApi.error(error.message || '删除失败');
    }
  };

  const handleViewPapers = async (keyword: PaperSearchKeyword) => {
    setSelectedKeyword(keyword);
    setPapersPage(1);
    setPapersModalVisible(true);
    await loadPapers(keyword.id, 1);
  };

  const loadPapers = async (keywordId: string, page: number) => {
    setPapersLoading(true);
    try {
      const response = await apiClient.get(`/admin/paper-search-keywords/${keywordId}/papers`, {
        params: {
          page,
          size: papersPageSize,
        },
      });

      const items = response.data.items || [];
      setPapers(items);
      setPapersTotal(response.data.pagination.total || 0);
    } catch (error: any) {
      console.error('Load papers error:', error);
      messageApi.error(error.message || '加载论文失败');
      setPapers([]);
      setPapersTotal(0);
    } finally {
      setPapersLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        tags: values.tags ? JSON.stringify(values.tags) : undefined,
      };

      if (editingKeyword) {
        await apiClient.put(`/admin/paper-search-keywords/${editingKeyword.id}`, data);
        messageApi.success('更新成功');
      } else {
        await apiClient.post('/admin/paper-search-keywords', data);
        messageApi.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadKeywords();
    } catch (error: any) {
      console.error('Save error:', error);
      messageApi.error(error.message || '保存失败');
    }
  };

  const handleSyncPapers = async () => {
    setSyncLoading(true);
    try {
      const response = await apiClient.post('/admin/sync/papers-by-keywords', {
        sourceType: 'all',
        days: 7,
        maxResultsPerKeyword: 20,
      });
      messageApi.success(`同步成功：${response.data.synced} 篇论文，${response.data.keywords} 个关键词`);
      loadKeywords();
    } catch (error: any) {
      console.error('Sync papers error:', error);
      messageApi.error(error.response?.data?.message || error.message || '同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 180,
      render: (text: string, record: PaperSearchKeyword) => (
        <Space size="small">
          <Badge count={record.paperCount || 0} showZero color="#52c41a">
            <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>{text}</Text>
          </Badge>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string | null) => text ? <Tag color="blue" style={{ fontSize: '12px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>{text}</Tag> : '-',
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 90,
      render: (text: string) => (
        <Tag color={text === 'admin' ? 'cyan' : 'orange'} style={{ fontSize: '12px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
          {text === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 70,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} style={{ fontSize: '12px' }}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 70,
      sorter: (a: PaperSearchKeyword, b: PaperSearchKeyword) => b.priority - a.priority,
      render: (priority: number) => (
        <Tag color={priority >= 10 ? 'red' : priority >= 5 ? 'orange' : 'default'} style={{ fontSize: '12px' }}>
          {priority}
        </Tag>
      ),
    },
    {
      title: '论文数',
      dataIndex: 'paperCount',
      key: 'paperCount',
      width: 80,
      sorter: (a: PaperSearchKeyword, b: PaperSearchKeyword) => (b.paperCount || 0) - (a.paperCount || 0),
      render: (count: number, record: PaperSearchKeyword) => (
        <Button
          type="link"
          size="small"
          icon={<UnorderedListOutlined />}
          onClick={() => handleViewPapers(record)}
          style={{ padding: 0, height: 'auto', fontSize: '13px' }}
        >
          {count || 0}
        </Button>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>{dayjs(date).format('MM-DD HH:mm')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: PaperSearchKeyword) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ padding: 0, height: 'auto' }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个关键词吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ padding: 0, height: 'auto' }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalPapers = keywords.reduce((sum, k) => sum + (k.paperCount || 0), 0);
  const activeKeywords = keywords.filter(k => k.isActive).length;
  const adminKeywords = keywords.filter(k => k.sourceType === 'admin').length;
  const userKeywords = keywords.filter(k => k.sourceType === 'user').length;
  const highPriorityKeywords = keywords.filter(k => k.priority >= 10).length;

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col span={4}>
            <Card 
              size="small"
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none'
              }}
            >
              <Statistic
                title="总关键词"
                value={total}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card 
              size="small"
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none'
              }}
            >
              <Statistic
                title="启用关键词"
                value={activeKeywords}
                prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card 
              size="small"
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none'
              }}
            >
              <Statistic
                title="总论文数"
                value={totalPapers}
                prefix={<StarOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card 
              size="small"
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none'
              }}
            >
              <Statistic
                title="高优先级"
                value={highPriorityKeywords}
                prefix={<FireOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d', fontSize: '24px', fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={12}>
            <Card 
              size="small"
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none'
              }}
            >
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', marginRight: 8 }}>管理员创建</Text>
                  <Text strong style={{ fontSize: '18px', color: '#722ed1' }}>{adminKeywords}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', marginRight: 8 }}>用户订阅</Text>
                  <Text strong style={{ fontSize: '18px', color: '#fa8c16' }}>{userKeywords}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              size="small"
              style={{ 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none'
              }}
            >
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', marginRight: 8 }}>活跃度</Text>
                  <Progress 
                    percent={total > 0 ? Math.round((activeKeywords / total) * 100) : 0} 
                    size="small" 
                    strokeColor="#52c41a"
                    format={percent => `${percent}%`}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', marginRight: 8 }}>覆盖率</Text>
                  <Progress 
                    percent={total > 0 ? Math.round((totalPapers / (total * 10)) * 100) : 0} 
                    size="small" 
                    strokeColor="#1890ff"
                    format={percent => `${percent}%`}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <Card
        size="small"
        style={{ 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: 'none'
        }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: '16px', fontWeight: 600 }}>论文搜索关键词</span>
          </Space>
        }
        extra={
          <Space size="small" wrap>
            <Input
              placeholder="搜索关键词"
              prefix={<SearchOutlined />}
              style={{ width: 160, fontSize: '13px' }}
              size="small"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={() => setPage(1)}
            />
            <Select
              placeholder="分类"
              style={{ width: 100, fontSize: '13px' }}
              size="small"
              allowClear
              value={categoryFilter}
              onChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
              options={CATEGORIES}
            />
            <Select
              placeholder="来源"
              style={{ width: 90, fontSize: '13px' }}
              size="small"
              allowClear
              value={sourceTypeFilter}
              onChange={(value) => {
                setSourceTypeFilter(value);
                setPage(1);
              }}
              options={SOURCE_TYPES}
            />
            <Select
              placeholder="状态"
              style={{ width: 80, fontSize: '13px' }}
              size="small"
              allowClear
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { value: true, label: '启用' },
                { value: false, label: '禁用' },
              ]}
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                setPage(1);
                loadKeywords();
              }}
            >
              刷新
            </Button>
            <Button
              size="small"
              icon={<UploadOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              导入
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              loading={exportLoading}
              onClick={handleExport}
            >
              导出
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建
            </Button>
            <Button
              size="small"
              type="default"
              icon={<ThunderboltOutlined />}
              onClick={handleSyncPapers}
              loading={syncLoading}
              style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
            >
              一键拉取
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={keywords}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['20', '50', '100', '200'],
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
            style: { fontSize: '13px' },
          }}
          scroll={{ x: 900 }}
          style={{ fontSize: '13px' }}
        />
      </Card>

      <Modal
        title={editingKeyword ? '编辑关键词' : '新建关键词'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={500}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" size="small">
          <Form.Item
            name="keyword"
            label="关键词"
            rules={[
              { required: true, message: '请输入关键词' },
              { max: 100, message: '关键词长度不能超过100字符' },
            ]}
          >
            <Input placeholder="请输入关键词，如：VLA" />
          </Form.Item>

          <Form.Item name="category" label="分类">
            <Select
              placeholder="请选择分类"
              allowClear
              options={CATEGORIES}
            />
          </Form.Item>

          <Form.Item name="sourceType" label="来源类型">
            <Select
              placeholder="请选择来源类型"
              options={SOURCE_TYPES}
            />
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item name="priority" label="优先级">
            <InputNumber
              min={0}
              max={100}
              placeholder="数字越大优先级越高"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea
              rows={3}
              placeholder="请输入描述说明"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="请输入标签"
              options={[
                { value: 'VLA', label: 'VLA' },
                { value: '机器人', label: '机器人' },
                { value: 'AI', label: 'AI' },
                { value: '具身智能', label: '具身智能' },
                { value: '计算机视觉', label: '计算机视觉' },
                { value: '强化学习', label: '强化学习' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>{selectedKeyword?.keyword} - 相关论文</span>
          </Space>
        }
        open={papersModalVisible}
        onCancel={() => {
          setPapersModalVisible(false);
          setPapers([]);
          setSelectedKeyword(null);
        }}
        footer={null}
        width={1000}
      >
        <Table
          columns={[
            {
              title: '标题',
              dataIndex: 'title',
              key: 'title',
              render: (text: string, record: Paper) => (
                <a
                  href={`https://arxiv.org/abs/${record.arxivId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1890ff' }}
                >
                  {text}
                </a>
              ),
            },
            {
              title: '作者',
              dataIndex: 'authors',
              key: 'authors',
              width: 200,
              render: (authors: string[]) => (
                <Text ellipsis style={{ maxWidth: 200 }}>
                  {Array.isArray(authors) ? authors.join(', ') : authors}
                </Text>
              ),
            },
            {
              title: '发布日期',
              dataIndex: 'publishedDate',
              key: 'publishedDate',
              width: 120,
              render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
            },
            {
              title: '引用数',
              dataIndex: 'citationCount',
              key: 'citationCount',
              width: 100,
              render: (count: number) => count || 0,
            },
            {
              title: '浏览数',
              dataIndex: 'viewCount',
              key: 'viewCount',
              width: 100,
              render: (count: number) => count || 0,
            },
            {
              title: '收藏数',
              dataIndex: 'favoriteCount',
              key: 'favoriteCount',
              width: 100,
              render: (count: number) => count || 0,
            },
          ]}
          dataSource={papers}
          rowKey="id"
          loading={papersLoading}
          size="small"
          pagination={{
            current: papersPage,
            pageSize: papersPageSize,
            total: papersTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 篇论文`,
            onChange: (page) => {
              setPapersPage(page);
              selectedKeyword && loadPapers(selectedKeyword.id, page);
            },
          }}
          scroll={{ y: 400 }}
        />
      </Modal>

      <Modal
        title="导入关键词"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="CSV格式说明"
          description="第一行为表头，每行包含：关键词,分类,来源类型,优先级,描述"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Upload
          fileList={importFileList}
          onChange={({ fileList }) => setImportFileList(fileList)}
          beforeUpload={() => false}
          accept=".csv"
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
      </Modal>
    </div>
  );
}
