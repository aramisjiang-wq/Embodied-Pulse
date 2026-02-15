/**
 * 管理端 - 订阅管理页面（完整功能版）
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  Drawer,
  Statistic,
  Row,
  Col,
  Tooltip,
  Badge,
  Timeline,
} from 'antd';
import {
  BellOutlined,
  ReloadOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { subscriptionApi } from '@/lib/api/subscription';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Subscription {
  id: string;
  userId: string;
  contentType: string;
  keywords?: string;
  tags?: string;
  authors?: string;
  uploaders?: string;
  platform?: string;
  isPublic: boolean;
  isActive: boolean;
  notifyEnabled: boolean;
  syncEnabled: boolean;
  totalMatched: number;
  newCount: number;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { username: string; email: string; avatarUrl?: string };
  _count?: { history: number };
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [trendDrawerVisible, setTrendDrawerVisible] = useState(false);
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [monitorData, setMonitorData] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    // 检查管理员权限
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      message.error('需要管理员权限');
      router.push('/admin/login');
      return;
    }
    
    loadSubscriptions();
    loadStats();
  }, [user, router, contentTypeFilter]);

  const loadSubscriptions = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize };
      if (contentTypeFilter) params.contentType = contentTypeFilter;

      const result = await adminApi.getSubscriptions(params);
      
      if (!result || !result.items || !Array.isArray(result.items)) {
        console.error('Invalid data structure:', result);
        setSubscriptions([]);
        setPagination(prev => ({ ...prev, total: 0 }));
        return;
      }
      
      setSubscriptions(result.items);
      setPagination({
        current: page,
        pageSize,
        total: result.pagination?.total || 0,
      });
    } catch (error: any) {
      console.error('Load subscriptions error:', error);
      setSubscriptions([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getSubscriptionStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleToggleBatch = async (syncEnabled: boolean) => {
    if (selectedRows.length === 0) {
      message.warning('请先选择订阅');
      return;
    }

    Modal.confirm({
      title: `确认${syncEnabled ? '启用' : '禁用'}同步？`,
      content: `将${syncEnabled ? '启用' : '禁用'} ${selectedRows.length} 个订阅的自动同步功能`,
      onOk: async () => {
        try {
          await adminApi.toggleSubscriptionsBatch(selectedRows, syncEnabled);
          message.success('操作成功');
          setSelectedRows([]);
          loadSubscriptions(pagination.current, pagination.pageSize);
          loadStats();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleViewTrend = async (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setTrendDrawerVisible(true);

    try {
      const [trendRes, historyRes] = await Promise.all([
        adminApi.getSubscriptionTrends(subscription.id, 7),
        adminApi.getSubscriptionHistory(subscription.id, { page: 1, size: 10 }),
      ]);

      setTrendData(trendRes.trends);
      setHistoryData(historyRes.items);
    } catch (error) {
      message.error('加载趋势数据失败');
    }
  };

  const handleManualSync = async (id: string) => {
    try {
      await adminApi.triggerSubscriptionSync(id);
      message.success('同步成功');
      loadSubscriptions(pagination.current, pagination.pageSize);
      loadStats();
    } catch (error) {
      message.error('同步失败');
    }
  };

  const handleViewMonitor = async () => {
    setMonitorDrawerVisible(true);

    try {
      const data = await adminApi.getDataFlowMonitor();
      setMonitorData(data);
    } catch (error) {
      message.error('加载监控数据失败');
    }
  };


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理逗号分隔的字符串，转换为JSON字符串
      const processedValues: any = {
        ...values,
        keywords: values.keywords ? JSON.stringify(values.keywords.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : undefined,
        tags: values.tags ? JSON.stringify(values.tags.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : undefined,
        authors: values.authors ? JSON.stringify(values.authors.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : undefined,
        uploaders: values.uploaders ? JSON.stringify(values.uploaders.split(',').map((s: string) => s.trim()).filter((s: string) => s)) : undefined,
      };
      
      // 使用用户端订阅API（管理端可以代表用户创建订阅）
      if (selectedSubscription) {
        // 更新订阅
        await subscriptionApi.updateSubscription(selectedSubscription.id, processedValues);
        message.success('更新成功');
      } else {
        // 创建订阅 - 需要指定userId，这里使用当前登录用户的ID
        if (!user || !user.id) {
          message.error('无法获取用户信息');
          return;
        }
        await subscriptionApi.createSubscription({
          ...processedValues,
          userId: user.id,
        });
        message.success('创建成功');
      }
      
      setModalOpen(false);
      setSelectedSubscription(null);
      form.resetFields();
      loadSubscriptions(pagination.current, pagination.pageSize);
      loadStats();
    } catch (error: any) {
      console.error('Submit subscription error:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: '内容类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          paper: { label: '论文', color: 'blue' },
          video: { label: '视频', color: 'purple' },
          repo: { label: 'GitHub', color: 'green' },
          huggingface: { label: 'HF模型', color: 'orange' },
          job: { label: '岗位', color: 'red' },
        };
        const info = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 200,
      ellipsis: true,
      render: (keywords: string) => {
        try {
          const kws = JSON.parse(keywords || '[]');
          return kws.slice(0, 3).join(', ') + (kws.length > 3 ? '...' : '');
        } catch {
          return keywords || '-';
        }
      },
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'username',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 80,
      render: (isPublic: boolean) => (
        <Tag color={isPublic ? 'gold' : 'default'}>{isPublic ? '公共' : '私有'}</Tag>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: Subscription) => (
        <Space direction="vertical" size={0}>
          <Badge status={record.isActive ? 'success' : 'default'} text={record.isActive ? '活跃' : '禁用'} />
          <Badge status={record.syncEnabled ? 'processing' : 'default'} text={record.syncEnabled ? '同步中' : '已暂停'} />
        </Space>
      ),
    },
    {
      title: '同步开关',
      dataIndex: 'syncEnabled',
      key: 'syncEnabled',
      width: 100,
      render: (syncEnabled: boolean, record: Subscription) => (
        <Switch
          checked={syncEnabled}
          onChange={async (checked) => {
            try {
              await adminApi.toggleSubscriptionsBatch([record.id], checked);
              message.success('更新成功');
              loadSubscriptions(pagination.current, pagination.pageSize);
              loadStats();
            } catch (error) {
              message.error('更新失败');
            }
          }}
        />
      ),
    },
    {
      title: '订阅配置',
      key: 'config',
      render: (_: any, record: Subscription) => {
        const items = [];
        if (record.keywords) {
          const kws = JSON.parse(record.keywords);
          items.push(`关键词: ${kws.slice(0, 3).join(', ')}${kws.length > 3 ? '...' : ''}`);
        }
        if (record.uploaders) {
          const ups = JSON.parse(record.uploaders);
          items.push(`UP主: ${ups.slice(0, 2).join(', ')}${ups.length > 2 ? '...' : ''}`);
        }
        if (record.tags) {
          const tags = JSON.parse(record.tags);
          items.push(`标签: ${tags.slice(0, 2).join(', ')}${tags.length > 2 ? '...' : ''}`);
        }
        return items.map((item, idx) => <div key={idx} style={{ fontSize: 12, color: '#666' }}>{item}</div>);
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: Subscription) => (
        <Space direction="vertical" size="small">
          {record.isPublic && <Tag color="gold">公共</Tag>}
          {record.isActive && <Tag color="green">激活</Tag>}
          {record.notifyEnabled && <Tag icon={<BellOutlined />}>通知</Tag>}
        </Space>
      ),
    },
    {
      title: '匹配数/新增数',
      key: 'counts',
      width: 130,
      render: (_: any, record: Subscription) => (
        <Space direction="vertical" size={0}>
          <span>总计: {record.totalMatched || 0}</span>
          <Badge count={record.newCount} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncAt',
      key: 'lastSyncAt',
      width: 150,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Subscription) => (
        <Space>
          <Tooltip title="查看趋势">
            <Button
              type="link"
              size="small"
              icon={<LineChartOutlined />}
              onClick={() => handleViewTrend(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedSubscription(record);
                // 填充表单数据
                const formData: any = { ...record };
                // 解析JSON字段
                if (formData.keywords) {
                  try {
                    formData.keywords = JSON.parse(formData.keywords).join(', ');
                  } catch {}
                }
                if (formData.tags) {
                  try {
                    formData.tags = JSON.parse(formData.tags).join(', ');
                  } catch {}
                }
                if (formData.authors) {
                  try {
                    formData.authors = JSON.parse(formData.authors).join(', ');
                  } catch {}
                }
                if (formData.uploaders) {
                  try {
                    formData.uploaders = JSON.parse(formData.uploaders).join(', ');
                  } catch {}
                }
                form.setFieldsValue(formData);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="手动同步">
            <Button
              type="link"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => handleManualSync(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic title="订阅总数" value={stats.total} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="活跃订阅" value={stats.active} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="同步启用" value={stats.syncEnabled} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="24h同步" value={stats.last24h?.syncCount || 0} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="24h匹配" value={stats.last24h?.matchedCount || 0} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="成功率"
                value={parseFloat(stats.last24h?.successRate || '0')}
                precision={1}
                suffix="%"
                valueStyle={{ color: parseFloat(stats.last24h?.successRate || '0') > 90 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 主表格 */}
      <Card
        title="订阅列表"
        extra={
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="内容类型"
              allowClear
              value={contentTypeFilter || undefined}
              onChange={setContentTypeFilter}
            >
              <Select.Option value="paper">论文</Select.Option>
              <Select.Option value="video">视频</Select.Option>
              <Select.Option value="repo">GitHub</Select.Option>
              <Select.Option value="huggingface">HF模型</Select.Option>
              <Select.Option value="job">岗位</Select.Option>
            </Select>
            <Button icon={<EyeOutlined />} onClick={handleViewMonitor}>
              数据流动监控
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedSubscription(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              新建订阅
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => loadSubscriptions()}>
              刷新
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            disabled={selectedRows.length === 0}
            onClick={() => handleToggleBatch(true)}
          >
            批量启用同步
          </Button>
          <Button disabled={selectedRows.length === 0} onClick={() => handleToggleBatch(false)}>
            批量禁用同步
          </Button>
          <span style={{ marginLeft: 8 }}>
            {selectedRows.length > 0 && `已选择 ${selectedRows.length} 项`}
          </span>
        </Space>

        <Table
          columns={columns}
          dataSource={subscriptions}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(newPagination) => {
            loadSubscriptions(newPagination.current, newPagination.pageSize);
          }}
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: (keys) => setSelectedRows(keys as string[]),
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={selectedSubscription ? '编辑订阅' : '新建订阅'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          setSelectedSubscription(null);
          form.resetFields();
        }}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="contentType"
            label="内容类型"
            rules={[{ required: true, message: '请选择内容类型' }]}
          >
            <Select placeholder="选择内容类型">
              <Option value="paper">📄 论文</Option>
              <Option value="video">🎬 视频</Option>
              <Option value="repo">💻 代码</Option>
              <Option value="huggingface">🤖 模型</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.contentType !== currentValues.contentType}
          >
            {({ getFieldValue }) => {
              const contentType = getFieldValue('contentType');
              
              return (
                <>
                  {contentType === 'paper' && (
                    <>
                      <Form.Item name="keywords" label="关键词（逗号分隔）">
                        <TextArea rows={2} placeholder="embodied AI, robotics, manipulation" />
                      </Form.Item>
                      <Form.Item name="tags" label="分类标签（逗号分隔）">
                        <Input placeholder="cs.RO, cs.AI, cs.LG" />
                      </Form.Item>
                      <Form.Item name="authors" label="作者（逗号分隔）">
                        <Input placeholder="Sergey Levine, Pieter Abbeel" />
                      </Form.Item>
                    </>
                  )}
                  
                  {contentType === 'video' && (
                    <>
                      <Form.Item name="uploaders" label="UP主（逗号分隔）">
                        <TextArea rows={2} placeholder="跟李沐学AI, 3Blue1Brown官方" />
                      </Form.Item>
                      <Form.Item name="platform" label="平台">
                        <Select placeholder="选择平台">
                          <Option value="bilibili">📺 B站</Option>
                          <Option value="youtube">🎬 YouTube</Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}
                  
                  {(contentType === 'repo' || contentType === 'huggingface') && (
                    <>
                      <Form.Item name="keywords" label="关键词（逗号分隔）">
                        <TextArea rows={2} placeholder="embodied, robotics" />
                      </Form.Item>
                      <Form.Item name="tags" label="标签（逗号分隔）">
                        <Input placeholder="python, pytorch, ros" />
                      </Form.Item>
                    </>
                  )}
                </>
              );
            }}
          </Form.Item>

          <Divider />

          <Form.Item name="isPublic" label="公共订阅" valuePropName="checked" tooltip="公共订阅对所有用户可见">
            <Switch />
          </Form.Item>

          <Form.Item name="isActive" label="激活状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item name="notifyEnabled" label="开启通知" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      {/* 趋势抽屉 */}
      <Drawer
        title={`订阅趋势分析 - ${selectedSubscription?.contentType}`}
        width={800}
        open={trendDrawerVisible}
        onClose={() => setTrendDrawerVisible(false)}
      >
        {trendData.length > 0 && (
          <>
            <h3>最近7天同步趋势</h3>
            <Line
              data={trendData}
              xField="date"
              yField="matchedCount"
              seriesField="type"
              height={300}
              smooth
              point={{ size: 5 }}
            />

            <h3 style={{ marginTop: 32 }}>同步历史记录</h3>
            <Timeline>
              {historyData.map((item) => (
                <Timeline.Item
                  key={item.id}
                  color={item.status === 'success' ? 'green' : 'red'}
                >
                  <p><strong>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</strong></p>
                  <p>
                    类型: <Tag>{item.syncType}</Tag>
                    状态: <Tag color={item.status === 'success' ? 'green' : 'red'}>{item.status}</Tag>
                  </p>
                  <p>匹配: {item.matchedCount} 条 | 新增: {item.newCount} 条 | 耗时: {item.duration}ms</p>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}
      </Drawer>

      {/* 数据流动监控抽屉 */}
      <Drawer
        title="数据流动监控"
        width={900}
        open={monitorDrawerVisible}
        onClose={() => setMonitorDrawerVisible(false)}
      >
        {monitorData && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic title="最近1小时同步次数" value={monitorData.summary.totalSyncs} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="总匹配数量" value={monitorData.summary.totalMatched} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="新增数量" value={monitorData.summary.totalNew} valueStyle={{ color: '#3f8600' }} />
                </Card>
              </Col>
            </Row>

            <h3>按内容类型统计</h3>
            <Table
              dataSource={Object.entries(monitorData.flowByType || {}).map(([type, data]: [string, any]) => ({
                type,
                ...data,
              }))}
              columns={[
                { title: '内容类型', dataIndex: 'type', key: 'type' },
                { title: '同步次数', dataIndex: 'syncs', key: 'syncs' },
                { title: '匹配数量', dataIndex: 'matched', key: 'matched' },
                { title: '新增数量', dataIndex: 'new', key: 'new' },
              ]}
              pagination={false}
              size="small"
            />

            <h3 style={{ marginTop: 24 }}>最近同步记录</h3>
            <Timeline>
              {(monitorData.recentSyncs || []).slice(0, 10).map((item: any) => (
                <Timeline.Item key={item.id}>
                  <p><strong>{dayjs(item.createdAt).format('HH:mm:ss')}</strong></p>
                  <p>
                    {item.subscription?.contentType} - {item.subscription?.user?.username}
                    {item.subscription?.isPublic && <Tag color="gold">公共</Tag>}
                  </p>
                  <p>匹配: {item.matchedCount} | 新增: {item.newCount}</p>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}
      </Drawer>
    </div>
  );
}
