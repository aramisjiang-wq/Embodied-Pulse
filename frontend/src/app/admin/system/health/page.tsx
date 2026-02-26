'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Tag, Space, Button, App, Progress, Typography,
  Descriptions, Divider, Alert
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  ReloadOutlined, DatabaseOutlined, CloudServerOutlined,
  HddOutlined, DashboardOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const { Text, Title } = Typography;

interface HealthItem {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  checkedAt: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
  healthy: { color: 'green', icon: <CheckCircleOutlined />, text: '健康' },
  degraded: { color: 'orange', icon: <WarningOutlined />, text: '降级' },
  down: { color: 'red', icon: <CloseCircleOutlined />, text: '故障' },
};

const componentIcons: Record<string, React.ReactNode> = {
  database: <DatabaseOutlined />,
  redis: <CloudServerOutlined />,
  disk: <HddOutlined />,
  memory: <DashboardOutlined />,
};

export default function SystemHealthPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<Record<string, HealthItem>>({});
  const [checking, setChecking] = useState(false);

  const loadHealth = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiClient.get<Record<string, HealthItem>>('/admin/system/health/latest');
      if (response && 'data' in response) {
        setHealth(response.data as Record<string, HealthItem>);
      }
    } catch {
      message.error('加载健康状态失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const response = await apiClient.get<HealthItem[]>('/admin/system/health');
      if (response && 'data' in response) {
        const data = response.data as HealthItem[];
        const healthMap: Record<string, HealthItem> = {};
        data.forEach((item) => {
          healthMap[item.component] = item;
        });
        setHealth(healthMap);
        message.success('健康检查完成');
      }
    } catch {
      message.error('健康检查失败');
    } finally {
      setChecking(false);
    }
  };

  const getOverallStatus = () => {
    const statuses = Object.values(health).map((h) => h.status);
    if (statuses.includes('down')) return 'down';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.length === 0) return 'unknown';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <PageContainer title="系统健康状态">
      <div className={styles.container}>
        <Alert
          message={
            <Space>
              <Text strong>系统状态:</Text>
              <Tag color={statusConfig[overallStatus]?.color || 'default'} icon={statusConfig[overallStatus]?.icon}>
                {statusConfig[overallStatus]?.text || '未知'}
              </Tag>
              <Text type="secondary">最后检查: {health.database?.checkedAt ? new Date(health.database.checkedAt).toLocaleString('zh-CN') : '-'}</Text>
            </Space>
          }
          type={overallStatus === 'healthy' ? 'success' : overallStatus === 'degraded' ? 'warning' : 'error'}
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={handleCheck} loading={checking}>
              立即检查
            </Button>
          }
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          {Object.entries(health).map(([key, item]) => {
            const config = statusConfig[item.status] || statusConfig.healthy;
            return (
              <Col span={6} key={key}>
                <Card>
                  <div className={styles.healthCard}>
                    <div className={styles.healthIcon}>
                      {componentIcons[key] || <DatabaseOutlined />}
                    </div>
                    <div className={styles.healthInfo}>
                      <Text type="secondary">{key.toUpperCase()}</Text>
                      <Tag color={config.color} icon={config.icon}>
                        {config.text}
                      </Tag>
                    </div>
                  </div>
                  {item.responseTime && (
                    <Statistic
                      title="响应时间"
                      value={item.responseTime}
                      suffix="ms"
                      valueStyle={{ fontSize: 16 }}
                    />
                  )}
                  {item.errorMessage && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      {item.errorMessage}
                    </Text>
                  )}
                  {item.metadata && (
                    <div className={styles.metadata}>
                      {item.metadata.usedPercent !== undefined && (
                        <Progress
                          percent={item.metadata.usedPercent as number}
                          size="small"
                          status={(item.metadata.usedPercent as number) > 90 ? 'exception' : 'normal'}
                        />
                      )}
                      {Boolean(item.metadata.heapUsedMB) && Boolean(item.metadata.heapTotalMB) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {`${item.metadata.heapUsedMB}MB / ${item.metadata.heapTotalMB}MB`}
                        </Text>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>

        <Card title="系统详情" style={{ marginTop: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="Node.js 版本">{process.env.NODE_ENV}</Descriptions.Item>
            <Descriptions.Item label="运行环境">Development</Descriptions.Item>
            <Descriptions.Item label="数据库">SQLite (Admin) + SQLite (User)</Descriptions.Item>
            <Descriptions.Item label="缓存">Redis (可选)</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Prometheus 指标" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>系统已集成 Prometheus 指标收集，可通过以下端点访问：</Text>
            <Text code>/metrics</Text> - Prometheus 格式指标
            <Text code>/health</Text> - 健康检查端点
            <Text code>/ready</Text> - 就绪检查端点
            <Divider />
            <Text type="secondary">
              可配置 Grafana 仪表板进行可视化监控，或使用管理端内置的监控功能。
            </Text>
          </Space>
        </Card>
      </div>
    </PageContainer>
  );
}
