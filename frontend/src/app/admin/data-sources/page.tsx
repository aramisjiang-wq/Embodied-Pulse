/**
 * 管理端 - 第三方API管理页面
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  App,
  Spin,
  Tag,
  Switch,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Tabs,
  Select,
} from 'antd';
import {
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { dataSourceApi, DataSource, DataSourceLog } from '@/lib/api/data-source';
import { syncApi } from '@/lib/api/sync';
import apiClient from '@/lib/api/client';

const { TabPane } = Tabs;

type ApiError = {
  message?: string;
  status?: number;
  code?: string;
  response?: { data?: { code?: number; message?: string } };
  errorFields?: unknown;
};

const normalizeError = (error: unknown): ApiError => (
  typeof error === 'object' && error !== null ? (error as ApiError) : {}
);

export default function DataSourceManagementPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [logs, setLogs] = useState<DataSourceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'tags' | 'enabled' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 加载数据源列表
  const loadDataSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const sources = await dataSourceApi.getAll();
      // 确保sources是数组
      setDataSources(Array.isArray(sources) ? sources : []);
    } catch (error: unknown) {
      console.error('Load data sources error:', error);
      const err = normalizeError(error);
      const errorMessage = err.message || err.response?.data?.message || '加载数据源失败';
      setError(errorMessage);
      
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
        // API客户端会自动跳转，这里只显示错误消息
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(errorMessage);
      }
      setDataSources([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据源（首次使用）
  const handleInit = async () => {
    try {
      await dataSourceApi.init();
      message.success('数据源初始化成功');
      loadDataSources();
    } catch (error: unknown) {
      const err = normalizeError(error);
      message.error(err.message || '初始化失败');
    }
  };

  // 切换数据源启用状态
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await dataSourceApi.toggle(id, enabled);
      message.success(enabled ? '数据源已启用' : '数据源已禁用');
      loadDataSources();
    } catch (error: unknown) {
      const err = normalizeError(error);
      message.error(err.message || '操作失败');
    }
  };

  // 检查所有数据源健康状态
  const handleCheckAllHealth = async () => {
    setLoading(true);
    const hideLoading = message.loading('正在检查所有数据源的健康状态，这可能需要一些时间...', 0);
    
    try {
      const results = await dataSourceApi.checkAllHealth();
      hideLoading();
      
      // 统计检查结果
      const healthyCount = results.filter(r => r.result.status === 'healthy').length;
      const unhealthyCount = results.filter(r => r.result.status === 'unhealthy').length;
      const unknownCount = results.filter(r => r.result.status === 'unknown').length;
      
      if (unhealthyCount === 0 && unknownCount === 0) {
        message.success(`所有数据源健康检查完成：${healthyCount} 个数据源状态正常`);
      } else {
        message.warning(
          `健康检查完成：${healthyCount} 个正常，${unhealthyCount} 个异常，${unknownCount} 个未知`,
          5
        );
      }
      
      loadDataSources();
    } catch (error: unknown) {
      hideLoading();
      console.error('Check all health error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
        // API客户端会自动跳转，这里只显示错误消息
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(err.message || err.response?.data?.message || '健康检查失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 检查单个数据源健康状态
  const handleCheckHealth = async (id: string) => {
    const source = dataSources.find(s => s.id === id);
    const sourceName = source?.displayName || '数据源';
    
    // 显示加载提示（HuggingFace可能需要较长时间）
    const hideLoading = message.loading(`正在检查 ${sourceName} 的健康状态...`, 0);
    
    try {
      const result = await dataSourceApi.checkHealth(id);
      hideLoading();
      
      // 根据检查结果显示不同的消息
      if (result.status === 'healthy') {
        if (result.error) {
          // 有错误信息但状态是健康的（例如：超时但API可用）
          message.warning(`${sourceName} 健康检查完成：${result.error}`, 5);
        } else {
          message.success(`${sourceName} 健康检查完成：状态正常`);
        }
      } else if (result.status === 'unhealthy') {
        const errorMsg = result.error || '未知错误';
        message.error(`${sourceName} 健康检查失败：${errorMsg}`, 8);
        // 在控制台输出详细错误信息
        console.error(`[健康检查失败] ${sourceName}:`, {
          status: result.status,
          error: result.error,
          responseTime: result.responseTime,
          timestamp: result.timestamp,
        });
      } else {
        message.warning(`${sourceName} 健康状态未知`);
      }
      
      // 刷新数据源列表
      loadDataSources();
    } catch (error: unknown) {
      hideLoading();
      console.error('Check health error:', error);
      const err = normalizeError(error);
      if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行或网络连接失败');
      } else {
        message.error(err.message || '健康检查失败');
      }
    }
  };

  // 打开配置弹窗
  const handleOpenConfig = (source: DataSource) => {
    setSelectedSource(source);
    form.setFieldsValue({
      displayName: source.displayName,
      apiBaseUrl: source.apiBaseUrl,
      apiKey: source.apiKey || '',
      tags: source.tags || [],
      ...source.config,
    });
    setConfigModalVisible(true);
  };

  // 保存配置
  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();
      const { displayName, apiBaseUrl, apiKey, tags, ...config } = values;
      
      await dataSourceApi.update(selectedSource!.id, {
        displayName,
        apiBaseUrl,
        apiKey: apiKey || undefined,
        tags: tags || [],
        config,
      });
      
      message.success('配置保存成功');
      setConfigModalVisible(false);
      loadDataSources();
    } catch (error: unknown) {
      const err = normalizeError(error);
      if (err.errorFields) {
        return; // 表单验证错误
      }
      message.error(err.message || '保存失败');
    }
  };

  // 打开日志弹窗
  const handleOpenLogs = async (source: DataSource) => {
    setSelectedSource(source);
    setLogsModalVisible(true);
    setLogsLoading(true);
    try {
      const result = await dataSourceApi.getLogs(source.id);
      setLogs(result.logs);
    } catch (error: unknown) {
      const err = normalizeError(error);
      message.error(err.message || '加载日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  // 全量同步所有数据源
  const handleSyncAll = async () => {
    try {
      const hideLoading = message.loading('正在全量同步所有数据源，这可能需要较长时间，请耐心等待...', 0);
      
      try {
        await syncApi.syncAll();
        hideLoading();
        message.success('全量同步已启动，数据将在后台更新');
        loadDataSources();
      } catch (error: unknown) {
        hideLoading();
        const err = normalizeError(error);
        const errorMsg = err.response?.data?.message || err.message || '同步失败';
        message.error(`全量同步失败: ${errorMsg}`, 5);
      }
    } catch (error: unknown) {
      const err = normalizeError(error);
      message.error(err.message || '同步失败');
    }
  };

  // 同步数据源
  const handleSync = async (source: DataSource) => {
    try {
      let result;
      switch (source.name) {
        case 'arxiv':
          result = await syncApi.syncArxiv(source.config);
          break;
        case 'github':
          result = await syncApi.syncGithub(source.config);
          break;
        case 'huggingface':
          // HuggingFace同步可能需要较长时间，显示加载提示
          message.loading('HuggingFace同步可能需要较长时间，请耐心等待...', 0);
          try {
            result = await syncApi.syncHuggingFace(source.config);
            message.destroy(); // 清除加载提示
            
            // 检查同步结果，即使API返回200，也可能success=false
            if (result && !result.success) {
              const errorMsg = result.message || 'HuggingFace同步失败';
              message.error(errorMsg.replace(/\n/g, ' '), 8); // 显示8秒，将换行符替换为空格
              // 不抛出错误，因为已经返回了结果，只是success=false
              return;
            }
          } catch (error: unknown) {
            message.destroy(); // 清除加载提示
            // 显示详细的错误信息
            const err = normalizeError(error);
            const errorMsg = err.response?.data?.message || err.message || '同步失败';
            message.error(`HuggingFace同步失败: ${errorMsg.replace(/\n/g, ' ')}`, 8);
            throw error; // 重新抛出错误以便外层处理
          }
          break;
        case 'bilibili':
          result = await syncApi.syncBilibili(source.config);
          break;
        case 'youtube':
          result = await syncApi.syncYouTube(source.config);
          break;
        case 'hot_news':
          result = await syncApi.syncHotNews({
            platform: source.config?.platform || 'baidu',
            maxResults: source.config?.maxResults || 50,
          });
          break;
        case 'dailyhot_api':
          try {
            result = await syncApi.syncDailyHotApi({
              platform: source.config?.platform || 'baidu',
              maxResults: source.config?.maxResults || 50,
            });
          } catch (error: unknown) {
            // 显示详细的错误信息
            const err = normalizeError(error);
            const errorMsg = err.response?.data?.message || err.message || '同步失败';
            message.error(`DailyHotApi同步失败: ${errorMsg}`, 5);
            throw error; // 重新抛出以便外层处理
          }
          break;
        case '36kr':
          result = await syncApi.sync36kr({
            maxResults: source.config?.maxResults || 100,
            useApi: source.config?.useApi !== false,
          });
          break;
        case 'tech_news':
          result = await syncApi.syncTechNews({
            maxResults: source.config?.maxResults || 50,
            sources: source.config?.sources,
          });
          break;
        case 'semantic_scholar':
          result = await syncApi.syncSemanticScholar({
            query: source.config?.query || 'embodied AI OR robotics',
            maxResults: source.config?.maxResults || 100,
            year: source.config?.year,
            fieldsOfStudy: source.config?.fieldsOfStudy,
          });
          break;
        default:
          message.warning('不支持的数据源类型');
          return;
      }
      
      // 检查同步是否成功
      if (result.success) {
        message.success(`同步完成：成功 ${result.synced} 条，失败 ${result.errors} 条`);
      } else {
        // 显示详细的错误信息
        const errorMsg = (result as { message?: string }).message || `同步失败：成功 ${result.synced} 条，失败 ${result.errors} 条`;
        message.warning(errorMsg, 8); // 显示8秒，让用户有时间阅读
      }
      loadDataSources();
    } catch (error: unknown) {
      // 显示详细的错误信息
      const err = normalizeError(error);
      const errorMsg = err.response?.data?.message || err.message || '同步失败';
      message.error(`同步失败: ${errorMsg}`, 5);
      console.error('Sync error details:', error);
    }
  };


  // 获取健康状态标签
  const getHealthStatusTag = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Tag color="green" icon={<CheckCircleOutlined />}>健康</Tag>;
      case 'unhealthy':
        return <Tag color="red" icon={<CloseCircleOutlined />}>异常</Tag>;
      default:
        return <Tag color="default" icon={<ClockCircleOutlined />}>未知</Tag>;
    }
  };

  // 获取同步状态标签
  const getSyncStatusTag = (status?: string) => {
    switch (status) {
      case 'success':
        return <Tag color="green">成功</Tag>;
      case 'error':
        return <Tag color="red">失败</Tag>;
      case 'running':
        return <Tag color="blue">运行中</Tag>;
      default:
        return <Tag color="default">未同步</Tag>;
    }
  };

  // 排序数据源
  const getSortedDataSources = () => {
    if (sortField === 'none') {
      return dataSources;
    }

    const sorted = [...dataSources].sort((a, b) => {
      if (sortField === 'enabled') {
        const aValue = a.enabled ? 1 : 0;
        const bValue = b.enabled ? 1 : 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortField === 'tags') {
        const aTags = a.tags?.join(',') || '';
        const bTags = b.tags?.join(',') || '';
        if (sortOrder === 'asc') {
          return aTags.localeCompare(bTags);
        } else {
          return bTags.localeCompare(aTags);
        }
      }
      return 0;
    });

    return sorted;
  };

  useEffect(() => {
    loadDataSources();
  }, []);

  const columns = [
    {
      title: '数据源',
      key: 'name',
      render: (record: DataSource) => (
        <Space>
          <strong>{record.displayName}</strong>
          <Tag>{record.name}</Tag>
        </Space>
      ),
    },
    {
      title: '标签',
      key: 'tags',
      render: (record: DataSource) => (
        <Space>
          {record.tags && record.tags.length > 0 ? (
            record.tags.map((tag, index) => (
              <Tag key={index} color="blue">{tag}</Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>无标签</span>
          )}
        </Space>
      ),
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: DataSource) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
        />
      ),
    },
    {
      title: '健康状态',
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (status: string, record: DataSource) => {
        // 尝试从最新日志中获取错误信息
        const latestLog = record.logs && record.logs.length > 0 ? record.logs[0] : null;
        const errorMessage = latestLog?.errorMessage || record.healthError;
        
        return (
          <Space direction="vertical" size="small">
            <Space>
              {getHealthStatusTag(status)}
              <Button
                type="link"
                size="small"
                onClick={() => handleCheckHealth(record.id)}
              >
                检查
              </Button>
            </Space>
            {status === 'unhealthy' && errorMessage && (
              <div 
                style={{ 
                  fontSize: 12, 
                  color: '#ff4d4f', 
                  maxWidth: 400,
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                }}
                title={errorMessage}
              >
                {errorMessage.length > 60 ? `${errorMessage.substring(0, 60)}...` : errorMessage}
              </div>
            )}
          </Space>
        );
      },
    },
    {
      title: '最后同步',
      key: 'lastSync',
      render: (record: DataSource) => (
        <Space direction="vertical" size="small">
          <div>
            {record.lastSyncAt
              ? new Date(record.lastSyncAt).toLocaleString('zh-CN')
              : '从未同步'}
          </div>
          {record.lastSyncStatus && (
            <Space>
              {getSyncStatusTag(record.lastSyncStatus)}
              {record.lastSyncResult && 
               (record.lastSyncResult.synced !== undefined || record.lastSyncResult.errors !== undefined) &&
               ((record.lastSyncResult.synced ?? 0) > 0 || (record.lastSyncResult.errors ?? 0) > 0) && (
                <span style={{ fontSize: 12, color: '#666' }}>
                  成功: {record.lastSyncResult.synced ?? 0}, 失败: {record.lastSyncResult.errors ?? 0}
                </span>
              )}
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: DataSource) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleSync(record)}
            disabled={!record.enabled}
          >
            同步
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenConfig(record)}
          >
            配置
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenLogs(record)}
          >
            日志
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>第三方API管理</h1>
        <Space>
          <Space>
            <span>排序：</span>
            <Select
              value={sortField}
              onChange={(value) => {
                setSortField(value);
                if (value === 'none') {
                  setSortOrder('asc');
                }
              }}
              style={{ width: 120 }}
            >
              <Select.Option value="none">不排序</Select.Option>
              <Select.Option value="tags">按标签</Select.Option>
              <Select.Option value="enabled">按启用状态</Select.Option>
            </Select>
            {sortField !== 'none' && (
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                style={{ width: 100 }}
              >
                <Select.Option value="asc">升序</Select.Option>
                <Select.Option value="desc">降序</Select.Option>
              </Select>
            )}
          </Space>
          {dataSources.length === 0 && (
            <Button onClick={handleInit}>初始化数据源</Button>
          )}
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleSyncAll}
            loading={loading}
          >
            全量同步所有数据源
          </Button>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={handleCheckAllHealth}
            loading={loading}
          >
            检查所有健康状态
          </Button>
        </Space>
      </div>

      <Card>
        {error && !loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 16, color: '#ff4d4f', marginBottom: 16 }}>
              {error}
            </p>
            <Space>
              <Button onClick={loadDataSources}>重试</Button>
              {dataSources.length === 0 && (
                <Button type="primary" onClick={handleInit}>
                  初始化数据源
                </Button>
              )}
            </Space>
          </div>
        ) : dataSources.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
              暂无数据源，请先初始化数据源
            </p>
            <Button type="primary" onClick={handleInit}>
              初始化数据源
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={getSortedDataSources()}
            rowKey="id"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: '暂无数据源',
            }}
          />
        )}
      </Card>

      {/* 配置弹窗 */}
      <Modal
        title={`配置数据源: ${selectedSource?.displayName}`}
        open={configModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => setConfigModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
            tooltip="输入标签，用逗号分隔，例如：新闻,AI,机器人"
          >
            <Select
              mode="tags"
              placeholder="输入标签后按回车添加"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="API基础URL"
            name="apiBaseUrl"
            rules={[{ required: true, message: '请输入API基础URL' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="API密钥" name="apiKey">
            <Input.Password placeholder="留空则不修改" />
          </Form.Item>

          <Tabs>
            {selectedSource?.name === 'arxiv' && (
              <TabPane tab="arXiv配置" key="arxiv">
                <Form.Item label="搜索关键词" name="query">
                  <Input placeholder="例如: embodied AI OR robotics" />
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'github' && (
              <TabPane tab="GitHub配置" key="github">
                <Form.Item label="搜索关键词" name="query">
                  <Input placeholder="例如: embodied-ai OR robotics stars:>50" />
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'huggingface' && (
              <TabPane tab="HuggingFace配置" key="huggingface">
                <Form.Item label="任务类型" name="task">
                  <Input placeholder="例如: image-classification, robotics" />
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={500} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'bilibili' && (
              <TabPane tab="Bilibili配置" key="bilibili">
                <Form.Item label="搜索关键词" name="query">
                  <Input placeholder="例如: 机器人 OR 具身智能" />
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'youtube' && (
              <TabPane tab="YouTube配置" key="youtube">
                <Form.Item label="搜索关键词" name="query">
                  <Input placeholder="例如: embodied AI OR robotics" />
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'hot_news' && (
              <TabPane tab="热点新闻配置" key="hot_news">
                <Form.Item label="平台" name="platform">
                  <Input placeholder="例如: baidu, weibo, zhihu, bilibili, douban, juejin" />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    支持的平台：baidu, weibo, zhihu, bilibili, douban, juejin, sspai, tskr, ftpojie, hupu, tieba, douyin, vtex, jinritoutiao, stackoverflow, github, hackernews, sina_finance, eastmoney, xueqiu, cls, tenxunwang
                  </div>
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'dailyhot_api' && (
              <TabPane tab="DailyHotApi配置" key="dailyhot_api">
                <Form.Item label="平台" name="platform">
                  <Input placeholder="例如: baidu, weibo, zhihu, bilibili, acfun, douyin, kuaishou, tieba, sspai, ithome, jianshu, juejin, qq-news, sina, netease-news, 52pojie, hupu, coolapk, v2ex" />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    支持的平台：baidu, weibo, zhihu, bilibili, acfun, douyin, kuaishou, tieba, sspai, ithome, jianshu, juejin, qq-news, sina, netease-news, 52pojie, hupu, coolapk, v2ex, hellogithub, weatheralarm, earthquake, history等40+平台
                  </div>
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </TabPane>
            )}

            {selectedSource?.name === 'semantic_scholar' && (
              <TabPane tab="Semantic Scholar配置" key="semantic_scholar">
                <Form.Item label="搜索关键词" name="query">
                  <Input placeholder="例如: embodied AI OR robotics OR computer vision" />
                </Form.Item>
                <Form.Item label="最大结果数" name="maxResults">
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    注意：单次最多100篇，如需更多请使用分页
                  </div>
                </Form.Item>
                <Form.Item label="年份筛选" name="year">
                  <InputNumber min={1900} max={new Date().getFullYear()} style={{ width: '100%' }} placeholder="留空则不限制年份" />
                </Form.Item>
                <Form.Item label="研究领域" name="fieldsOfStudy">
                  <Select mode="tags" placeholder="例如: Computer Science, Robotics, Machine Learning">
                    <Select.Option value="Computer Science">Computer Science</Select.Option>
                    <Select.Option value="Robotics">Robotics</Select.Option>
                    <Select.Option value="Machine Learning">Machine Learning</Select.Option>
                    <Select.Option value="Artificial Intelligence">Artificial Intelligence</Select.Option>
                  </Select>
                </Form.Item>
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  <div>API限制：100请求/5分钟（免费）</div>
                  <div>如需更高限制，请申请API key并配置环境变量：SEMANTIC_SCHOLAR_API_KEY</div>
                </div>
              </TabPane>
            )}
          </Tabs>
        </Form>
      </Modal>

      {/* 日志弹窗 */}
      <Modal
        title={`调用日志: ${selectedSource?.displayName}`}
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        width={1000}
        footer={null}
      >
        <Table
          columns={[
            {
              title: '时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (time: string) => new Date(time).toLocaleString('zh-CN'),
            },
            {
              title: '类型',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => {
                const typeMap: Record<string, string> = {
                  sync: '同步',
                  health_check: '健康检查',
                  config_update: '配置更新',
                };
                return typeMap[type] || type;
              },
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const colorMap: Record<string, string> = {
                  success: 'green',
                  error: 'red',
                  warning: 'orange',
                };
                return <Tag color={colorMap[status]}>{status}</Tag>;
              },
            },
            {
              title: '请求URL',
              dataIndex: 'requestUrl',
              key: 'requestUrl',
              ellipsis: true,
            },
            {
              title: '耗时',
              dataIndex: 'duration',
              key: 'duration',
              render: (duration?: number) => duration ? `${duration}ms` : '-',
            },
            {
              title: '同步数量',
              key: 'syncCount',
              render: (record: DataSourceLog) => {
                if (record.syncedCount !== undefined || record.errorCount !== undefined) {
                  return (
                    <span>
                      {record.syncedCount !== undefined && `成功: ${record.syncedCount}`}
                      {record.errorCount !== undefined && ` 失败: ${record.errorCount}`}
                    </span>
                  );
                }
                return '-';
              },
            },
          ]}
          dataSource={logs}
          rowKey="id"
          loading={logsLoading}
          pagination={{ pageSize: 20 }}
        />
      </Modal>
    </div>
  );
}
