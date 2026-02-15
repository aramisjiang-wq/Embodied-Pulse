'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Input, 
  Select, 
  DatePicker, 
  Tooltip, 
  Popconfirm, 
  Card, 
  Row, 
  Col,
  message,
  Modal,
  Form,
  Checkbox,
  Badge,
  Statistic,
  Progress
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
  CheckOutlined,
  CloseOutlined,
  StarOutlined,
  HeartOutlined,
  FileTextOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;

interface ContentManagementProps {
  type: 'paper' | 'repo' | 'video' | 'job';
  title: string;
  columns: any[];
  loadData: (params: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: any) => void;
  onCreate: () => void;
}

export default function ContentManagement({
  type,
  title,
  columns,
  loadData,
  onDelete,
  onEdit,
  onCreate,
}: ContentManagementProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFields, setExportFields] = useState<string[]>([]);

  useEffect(() => {
    loadContent();
  }, [page, size, keyword, statusFilter, dateRange]);

  type ApiError = { message?: string };
  const normalizeError = (error: unknown): ApiError => (
    typeof error === 'object' && error !== null ? (error as ApiError) : {}
  );

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        size,
        keyword: keyword || undefined,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (dateRange[0]) {
        params.startDate = dateRange[0].toISOString();
      }
      if (dateRange[1]) {
        params.endDate = dateRange[1].toISOString();
      }

      const response = await loadData(params);
      setItems(response.items || []);
      setTotal(response.pagination?.total || 0);
    } catch (error: unknown) {
      console.error('Load content error:', error);
      const err = normalizeError(error);
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, keyword, statusFilter, dateRange, loadData]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setDateRange(dates ?? [null, null]);
    setPage(1);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setDateRange([null, null]);
    setPage(1);
    setShowFilterModal(false);
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的项');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 项内容吗？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map(key => onDelete(key as string))
          );
          message.success(`成功删除 ${selectedRowKeys.length} 项`);
          setSelectedRowKeys([]);
          loadContent();
        } catch (error: unknown) {
          const err = normalizeError(error);
          message.error(err.message || '删除失败');
        }
      },
    });
  };

  const handleExport = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的项');
      return;
    }

    const selectedItems = items.filter(item => selectedRowKeys.includes(item.id));
    const dataStr = JSON.stringify(selectedItems, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的项');
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map(key => {
          const item = items.find(i => i.id === key);
          if (item) {
            return fetch(`/api/admin/content/${type}/${key}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, status: newStatus }),
            });
          }
        })
      );
      message.success(`成功更新 ${selectedRowKeys.length} 项状态`);
      setSelectedRowKeys([]);
      loadContent();
    } catch (error: unknown) {
      const err = normalizeError(error);
      message.error(err.message || '更新失败');
    }
  };

  const allFields = columns.map(col => col.dataIndex || col.key).filter(Boolean);

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="总数"
              value={total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="已选择"
              value={selectedRowKeys.length}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="当前页"
              value={page}
              suffix={`/ ${Math.ceil(total / size)}`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Progress
              type="circle"
              percent={total > 0 ? Math.round((page * size) / total * 100) : 0}
              format={(percent) => `${percent}%`}
              strokeColor="#1890ff"
            />
          </Col>
        </Row>

        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索关键词"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
            style={{ width: 200 }}
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={handleStatusFilter}
            style={{ width: 120 }}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '已发布', value: 'published' },
              { label: '草稿', value: 'draft' },
              { label: '已归档', value: 'archived' },
            ]}
          />

          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={['开始日期', '结束日期']}
            style={{ width: 260 }}
          />

          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilterModal(true)}
          >
            高级筛选
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadContent()}
          >
            刷新
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            新增
          </Button>

          {selectedRowKeys.length > 0 && (
            <>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>

              <Popconfirm
                title="确认删除"
                description={`确定要删除选中的 ${selectedRowKeys.length} 项吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
                okType="danger"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                >
                  批量删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => {
              setPage(page);
            },
            onShowSizeChange: (current, size) => {
              setPage(1);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="高级筛选"
        open={showFilterModal}
        onCancel={() => setShowFilterModal(false)}
        footer={[
          <Button key="reset" icon={<ReloadOutlined />} onClick={handleResetFilters}>
            重置筛选
          </Button>,
          <Button key="close" onClick={() => setShowFilterModal(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="关键词">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词搜索"
              allowClear
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              value={statusFilter}
              onChange={handleStatusFilter}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '已发布', value: 'published' },
                { label: '草稿', value: 'draft' },
                { label: '已归档', value: 'archived' },
              ]}
            />
          </Form.Item>
          <Form.Item label="日期范围">
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导出配置"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        onOk={handleExport}
        okText="导出"
        cancelText="取消"
        width={500}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button
              size="small"
              onClick={() => setExportFields(allFields)}
            >
              全选
            </Button>
            <Button
              size="small"
              onClick={() => setExportFields([])}
            >
              清空
            </Button>
          </div>
          <Checkbox.Group
            value={exportFields}
            onChange={setExportFields}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}
          >
            {allFields.map(field => (
              <Checkbox key={field} value={field}>
                {field}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
      </Modal>
    </div>
  );
}
