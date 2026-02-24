'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Input, Space, Tag, Popconfirm, Statistic, Row, Col, Switch, Progress, Alert, Badge, Dropdown, MenuProps, Drawer, Descriptions, Timeline, App } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, SettingOutlined, HistoryOutlined, BellOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons';
import { cookieApi, BilibiliCookie, CookieStatus } from '@/lib/api/cookie';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';
import dayjs from 'dayjs';

export default function CookieManagementPage() {
  const [loading, setLoading] = useState(false);
  const [cookieStatus, setCookieStatus] = useState<CookieStatus | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(false);
  const [healthCheckInterval, setHealthCheckInterval] = useState(60);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [selectedCookie, setSelectedCookie] = useState<BilibiliCookie | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const { message } = App.useApp();

  useEffect(() => {
    loadCookieStatus();
    loadSettings();
    startPolling();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    if (autoRotateEnabled) {
      pollingRef.current = setInterval(() => {
        loadCookieStatus();
        checkHealth();
      }, healthCheckInterval * 1000);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await cookieApi.getSettings();
      setAutoRotateEnabled(settings.autoRotateEnabled || false);
      setHealthCheckInterval(settings.healthCheckInterval || 60);
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const health = await cookieApi.checkHealth();
      
      const newAlerts: any[] = [];
      health.cookies.forEach((cookie: any) => {
        if (cookie.errorCount >= 3) {
          newAlerts.push({
            type: 'error',
            message: `Cookie "${cookie.name}" 错误次数过多，已自动停用`,
            cookieId: cookie.id,
            timestamp: new Date(),
          });
        } else if (cookie.errorCount > 0) {
          newAlerts.push({
            type: 'warning',
            message: `Cookie "${cookie.name}" 出现 ${cookie.errorCount} 次错误`,
            cookieId: cookie.id,
            timestamp: new Date(),
          });
        }
      });

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      }

      setHealthHistory(prev => [
        {
          timestamp: new Date(),
          activeCount: health.activeCount,
          totalCount: health.totalCount,
          healthyCount: health.cookies.filter((c: any) => c.errorCount === 0).length,
        },
        ...prev,
      ].slice(0, 100));
    } catch (error) {
      console.error('Health check error:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await cookieApi.updateSettings({
        autoRotateEnabled,
        healthCheckInterval,
      });
      message.success('设置保存成功');
      setSettingsVisible(false);
      startPolling();
    } catch (error: any) {
      message.error(error.message || '保存设置失败');
    }
  };

  const handleToggleAutoRotate = async (enabled: boolean) => {
    setAutoRotateEnabled(enabled);
    try {
      await cookieApi.updateSettings({
        autoRotateEnabled: enabled,
        healthCheckInterval,
      });
      message.success(enabled ? '自动轮换已启用' : '自动轮换已禁用');
      startPolling();
    } catch (error: any) {
      message.error(error.message || '设置失败');
      setAutoRotateEnabled(!enabled);
    }
  };

  const loadCookieStatus = async () => {
    setLoading(true);
    try {
      const status = await cookieApi.getCookieStatus();
      setCookieStatus(status);
    } catch (error: any) {
      console.error('Load cookie status error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '加载失败');
      }
      setCookieStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values: { name: string; cookie: string }) => {
    try {
      await cookieApi.addCookie(values.name, values.cookie);
      message.success('添加成功');
      setAddModalVisible(false);
      form.resetFields();
      loadCookieStatus();
    } catch (error: any) {
      console.error('Add cookie error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '添加失败');
      }
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await cookieApi.removeCookie(id);
      message.success('删除成功');
      loadCookieStatus();
    } catch (error: any) {
      console.error('Remove cookie error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '删除失败');
      }
    }
  };

  const handleRotate = async () => {
    try {
      await cookieApi.rotateCookie();
      message.success('切换成功');
      loadCookieStatus();
    } catch (error: any) {
      console.error('Rotate cookie error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '切换失败');
      }
    }
  };

  const handleViewDetails = (cookie: BilibiliCookie) => {
    setSelectedCookie(cookie);
    setDetailDrawerVisible(true);
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  const getHealthStatus = (cookie: BilibiliCookie) => {
    if (!cookie.isActive) {
      return { text: '已停用', color: 'default', percent: 0 };
    }
    if (cookie.errorCount >= 3) {
      return { text: '已失效', color: 'error', percent: 0 };
    }
    if (cookie.errorCount > 0) {
      return { text: '不稳定', color: 'warning', percent: Math.max(0, 100 - cookie.errorCount * 30) };
    }
    return { text: '健康', color: 'success', percent: 100 };
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '健康状态',
      key: 'health',
      render: (_: any, record: BilibiliCookie) => {
        const status = getHealthStatus(record);
        return (
          <Space direction="vertical" size={0}>
            <Tag color={status.color}>{status.text}</Tag>
            <Progress percent={status.percent} size="small" showInfo={false} />
          </Space>
        );
      },
    },
    {
      title: '错误次数',
      dataIndex: 'errorCount',
      key: 'errorCount',
      render: (count: number) => (
        <Tag color={count >= 3 ? 'error' : count > 0 ? 'warning' : 'default'}>
          {count}
        </Tag>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '最后错误',
      dataIndex: 'lastError',
      key: 'lastError',
      ellipsis: true,
      render: (error?: string) => error ? <span style={{ color: '#ff4d4f' }}>{error}</span> : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: BilibiliCookie) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定删除此Cookie吗？"
            description="删除后将无法恢复"
            onConfirm={() => handleRemove(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Bilibili Cookie管理" loading={loading && !cookieStatus}>
      <Card className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Bilibili Cookie管理</h2>
          <Space>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
            >
              设置
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setHistoryDrawerVisible(true)}
            >
              健康历史
            </Button>
            <Badge count={alerts.filter(a => a.type === 'error').length} offset={[10, 0]}>
              <Button icon={<BellOutlined />}>
                告警
              </Button>
            </Badge>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadCookieStatus}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              添加Cookie
            </Button>
          </Space>
        </div>

        {alerts.length > 0 && (
          <Alert
            message={`有 ${alerts.filter(a => a.type === 'error').length} 个错误告警`}
            description={
              <div className={styles.alertContainer}>
                {alerts.slice(0, 5).map((alert, index) => (
                  <div key={index} className={styles.alertItem}>
                    <Tag color={alert.type === 'error' ? 'error' : 'warning'}>
                      {alert.type === 'error' ? '错误' : '警告'}
                    </Tag>
                    <span style={{ fontSize: 12 }}>{alert.message}</span>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <div className={styles.alertMore}>
                    还有 {alerts.length - 5} 条告警...
                  </div>
                )}
              </div>
            }
            type="error"
            showIcon
            closable
            onClose={handleClearAlerts}
            style={{ marginBottom: 16 }}
          />
        )}

        {cookieStatus && (
          <Row gutter={16} className={styles.statsRow}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className={styles.statsCard}>
                <Statistic
                  title="总Cookie数"
                  value={cookieStatus.totalCount}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className={styles.statsCard}>
                <Statistic
                  title="活跃Cookie数"
                  value={cookieStatus.activeCount}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className={styles.statsCard}>
                <Statistic
                  title="健康Cookie数"
                  value={cookieStatus.cookies?.filter((c: any) => c.errorCount === 0).length || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" className={styles.statsCard}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div className={styles.statsLabel}>自动轮换</div>
                  <Switch
                    checked={autoRotateEnabled}
                    onChange={handleToggleAutoRotate}
                    checkedChildren="已启用"
                    unCheckedChildren="已禁用"
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={cookieStatus?.cookies || []}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title="添加Bilibili Cookie"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={() => form.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            label="Cookie名称"
            name="name"
            rules={[{ required: true, message: '请输入Cookie名称' }]}
          >
            <Input placeholder="例如：主账号Cookie" />
          </Form.Item>
          <Form.Item
            label="Cookie内容"
            name="cookie"
            rules={[{ required: true, message: '请输入Cookie内容' }]}
          >
            <Input.TextArea
              placeholder="粘贴完整的Cookie字符串"
              rows={6}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Card style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>使用说明</h3>
        <ul>
          <li>系统会自动在多个Cookie之间轮换，避免单个Cookie被限流</li>
          <li>当某个Cookie错误次数达到3次时，会自动停用</li>
          <li>建议添加多个Cookie以提高稳定性</li>
          <li><strong>获取Cookie步骤：</strong>
            <ol style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>打开浏览器，登录 <a href="https://www.bilibili.com" target="_blank" rel="noopener noreferrer">bilibili.com</a></li>
              <li>按 <kbd>F12</kbd> 打开开发者工具</li>
              <li>切换到 <strong>Network</strong> 标签页</li>
              <li>刷新页面，点击任意请求</li>
              <li>在 <strong>Headers</strong> 中找到 <code>Cookie</code>，复制整个值</li>
            </ol>
          </li>
          <li><strong>必须包含的字段：</strong>
            <code>SESSDATA</code>、<code>bili_jct</code>、<code>buvid3</code>、<code>DedeUserID</code>
          </li>
          <li>Cookie可能会过期，请定期更新（通常有效期1-3个月）</li>
          <li><strong>无需申请官方API</strong>，只需从浏览器复制Cookie即可</li>
        </ul>
      </Card>

      {/* 设置弹窗 */}
      <Modal
        title="Cookie管理设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={handleSaveSettings}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="自动轮换">
            <Switch
              checked={autoRotateEnabled}
              onChange={setAutoRotateEnabled}
              checkedChildren="已启用"
              unCheckedChildren="已禁用"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              启用后，系统会自动在多个Cookie之间轮换，避免单个Cookie被限流
            </div>
          </Form.Item>
          <Form.Item label="健康检查间隔（秒）">
            <Input
              type="number"
              value={healthCheckInterval}
              onChange={(e) => setHealthCheckInterval(Number(e.target.value))}
              min={10}
              max={3600}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              系统会定期检查Cookie的健康状态，建议设置为 60-300 秒
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 健康历史抽屉 */}
      <Drawer
        title="Cookie健康历史"
        width={800}
        open={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
      >
        <Timeline
          items={healthHistory.map((item, index) => ({
            color: index === 0 ? 'green' : 'blue',
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>
                  {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  总数: {item.totalCount} | 活跃: {item.activeCount} | 健康: {item.healthyCount}
                </div>
              </div>
            ),
          }))}
        />
      </Drawer>

      {/* Cookie详情抽屉 */}
      <Drawer
        title="Cookie详情"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedCookie && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="名称">{selectedCookie.name}</Descriptions.Item>
            <Descriptions.Item label="健康状态">
              {getHealthStatus(selectedCookie).text}
            </Descriptions.Item>
            <Descriptions.Item label="错误次数">{selectedCookie.errorCount}</Descriptions.Item>
            <Descriptions.Item label="最后使用">
              {dayjs(selectedCookie.lastUsed).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="最后错误">
              {selectedCookie.lastError || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedCookie.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(selectedCookie.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
}