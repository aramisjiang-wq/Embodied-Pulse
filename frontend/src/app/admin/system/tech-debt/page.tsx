'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Tag, Space, Button, Select, App, Spin, Statistic, Row, Col,
  Progress, Modal, Typography, Tooltip, Badge
} from 'antd';
import {
  WarningOutlined, BugOutlined, ApiOutlined, CodeOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const { Text } = Typography;

interface TechDebtItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  filePath?: string;
  line?: number;
  status: string;
  createdAt: string;
}

interface TechDebtStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

const severityColors: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'green',
};

const typeIcons: Record<string, React.ReactNode> = {
  dependency: <ApiOutlined />,
  vulnerability: <BugOutlined />,
  code: <CodeOutlined />,
  config: <WarningOutlined />,
};

export default function TechDebtPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TechDebtStats | null>(null);
  const [items, setItems] = useState<TechDebtItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ type?: string; severity?: string; status?: string }>({});
  const [scanning, setScanning] = useState(false);

  const loadStats = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) return;
    
    try {
      const response = await apiClient.get<TechDebtStats>('/admin/system/tech-debt/stats');
      if (response && 'data' in response) {
        setStats(response.data as TechDebtStats);
      }
    } catch {
      // 静默失败
    }
  }, []);

  const loadItems = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '20');
      if (filters.type) params.append('type', filters.type);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);

      const response = await apiClient.get<{ items: TechDebtItem[]; total: number }>(
        `/admin/system/tech-debt?${params.toString()}`
      );
      if (response && 'data' in response) {
        const data = response.data as { items: TechDebtItem[]; total: number };
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      message.error('加载技术债务失败');
    } finally {
      setLoading(false);
    }
  }, [page, filters, message]);

  useEffect(() => {
    loadStats();
    loadItems();
  }, [loadStats, loadItems]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await apiClient.post('/admin/system/tech-debt/scan');
      if (response && 'data' in response) {
        const data = response.data as { dependencies: number; vulnerabilities: number };
        message.success(`扫描完成: ${data.dependencies} 个过期依赖, ${data.vulnerabilities} 个安全漏洞`);
        loadStats();
        loadItems();
      }
    } catch {
      message.error('扫描失败');
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await apiClient.put(`/admin/system/tech-debt/${id}`, { status: 'resolved' });
      message.success('已标记为已解决');
      loadStats();
      loadItems();
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag icon={typeIcons[type] || <WarningOutlined />}>{type}</Tag>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={severityColors[severity] || 'default'}>{severity}</Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => <Text type="secondary">{desc}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
          open: { color: 'orange', icon: <ExclamationCircleOutlined /> },
          in_progress: { color: 'blue', icon: <ClockCircleOutlined /> },
          resolved: { color: 'green', icon: <CheckCircleOutlined /> },
          ignored: { color: 'default', icon: <CloseCircleOutlined /> },
        };
        const config = statusConfig[status] || statusConfig.open;
        return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: TechDebtItem) => (
        <Space>
          {record.status !== 'resolved' && (
            <Button size="small" type="link" onClick={() => handleResolve(record.id)}>
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const healthScore = stats ? Math.max(0, 100 - (stats.bySeverity.critical || 0) * 20 - (stats.bySeverity.high || 0) * 10 - (stats.bySeverity.medium || 0) * 5) : 0;

  return (
    <PageContainer title="技术债务管理">
      <div className={styles.container}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="健康分数"
                value={healthScore}
                suffix="/ 100"
                valueStyle={{ color: healthScore > 70 ? '#3f8600' : healthScore > 40 ? '#faad14' : '#cf1322' }}
              />
              <Progress percent={healthScore} showInfo={false} strokeColor={healthScore > 70 ? '#3f8600' : healthScore > 40 ? '#faad14' : '#cf1322'} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总债务数"
                value={stats?.total || 0}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="高危问题"
                value={(stats?.bySeverity.critical || 0) + (stats?.bySeverity.high || 0)}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={stats?.byStatus.open || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="债务列表"
          extra={
            <Space>
              <Select
                placeholder="类型"
                allowClear
                style={{ width: 120 }}
                onChange={(v) => setFilters({ ...filters, type: v })}
              >
                <Select.Option value="dependency">依赖</Select.Option>
                <Select.Option value="vulnerability">漏洞</Select.Option>
                <Select.Option value="code">代码</Select.Option>
                <Select.Option value="config">配置</Select.Option>
              </Select>
              <Select
                placeholder="严重程度"
                allowClear
                style={{ width: 100 }}
                onChange={(v) => setFilters({ ...filters, severity: v })}
              >
                <Select.Option value="critical">严重</Select.Option>
                <Select.Option value="high">高</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="low">低</Select.Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleScan} loading={scanning}>
                扫描依赖
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              total,
              pageSize: 20,
              onChange: setPage,
            }}
            size="small"
          />
        </Card>
      </div>
    </PageContainer>
  );
}
