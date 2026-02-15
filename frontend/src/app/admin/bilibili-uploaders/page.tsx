/**
 * Bilibili UP主管理页面
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Space,
  Tag,
  Popconfirm,
  Switch,
  Card,
  Dropdown,
  MenuProps,
  Checkbox,
  Row,
  Col,
  Statistic,
  Badge,
  Progress as AntProgress,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  LinkOutlined,
  EditOutlined,
  TagOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckSquareOutlined,
  MoreOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { bilibiliUploaderApi, BilibiliUploader } from '@/lib/api/bilibili-uploader';
import dayjs from 'dayjs';
import { App, Progress } from 'antd';

export default function BilibiliUploadersPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [uploaders, setUploaders] = useState<BilibiliUploader[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>('');
  const [editTagsModalVisible, setEditTagsModalVisible] = useState(false);
  const [editingUploader, setEditingUploader] = useState<BilibiliUploader | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [editInfoModalVisible, setEditInfoModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editInfoForm] = Form.useForm();
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncPolling, setSyncPolling] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchSyncModalVisible, setBatchSyncModalVisible] = useState(false);
  const [batchSyncProgress, setBatchSyncProgress] = useState<any>(null);

  useEffect(() => {
    loadUploaders();
  }, [page, pageSize, tagFilter]);

  useEffect(() => {
    loadSchedulerStatus();
  }, []);

  const loadSchedulerStatus = async () => {
    try {
      const status = await bilibiliUploaderApi.getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (error: any) {
      console.error('获取定时任务状态失败:', error);
    }
  };

  const handleStartScheduler = async () => {
    try {
      const status = await bilibiliUploaderApi.startScheduler();
      setSchedulerStatus(status);
      message.success('定时同步任务已启动');
      // 重新加载状态
      await loadSchedulerStatus();
    } catch (error: any) {
      message.error(error.message || '启动定时任务失败');
      // 重新加载状态以获取最新状态
      await loadSchedulerStatus();
    }
  };

  const handleStopScheduler = async () => {
    try {
      await bilibiliUploaderApi.stopScheduler();
      message.success('定时同步任务已停止');
      // 重新加载状态
      await loadSchedulerStatus();
    } catch (error: any) {
      message.error(error.message || '停止定时任务失败');
      // 重新加载状态以获取最新状态
      await loadSchedulerStatus();
    }
  };

  const loadUploaders = async () => {
    setLoading(true);
    try {
      const data = await bilibiliUploaderApi.getUploaders({
        page,
        size: pageSize,
        isActive: undefined,
      });
      let filteredItems = Array.isArray(data.items) ? data.items : [];
      
      if (tagFilter) {
        filteredItems = filteredItems.filter(uploader => {
          const tags = uploader.tags || [];
          return tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));
        });
      }
      
      setUploaders(filteredItems);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Load uploaders error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
        // 如果是管理端页面，跳转到登录页
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 1500);
        }
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(error.message || error.response?.data?.message || '加载失败');
      }
      setUploaders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values: { url: string }) => {
    try {
      const result = await bilibiliUploaderApi.addUploader(values.url);
      // 检查是否是使用默认信息创建的
      if (result.name?.startsWith('UP主-')) {
        message.warning({
          content: 'UP主已添加，但由于Bilibili API限制，使用了默认信息。请稍后手动更新名称和头像。',
          duration: 5,
        });
      } else {
        message.success('添加成功');
      }
      setAddModalVisible(false);
      form.resetFields();
      loadUploaders();
    } catch (error: any) {
      console.error('添加UP主失败:', error);
      // 显示详细的错误信息
      const errorMessage = error.message || error.response?.data?.message || '添加失败';
      // 如果是API限制错误，提供更友好的提示
      if (errorMessage.includes('Bilibili API返回-401') || errorMessage.includes('Bilibili API返回-799')) {
        message.error({
          content: 'Bilibili API暂时不可用，但UP主已使用默认信息创建。您可以稍后手动更新名称和头像。',
          duration: 5,
        });
        // 即使API失败，也刷新列表（因为可能已经创建了默认UP主）
        setTimeout(() => loadUploaders(), 1000);
      } else {
        message.error(errorMessage);
      }
    }
  };

  const handleSync = async (mid: string) => {
    try {
      message.loading({ content: '同步中...', key: 'sync' });
      const result = await bilibiliUploaderApi.syncUploader(mid, 100);
      message.success({
        content: `同步完成：成功 ${result.synced} 个，失败 ${result.errors} 个`,
        key: 'sync',
      });
      loadUploaders();
    } catch (error: any) {
      message.error({ content: error.message || '同步失败', key: 'sync' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bilibiliUploaderApi.deleteUploader(id);
      message.success('删除成功');
      loadUploaders();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await bilibiliUploaderApi.toggleUploaderStatus(id);
      message.success('状态已更新');
      loadUploaders();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const handleEditTags = (uploader: BilibiliUploader) => {
    setEditingUploader(uploader);
    setTagInput(Array.isArray(uploader.tags) ? uploader.tags.join(',') : '');
    setEditTagsModalVisible(true);
  };

  const handleSaveTags = async () => {
    if (!editingUploader) return;
    
    try {
      const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
      await bilibiliUploaderApi.updateTags(editingUploader.id, tags);
      message.success('标签更新成功');
      setEditTagsModalVisible(false);
      setEditingUploader(null);
      setTagInput('');
      loadUploaders();
    } catch (error: any) {
      message.error(error.message || '更新标签失败');
    }
  };

  const handleRefreshInfo = async (id: string) => {
    try {
      message.loading({ content: '刷新UP主信息中...', key: 'refresh' });
      await bilibiliUploaderApi.refreshInfo(id);
      message.success({ content: 'UP主信息刷新成功', key: 'refresh' });
      loadUploaders();
    } catch (error: any) {
      message.error({ 
        content: error.message || '刷新失败，请稍后重试',
        key: 'refresh',
        duration: 5,
      });
    }
  };

  const handleEditInfo = (uploader: BilibiliUploader) => {
    setEditingUploader(uploader);
    editInfoForm.setFieldsValue({
      name: uploader.name,
      avatar: uploader.avatar,
      description: uploader.description,
    });
    setEditInfoModalVisible(true);
  };

  const handleSaveInfo = async () => {
    if (!editingUploader) return;
    
    try {
      const values = await editInfoForm.validateFields();
      await bilibiliUploaderApi.updateInfo(editingUploader.id, values);
      message.success('UP主信息更新成功');
      setEditInfoModalVisible(false);
      setEditingUploader(null);
      editInfoForm.resetFields();
      loadUploaders();
    } catch (error: any) {
      message.error(error.message || '更新UP主信息失败');
    }
  };

  const handleSyncAll = async (maxResults: number = 100, smart: boolean = true) => {
    try {
      setSyncModalVisible(true);
      setSyncPolling(true);
      
      // 启动同步任务（异步执行）
      await bilibiliUploaderApi.syncAll(maxResults, smart);
      
      message.info({
        content: '同步任务已启动，正在后台执行...',
        duration: 3,
      });
      
      // 立即获取初始状态
      try {
        const status = await bilibiliUploaderApi.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('获取初始同步状态失败:', error);
      }
    } catch (error: any) {
      message.error(error.message || '启动同步任务失败');
      setSyncPolling(false);
      setSyncModalVisible(false);
    }
  };

  const handleCancelSync = async () => {
    try {
      await bilibiliUploaderApi.cancelSync();
      message.info('同步任务已取消');
    } catch (error: any) {
      message.error(error.message || '取消同步失败');
    }
  };

  const handleBatchSync = async (maxResults: number = 100) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要同步的UP主');
      return;
    }

    try {
      setBatchSyncModalVisible(true);
      setBatchSyncProgress({ current: 0, total: selectedRowKeys.length, results: [] });

      const results: any[] = [];
      for (let i = 0; i < selectedRowKeys.length; i++) {
        const uploader = uploaders.find(u => u.id === selectedRowKeys[i]);
        if (!uploader) continue;

        try {
          const result = await bilibiliUploaderApi.syncUploader(uploader.mid, maxResults);
          results.push({
            mid: uploader.mid,
            name: uploader.name,
            status: 'success',
            synced: result.synced,
            errors: result.errors,
          });
        } catch (error: any) {
          results.push({
            mid: uploader.mid,
            name: uploader.name,
            status: 'error',
            error: error.message,
          });
        }

        setBatchSyncProgress({ current: i + 1, total: selectedRowKeys.length, results });
      }

      message.success(`批量同步完成：成功 ${results.filter(r => r.status === 'success').length} 个，失败 ${results.filter(r => r.status === 'error').length} 个`);
      loadUploaders();
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(error.message || '批量同步失败');
    } finally {
      setTimeout(() => {
        setBatchSyncModalVisible(false);
        setBatchSyncProgress(null);
      }, 3000);
    }
  };

  const handleBatchToggleStatus = async (isActive: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的UP主');
      return;
    }

    try {
      for (const id of selectedRowKeys) {
        await bilibiliUploaderApi.toggleUploaderStatus(id as string);
      }
      message.success(`批量${isActive ? '启用' : '禁用'}成功`);
      loadUploaders();
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(error.message || '批量操作失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的UP主');
      return;
    }

    Modal.confirm({
      title: `确认删除选中的 ${selectedRowKeys.length} 个UP主?`,
      content: '删除后，这些UP主的所有视频数据将不再更新',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          for (const id of selectedRowKeys) {
            await bilibiliUploaderApi.deleteUploader(id as string);
          }
          message.success('批量删除成功');
          loadUploaders();
          setSelectedRowKeys([]);
        } catch (error: any) {
          message.error(error.message || '批量删除失败');
        }
      },
    });
  };

  const getBatchMenuItems: MenuProps['items'] = [
    {
      key: 'sync',
      label: '批量同步',
      icon: <SyncOutlined />,
      onClick: () => handleBatchSync(100),
    },
    {
      key: 'enable',
      label: '批量启用',
      icon: <CheckSquareOutlined />,
      onClick: () => handleBatchToggleStatus(true),
    },
    {
      key: 'disable',
      label: '批量禁用',
      icon: <StopOutlined />,
      onClick: () => handleBatchToggleStatus(false),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleBatchDelete,
    },
  ];

  useEffect(() => {
    if (syncPolling && syncModalVisible) {
      const interval = setInterval(async () => {
        try {
          const status = await bilibiliUploaderApi.getSyncStatus();
          setSyncStatus(status);
          
          if (!status.isRunning) {
            setSyncPolling(false);
            clearInterval(interval);
            loadUploaders();
          }
        } catch (error) {
          console.error('获取同步状态失败:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [syncPolling, syncModalVisible]);

  const columns = [
    {
      title: 'UP主信息',
      key: 'uploader',
      render: (_: any, record: BilibiliUploader) => (
        <Space direction="vertical" size={0}>
          <Space>
            {record.avatar ? (
              <img
                src={record.avatar}
                alt={record.name}
                style={{ width: 40, height: 40, borderRadius: '50%' }}
                referrerPolicy="no-referrer"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name || 'U')}&background=1890ff&color=fff&size=40`;
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {record.name?.charAt(0) || 'U'}
              </div>
            )}
            <Space direction="vertical" size={0}>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 500,
                color: record.name?.startsWith('UP主-') ? '#ff4d4f' : undefined 
              }}>
                {record.name}
                {record.name?.startsWith('UP主-') && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    需更新
                  </Tag>
                )}
              </span>
              <span style={{ fontSize: 12, color: '#999' }}>
                MID: {record.mid}
              </span>
            </Space>
          </Space>
          {record.description && (
            <div style={{ 
              fontSize: 12, 
              color: '#666',
              maxWidth: 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 4
            }}>
              {record.description}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Bilibili空间',
      dataIndex: 'mid',
      key: 'mid',
      render: (mid: string) => (
        <a
          href={`https://space.bilibili.com/${mid}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1890ff' }}
        >
          <LinkOutlined style={{ marginRight: 4 }} />
          访问主页
        </a>
      ),
    },
    {
      title: '视频统计',
      key: 'stats',
      render: (_: any, record: BilibiliUploader) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {record.videoCount} 个视频
          </span>
          <span style={{ fontSize: 12, color: '#999' }}>
            已同步
          </span>
        </Space>
      ),
    },
    {
      title: '标签',
      key: 'tags',
      width: 200,
      render: (_: any, record: BilibiliUploader) => (
        <Space wrap>
          {record.tags && record.tags.length > 0 ? (
            record.tags.map((tag, index) => (
              <Tag key={index} color="blue">
                {tag}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#999', fontSize: 12 }}>暂无标签</span>
          )}
        </Space>
      ),
    },
    {
      title: '同步状态',
      key: 'syncStatus',
      render: (_: any, record: BilibiliUploader) => (
        <Space direction="vertical" size={0}>
          <Switch
            checked={record.isActive}
            onChange={() => handleToggleStatus(record.id)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
          <span style={{ fontSize: 12, color: '#999' }}>
            {record.lastSyncAt 
              ? `同步于 ${dayjs(record.lastSyncAt).format('MM-DD HH:mm')}`
              : '从未同步'
            }
          </span>
        </Space>
      ),
    },
    {
      title: '时间信息',
      key: 'timeInfo',
      render: (_: any, record: BilibiliUploader) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12, color: '#666' }}>
            创建: {dayjs(record.createdAt).format('YYYY-MM-DD')}
          </span>
          <span style={{ fontSize: 12, color: '#666' }}>
            更新: {dayjs(record.updatedAt).format('YYYY-MM-DD')}
          </span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_: any, record: BilibiliUploader) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTags(record)}
          >
            标签
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditInfo(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRefreshInfo(record.id)}
          >
            刷新
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleSync(record.mid)}
          >
            同步
          </Button>
          <Popconfirm
            title="确定删除此UP主吗？"
            description="删除后，该UP主的所有视频数据将不再更新"
            onConfirm={() => handleDelete(record.id)}
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
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Bilibili UP主管理</h2>
          <Space>
            {schedulerStatus?.isRunning ? (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleStopScheduler}
                loading={loading}
              >
                停止定时同步
              </Button>
            ) : (
              <Button
                type="default"
                icon={<PlayCircleOutlined />}
                onClick={handleStartScheduler}
                loading={loading}
              >
                启动定时同步
              </Button>
            )}
            {schedulerStatus?.nextRun && (
              <span style={{ fontSize: 12, color: '#999' }}>
                下次运行: {dayjs(schedulerStatus.nextRun).format('MM-DD HH:mm')}
              </span>
            )}
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleSyncAll(999999, true)}
              loading={syncPolling}
              disabled={syncPolling}
            >
              智能全量同步
            </Button>
            <Input
              placeholder="按标签筛选"
              prefix={<TagOutlined />}
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              添加UP主
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="总UP主数"
                value={total}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="启用中"
                value={uploaders.filter(u => u.isActive).length}
                prefix={<CheckSquareOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="总视频数"
                value={uploaders.reduce((sum, u) => sum + (u.videoCount || 0), 0)}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="已同步"
                value={uploaders.filter(u => u.lastSyncAt).length}
                prefix={<SyncOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Space>
              <Badge count={selectedRowKeys.length} offset={[10, 0]}>
                <Button>已选择</Button>
              </Badge>
              <Dropdown menu={{ items: getBatchMenuItems }}>
                <Button icon={<MoreOutlined />}>
                  批量操作
                </Button>
              </Dropdown>
              <Button onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </Card>
        )}

        <Table
          columns={columns}
          dataSource={uploaders}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize) setPageSize(newPageSize);
            },
          }}
        />
      </Card>

      <Modal
        title="添加UP主"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item
            name="url"
            label="UP主链接或MID"
            rules={[{ required: true, message: '请输入UP主链接或MID' }]}
            extra={
              <div>
                <div>支持格式：</div>
                <div>• https://space.bilibili.com/123456</div>
                <div>• 直接输入MID：123456</div>
                <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
                  ⚠️ 注意：如果Bilibili API不可用，系统会使用默认信息创建UP主，您可以稍后手动更新名称和头像。
                </div>
              </div>
            }
          >
            <Input
              placeholder="https://space.bilibili.com/123456 或 123456"
              prefix={<LinkOutlined />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑标签"
        open={editTagsModalVisible}
        onCancel={() => {
          setEditTagsModalVisible(false);
          setEditingUploader(null);
          setTagInput('');
        }}
        onOk={handleSaveTags}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>UP主：</strong> {editingUploader?.name}
          </div>
          <Form.Item
            label="标签"
            extra="多个标签用逗号分隔，例如：AI, 机器人, 具身智能"
          >
            <Input.TextArea
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="输入标签，用逗号分隔"
              rows={4}
            />
          </Form.Item>
        </div>
      </Modal>

      <Modal
        title="编辑UP主信息"
        open={editInfoModalVisible}
        onCancel={() => {
          setEditInfoModalVisible(false);
          setEditingUploader(null);
          editInfoForm.resetFields();
        }}
        onOk={handleSaveInfo}
        width={600}
      >
        <Form form={editInfoForm} layout="vertical">
          <Form.Item
            name="name"
            label="UP主名称"
            rules={[{ required: true, message: '请输入UP主名称' }]}
          >
            <Input placeholder="输入UP主名称" />
          </Form.Item>
          <Form.Item
            name="avatar"
            label="头像URL"
          >
            <Input placeholder="输入头像URL" />
          </Form.Item>
          <Form.Item
            name="description"
            label="简介"
          >
            <Input.TextArea
              placeholder="输入UP主简介"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="一键同步进度"
        open={syncModalVisible}
        onCancel={() => {
          setSyncModalVisible(false);
          setSyncStatus(null);
        }}
        footer={[
          <Button
            key="cancel"
            icon={<StopOutlined />}
            onClick={handleCancelSync}
            disabled={!syncStatus?.isRunning}
          >
            取消同步
          </Button>,
        ]}
        width={800}
      >
        {syncStatus && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space size="large">
                <div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>总进度</div>
                  <Progress
                    type="circle"
                    percent={Math.round((syncStatus.completedTasks / syncStatus.totalTasks) * 100)}
                    format={() => `${syncStatus.completedTasks}/${syncStatus.totalTasks}`}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>同步统计</div>
                  <div style={{ fontSize: 14 }}>
                    <div>成功: <span style={{ color: '#52c41a' }}>{syncStatus.totalSynced}</span> 个</div>
                    <div>失败: <span style={{ color: '#ff4d4f' }}>{syncStatus.totalErrors}</span> 个</div>
                  </div>
                </div>
              </Space>
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>UP主同步详情</div>
              {syncStatus.tasks.map((task: any, index: number) => (
                <div
                  key={task.mid}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    backgroundColor: task.status === 'running' ? '#f6ffed' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Space>
                      <span style={{ fontWeight: 500 }}>{task.name}</span>
                      <span style={{ fontSize: 12, color: '#999' }}>MID: {task.mid}</span>
                    </Space>
                    <Tag
                      color={
                        task.status === 'completed' ? 'success' :
                        task.status === 'failed' ? 'error' :
                        task.status === 'running' ? 'processing' : 'default'
                      }
                    >
                      {
                        task.status === 'completed' ? '已完成' :
                        task.status === 'failed' ? '失败' :
                        task.status === 'running' ? '同步中' : '等待中'
                      }
                    </Tag>
                  </div>
                  {task.status === 'running' && (
                    <Progress percent={50} size="small" status="active" />
                  )}
                  {task.status === 'completed' && (
                    <div style={{ fontSize: 12, color: '#52c41a' }}>
                      成功 {task.synced} 个视频
                    </div>
                  )}
                  {task.status === 'failed' && (
                    <div style={{ fontSize: 12, color: '#ff4d4f' }}>
                      {task.error || '同步失败'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 批量同步进度弹窗 */}
      <Modal
        title="批量同步进度"
        open={batchSyncModalVisible}
        onCancel={() => {
          setBatchSyncModalVisible(false);
          setBatchSyncProgress(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setBatchSyncModalVisible(false);
            setBatchSyncProgress(null);
          }}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {batchSyncProgress && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <AntProgress
                percent={Math.round((batchSyncProgress.current / batchSyncProgress.total) * 100)}
                status="active"
                format={() => `${batchSyncProgress.current}/${batchSyncProgress.total}`}
              />
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {batchSyncProgress.results.map((result: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    backgroundColor: result.status === 'success' ? '#f6ffed' : '#fff1f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Space>
                      <span style={{ fontWeight: 500 }}>{result.name}</span>
                      <span style={{ fontSize: 12, color: '#999' }}>MID: {result.mid}</span>
                    </Space>
                    <Tag color={result.status === 'success' ? 'success' : 'error'}>
                      {result.status === 'success' ? '成功' : '失败'}
                    </Tag>
                  </div>
                  {result.status === 'success' && (
                    <div style={{ fontSize: 12, color: '#52c41a' }}>
                      成功同步 {result.synced} 个视频
                      {result.errors > 0 && `，失败 ${result.errors} 个`}
                    </div>
                  )}
                  {result.status === 'error' && (
                    <div style={{ fontSize: 12, color: '#ff4d4f' }}>
                      {result.error || '同步失败'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
