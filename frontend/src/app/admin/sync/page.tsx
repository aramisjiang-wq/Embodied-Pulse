/**
 * 管理端 - 数据同步页面
 */

'use client';

import { useState } from 'react';
import { Card, Button, Space, Spin, Progress, Tag, Divider, App } from 'antd';
import { 
  ReloadOutlined, 
  FileTextOutlined, 
  GithubOutlined, 
  RobotOutlined, 
  PlayCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { syncApi } from '@/lib/api/sync';

interface SyncResult {
  success: boolean;
  synced: number;
  errors: number;
  total?: number;
  message?: string;
}

export default function AdminSyncPage() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SyncResult>>({});
  const { message } = App.useApp();

  const handleSyncAll = async () => {
    setLoading(true);
    setSyncing('all');
    try {
      await syncApi.syncAll();
      message.success('全量数据同步任务已启动，请稍后查看结果');
      // 注意：这是异步任务，实际结果需要查看日志或稍后刷新
    } catch (error: any) {
      console.error('Sync all error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '同步失败');
      }
    } finally {
      setLoading(false);
      setSyncing(null);
    }
  };

  const handleSync = async (type: string, endpoint: string, params?: any) => {
    setSyncing(type);
    try {
      let result: SyncResult | undefined;
      
      switch (endpoint) {
        case 'arxiv':
          result = await syncApi.syncArxiv(params);
          break;
        case 'github':
          result = await syncApi.syncGithub(params);
          break;
        case 'huggingface':
          result = await syncApi.syncHuggingFace(params);
          // 检查同步结果，即使API返回200，也可能success=false
          if (result && !result.success) {
            const errorMsg = result.message || 'HuggingFace同步失败';
            message.error(errorMsg.replace(/\n/g, ' '), 8); // 显示8秒，将换行符替换为空格
            // 不继续处理，因为同步失败
            setSyncing(null);
            return;
          }
          break;
        case 'huggingface-papers':
          result = await syncApi.syncHuggingFace(params);
          break;
        case 'bilibili':
          result = await syncApi.syncBilibili(params);
          break;
        case 'youtube':
          result = await syncApi.syncYouTube(params);
          break;
        case 'embodied-ai':
          await syncApi.syncEmbodiedAI();
          message.success(`${getTypeName(type)}同步任务已启动`);
          setSyncing(null);
          return;
        default:
          throw new Error('未知的同步类型');
      }

      if (result) {
        setResults(prev => ({
          ...prev,
          [type]: result!
        }));
        message.success(`${getTypeName(type)}同步完成：成功 ${result.synced} 条，失败 ${result.errors} 条`);
      } else {
        message.success(`${getTypeName(type)}同步任务已启动`);
      }
    } catch (error: any) {
      console.error(`Sync ${type} error:`, error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '同步失败');
      }
      setResults(prev => ({
        ...prev,
        [type]: { success: false, synced: 0, errors: 1 }
      }));
    } finally {
      setSyncing(null);
    }
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      arxiv: 'arXiv论文',
      github: 'GitHub项目',
      huggingface: 'HuggingFace模型',
      bilibili: 'Bilibili视频',
      youtube: 'YouTube视频',
      jobs: '招聘岗位',
      embodied: '具身智能数据',
    };
    return names[type] || type;
  };

  const syncCards = [
    {
      key: 'arxiv',
      title: 'arXiv论文',
      icon: <FileTextOutlined />,
      description: '同步arXiv上的具身智能相关论文',
      endpoint: 'arxiv',
      params: { query: 'embodied AI OR robotics OR computer vision', maxResults: 100 },
      color: '#1890ff',
    },
    {
      key: 'github',
      title: 'GitHub项目',
      icon: <GithubOutlined />,
      description: '同步GitHub上的机器人、具身智能相关项目',
      endpoint: 'github',
      params: { query: 'embodied-ai OR robotics OR computer-vision stars:>50', maxResults: 100 },
      color: '#722ed1',
    },
    {
      key: 'huggingface',
      title: 'HuggingFace模型',
      icon: <RobotOutlined />,
      description: '同步HuggingFace上的视觉、多模态模型',
      endpoint: 'huggingface',
      params: { task: 'image-classification', maxResults: 100 },
      color: '#13c2c2',
    },
    {
      key: 'bilibili',
      title: 'Bilibili视频',
      icon: <PlayCircleOutlined />,
      description: '同步B站上的机器人、具身智能相关视频',
      endpoint: 'bilibili',
      params: { query: '机器人 OR 具身智能', maxResults: 50 },
      color: '#f5222d',
    },
    {
      key: 'youtube',
      title: 'YouTube视频',
      icon: <PlayCircleOutlined />,
      description: '同步YouTube上的embodied AI相关视频',
      endpoint: 'youtube',
      params: { query: 'embodied AI OR robotics', maxResults: 50 },
      color: '#ff4d4f',
    },
    {
      key: 'embodied',
      title: '具身智能核心数据',
      icon: <ThunderboltOutlined />,
      description: '同步所有具身智能相关的核心数据',
      endpoint: 'embodied-ai',
      color: '#fa8c16',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>数据同步</h1>
        <Button 
          type="primary" 
          size="large"
          icon={<ReloadOutlined />}
          onClick={handleSyncAll}
          loading={syncing === 'all'}
        >
          全量同步所有数据
        </Button>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <p style={{ margin: 0, color: '#666' }}>
          <strong>说明：</strong>
          数据同步会从第三方API抓取最新数据并存储到数据库。
          全量同步可能需要较长时间，建议在非高峰时段执行。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {syncCards.map((card) => {
          const result = results[card.key];
          const isSyncing = syncing === card.key;

          return (
            <Card
              key={card.key}
              title={
                <Space>
                  <span style={{ color: card.color }}>{card.icon}</span>
                  <span>{card.title}</span>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleSync(card.key, card.endpoint, card.params)}
                  loading={isSyncing}
                >
                  同步
                </Button>
              }
              style={{ minHeight: 200 }}
            >
              <p style={{ color: '#666', marginBottom: 16 }}>{card.description}</p>
              
              {result && (
                <div style={{ marginTop: 16 }}>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>同步状态：</span>
                      <Tag color={result.success ? 'success' : 'error'}>
                        {result.success ? '成功' : '失败'}
                      </Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>成功数量：</span>
                      <strong style={{ color: '#52c41a' }}>{result.synced}</strong>
                    </div>
                    {result.errors > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>失败数量：</span>
                        <strong style={{ color: '#ff4d4f' }}>{result.errors}</strong>
                      </div>
                    )}
                    {result.total !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>总计：</span>
                        <strong>{result.total}</strong>
                      </div>
                    )}
                  </Space>
                </div>
              )}

              {isSyncing && (
                <div style={{ marginTop: 16 }}>
                  <Spin size="small" />
                  <span style={{ marginLeft: 8, color: '#666' }}>同步中...</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
