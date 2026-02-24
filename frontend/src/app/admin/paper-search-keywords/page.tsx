/**
 * 论文搜索关键词管理页面
 * 科技极简风重构版
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
  Checkbox,
  Divider,
  Drawer,
  Upload,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  ControlOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import styles from './page.module.css';

const { TextArea } = Input;

const ARXIV_CATEGORIES = [
  { value: 'cs.AI', label: 'cs.AI', desc: '人工智能' },
  { value: 'cs.RO', label: 'cs.RO', desc: '机器人' },
  { value: 'cs.CV', label: 'cs.CV', desc: '计算机视觉' },
  { value: 'cs.LG', label: 'cs.LG', desc: '机器学习' },
  { value: 'cs.CL', label: 'cs.CL', desc: '自然语言处理' },
  { value: 'cs.NE', label: 'cs.NE', desc: '神经与进化计算' },
  { value: 'cs.MA', label: 'cs.MA', desc: '多智能体' },
  { value: 'eess.SY', label: 'eess.SY', desc: '系统与控制' },
];

const CATEGORIES = [
  { value: '核心概念', label: '核心概念' },
  { value: '技术相关', label: '技术相关' },
  { value: '应用场景', label: '应用场景' },
  { value: '学习方法', label: '学习方法' },
  { value: '任务类型', label: '任务类型' },
  { value: '人群关注', label: '人群关注' },
];

interface PaperSearchKeyword {
  id: string;
  keyword: string;
  category: string | null;
  source_type: string;
  is_active: boolean;
  priority: number;
  description: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  paperCount?: number;
}

interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string;
  publishedDate: string;
  arxivId: string | null;
  pdfUrl: string | null;
  citationCount: number;
}

type SyncMode = 'arxiv-categories' | 'keywords';

export default function PaperSearchKeywordsPage() {
  const { message: msg } = App.useApp();

  // keywords list
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<PaperSearchKeyword[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  // keyword modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKw, setEditingKw] = useState<PaperSearchKeyword | null>(null);
  const [form] = Form.useForm();

  // papers drawer
  const [papersDrawer, setPapersDrawer] = useState(false);
  const [selectedKw, setSelectedKw] = useState<PaperSearchKeyword | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersTotal, setPapersTotal] = useState(0);
  const [papersPage, setPapersPage] = useState(1);

  // sync panel
  const [syncMode, setSyncMode] = useState<SyncMode>('arxiv-categories');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');
  // arxiv categories sync config
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['cs.AI', 'cs.RO', 'cs.CV', 'cs.LG']);
  const [maxPerCategory, setMaxPerCategory] = useState(50);
  // keyword sync config
  const [syncDays, setSyncDays] = useState(7);
  const [maxPerKeyword, setMaxPerKeyword] = useState(20);

  // import
  const [importVisible, setImportVisible] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const loadKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/paper-search-keywords', {
        params: {
          page,
          size: pageSize,
          category: categoryFilter || undefined,
          isActive: statusFilter,
          keyword: searchText || undefined,
          withPaperCount: 'true',
        },
      });
      // 兼容：接口返回 { code, message, data: { items, pagination } }，axios 拦截器已返回 response.data
      const raw = res as { data?: { items?: PaperSearchKeyword[]; pagination?: { total?: number } }; items?: PaperSearchKeyword[]; pagination?: { total?: number } };
      const data = raw?.data ?? raw;
      const list = Array.isArray(data?.items) ? data.items : [];
      const totalNum = data?.pagination?.total ?? 0;
      setKeywords(list);
      setTotal(totalNum);
    } catch (err: any) {
      msg.error(err.message || '加载失败');
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryFilter, statusFilter, searchText, msg]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const loadPapers = async (kwId: string, p = 1) => {
    setPapersLoading(true);
    try {
      const res = await apiClient.get(`/admin/paper-search-keywords/${kwId}/papers`, {
        params: { page: p, size: 10 },
      });
      const d = res.data as { items?: Paper[]; pagination?: { total?: number } };
      setPapers(d.items || []);
      setPapersTotal(d.pagination?.total || 0);
    } catch (err: any) {
      msg.error(err.message || '加载论文失败');
    } finally {
      setPapersLoading(false);
    }
  };

  const handleViewPapers = (kw: PaperSearchKeyword) => {
    setSelectedKw(kw);
    setPapersPage(1);
    setPapersDrawer(true);
    loadPapers(kw.id, 1);
  };

  const handleCreate = () => {
    setEditingKw(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, priority: 0, source_type: 'admin' });
    setModalVisible(true);
  };

  const handleEdit = (kw: PaperSearchKeyword) => {
    setEditingKw(kw);
    form.setFieldsValue({
      keyword: kw.keyword,
      category: kw.category,
      source_type: kw.source_type,
      is_active: kw.is_active,
      priority: kw.priority,
      description: kw.description,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingKw) {
        await apiClient.put(`/admin/paper-search-keywords/${editingKw.id}`, {
          keyword: values.keyword,
          category: values.category,
          sourceType: values.source_type,
          isActive: values.is_active,
          priority: values.priority,
          description: values.description,
        });
        msg.success('更新成功');
      } else {
        await apiClient.post('/admin/paper-search-keywords', {
          keyword: values.keyword,
          category: values.category,
          sourceType: values.source_type,
          isActive: values.is_active,
          priority: values.priority,
          description: values.description,
        });
        msg.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      loadKeywords();
    } catch (err: any) {
      if (err.errorFields) return;
      msg.error(err.message || '保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/paper-search-keywords/${id}`);
      msg.success('删除成功');
      loadKeywords();
    } catch (err: any) {
      msg.error(err.message || '删除失败');
    }
  };

  const handleToggleActive = async (kw: PaperSearchKeyword) => {
    try {
      await apiClient.put(`/admin/paper-search-keywords/${kw.id}`, {
        isActive: !kw.is_active,
      });
      loadKeywords();
    } catch (err: any) {
      msg.error(err.message || '操作失败');
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult('');
    try {
      if (syncMode === 'arxiv-categories') {
        if (selectedCategories.length === 0) {
          msg.warning('请至少选择一个 arXiv 分类');
          setSyncLoading(false);
          return;
        }
        const res = await apiClient.post('/admin/sync/arxiv-categories', {
          categories: selectedCategories,
          maxResultsPerCategory: maxPerCategory,
        });
        const d = res.data as { synced?: number; errors?: number; categories?: Record<string, { synced: number; errors: number }> };
        const catDetail = d.categories
          ? Object.entries(d.categories)
              .map(([cat, r]) => `${cat}: +${r.synced}`)
              .join(' | ')
          : '';
        setSyncResult(`全量拉取完成 — 共入库 ${d.synced || 0} 篇，错误 ${d.errors || 0} 次${catDetail ? `\n${catDetail}` : ''}`);
        msg.success(`全量拉取完成，入库 ${d.synced || 0} 篇论文`);
      } else {
        const res = await apiClient.post('/admin/sync/papers-by-keywords', {
          sourceType: 'all',
          days: syncDays,
          maxResultsPerKeyword: maxPerKeyword,
        });
        const d = res.data as { synced?: number; errors?: number; keywords?: number };
        setSyncResult(`关键词同步完成 — ${d.keywords || 0} 个关键词，入库 ${d.synced || 0} 篇，错误 ${d.errors || 0} 次`);
        msg.success(`关键词同步完成，入库 ${d.synced || 0} 篇论文`);
      }
      loadKeywords();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || '同步失败';
      const hint = '若失败请确认：已登录管理员账号、后端服务可访问 https://arxiv.org';
      setSyncResult(`同步失败：${errMsg}\n${hint}`);
      msg.error(errMsg);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await apiClient.get('/admin/paper-search-keywords', {
        params: { page: 1, size: 10000 },
      });
      const data = res.data as { items?: PaperSearchKeyword[] };
      const items = data.items || [];
      const csv = [
        ['关键词', '分类', '来源', '状态', '优先级', '描述', '创建时间'].join(','),
        ...items.map(k =>
          [
            k.keyword,
            k.category || '',
            k.source_type === 'admin' ? '管理员' : '用户',
            k.is_active ? '启用' : '禁用',
            k.priority,
            k.description || '',
            dayjs(k.created_at).format('YYYY-MM-DD'),
          ].join(',')
        ),
      ].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `keywords-${dayjs().format('YYYYMMDD')}.csv`;
      a.click();
      msg.success('导出成功');
    } catch {
      msg.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFileList.length) { msg.warning('请选择文件'); return; }
    const file = importFileList[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1);
        const batch = lines
          .map(l => l.trim())
          .filter(Boolean)
          .map(l => {
            const [keyword, category, , , priority, description] = l.split(',');
            return keyword?.trim() ? {
              keyword: keyword.trim(),
              category: category?.trim() || undefined,
              priority: parseInt(priority || '0') || 0,
              description: description?.trim() || undefined,
            } : null;
          })
          .filter(Boolean);
        if (!batch.length) { msg.warning('文件中没有有效数据'); return; }
        await apiClient.post('/admin/paper-search-keywords/batch', { keywords: batch });
        msg.success(`导入 ${batch.length} 个关键词`);
        setImportVisible(false);
        setImportFileList([]);
        loadKeywords();
      } catch (err: any) {
        msg.error(err.message || '导入失败');
      }
    };
    reader.readAsText(file.originFileObj);
  };

  const activeCount = keywords.filter(k => k.is_active).length;
  const totalPapers = keywords.reduce((s, k) => s + (k.paperCount || 0), 0);
  const highPriCount = keywords.filter(k => k.priority >= 10).length;

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 160,
      render: (text: string, record: PaperSearchKeyword) => (
        <button
          onClick={() => handleViewPapers(record)}
          className={styles.kwCell}
        >
          <span className={styles.kwText}>{text}</span>
          {(record.paperCount ?? 0) > 0 && (
            <span className={styles.kwBadge}>{record.paperCount}</span>
          )}
        </button>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string | null) =>
        v ? <span className={styles.tagBlue}>{v}</span> : <span className={styles.textMuted}>—</span>,
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      key: 'source_type',
      width: 80,
      render: (v: string) => (
        <span className={v === 'admin' ? styles.tagCyan : styles.tagOrange}>
          {v === 'admin' ? '管理员' : '用户'}
        </span>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 70,
      sorter: (a: PaperSearchKeyword, b: PaperSearchKeyword) => b.priority - a.priority,
      render: (v: number) => (
        <span className={v >= 10 ? styles.tagRed : v >= 5 ? styles.tagOrange : styles.textMuted}>
          {v}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (v: boolean, record: PaperSearchKeyword) => (
        <Switch
          size="small"
          checked={v}
          onChange={() => handleToggleActive(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          style={{ minWidth: 52 }}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (d: string) => (
        <span className={styles.textMuted}>{dayjs(d).format('MM-DD HH:mm')}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: PaperSearchKeyword) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className={styles.actionBtn}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这个关键词？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                className={styles.actionBtn}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.root}>
      {/* ── 顶部标题 ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <FileTextOutlined className={styles.pageTitleIcon} />
          <span>论文关键词管理</span>
          <span className={styles.pageTitleSub}>基于 arXiv 全量拉取 + 内部关键词分类</span>
        </div>
      </div>

      {/* ── 数据概览 ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#3b82f6' }}>{total}</div>
          <div className={styles.statLabel}>关键词总数</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#10b981' }}>{activeCount}</div>
          <div className={styles.statLabel}>已启用</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#f59e0b' }}>{totalPapers.toLocaleString()}</div>
          <div className={styles.statLabel}>匹配论文数</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#ef4444' }}>{highPriCount}</div>
          <div className={styles.statLabel}>高优先级 (≥10)</div>
        </div>
      </div>

      {/* ── 同步控制台 ── */}
      <div className={styles.syncPanel}>
        <div className={styles.syncPanelHeader}>
          <ControlOutlined className={styles.syncPanelIcon} />
          <span>数据同步控制台</span>
          <span className={styles.syncPanelSub}>
            推荐使用全量拉取模式：先从 arXiv 全量拉取论文，再通过关键词在数据库内部检索分类
          </span>
        </div>

        <div className={styles.syncModeTabs}>
          <button
            className={`${styles.modeTab} ${syncMode === 'arxiv-categories' ? styles.modeTabActive : ''}`}
            onClick={() => setSyncMode('arxiv-categories')}
          >
            <DatabaseOutlined />
            <span>全量拉取 arXiv</span>
            <span className={styles.modeTabBadge}>推荐</span>
          </button>
          <button
            className={`${styles.modeTab} ${syncMode === 'keywords' ? styles.modeTabActive : ''}`}
            onClick={() => setSyncMode('keywords')}
          >
            <SearchOutlined />
            <span>按关键词搜索</span>
          </button>
        </div>

        <div className={styles.syncConfig}>
          {syncMode === 'arxiv-categories' ? (
            <div className={styles.syncConfigInner}>
              <div className={styles.configHint} style={{ marginBottom: 12 }}>
                <strong>全量拉取说明：</strong>按所选 arXiv 分类，拉取 <strong>最近 1 年</strong> 内提交的论文（按提交时间倒序），每个分类最多拉取下面设置的数量篇。已存在的论文会更新，不会重复入库。
              </div>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>选择 arXiv 分类</label>
                <div className={styles.categoryGrid}>
                  {ARXIV_CATEGORIES.map(cat => (
                    <label key={cat.value} className={styles.categoryItem}>
                      <Checkbox
                        checked={selectedCategories.includes(cat.value)}
                        onChange={e => {
                          setSelectedCategories(prev =>
                            e.target.checked
                              ? [...prev, cat.value]
                              : prev.filter(c => c !== cat.value)
                          );
                        }}
                      />
                      <span className={styles.categoryLabel}>{cat.label}</span>
                      <span className={styles.categoryDesc}>{cat.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>每个分类最大拉取数量</label>
                <InputNumber
                  min={10}
                  max={500}
                  value={maxPerCategory}
                  onChange={v => setMaxPerCategory(v || 50)}
                  className={styles.configInput}
                  addonAfter="篇"
                />
              </div>
            </div>
          ) : (
            <div className={styles.syncConfigInner}>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>拉取最近几天的论文</label>
                <InputNumber
                  min={1}
                  max={30}
                  value={syncDays}
                  onChange={v => setSyncDays(v || 7)}
                  className={styles.configInput}
                  addonAfter="天"
                />
              </div>
              <div className={styles.configGroup}>
                <label className={styles.configLabel}>每个关键词最大数量</label>
                <InputNumber
                  min={5}
                  max={100}
                  value={maxPerKeyword}
                  onChange={v => setMaxPerKeyword(v || 20)}
                  className={styles.configInput}
                  addonAfter="篇"
                />
              </div>
              <div className={styles.configHint}>
                <span>将用数据库中所有启用的关键词逐一搜索 arXiv API，获取最近 {syncDays} 天的论文</span>
              </div>
            </div>
          )}

          <div className={styles.syncActions}>
            <Button
              type="primary"
              icon={syncLoading ? <SyncOutlined spin /> : <ThunderboltOutlined />}
              loading={syncLoading}
              onClick={handleSync}
              className={styles.syncBtn}
              size="large"
            >
              {syncLoading ? '同步中...' : syncMode === 'arxiv-categories' ? '开始全量拉取' : '按关键词同步'}
            </Button>
            {syncResult && (
              <div className={syncResult.startsWith('同步失败') ? styles.syncResultError : styles.syncResultOk}>
                {syncResult.startsWith('同步失败') ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                <span>{syncResult}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 关键词列表 ── */}
      <div className={styles.tablePanel}>
        <div className={styles.tablePanelHeader}>
          <div className={styles.tableFilterRow}>
            <Input
              placeholder="搜索关键词..."
              prefix={<SearchOutlined className={styles.searchIcon} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => setPage(1)}
              className={styles.searchInput}
              allowClear
            />
            <Select
              placeholder="分类"
              value={categoryFilter || undefined}
              onChange={v => { setCategoryFilter(v || ''); setPage(1); }}
              allowClear
              options={CATEGORIES}
              className={styles.filterSelect}
            />
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1); }}
              allowClear
              options={[
                { value: true, label: '已启用' },
                { value: false, label: '已禁用' },
              ]}
              className={styles.filterSelect}
            />
            <Button icon={<ReloadOutlined />} onClick={() => { setPage(1); loadKeywords(); }}>
              刷新
            </Button>
          </div>
          <div className={styles.tableActions}>
            <Button icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>导入</Button>
            <Button icon={<DownloadOutlined />} loading={exportLoading} onClick={handleExport}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建关键词</Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={keywords}
          rowKey="id"
          loading={loading}
          size="small"
          className={styles.dataTable}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条`,
            pageSizeOptions: ['20', '50', '100'],
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          scroll={{ x: 750 }}
        />
      </div>

      {/* ── 创建/编辑 Modal ── */}
      <Modal
        title={editingKw ? '编辑关键词' : '新建关键词'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        okText={editingKw ? '保存' : '创建'}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
          <Form.Item
            name="keyword"
            label="关键词"
            rules={[
              { required: true, message: '请输入关键词' },
              { max: 100, message: '关键词不超过 100 字符' },
            ]}
          >
            <Input placeholder="例如：VLA、embodied AI、具身智能" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类（可选）" allowClear options={CATEGORIES} />
          </Form.Item>
          <Form.Item name="source_type" label="来源类型">
            <Select
              options={[
                { value: 'admin', label: '管理员创建' },
                { value: 'user', label: '用户订阅' },
              ]}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="priority" label="优先级">
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0–100，越大越高" />
            </Form.Item>
            <Form.Item name="is_active" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="可选描述" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 论文列表 Drawer ── */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>{selectedKw?.keyword}</span>
            <Tag color="blue">{papersTotal} 篇论文</Tag>
          </Space>
        }
        open={papersDrawer}
        onClose={() => { setPapersDrawer(false); setPapers([]); setSelectedKw(null); }}
        width={800}
        destroyOnHidden
      >
        <Table
          columns={[
            {
              title: '标题',
              dataIndex: 'title',
              render: (t: string, r: Paper) =>
                r.arxivId ? (
                  <a
                    href={`https://arxiv.org/abs/${r.arxivId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', fontSize: 13, lineHeight: '1.4' }}
                  >
                    {t}
                  </a>
                ) : (
                  <span style={{ fontSize: 13 }}>{t}</span>
                ),
            },
            {
              title: '发布日期',
              dataIndex: 'publishedDate',
              width: 110,
              render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '—',
            },
            {
              title: '引用数',
              dataIndex: 'citationCount',
              width: 80,
              render: (v: number) => v || 0,
            },
          ]}
          dataSource={papers}
          rowKey="id"
          loading={papersLoading}
          size="small"
          pagination={{
            current: papersPage,
            pageSize: 10,
            total: papersTotal,
            showTotal: t => `共 ${t} 篇`,
            onChange: p => {
              setPapersPage(p);
              selectedKw && loadPapers(selectedKw.id, p);
            },
          }}
          scroll={{ y: 500 }}
        />
      </Drawer>

      {/* ── 导入 Modal ── */}
      <Modal
        title="批量导入关键词"
        open={importVisible}
        onOk={handleImport}
        onCancel={() => { setImportVisible(false); setImportFileList([]); }}
        okText="开始导入"
        width={520}
      >
        <Alert
          message="CSV 格式：关键词, 分类, 来源, 状态, 优先级, 描述（首行为表头）"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Upload
          fileList={importFileList}
          onChange={({ fileList }) => setImportFileList(fileList)}
          beforeUpload={() => false}
          accept=".csv"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
        </Upload>
      </Modal>
    </div>
  );
}
