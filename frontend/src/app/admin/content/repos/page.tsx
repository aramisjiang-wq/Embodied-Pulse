/**
 * 管理端 - GitHub项目管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Button, Space, Table, Modal, Form, Input, InputNumber, DatePicker, Tag, Popconfirm, Empty, App, Card, Row, Col, Collapse, Tooltip, Select, Input as AntInput } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, GithubOutlined, SearchOutlined, ClearOutlined, LinkOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import { syncApi } from '@/lib/api/sync';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export default function ReposManagementPage() {
  const { message } = App.useApp();
  type RepoItem = {
    id: string;
    repoId?: number | string;
    name?: string;
    fullName?: string;
    owner?: string;
    description?: string;
    language?: string;
    starsCount?: number;
    forksCount?: number;
    issuesCount?: number;
    topics?: string[] | string;
    createdDate?: string;
    updatedDate?: string;
    htmlUrl?: string;
    [key: string]: unknown;
  };
  type RepoFormValues = {
    repoId?: number | string;
    fullName?: string;
    name?: string;
    owner?: string;
    description?: string;
    language?: string;
    starsCount?: number;
    forksCount?: number;
    issuesCount?: number;
    topics?: string;
    createdDate?: dayjs.Dayjs | null;
    updatedDate?: dayjs.Dayjs | null;
    [key: string]: unknown;
  };
  type ApiError = { status?: number; code?: string; message?: string; response?: { data?: { code?: number; message?: string } } };
  const normalizeError = (error: unknown): ApiError => (
    typeof error === 'object' && error !== null ? (error as ApiError) : {}
  );
  const toNumber = (value: unknown, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RepoItem | null>(null);
  const [items, setItems] = useState<RepoItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string | undefined>(undefined);
  const [keywordFilter, setKeywordFilter] = useState<string>('');


  const loadRepos = async (pageNum: number) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pageNum, size };
      if (languageFilter) {
        params.language = languageFilter;
      }
      if (keywordFilter) {
        params.keyword = keywordFilter;
      }
      
      const response = await apiClient.get('/repos', { params });
      if (response.code === 0) {
        setItems(response.data.items || []);
        setTotal(response.data.pagination?.total || 0);
        setPage(pageNum);
      } else {
        message.error(response.message || '加载失败');
      }
    } catch (error: unknown) {
      console.error('Load repos error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        const errorMessage = err.response?.data?.message || err.message || '加载失败';
        message.error(errorMessage);
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos(1);
  }, [languageFilter, keywordFilter]);

  const parseJsonField = (value?: string) => {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const fetchGitHubRepoInfo = async () => {
    if (!githubUrl.trim()) {
      message.warning('请输入GitHub仓库URL');
      return;
    }

    setFetchingRepo(true);
    try {
      const response = await apiClient.get('/admin/github-repo-info/info', {
        params: { url: githubUrl.trim() },
      });

      if (response.code === 0) {
        const repoInfo = response.data;
        
        form.setFieldsValue({
          repoId: repoInfo.repoId,
          fullName: repoInfo.fullName,
          name: repoInfo.name,
          owner: repoInfo.owner,
          description: repoInfo.description,
          language: repoInfo.language,
          starsCount: repoInfo.starsCount,
          forksCount: repoInfo.forksCount,
          issuesCount: repoInfo.issuesCount,
          topics: JSON.stringify(repoInfo.topics || []),
          createdDate: dayjs(repoInfo.createdDate),
          updatedDate: dayjs(repoInfo.updatedDate),
        });

        message.success('获取仓库信息成功！');
      } else {
        message.error(response.message || '获取仓库信息失败');
      }
    } catch (error: unknown) {
      const err = normalizeError(error);
      message.error(err.response?.data?.message || err.message || '获取仓库信息失败');
    } finally {
      setFetchingRepo(false);
    }
  };

  const handleCreate = async (values: RepoFormValues) => {
    try {
      console.log('Form values:', values);
      const payload: Record<string, unknown> = { ...values };
      
      // 验证必填字段
      if (!payload.name || !payload.fullName) {
        message.error('项目名和完整名称是必填字段');
        return;
      }

      // 处理日期字段
      if (payload.createdDate) {
        payload.createdDate = (payload.createdDate as dayjs.Dayjs).toISOString();
      } else {
        payload.createdDate = null;
      }
      if (payload.updatedDate) {
        payload.updatedDate = (payload.updatedDate as dayjs.Dayjs).toISOString();
      } else {
        payload.updatedDate = null;
      }

      // 处理topics字段：确保是数组格式
      if (payload.topics) {
        const topics = parseJsonField(String(payload.topics));
        if (topics === null) {
          message.error('Topics需要是合法的JSON数组');
          return;
        }
        // 后端可以处理数组或JSON字符串，这里发送数组格式
        payload.topics = Array.isArray(topics) ? topics : [];
      } else {
        payload.topics = [];
      }

      // 确保repoId是数字类型
      if (payload.repoId !== undefined && payload.repoId !== null) {
        payload.repoId = toNumber(payload.repoId);
      }

      // 确保数字字段是数字类型
      payload.starsCount = toNumber(payload.starsCount, 0);
      payload.forksCount = toNumber(payload.forksCount, 0);
      payload.issuesCount = toNumber(payload.issuesCount, 0);

      console.log('Sending payload to API:', payload);
      
      if (editingItem) {
        const response = await apiClient.put(`/admin/content/repos/${editingItem.id}`, payload);
        console.log('Update response:', response);
        message.success('更新成功!');
      } else {
        const response = await apiClient.post('/admin/content/repos', payload);
        console.log('Create response:', response);
        message.success('创建成功!');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      setGithubUrl('');
      loadRepos(page);
    } catch (error: unknown) {
      console.error('Create repo error:', error);
      const err = normalizeError(error);
      const errorMessage = err.response?.data?.message || err.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const handleEdit = (record: RepoItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      createdDate: record.createdDate ? dayjs(record.createdDate) : null,
      updatedDate: record.updatedDate ? dayjs(record.updatedDate) : null,
      topics: Array.isArray(record.topics) ? JSON.stringify(record.topics) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/repos/${id}`);
      message.success('删除成功');
      loadRepos(page);
    } catch (error: unknown) {
      console.error('Delete repo error:', error);
      const err = normalizeError(error);
      const errorMessage = err.response?.data?.message || err.message || '删除失败';
      message.error(errorMessage);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>
              <GithubOutlined style={{ marginRight: 8 }} />
              GitHub项目管理
            </h1>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
              具身智能、机器人相关项目 | 共 {total} 个项目
            </div>
          </div>
          <Space>
            <Button 
              icon={<GithubOutlined />} 
              onClick={async () => {
                try {
                  message.loading('正在从GitHub搜索同步项目...', 0);
                  const result = await syncApi.syncGithub({
                    query: 'embodied-ai OR robotics OR robot-learning stars:>100',
                    maxResults: 50,
                  });
                  message.destroy();
                  message.success(`同步完成：成功 ${result.synced} 个，失败 ${result.errors} 个`);
                  loadRepos(1);
                } catch (error: unknown) {
                  message.destroy();
                  const err = normalizeError(error);
                  const errorMsg = err.response?.data?.message || err.message || '同步失败';
                  message.error(errorMsg);
                }
              }}
            >
              从GitHub搜索同步
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingItem(null);
              form.resetFields();
              setShowModal(true);
            }}>
              新增项目
            </Button>
          </Space>
        </div>
        
        {/* 筛选栏 */}
        <Card size="small" style={{ marginBottom: 12 }}>
          <Space size="middle" wrap>
            <span style={{ fontSize: 13, fontWeight: 500 }}>筛选：</span>
            <Select
              placeholder="选择语言"
              allowClear
              style={{ width: 150 }}
              value={languageFilter}
              onChange={(value) => {
                setLanguageFilter(value);
                setPage(1);
              }}
            >
              <Option value="Python">Python</Option>
              <Option value="C++">C++</Option>
              <Option value="JavaScript">JavaScript</Option>
              <Option value="TypeScript">TypeScript</Option>
              <Option value="Jupyter Notebook">Jupyter Notebook</Option>
              <Option value="Java">Java</Option>
              <Option value="Go">Go</Option>
              <Option value="Rust">Rust</Option>
              <Option value="C#">C#</Option>
              <Option value="Lua">Lua</Option>
            </Select>
            <AntInput
              placeholder="搜索项目名称或描述"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 250 }}
              value={keywordFilter}
              onChange={(e) => {
                setKeywordFilter(e.target.value);
                setPage(1);
              }}
              onPressEnter={() => loadRepos(1)}
            />
            {(languageFilter || keywordFilter) && (
              <Button
                size="small"
                icon={<ClearOutlined />}
                onClick={() => {
                  setLanguageFilter(undefined);
                  setKeywordFilter('');
                  setPage(1);
                }}
              >
                清除筛选
              </Button>
            )}
          </Space>
        </Card>
      </div>

      {items.length === 0 && !loading ? (
        <Empty description="暂无数据" style={{ padding: '40px 0' }} />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: size,
            total,
            onChange: (p) => loadRepos(p),
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="small"
          columns={[
            { 
              title: '项目名称', 
              dataIndex: 'name', 
              width: 180, 
              ellipsis: true,
              render: (name: string, record: RepoItem) => {
                const displayName = name || record.fullName?.split('/')[1] || record.fullName;
                const owner = record.owner || record.fullName?.split('/')[0] || '';
                return (
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {owner}
                    </div>
                  </div>
                );
              },
            },
            { 
              title: '描述', 
              dataIndex: 'description', 
              width: 320, 
              ellipsis: { showTitle: false },
              render: (desc: string) => (
                <Tooltip title={desc}>
                  <span style={{ fontSize: 12 }}>{desc || '-'}</span>
                </Tooltip>
              ),
            },
            { 
              title: '语言', 
              dataIndex: 'language', 
              width: 90, 
              render: (value: string) => value ? <Tag color="blue">{value}</Tag> : '-',
            },
            { 
              title: '⭐', 
              dataIndex: 'starsCount', 
              width: 70,
              sorter: (a: RepoItem, b: RepoItem) => (a.starsCount || 0) - (b.starsCount || 0),
              render: (value: number) => (
                <span style={{ fontSize: 12 }}>{value ? value.toLocaleString() : '0'}</span>
              ),
            },
            { 
              title: '🍴', 
              dataIndex: 'forksCount', 
              width: 70,
              render: (value: number) => (
                <span style={{ fontSize: 12 }}>{value ? value.toLocaleString() : '0'}</span>
              ),
            },
            { 
              title: 'Issues', 
              dataIndex: 'issuesCount', 
              width: 70,
              render: (value: number) => (
                <span style={{ fontSize: 12 }}>{value ? value.toLocaleString() : '0'}</span>
              ),
            },
            {
              title: 'Topics',
              dataIndex: 'topics',
              width: 200,
              render: (value: unknown) => {
                let topics: string[] = [];
                if (Array.isArray(value)) {
                  topics = value as string[];
                } else if (typeof value === 'string' && value) {
                  try {
                    const parsed = JSON.parse(value);
                    topics = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    topics = [];
                  }
                }
                
                if (topics.length === 0) return '-';
                
                // 显示前3个，其余折叠
                const visibleTopics = topics.slice(0, 3);
                const hiddenTopics = topics.slice(3);
                
                return (
                  <div>
                    <Space size={[4, 4]} wrap style={{ marginBottom: hiddenTopics.length > 0 ? 4 : 0 }}>
                      {visibleTopics.map((topic: string, idx: number) => (
                        <Tag key={idx} style={{ margin: 0, fontSize: 11, padding: '0 6px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{topic}</Tag>
                      ))}
                    </Space>
                    {hiddenTopics.length > 0 && (
                      <Collapse 
                        ghost 
                        size="small" 
                        style={{ background: 'transparent', marginTop: -4 }}
                        items={[{
                          key: '1',
                          label: <span style={{ fontSize: 11, color: '#1890ff', cursor: 'pointer' }}>+{hiddenTopics.length} 更多</span>,
                          children: (
                            <Space size={[4, 4]} wrap style={{ marginTop: 0 }}>
                              {hiddenTopics.map((topic: string, idx: number) => (
                                <Tag key={idx} style={{ margin: 0, fontSize: 11, padding: '0 6px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{topic}</Tag>
                              ))}
                            </Space>
                          ),
                        }]}
                      />
                    )}
                  </div>
                );
              },
            },
            {
              title: '更新',
              dataIndex: 'updatedDate',
              width: 80,
              sorter: (a: RepoItem, b: RepoItem) => {
                const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : 0;
                const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : 0;
                return dateA - dateB;
              },
              render: (value: string) => value ? (
                <Tooltip title={dayjs(value).format('YYYY-MM-DD')}>
                  <span style={{ fontSize: 12 }}>{dayjs(value).format('MM-DD')}</span>
                </Tooltip>
              ) : '-',
            },
            {
              title: '操作',
              width: 100,
              fixed: 'right',
              render: (_: unknown, record: RepoItem) => {
                const githubUrl = record.htmlUrl || `https://github.com/${record.fullName}`;
                return (
                  <Space size="small">
                    <Tooltip title="在GitHub打开">
                      <Button 
                        type="text" 
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => {
                          window.open(githubUrl, '_blank');
                        }}
                      />
                    </Tooltip>
                    <Button 
                      type="text" 
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                    <Popconfirm 
                      title="确认删除?" 
                      onConfirm={() => handleDelete(record.id)}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                );
              },
            },
          ]}
        />
      )}

      <Modal
        title={editingItem ? '编辑GitHub项目' : '新增GitHub项目'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
          setGithubUrl('');
        }}
        footer={null}
        width={800}
      >
        {!editingItem && (
          <Card 
            title="从GitHub仓库自动获取信息" 
            size="small" 
            style={{ marginBottom: 16 }}
          >
            <Row gutter={8}>
              <Col span={18}>
                <Input
                  placeholder="粘贴GitHub仓库URL，例如：https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onPressEnter={fetchGitHubRepoInfo}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  loading={fetchingRepo}
                  onClick={fetchGitHubRepoInfo}
                  block
                >
                  获取信息
                </Button>
              </Col>
            </Row>
          </Card>
        )}
        
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item 
            name="repoId" 
            label="Repo ID" 
            rules={[
              { required: true, message: '请输入Repo ID' },
              { type: 'number', min: 1, message: 'Repo ID必须是大于0的数字' }
            ]}
            tooltip="GitHub仓库的唯一ID，如果通过URL获取会自动填充"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="例如: 123456789" />
          </Form.Item>
          <Form.Item name="fullName" label="完整名称" rules={[{ required: true, message: '请输入完整名称' }]}>
            <Input placeholder="owner/name" />
          </Form.Item>
          <Form.Item name="name" label="项目名" rules={[{ required: true, message: '请输入项目名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="owner" label="Owner">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="language" label="语言">
            <Input placeholder="JavaScript, Python, TypeScript..." />
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
          <Form.Item name="topics" label="Topics(JSON数组)"
            tooltip='例如: ["robotics", "ai"]'>
            <Input placeholder='["robotics", "ai"]' />
          </Form.Item>
          <Form.Item name="createdDate" label="创建日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="updatedDate" label="更新日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingItem ? '更新项目' : '创建项目'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
