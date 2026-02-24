/**
 * 管理端 - 论文管理页面
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Tag,
  Popconfirm,
  App,
  Drawer,
  Descriptions,
  Typography,
  Select,
  Divider,
  Tooltip,
  Badge,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  LinkOutlined,
  TeamOutlined,
  BookOutlined,
  FireOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './page.module.css';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

type SortOption = 'latest' | 'citation' | 'views' | 'favorites';

interface PaperItem {
  id: string;
  title: string;
  arxivId?: string;
  abstract?: string;
  authors?: string[];
  categories?: string[];
  venue?: string;
  publishedDate?: string;
  pdfUrl?: string;
  citationCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function PapersManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<PaperItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PaperItem | null>(null);
  const [items, setItems] = useState<PaperItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [inputKeyword, setInputKeyword] = useState('');
  const [sort, setSort] = useState<SortOption>('latest');
  const [form] = Form.useForm();

  const loadPapers = useCallback(
    async (pageNum: number, searchKeyword = keyword, sortBy = sort) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page: pageNum, size };
        if (searchKeyword) params.keyword = searchKeyword;
        if (sortBy) params.sort = sortBy;

        const response = await apiClient.get('/papers', { params });
        if (response.code === 0) {
          const data = response.data as {
            items?: PaperItem[];
            pagination?: { total?: number };
          };
          setItems(data.items || []);
          setTotal(data.pagination?.total || 0);
          setPage(pageNum);
        } else {
          message.error(response.message || '加载失败');
        }
      } catch (error: unknown) {
        const err = error as {
          status?: number;
          code?: string;
          response?: { data?: { code?: number; message?: string } };
          message?: string;
        };
        if (
          err.status === 401 ||
          err.code === 'UNAUTHORIZED' ||
          err.response?.data?.code === 1002 ||
          err.response?.data?.code === 1003
        ) {
          message.error('未登录或登录已过期，请重新登录');
        } else if (
          err.code === 'CONNECTION_REFUSED' ||
          err.code === 'TIMEOUT' ||
          err.code === 'NETWORK_ERROR'
        ) {
          message.error('后端服务未运行，请确保后端服务已启动');
        } else {
          message.error(err.response?.data?.message || err.message || '加载失败');
        }
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [keyword, sort, size, message]
  );

  useEffect(() => {
    loadPapers(1);
  }, []);

  const handleSearch = () => {
    setKeyword(inputKeyword);
    loadPapers(1, inputKeyword, sort);
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    loadPapers(1, keyword, value);
  };

  const handleReset = () => {
    setInputKeyword('');
    setKeyword('');
    setSort('latest');
    loadPapers(1, '', 'latest');
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      const payload = { ...values };

      if (payload.publishedDate) {
        payload.publishedDate = (payload.publishedDate as dayjs.Dayjs).toISOString();
      }

      if (editingItem) {
        await apiClient.put(`/admin/content/papers/${editingItem.id}`, payload);
        message.success('论文更新成功');
      } else {
        await apiClient.post('/admin/content/papers', payload);
        message.success('论文创建成功');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadPapers(page);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      message.error(err.response?.data?.message || err.message || '操作失败');
    }
  };

  const handleEdit = (record: PaperItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      publishedDate: record.publishedDate ? dayjs(record.publishedDate) : null,
      authors: Array.isArray(record.authors) ? record.authors : [],
      categories: Array.isArray(record.categories) ? record.categories : [],
    });
    setShowModal(true);
  };

  const handleView = (record: PaperItem) => {
    setViewingItem(record);
    setShowDrawer(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/content/papers/${id}`);
      message.success('删除成功');
      loadPapers(page);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      message.error(err.response?.data?.message || err.message || '删除失败');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const getCitationColor = (count: number) => {
    if (count >= 100) return '#f5222d';
    if (count >= 10) return '#fa8c16';
    return '#52c41a';
  };

  const columns = [
    {
      title: '论文',
      dataIndex: 'title',
      key: 'title',
      width: 340,
      render: (title: string, record: PaperItem) => (
        <div className={styles.titleCell}>
          <Text
            strong
            className={styles.titleText}
            onClick={() => handleView(record)}
          >
            {title}
          </Text>
          <div className={styles.titleMeta}>
            {record.arxivId && (
              <Tag
                color="cyan"
                className={styles.arxivTag}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `https://arxiv.org/abs/${record.arxivId}`,
                    '_blank'
                  );
                }}
              >
                arXiv:{record.arxivId}
                <ExportOutlined style={{ marginLeft: 3, fontSize: 10 }} />
              </Tag>
            )}
            {record.abstract && (
              <Text type="secondary" className={styles.abstractPreview}>
                {record.abstract.slice(0, 80)}
                {record.abstract.length > 80 ? '…' : ''}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'authors',
      key: 'authors',
      width: 180,
      render: (authors: string[]) => {
        const list = Array.isArray(authors) ? authors : [];
        if (list.length === 0) return <Text type="secondary">—</Text>;
        return (
          <Tooltip title={list.join(' · ')}>
            <Space size={[4, 4]} wrap>
              {list.slice(0, 2).map((a, i) => (
                <Tag key={i} icon={<TeamOutlined />} color="blue" className={styles.compactTag}>
                  {a}
                </Tag>
              ))}
              {list.length > 2 && (
                <Tag className={styles.compactTag} color="default">
                  +{list.length - 2}
                </Tag>
              )}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '分类 / 会议',
      key: 'meta',
      width: 160,
      render: (_: unknown, record: PaperItem) => {
        const cats = Array.isArray(record.categories) ? record.categories : [];
        return (
          <Space direction="vertical" size={4}>
            {record.venue && (
              <Tag icon={<BookOutlined />} color="orange" className={styles.compactTag}>
                {record.venue}
              </Tag>
            )}
            {cats.slice(0, 2).map((c, i) => (
              <Tag key={i} color="purple" className={styles.compactTag}>
                {c}
              </Tag>
            ))}
            {cats.length > 2 && (
              <Tag color="default" className={styles.compactTag}>
                +{cats.length - 2}
              </Tag>
            )}
            {!record.venue && cats.length === 0 && (
              <Text type="secondary">—</Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '发布日期',
      dataIndex: 'publishedDate',
      key: 'publishedDate',
      width: 110,
      sorter: (a: PaperItem, b: PaperItem) =>
        new Date(a.publishedDate || 0).getTime() -
        new Date(b.publishedDate || 0).getTime(),
      render: (date: string) => {
        if (!date) return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{dayjs(date).format('YYYY-MM-DD')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).fromNow()}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '引用',
      dataIndex: 'citationCount',
      key: 'citationCount',
      width: 80,
      align: 'center' as const,
      sorter: (a: PaperItem, b: PaperItem) =>
        (a.citationCount || 0) - (b.citationCount || 0),
      render: (count: number) => {
        const n = count || 0;
        return (
          <Badge
            count={formatNumber(n)}
            showZero
            style={{
              backgroundColor: getCitationColor(n),
              fontSize: 12,
              padding: '0 6px',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      title: '互动',
      key: 'stats',
      width: 100,
      render: (_: unknown, record: PaperItem) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <EyeOutlined style={{ color: '#1890ff', fontSize: 11 }} />
            <Text style={{ fontSize: 12, color: '#595959' }}>
              {formatNumber(record.viewCount || 0)}
            </Text>
          </Space>
          <Space size={4}>
            <HeartOutlined style={{ color: '#f5222d', fontSize: 11 }} />
            <Text style={{ fontSize: 12, color: '#595959' }}>
              {formatNumber(record.favoriteCount || 0)}
            </Text>
          </Space>
          <Space size={4}>
            <ShareAltOutlined style={{ color: '#52c41a', fontSize: 11 }} />
            <Text style={{ fontSize: 12, color: '#595959' }}>
              {formatNumber(record.shareCount || 0)}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: PaperItem) => (
        <Space size={0} direction="vertical">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            className={styles.actionBtn}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className={styles.actionBtn}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该论文?"
            description="删除后数据将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className={styles.actionBtn}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statsData = [
    {
      label: '总论文数',
      value: total,
      suffix: '篇',
      color: '#1677ff',
      icon: <FileTextOutlined />,
    },
    {
      label: '高引用 ≥100',
      value: items.filter((i) => (i.citationCount || 0) >= 100).length,
      suffix: '篇',
      color: '#f5222d',
      icon: <FireOutlined />,
    },
    {
      label: '有 PDF 链接',
      value: items.filter((i) => i.pdfUrl).length,
      suffix: '篇',
      color: '#13c2c2',
      icon: <FileTextOutlined />,
    },
    {
      label: '本月新增',
      value: items.filter((i) =>
        i.createdAt ? dayjs(i.createdAt).isSame(dayjs(), 'month') : false
      ).length,
      suffix: '篇',
      color: '#52c41a',
      icon: <CalendarOutlined />,
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FileTextOutlined />
          </div>
          <div>
            <h1 className={styles.pageTitle}>论文管理</h1>
            <Text type="secondary" className={styles.pageSubtitle}>
              共 <strong>{total}</strong> 篇论文收录
            </Text>
          </div>
          {/* 行内统计徽章 */}
          <div className={styles.statsInline}>
            {statsData.map((s) => (
              <div key={s.label} className={styles.statBadge}>
                <span className={styles.statIcon} style={{ color: s.color }}>
                  {s.icon}
                </span>
                <span className={styles.statValue} style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="middle"
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setShowModal(true);
          }}
          className={styles.addBtn}
        >
          新增论文
        </Button>
      </div>

      <Divider className={styles.headerDivider} />

      {/* 筛选工具栏 */}
      <div className={styles.toolbar}>
        <Space size={8} wrap>
          <Input
            placeholder="搜索论文标题、作者、关键词…"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            onClear={() => {
              setInputKeyword('');
              setKeyword('');
              loadPapers(1, '', sort);
            }}
            className={styles.searchInput}
          />
          <Select
            value={sort}
            onChange={handleSortChange}
            className={styles.sortSelect}
            options={[
              { value: 'latest', label: '最新发布' },
              { value: 'citation', label: '引用最多' },
              { value: 'views', label: '浏览最多' },
              { value: 'favorites', label: '收藏最多' },
            ]}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            重置
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          pageSize: size,
          total,
          onChange: (p) => loadPapers(p),
          showTotal: (t, range) =>
            `第 ${range[0]}–${range[1]} 条，共 ${t} 条`,
          showSizeChanger: false,
          showQuickJumper: true,
          size: 'small',
        }}
        className={styles.table}
        rowClassName={(_, index) =>
          index % 2 === 0 ? styles.rowEven : styles.rowOdd
        }
        size="middle"
      />

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span className={styles.drawerTitle}>论文详情</span>
          </Space>
        }
        open={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setViewingItem(null);
        }}
        width={600}
        extra={
          viewingItem && (
            <Space>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setShowDrawer(false);
                  handleEdit(viewingItem);
                }}
              >
                编辑
              </Button>
            </Space>
          )
        }
      >
        {viewingItem && (
          <div className={styles.drawerContent}>
            <h2 className={styles.drawerPaperTitle}>{viewingItem.title}</h2>

            {/* 标识信息 */}
            <div className={styles.drawerMeta}>
              {viewingItem.arxivId && (
                <a
                  href={`https://arxiv.org/abs/${viewingItem.arxivId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.arxivLink}
                >
                  <ExportOutlined />
                  arXiv:{viewingItem.arxivId}
                </a>
              )}
              {viewingItem.pdfUrl && (
                <a
                  href={viewingItem.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfLink}
                >
                  <FileTextOutlined />
                  查看 PDF
                </a>
              )}
            </div>

            <Divider className={styles.drawerDivider} />

            {/* 摘要 */}
            {viewingItem.abstract && (
              <div className={styles.drawerSection}>
                <Text type="secondary" className={styles.sectionLabel}>
                  摘要
                </Text>
                <Paragraph className={styles.abstractText}>
                  {viewingItem.abstract}
                </Paragraph>
              </div>
            )}

            {/* 作者 */}
            <div className={styles.drawerSection}>
              <Text type="secondary" className={styles.sectionLabel}>
                作者
              </Text>
              <Space size={[6, 6]} wrap>
                {(viewingItem.authors || []).map((a, i) => (
                  <Tag key={i} icon={<TeamOutlined />} color="blue">
                    {a}
                  </Tag>
                ))}
                {(!viewingItem.authors || viewingItem.authors.length === 0) && (
                  <Text type="secondary">—</Text>
                )}
              </Space>
            </div>

            {/* 分类 */}
            <div className={styles.drawerSection}>
              <Text type="secondary" className={styles.sectionLabel}>
                分类
              </Text>
              <Space size={[6, 6]} wrap>
                {(viewingItem.categories || []).map((c, i) => (
                  <Tag key={i} color="purple">
                    {c}
                  </Tag>
                ))}
                {(!viewingItem.categories ||
                  viewingItem.categories.length === 0) && (
                  <Text type="secondary">—</Text>
                )}
              </Space>
            </div>

            <Divider className={styles.drawerDivider} />

            {/* 数据指标 */}
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="会议 / 期刊">
                {viewingItem.venue ? (
                  <Tag icon={<BookOutlined />} color="orange">
                    {viewingItem.venue}
                  </Tag>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="发布日期">
                {viewingItem.publishedDate
                  ? dayjs(viewingItem.publishedDate).format('YYYY-MM-DD')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="引用数">
                <Text
                  strong
                  style={{ color: getCitationColor(viewingItem.citationCount || 0) }}
                >
                  {formatNumber(viewingItem.citationCount || 0)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="浏览量">
                <Space size={4}>
                  <EyeOutlined style={{ color: '#1890ff' }} />
                  {formatNumber(viewingItem.viewCount || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="收藏数">
                <Space size={4}>
                  <HeartOutlined style={{ color: '#f5222d' }} />
                  {formatNumber(viewingItem.favoriteCount || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="分享数">
                <Space size={4}>
                  <ShareAltOutlined style={{ color: '#52c41a' }} />
                  {formatNumber(viewingItem.shareCount || 0)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="收录时间" span={2}>
                {dayjs(viewingItem.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新" span={2}>
                {dayjs(viewingItem.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* 新增 / 编辑弹窗 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{editingItem ? '编辑论文' : '新增论文'}</span>
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={720}
        destroyOnHidden
        className={styles.modal}
      >
        <Divider style={{ margin: '12px 0 20px' }} />
        <Form form={form} onFinish={handleCreate} layout="vertical" requiredMark="optional">
          {/* 基本信息 */}
          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              基本信息
            </Text>
            <Form.Item
              name="title"
              label="论文标题"
              rules={[{ required: true, message: '请输入论文标题' }]}
            >
              <Input placeholder="请输入完整论文标题" size="large" />
            </Form.Item>

            <Form.Item name="abstract" label="论文摘要">
              <TextArea
                rows={4}
                placeholder="请输入论文摘要（可选）"
                showCount
                maxLength={3000}
              />
            </Form.Item>
          </div>

          <Divider dashed style={{ margin: '4px 0 16px' }} />

          {/* 来源信息 */}
          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              来源信息
            </Text>
            <div className={styles.formRow}>
              <Form.Item
                name="arxivId"
                label="arXiv ID"
                tooltip="例如: 2301.00001"
                style={{ flex: 1 }}
              >
                <Input
                  placeholder="2301.00001"
                  prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
                />
              </Form.Item>
              <Form.Item name="venue" label="会议 / 期刊" style={{ flex: 1 }}>
                <Input placeholder="CVPR · NeurIPS · ICLR…" />
              </Form.Item>
            </div>
            <Form.Item name="pdfUrl" label="PDF 链接">
              <Input
                placeholder="https://arxiv.org/pdf/2301.00001.pdf"
                prefix={<FileTextOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>
          </div>

          <Divider dashed style={{ margin: '4px 0 16px' }} />

          {/* 作者与分类 */}
          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              作者与分类
            </Text>
            <Form.Item
              name="authors"
              label="作者列表"
              tooltip="输入作者名后按 Enter 添加"
              rules={[{ required: true, message: '请至少添加一位作者' }]}
            >
              <Select
                mode="tags"
                placeholder="输入作者名后按 Enter 或逗号添加"
                tokenSeparators={[',']}
                open={false}
                suffixIcon={<TeamOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>
            <Form.Item
              name="categories"
              label="分类标签"
              tooltip="输入分类标签后按 Enter 添加，如 cs.AI、cs.RO"
              rules={[{ required: true, message: '请至少添加一个分类' }]}
            >
              <Select
                mode="tags"
                placeholder="输入分类后按 Enter 添加，如 cs.AI · cs.RO"
                tokenSeparators={[',']}
                open={false}
                suffixIcon={<BookOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Form.Item>
          </div>

          <Divider dashed style={{ margin: '4px 0 16px' }} />

          {/* 发布信息 */}
          <div className={styles.formSection}>
            <Text type="secondary" className={styles.formSectionLabel}>
              发布信息
            </Text>
            <div className={styles.formRow}>
              <Form.Item name="publishedDate" label="发布日期" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} placeholder="选择发布日期" />
              </Form.Item>
              <Form.Item name="citationCount" label="引用数" style={{ flex: 1 }}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0"
                  prefix={<FireOutlined style={{ color: '#bfbfbf' }} />}
                />
              </Form.Item>
            </div>
          </div>

          <div className={styles.formFooter}>
            <Button
              onClick={() => {
                setShowModal(false);
                setEditingItem(null);
                form.resetFields();
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" icon={editingItem ? <EditOutlined /> : <PlusOutlined />}>
              {editingItem ? '保存修改' : '创建论文'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
