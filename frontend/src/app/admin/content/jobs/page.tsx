/**
 * 管理端 - 招聘与求职管理（科技极简风）
 * 数据源：GET /admin/content/jobs、GET /admin/content/job-seeking-posts
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Popconfirm,
  Empty,
  Select,
  App,
  Tabs,
  Space,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  UserOutlined,
  AuditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import { syncApi } from '@/lib/api/sync';
import styles from './page.module.css';

const { TextArea } = Input;

type TabKey = 'jobs' | 'seekers';

interface JobItem {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  status: string;
  tags?: string | string[];
  viewCount?: number;
  favoriteCount?: number;
  createdAt?: string;
  applyUrl?: string;
}

interface SeekerItem {
  id: string;
  userId: string;
  name: string;
  targetPosition: string;
  expectedLocation?: string;
  expectedSalary?: string;
  skills?: string;
  introduction?: string;
  viewCount?: number;
  createdAt?: string;
}

export default function JobsManagementPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('jobs');

  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsSize] = useState(20);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsStatus, setJobsStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [jobsKeyword, setJobsKeyword] = useState('');

  const [seekersLoading, setSeekersLoading] = useState(false);
  const [seekers, setSeekers] = useState<SeekerItem[]>([]);
  const [seekersPage, setSeekersPage] = useState(1);
  const [seekersSize] = useState(20);
  const [seekersTotal, setSeekersTotal] = useState(0);
  const [seekersKeyword, setSeekersKeyword] = useState('');

  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [form] = Form.useForm();

  const loadJobs = useCallback(
    async (pageNum: number, overrides?: { status?: typeof jobsStatus; keyword?: string }) => {
      const status = overrides?.status ?? jobsStatus;
      const keyword = overrides?.keyword !== undefined ? overrides.keyword : jobsKeyword;
      setJobsLoading(true);
      try {
        const response = await apiClient.get('/admin/content/jobs', {
          params: { page: pageNum, size: jobsSize, status, keyword: keyword || undefined },
        });
        if (response.code === 0) {
          const data = response.data as { items?: JobItem[]; pagination?: { total?: number } };
          setJobs(data.items || []);
          setJobsTotal(data.pagination?.total ?? 0);
          setJobsPage(pageNum);
        } else {
          message.error(response.message || '加载失败');
        }
      } catch (e: unknown) {
        const err = e as { status?: number; code?: string; message?: string };
        if (err.status === 401 || err.code === 'UNAUTHORIZED') {
          message.error('未登录或登录已过期，请重新登录');
        } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'NETWORK_ERROR') {
          message.error('后端服务未运行，请确保后端已启动');
        } else {
          message.error(err.message || '加载失败');
        }
        setJobs([]);
        setJobsTotal(0);
      } finally {
        setJobsLoading(false);
      }
    },
    [jobsSize, jobsStatus, jobsKeyword, message]
  );

  const loadSeekers = useCallback(
    async (pageNum: number, overrides?: { keyword?: string }) => {
      const keyword = overrides?.keyword !== undefined ? overrides.keyword : seekersKeyword;
      setSeekersLoading(true);
      try {
        const response = await apiClient.get('/admin/content/job-seeking-posts', {
          params: { page: pageNum, size: seekersSize, keyword: keyword || undefined },
        });
        if (response.code === 0) {
          const data = response.data as { items?: SeekerItem[]; pagination?: { total?: number } };
          setSeekers(data.items || []);
          setSeekersTotal(data.pagination?.total ?? 0);
          setSeekersPage(pageNum);
        } else {
          message.error(response.message || '加载失败');
        }
      } catch (e: unknown) {
        const err = e as { status?: number; code?: string; message?: string };
        if (err.status === 401 || err.code === 'UNAUTHORIZED') {
          message.error('未登录或登录已过期，请重新登录');
        } else {
          message.error(err.message || '加载失败');
        }
        setSeekers([]);
        setSeekersTotal(0);
      } finally {
        setSeekersLoading(false);
      }
    },
    [seekersSize, seekersKeyword, message]
  );

  useEffect(() => {
    loadJobs(1);
  }, [loadJobs]);

  useEffect(() => {
    if (activeTab === 'seekers') {
      loadSeekers(1);
    }
  }, [activeTab, loadSeekers]);

  const parseJsonField = (value?: string): string[] | undefined => {
    if (!value) return undefined;
    try {
      const v = JSON.parse(value);
      return Array.isArray(v) ? v : undefined;
    } catch {
      return undefined;
    }
  };

  const handleJobSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload = { ...values };
      const tags = parseJsonField(payload.tags as string);
      if (payload.tags !== undefined && payload.tags !== '' && tags === undefined) {
        message.error('标签需为合法 JSON 数组，如 ["机器人","Python"]');
        return;
      }
      if (tags) payload.tags = tags;

      if (editingJob) {
        await apiClient.put(`/admin/content/jobs/${editingJob.id}`, payload);
        message.success('更新成功');
      } else {
        await apiClient.post('/admin/content/jobs', payload);
        message.success('创建成功');
      }
      setShowModal(false);
      setEditingJob(null);
      form.resetFields();
      loadJobs(jobsPage);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err.response?.data?.message || err.message || '操作失败');
    }
  };

  const handleEditJob = (record: JobItem) => {
    setEditingJob(record);
    const tagsVal = Array.isArray(record.tags) ? JSON.stringify(record.tags) : (record.tags as string) ?? '';
    form.setFieldsValue({ ...record, tags: tagsVal });
    setShowModal(true);
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/jobs/${id}`);
      message.success('删除成功');
      loadJobs(jobsPage);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err.response?.data?.message || err.message || '删除失败');
    }
  };

  const handleSyncJobs = async () => {
    setSyncing(true);
    try {
      const result = await syncApi.syncJobs();
      if (result && !result.success) {
        message.error((result.message || '同步失败').replace(/\n/g, ' '), 8);
        return;
      }
      const total = result?.synced ?? 0;
      message.success(`同步完成：逐际动力岗位 ${total} 条`);
      loadJobs(1);
    } catch (e: unknown) {
      const err = e as { message?: string };
      message.error(err.message || '同步失败', 8);
    } finally {
      setSyncing(false);
    }
  };

  const renderTags = (value: JobItem['tags']) => {
    let list: string[] = [];
    if (Array.isArray(value)) list = value;
    else if (typeof value === 'string' && value) {
      try {
        const p = JSON.parse(value);
        list = Array.isArray(p) ? p : [];
      } catch {
        list = [];
      }
    }
    if (list.length === 0) return '—';
    return (
      <Space size={[0, 4]} wrap>
        {list.map((tag: string, idx: number) => (
          <Tag key={idx} className={styles.tag}>
            {tag}
          </Tag>
        ))}
      </Space>
    );
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>招聘与求职</h1>
          <span className={styles.subtitle}>岗位与求职者管理，与用户端同源数据</span>
        </div>
        <div className={styles.headerRight}>
          <Button
            icon={<SyncOutlined />}
            onClick={handleSyncJobs}
            loading={syncing}
            className={styles.btnSecondary}
          >
            同步逐际动力岗位
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingJob(null);
              form.resetFields();
              setShowModal(true);
            }}
            className={styles.btnPrimary}
          >
            新增岗位
          </Button>
        </div>
      </header>

      <div className={styles.tip}>
        <span>岗位来源：</span>
        <a href="https://career.limxdynamics.com/" target="_blank" rel="noopener noreferrer">
          逐际动力
        </a>
        <span>（同步仅更新该公司岗位，其他岗位请手动新增）。</span>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        className={styles.tabs}
        items={[
          {
            key: 'jobs',
            label: (
              <span>
                <AuditOutlined className={styles.tabIcon} />
                招聘岗位
                {jobsTotal >= 0 && (
                  <span className={styles.tabCount}>({jobsTotal})</span>
                )}
              </span>
            ),
            children: (
              <div className={styles.panel}>
                <div className={styles.toolbar}>
                  <Select
                    value={jobsStatus}
                    onChange={(v) => {
                      setJobsStatus(v);
                      loadJobs(1, { status: v });
                    }}
                    options={[
                      { value: 'all', label: '全部状态' },
                      { value: 'open', label: '招聘中' },
                      { value: 'closed', label: '已关闭' },
                    ]}
                    className={styles.select}
                  />
                  <Input
                    placeholder="搜索岗位 / 公司 / 地点"
                    prefix={<SearchOutlined className={styles.searchIcon} />}
                    value={jobsKeyword}
                    onChange={(e) => setJobsKeyword(e.target.value)}
                    onPressEnter={() => loadJobs(1, { keyword: jobsKeyword })}
                    className={styles.searchInput}
                    allowClear
                  />
                  <Button type="primary" ghost onClick={() => loadJobs(1, { keyword: jobsKeyword })}>
                    查询
                  </Button>
                </div>
                {jobs.length === 0 && !jobsLoading ? (
                  <Empty description="暂无岗位数据" className={styles.empty} />
                ) : (
                  <Table<JobItem>
                    rowKey="id"
                    loading={jobsLoading}
                    dataSource={jobs}
                    scroll={{ x: 1200 }}
                    size="small"
                    className={styles.table}
                    pagination={{
                      current: jobsPage,
                      pageSize: jobsSize,
                      total: jobsTotal,
                      onChange: (p) => loadJobs(p),
                      showTotal: (t) => `共 ${t} 条`,
                      showSizeChanger: false,
                    }}
                    columns={[
                      {
                        title: '岗位',
                        dataIndex: 'title',
                        width: 220,
                        ellipsis: true,
                        render: (text: string) => <span className={styles.cellTitle}>{text}</span>,
                      },
                      { title: '公司', dataIndex: 'company', width: 160, ellipsis: true },
                      {
                        title: '地点',
                        dataIndex: 'location',
                        width: 100,
                        render: (v: string) => v || '—',
                      },
                      {
                        title: '薪资',
                        width: 100,
                        render: (_: unknown, r: JobItem) =>
                          r.salaryMin != null && r.salaryMax != null
                            ? `${r.salaryMin}K–${r.salaryMax}K`
                            : '面议',
                      },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 88,
                        render: (v: string) => (
                          <Tag className={v === 'open' ? styles.tagOpen : styles.tagClosed}>
                            {v === 'open' ? '招聘中' : '已关闭'}
                          </Tag>
                        ),
                      },
                      {
                        title: '标签',
                        dataIndex: 'tags',
                        width: 180,
                        render: renderTags,
                      },
                      {
                        title: '操作',
                        width: 120,
                        fixed: 'right',
                        render: (_: unknown, record: JobItem) => (
                          <Space size={0}>
                            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditJob(record)}>
                              编辑
                            </Button>
                            <Popconfirm title="确认删除？" onConfirm={() => handleDeleteJob(record.id)}>
                              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'seekers',
            label: (
              <span>
                <UserOutlined className={styles.tabIcon} />
                求职者
                {seekersTotal >= 0 && (
                  <span className={styles.tabCount}>({seekersTotal})</span>
                )}
              </span>
            ),
            children: (
              <div className={styles.panel}>
                <div className={styles.toolbar}>
                  <Input
                    placeholder="搜索姓名 / 意向岗位 / 技能"
                    prefix={<SearchOutlined className={styles.searchIcon} />}
                    value={seekersKeyword}
                    onChange={(e) => setSeekersKeyword(e.target.value)}
                    onPressEnter={() => loadSeekers(1, { keyword: seekersKeyword })}
                    className={styles.searchInput}
                    allowClear
                  />
                  <Button type="primary" ghost onClick={() => loadSeekers(1, { keyword: seekersKeyword })}>
                    查询
                  </Button>
                </div>
                {seekers.length === 0 && !seekersLoading ? (
                  <Empty description="暂无求职者信息" className={styles.empty} />
                ) : (
                  <Table<SeekerItem>
                    rowKey="id"
                    loading={seekersLoading}
                    dataSource={seekers}
                    size="small"
                    className={styles.table}
                    pagination={{
                      current: seekersPage,
                      pageSize: seekersSize,
                      total: seekersTotal,
                      onChange: (p) => loadSeekers(p),
                      showTotal: (t) => `共 ${t} 条`,
                      showSizeChanger: false,
                    }}
                    columns={[
                      { title: '姓名', dataIndex: 'name', width: 100 },
                      {
                        title: '意向岗位',
                        dataIndex: 'targetPosition',
                        width: 180,
                        ellipsis: true,
                        render: (t: string) => <span className={styles.cellTitle}>{t}</span>,
                      },
                      {
                        title: '期望地点',
                        dataIndex: 'expectedLocation',
                        width: 120,
                        render: (v: string) => v || '—',
                      },
                      {
                        title: '期望薪资',
                        dataIndex: 'expectedSalary',
                        width: 100,
                        render: (v: string) => v || '—',
                      },
                      {
                        title: '技能',
                        dataIndex: 'skills',
                        width: 200,
                        ellipsis: true,
                        render: (v: string) => v || '—',
                      },
                      {
                        title: '简介',
                        dataIndex: 'introduction',
                        ellipsis: true,
                        render: (v: string) => (v ? (v.length > 60 ? `${v.slice(0, 60)}…` : v) : '—'),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        title={editingJob ? '编辑岗位' : '新增岗位'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingJob(null);
          form.resetFields();
        }}
        footer={null}
        width={640}
        className={styles.modal}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleJobSubmit} layout="vertical" className={styles.form}>
          <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="如：具身智能算法工程师" />
          </Form.Item>
          <Form.Item name="company" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="如：逐际动力" />
          </Form.Item>
          <Form.Item name="location" label="工作地点">
            <Input placeholder="北京、上海、远程等" />
          </Form.Item>
          <Form.Item name="salaryMin" label="最低薪资 (K)">
            <InputNumber min={0} className={styles.inputFull} />
          </Form.Item>
          <Form.Item name="salaryMax" label="最高薪资 (K)">
            <InputNumber min={0} className={styles.inputFull} />
          </Form.Item>
          <Form.Item name="description" label="岗位描述">
            <TextArea rows={4} placeholder="岗位职责与内容" />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <TextArea rows={3} placeholder="学历、经验、技能等" />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签 (JSON 数组)"
            tooltip='例如: ["机器人", "Python"]'
          >
            <Input placeholder='["机器人", "Python"]' />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="open">
            <Select
              options={[
                { value: 'open', label: '招聘中' },
                { value: 'closed', label: '已关闭' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingJob ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
