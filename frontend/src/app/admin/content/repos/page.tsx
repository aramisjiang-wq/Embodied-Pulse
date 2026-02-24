/**
 * 管理端 - GitHub项目管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Button, Space, Table, Modal, Form, Input, InputNumber, DatePicker, Tag, Popconfirm, Empty, App, Card, Row, Col, Collapse, Tooltip, Select, Input as AntInput, message as AntMessage, Checkbox, Spin, Badge, Tabs } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, GithubOutlined, SearchOutlined, ClearOutlined, LinkOutlined, ReloadOutlined, CloudDownloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import { syncApi } from '@/lib/api/sync';
import { clearCache } from '@/lib/api/cached-client';
import dayjs from 'dayjs';
import styles from './page.module.css';

const { TextArea } = Input;
const { Option } = Select;

/** 与用户端 /repos 一致的页面分类（资源清单 6 大板块 + 子分类） */
const REPO_CATEGORIES: { id: string; label: string; emoji: string; children?: { id: string; label: string }[] }[] = [
  { id: '1', emoji: '📌', label: '核心技术', children: [
    { id: '1.1', label: '视觉-语言-动作 (VLA)' },
    { id: '1.2', label: '模仿学习与行为克隆' },
    { id: '1.3', label: '强化学习框架与算法' },
    { id: '1.4', label: '世界模型与预测' },
  ]},
  { id: '2', emoji: '📊', label: '数据与仿真', children: [
    { id: '2.1', label: '核心数据集' },
    { id: '2.2', label: '机器人仿真环境' },
  ]},
  { id: '3', emoji: '🦾', label: '操作与控制', children: [
    { id: '3.1', label: '机器人操作与抓取' },
    { id: '3.2', label: '灵巧手与精细操作' },
    { id: '3.3', label: '运动规划与控制' },
  ]},
  { id: '4', emoji: '👁️', label: '感知与导航', children: [
    { id: '4.1', label: '机器人导航与SLAM' },
    { id: '4.2', label: '3D视觉与点云处理' },
    { id: '4.3', label: '机器人视觉与感知' },
  ]},
  { id: '5', emoji: '🤖', label: '平台与系统', children: [
    { id: '5.1', label: 'ROS与机器人操作系统' },
    { id: '5.2', label: '人形机器人与四足机器人' },
    { id: '5.3', label: '开源机器人硬件平台' },
    { id: '5.4', label: '大语言模型与机器人结合' },
    { id: '5.5', label: '遥操作与数据采集' },
    { id: '5.6', label: 'Sim2Real与域适应' },
  ]},
  { id: '6', emoji: '🛠️', label: '工具与资源', children: [
    { id: '6.1', label: '机器人学习框架' },
    { id: '6.2', label: '机器人工具与库' },
    { id: '6.3', label: '综合资源清单' },
    { id: '6.4', label: '自动驾驶与移动机器人' },
    { id: '6.5', label: '触觉感知与传感器' },
    { id: '6.6', label: '多机器人系统' },
    { id: '6.7', label: '机器人安全与可靠性' },
  ]},
];
const CATEGORY_OPTIONS = REPO_CATEGORIES.flatMap((b) => (b.children || []).map((c) => ({ id: c.id, label: c.label, parentLabel: b.label })));
function getCategoryLabel(id: string | null | undefined): string {
  if (!id) return '-';
  const opt = CATEGORY_OPTIONS.find((o) => o.id === id);
  return opt ? `${opt.id} ${opt.label}` : id;
}

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
    category?: string | null;
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
    category?: string | null;
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
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  
  // 分类补充相关状态
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestionStats, setSuggestionStats] = useState<{ id: string; description: string; suggestionCount: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [suggestedRepos, setSuggestedRepos] = useState<any[]>([]);
  const [selectedRepoKeys, setSelectedRepoKeys] = useState<Set<string>>(new Set());
  const [addingRepos, setAddingRepos] = useState(false);

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
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      
      const response = await apiClient.get('/repos', { params });
      if (response.code === 0) {
        const data = response.data as { items?: RepoItem[]; pagination?: { total?: number } };
        setItems(data.items || []);
        setTotal(data.pagination?.total || 0);
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
  }, [languageFilter, keywordFilter, categoryFilter]);

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
        const repoInfo = response.data as {
          repoId?: number;
          fullName?: string;
          name?: string;
          owner?: string;
          description?: string;
          language?: string;
          starsCount?: number;
          forksCount?: number;
          issuesCount?: number;
          topics?: string[];
          createdDate?: string;
          updatedDate?: string;
        };
        
        form.setFieldsValue({
          repoId: repoInfo?.repoId,
          fullName: repoInfo?.fullName,
          name: repoInfo?.name,
          owner: repoInfo?.owner,
          description: repoInfo?.description,
          language: repoInfo?.language,
          starsCount: repoInfo?.starsCount,
          forksCount: repoInfo?.forksCount,
          issuesCount: repoInfo?.issuesCount,
          topics: JSON.stringify(repoInfo?.topics || []),
          createdDate: repoInfo?.createdDate ? dayjs(repoInfo.createdDate) : undefined,
          updatedDate: repoInfo?.updatedDate ? dayjs(repoInfo.updatedDate) : undefined,
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

      // 确保repoId是字符串类型（支持大数值ID）
      if (payload.repoId !== undefined && payload.repoId !== null) {
        payload.repoId = String(payload.repoId);
      }

      // 确保数字字段是数字类型
      payload.starsCount = toNumber(payload.starsCount, 0);
      payload.forksCount = toNumber(payload.forksCount, 0);
      payload.issuesCount = toNumber(payload.issuesCount, 0);

      // 页面分类：空字符串视为清空
      if (payload.category !== undefined) {
        payload.category = payload.category === '' || payload.category == null ? null : String(payload.category).trim();
      }

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
      category: record.category ?? undefined,
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

  const handleSyncGithub = async () => {
    try {
      const hide = AntMessage.loading('正在从GitHub搜索同步项目...', 0);
      try {
        const result = await syncApi.syncGithub({
          query: 'embodied-ai OR robotics OR robot-learning stars:>100',
          maxResults: 50,
        });
        hide();
        
        // 清除缓存以确保数据更新
        clearCache('/repos');
        
        if (result.success) {
          AntMessage.success(`同步完成：成功 ${result.synced} 个，失败 ${result.errors} 个`);
          // 重新加载数据
          await loadRepos(1);
        } else {
          AntMessage.warning(`同步完成但部分失败：成功 ${result.synced} 个，失败 ${result.errors} 个`);
          await loadRepos(1);
        }
      } catch (error: unknown) {
        hide();
        const err = normalizeError(error);
        const errorMsg = err.response?.data?.message || err.message || '同步失败';
        AntMessage.error(errorMsg);
        console.error('GitHub同步错误:', error);
      }
    } catch (error: unknown) {
      const err = normalizeError(error);
      const errorMsg = err.response?.data?.message || err.message || '同步失败';
      AntMessage.error(errorMsg);
      console.error('GitHub同步错误:', error);
    }
  };

  // 加载分类补充统计
  const loadSuggestionStats = async () => {
    setSuggestLoading(true);
    try {
      const response = await apiClient.get('/admin/repos/suggestions/stats', {
        params: { minStars: 100 }
      });
      if (response.code === 0) {
        const data = response.data as { categories: { id: string; description: string; suggestionCount: number }[] };
        setSuggestionStats(data.categories || []);
      }
    } catch (error: unknown) {
      console.error('Load suggestion stats error:', error);
      message.error('加载分类统计失败');
    } finally {
      setSuggestLoading(false);
    }
  };

  // 搜索指定分类的候选项目
  const searchCategorySuggestions = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSuggestLoading(true);
    setSuggestedRepos([]);
    setSelectedRepoKeys(new Set());
    try {
      const response = await apiClient.get(`/admin/repos/suggestions/${categoryId}`, {
        params: { minStars: 100, maxResults: 30 }
      });
      if (response.code === 0) {
        const data = response.data as { items: any[] };
        setSuggestedRepos(data.items || []);
      }
    } catch (error: unknown) {
      console.error('Search suggestions error:', error);
      message.error('搜索候选项目失败');
    } finally {
      setSuggestLoading(false);
    }
  };

  // 批量添加选中的仓库
  const handleAddSelectedRepos = async () => {
    if (selectedRepoKeys.size === 0) {
      message.warning('请先选择要添加的项目');
      return;
    }

    setAddingRepos(true);
    try {
      const reposToAdd = suggestedRepos
        .filter(repo => selectedRepoKeys.has(repo.fullName))
        .map(repo => ({
          fullName: repo.fullName,
          category: selectedCategory!
        }));

      const response = await apiClient.post('/admin/repos/batch', { repos: reposToAdd });
      if (response.code === 0) {
        const data = response.data as { success: number; failed: number; errors: string[] };
        message.success(`成功添加 ${data.success} 个项目${data.failed > 0 ? `，失败 ${data.failed} 个` : ''}`);
        
        // 刷新列表和统计
        loadRepos(1);
        loadSuggestionStats();
        
        // 从候选列表中移除已添加的项目
        setSuggestedRepos(prev => prev.filter(r => !selectedRepoKeys.has(r.fullName)));
        setSelectedRepoKeys(new Set());
      }
    } catch (error: unknown) {
      console.error('Add repos error:', error);
      message.error('添加项目失败');
    } finally {
      setAddingRepos(false);
    }
  };

  // 打开分类补充弹窗
  const openSuggestModal = () => {
    setSuggestModalOpen(true);
    setSelectedCategory(null);
    setSuggestedRepos([]);
    setSelectedRepoKeys(new Set());
    loadSuggestionStats();
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <GithubOutlined style={{ marginRight: 12, fontSize: 28, color: '#1890ff' }} />
            GitHub项目管理
          </h1>
          <div className={styles.pageSubtitle}>
            具身智能、机器人相关项目 | 共 <strong>{total}</strong> 个项目
          </div>
        </div>
        <Space size="middle">
          <Button 
            icon={<CloudDownloadOutlined />}
            onClick={openSuggestModal}
            style={{ 
              fontWeight: 500,
              height: 40,
              paddingLeft: 20,
              paddingRight: 20,
              background: '#f6ffed',
              borderColor: '#b7eb8f',
              color: '#52c41a',
            }}
          >
            分类补充
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleSyncGithub}
            style={{ 
              fontWeight: 500,
              height: 40,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            从GitHub搜索同步
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingItem(null);
              form.resetFields();
              setShowModal(true);
            }}
            style={{ 
              fontWeight: 500,
              height: 40,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            新增项目
          </Button>
        </Space>
      </div>
      
      <Card 
        size="small" 
        style={{ 
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Space size="middle" wrap style={{ width: '100%' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>筛选条件：</span>
          <Select
            placeholder="页面分类"
            allowClear
            style={{ width: 220, fontSize: 14 }}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <Option key={opt.id} value={opt.id}>{opt.id} {opt.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择编程语言"
            allowClear
            style={{ width: 160, fontSize: 14 }}
            value={languageFilter}
            onChange={(value) => {
              setLanguageFilter(value);
              setPage(1);
            }}
          >
            <Option value="Python">🐍 Python</Option>
            <Option value="C++">🔧 C++</Option>
            <Option value="JavaScript">📦 JavaScript</Option>
            <Option value="TypeScript">💎 TypeScript</Option>
            <Option value="Jupyter Notebook">📊 Jupyter Notebook</Option>
            <Option value="Java">☕ Java</Option>
            <Option value="Go">🔵 Go</Option>
            <Option value="Rust">🦀 Rust</Option>
            <Option value="C#">C#</Option>
            <Option value="Lua">🌙 Lua</Option>
          </Select>
          <AntInput
            placeholder="搜索项目名称或描述"
            prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
            allowClear
            style={{ width: 280, fontSize: 14 }}
            value={keywordFilter}
            onChange={(e) => {
              setKeywordFilter(e.target.value);
              setPage(1);
            }}
            onPressEnter={() => loadRepos(1)}
          />
          {(languageFilter || keywordFilter || categoryFilter) && (
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setLanguageFilter(undefined);
                setKeywordFilter('');
                setCategoryFilter(undefined);
                setPage(1);
              }}
              style={{ fontSize: 14 }}
            >
              清除筛选
            </Button>
          )}
        </Space>
      </Card>

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
            onChange: (p) => loadRepos(p),
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            style: { marginTop: 16 },
          }}
          size="middle"
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
          }}
          columns={[
            { 
              title: '项目名称', 
              dataIndex: 'name', 
              width: 200, 
              ellipsis: true,
              fixed: 'left',
              render: (name: string, record: RepoItem) => {
                const displayName = name || record.fullName?.split('/')[1] || record.fullName;
                const owner = record.owner || record.fullName?.split('/')[0] || '';
                return (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#262626' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {owner}
                    </div>
                  </div>
                );
              },
            },
            { 
              title: '项目描述', 
              dataIndex: 'description', 
              width: 350, 
              ellipsis: { showTitle: false },
              render: (desc: string) => (
                <Tooltip title={desc}>
                  <span style={{ fontSize: 13, color: '#595959', lineHeight: '1.6' }}>{desc || '-'}</span>
                </Tooltip>
              ),
            },
            { 
              title: '编程语言', 
              dataIndex: 'language', 
              width: 120, 
              align: 'center',
              render: (value: string) => value ? (
                <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>
                  {value}
                </Tag>
              ) : (
                <span style={{ color: '#bfbfbf' }}>-</span>
              ),
            },
            {
              title: '页面分类',
              dataIndex: 'category',
              width: 200,
              ellipsis: { showTitle: false },
              render: (value: string | null | undefined) => (
                <Tooltip title={getCategoryLabel(value)}>
                  <span style={{ fontSize: 12, color: '#595959' }}>
                    {getCategoryLabel(value)}
                  </span>
                </Tooltip>
              ),
            },
            { 
              title: 'Star 数', 
              dataIndex: 'starsCount', 
              width: 100,
              align: 'center',
              sorter: (a: RepoItem, b: RepoItem) => (a.starsCount || 0) - (b.starsCount || 0),
              render: (value: number) => (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
                  {value ? value.toLocaleString() : '0'}
                </span>
              ),
            },
            { 
              title: 'Fork 数', 
              dataIndex: 'forksCount', 
              width: 100,
              align: 'center',
              render: (value: number) => (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
                  {value ? value.toLocaleString() : '0'}
                </span>
              ),
            },
            { 
              title: 'Issues 数', 
              dataIndex: 'issuesCount', 
              width: 100,
              align: 'center',
              render: (value: number) => (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
                  {value ? value.toLocaleString() : '0'}
                </span>
              ),
            },
            {
              title: '标签',
              dataIndex: 'topics',
              width: 220,
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
                
                if (topics.length === 0) return <span style={{ color: '#bfbfbf' }}>-</span>;
                
                // 显示前3个，其余折叠
                const visibleTopics = topics.slice(0, 3);
                const hiddenTopics = topics.slice(3);
                
                return (
                  <div>
                    <Space size={[4, 4]} wrap style={{ marginBottom: hiddenTopics.length > 0 ? 4 : 0 }}>
                      {visibleTopics.map((topic: string, idx: number) => (
                        <Tag 
                          key={idx} 
                          style={{ 
                            margin: 0, 
                            fontSize: 11, 
                            padding: '2px 8px', 
                            borderRadius: 4,
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            whiteSpace: 'nowrap',
                            backgroundColor: '#f0f0f0',
                            borderColor: '#d9d9d9',
                            color: '#595959',
                          }}
                        >
                          {topic}
                        </Tag>
                      ))}
                    </Space>
                    {hiddenTopics.length > 0 && (
                      <Collapse 
                        ghost 
                        size="small" 
                        style={{ background: 'transparent', marginTop: -4 }}
                        items={[{
                          key: '1',
                          label: <span style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer' }}>+{hiddenTopics.length} 更多</span>,
                          children: (
                            <Space size={[4, 4]} wrap style={{ marginTop: 0 }}>
                              {hiddenTopics.map((topic: string, idx: number) => (
                                <Tag 
                                  key={idx} 
                                  style={{ 
                                    margin: 0, 
                                    fontSize: 11, 
                                    padding: '2px 8px', 
                                    borderRadius: 4,
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#f0f0f0',
                                    borderColor: '#d9d9d9',
                                    color: '#595959',
                                  }}
                                >
                                  {topic}
                                </Tag>
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
              title: '更新时间',
              dataIndex: 'updatedDate',
              width: 110,
              align: 'center',
              sorter: (a: RepoItem, b: RepoItem) => {
                const dateA = a.updatedDate ? new Date(a.updatedDate).getTime() : 0;
                const dateB = b.updatedDate ? new Date(b.updatedDate).getTime() : 0;
                return dateA - dateB;
              },
              render: (value: string) => value ? (
                <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>
                  <span style={{ fontSize: 12, color: '#595959' }}>{dayjs(value).format('YYYY-MM-DD')}</span>
                </Tooltip>
              ) : (
                <span style={{ color: '#bfbfbf' }}>-</span>
              ),
            },
            {
              title: '操作',
              width: 140,
              fixed: 'right',
              align: 'center',
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
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>
                    <Tooltip title="编辑">
                      <Button 
                        type="text" 
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>
                    <Popconfirm 
                      title="确认删除此项目?" 
                      description="删除后无法恢复"
                      onConfirm={() => handleDelete(record.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button 
                          type="text" 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />} 
                        />
                      </Tooltip>
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
          <Form.Item name="category" label="页面分类（与用户端分类一致）" tooltip="选择后，用户端 /repos 可按该分类筛选">
            <Select placeholder="选择分类（如 1.1 视觉-语言-动作 VLA）" allowClear>
              {REPO_CATEGORIES.map((block) => (
                <Select.OptGroup key={block.id} label={`${block.emoji} ${block.label}`}>
                  {(block.children || []).map((c) => (
                    <Option key={c.id} value={c.id}>{c.id} {c.label}</Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
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

      {/* 分类补充弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloudDownloadOutlined style={{ fontSize: 18, color: '#52c41a' }} />
            <span>分类补充 - 从GitHub搜索新项目</span>
          </div>
        }
        open={suggestModalOpen}
        onCancel={() => {
          setSuggestModalOpen(false);
          setSelectedCategory(null);
          setSuggestedRepos([]);
          setSelectedRepoKeys(new Set());
        }}
        footer={null}
        width={1000}
      >
        <Spin spinning={suggestLoading}>
          {!selectedCategory ? (
            <div>
              <div style={{ marginBottom: 16, color: '#8c8c8c' }}>
                选择一个分类，系统将从GitHub搜索相关的高质量项目（Stars≥100）
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {REPO_CATEGORIES.map((block) => (
                  <div key={block.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#262626' }}>
                      {block.emoji} {block.label}
                    </div>
                    {(block.children || []).map((child) => {
                      const stat = suggestionStats.find(s => s.id === child.id);
                      return (
                        <div
                          key={child.id}
                          onClick={() => searchCategorySuggestions(child.id)}
                          style={{
                            padding: '10px 12px',
                            marginBottom: 6,
                            background: '#fafafa',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e6f7ff';
                            e.currentTarget.style.borderColor = '#1890ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fafafa';
                          }}
                        >
                          <span style={{ fontSize: 13 }}>
                            <span style={{ color: '#8c8c8c', marginRight: 8 }}>{child.id}</span>
                            {child.label}
                          </span>
                          <Badge 
                            count={stat?.suggestionCount || 0} 
                            style={{ backgroundColor: stat?.suggestionCount ? '#52c41a' : '#d9d9d9' }}
                            showZero
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button onClick={() => setSelectedCategory(null)}>
                  ← 返回分类列表
                </Button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>
                    已选择 {selectedRepoKeys.size} 个项目
                  </span>
                  <Button
                    type="primary"
                    disabled={selectedRepoKeys.size === 0}
                    loading={addingRepos}
                    onClick={handleAddSelectedRepos}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    添加选中的项目
                  </Button>
                </div>
              </div>

              {suggestedRepos.length === 0 ? (
                <Empty description="暂无候选项目" />
              ) : (
                <div style={{ maxHeight: 500, overflow: 'auto' }}>
                  <div style={{ marginBottom: 12 }}>
                    <Checkbox
                      checked={selectedRepoKeys.size === suggestedRepos.length && suggestedRepos.length > 0}
                      indeterminate={selectedRepoKeys.size > 0 && selectedRepoKeys.size < suggestedRepos.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRepoKeys(new Set(suggestedRepos.map(r => r.fullName)));
                        } else {
                          setSelectedRepoKeys(new Set());
                        }
                      }}
                    >
                      全选
                    </Checkbox>
                  </div>
                  {suggestedRepos.map((repo) => (
                    <div
                      key={repo.fullName}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        background: selectedRepoKeys.has(repo.fullName) ? '#f6ffed' : '#fafafa',
                        borderRadius: 8,
                        border: `1px solid ${selectedRepoKeys.has(repo.fullName) ? '#b7eb8f' : '#f0f0f0'}`,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Checkbox
                          checked={selectedRepoKeys.has(repo.fullName)}
                          onChange={(e) => {
                            const newKeys = new Set(selectedRepoKeys);
                            if (e.target.checked) {
                              newKeys.add(repo.fullName);
                            } else {
                              newKeys.delete(repo.fullName);
                            }
                            setSelectedRepoKeys(newKeys);
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <a
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontWeight: 600, color: '#262626' }}
                            >
                              {repo.fullName}
                            </a>
                            {repo.language && (
                              <Tag style={{ fontSize: 11 }}>{repo.language}</Tag>
                            )}
                            <span style={{ fontSize: 12, color: '#faad14' }}>
                              ⭐ {repo.starsCount?.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>
                            {repo.description || '暂无描述'}
                          </div>
                          {repo.matchedKeywords && repo.matchedKeywords.length > 0 && (
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                              匹配关键词: {repo.matchedKeywords.slice(0, 3).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
}
