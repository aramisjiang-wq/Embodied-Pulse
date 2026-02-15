/**
 * 管理端 - 注册用户管理页面
 * 管理所有注册用户
 */

'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Tag, Modal, Select, Input as AntInput, App, Switch, Drawer, Row, Col, Card, Badge, Dropdown, MenuProps, Checkbox, Descriptions, Avatar, Statistic, Progress, DatePicker, Form, Rate, Spin } from 'antd';
import { 
  SearchOutlined, 
  GithubOutlined, 
  MailOutlined, 
  EditOutlined, 
  PlusOutlined, 
  CloseOutlined, 
  FileTextOutlined,
  UserOutlined,
  MoreOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  StarOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [registerType, setRegisterType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [vipModalVisible, setVipModalVisible] = useState(false);
  const [vipEditingUser, setVipEditingUser] = useState<any>(null);
  const [vipSwitchChecked, setVipSwitchChecked] = useState(false);
  const [actionLogsDrawerOpen, setActionLogsDrawerOpen] = useState(false);
  const [actionLogsUser, setActionLogsUser] = useState<any>(null);
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [actionLogsLoading, setActionLogsLoading] = useState(false);
  const [actionLogsTotal, setActionLogsTotal] = useState(0);
  const [actionLogsPage, setActionLogsPage] = useState(1);
  
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [userProfileVisible, setUserProfileVisible] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterIsVip, setFilterIsVip] = useState<string>('');
  const [filterPointsMin, setFilterPointsMin] = useState<number | undefined>();
  const [filterPointsMax, setFilterPointsMax] = useState<number | undefined>();
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    vip: 0,
    github: 0,
    email: 0,
    today: 0,
    week: 0,
    month: 0,
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, keyword, registerType, status, filterLevel, filterIsVip, filterPointsMin, filterPointsMax, filterDateStart, filterDateEnd, filterTags]);

  const loadStats = async () => {
    try {
      const response: any = await apiClient.get('/admin/users/stats');
      if (response.code === 0) {
        setStats(response.data || stats);
      }
    } catch (error: any) {
      console.error('Load stats error:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.get('/admin/users', {
        params: { 
          page, 
          size: 20, 
          keyword: keyword || undefined,
          registerType: registerType || undefined,
          status: status || undefined,
          level: filterLevel || undefined,
          isVip: filterIsVip || undefined,
          pointsMin: filterPointsMin || undefined,
          pointsMax: filterPointsMax || undefined,
          dateStart: filterDateStart || undefined,
          dateEnd: filterDateEnd || undefined,
          tags: filterTags.length > 0 ? filterTags.join(',') : undefined,
        },
      });
      if (response.code === 0) {
        setUsers(Array.isArray(response.data.items) ? response.data.items : []);
        setTotal(response.data.pagination?.total || 0);
      } else {
        message.error(response.message || '加载失败');
        setUsers([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Load users error:', error);
      // 401错误已经在client.ts中处理跳转，这里只显示错误消息
      if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.response?.data?.code === 1002 || error.response?.data?.code === 1003) {
        message.error('未登录或登录已过期，请重新登录');
        // 如果是管理端页面，跳转到登录页
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 1500);
        }
      } else if (error.status === 500) {
        message.error('服务器错误，请稍后重试');
      } else {
        message.error(error.message || '加载失败');
      }
      // 设置空数据，避免页面崩溃
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: string, action: 'ban' | 'unban') => {
    Modal.confirm({
      title: `确认${action === 'ban' ? '禁用' : '解禁'}该用户?`,
      onOk: async () => {
        try {
          await apiClient.post(`/admin/users/${userId}/ban`, { action });
          message.success(`${action === 'ban' ? '禁用' : '解禁'}成功`);
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '操作失败');
        }
      },
    });
  };

  const handleBatchBan = async (action: 'ban' | 'unban') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择用户');
      return;
    }
    
    Modal.confirm({
      title: `确认批量${action === 'ban' ? '禁用' : '解禁'}选中的 ${selectedRowKeys.length} 个用户?`,
      onOk: async () => {
        try {
          await apiClient.post('/admin/users/batch-ban', { 
            userIds: selectedRowKeys,
            action 
          });
          message.success(`批量${action === 'ban' ? '禁用' : '解禁'}成功`);
          setSelectedRowKeys([]);
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '操作失败');
        }
      },
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择用户');
      return;
    }
    
    Modal.confirm({
      title: `确认删除选中的 ${selectedRowKeys.length} 个用户?`,
      content: '此操作不可恢复，请谨慎操作',
      okText: '确认删除',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiClient.delete('/admin/users/batch', { 
            data: { userIds: selectedRowKeys }
          });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          loadUsers();
        } catch (error: any) {
          message.error(error.message || '操作失败');
        }
      },
    });
  };

  const handleBatchSetVip = async (isVip: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择用户');
      return;
    }
    
    try {
      await apiClient.post('/admin/users/batch-vip', { 
        userIds: selectedRowKeys,
        isVip 
      });
      message.success(`批量设置${isVip ? 'VIP' : '普通用户'}成功`);
      setSelectedRowKeys([]);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleViewProfile = async (user: any) => {
    setProfileUser(user);
    setUserProfileVisible(true);
    setProfileLoading(true);
    
    try {
      const response: any = await apiClient.get(`/admin/users/${user.id}/profile`);
      if (response.code === 0) {
        setProfileUser({ ...user, ...response.data });
      }
    } catch (error: any) {
      console.error('Load profile error:', error);
      message.error(error.message || '加载用户画像失败');
    } finally {
      setProfileLoading(false);
    }
  };

  const getBatchMenuItems: MenuProps['items'] = [
    {
      key: 'ban',
      label: '批量禁用',
      icon: <StopOutlined />,
      onClick: () => handleBatchBan('ban'),
    },
    {
      key: 'unban',
      label: '批量解禁',
      icon: <CheckCircleOutlined />,
      onClick: () => handleBatchBan('unban'),
    },
    {
      type: 'divider',
    },
    {
      key: 'setVip',
      label: '批量设置VIP',
      icon: <CheckCircleOutlined />,
      onClick: () => handleBatchSetVip(true),
    },
    {
      key: 'unsetVip',
      label: '批量取消VIP',
      icon: <StopOutlined />,
      onClick: () => handleBatchSetVip(false),
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

  // 编辑标签（多标签独立管理）
  const handleEditTags = (user: any) => {
    setEditingUser(user);
    const userTags = Array.isArray(user.tags) ? user.tags : [];
    setTags(userTags);
    setNewTagInput('');
    setTagsDrawerOpen(true);
  };

  // 添加标签
  const handleAddTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 保存标签
  const handleSaveTags = async () => {
    if (!editingUser) return;
    
    try {
      await apiClient.put(`/admin/users/${editingUser.id}/tags`, { tags });
      message.success('标签更新成功');
      setTagsDrawerOpen(false);
      setEditingUser(null);
      setTags([]);
      setNewTagInput('');
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '标签更新失败');
    }
  };

  // 编辑VIP状态
  const handleEditVip = (user: any) => {
    setVipEditingUser(user);
    setVipSwitchChecked(user.isVip || false); // 初始化Switch状态为当前VIP状态
    setVipModalVisible(true);
  };

  // 保存VIP状态
  const handleSaveVip = async () => {
    if (!vipEditingUser) return;
    
    try {
      await apiClient.put(`/admin/users/${vipEditingUser.id}/vip`, { 
        isVip: vipSwitchChecked 
      });
      message.success('VIP状态更新成功');
      setVipModalVisible(false);
      setVipEditingUser(null);
      setVipSwitchChecked(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || 'VIP状态更新失败');
    }
  };

  // 查看用户行为日志
  const handleViewActionLogs = async (user: any) => {
    setActionLogsUser(user);
    setActionLogsDrawerOpen(true);
    setActionLogsPage(1);
    await loadActionLogs(user.id, 1);
  };

  // 加载用户行为日志
  const loadActionLogs = async (userId: string, page: number = 1) => {
    setActionLogsLoading(true);
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      const response: any = await apiClient.get(`/admin/users/${userId}/action-logs`, {
        params: { limit, offset },
      });
      
      if (response.code === 0) {
        setActionLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
        setActionLogsTotal(response.data.total || 0);
      } else {
        message.error(response.message || '加载日志失败');
        setActionLogs([]);
        setActionLogsTotal(0);
      }
    } catch (error: any) {
      console.error('Load action logs error:', error);
      message.error(error.message || '加载日志失败');
      setActionLogs([]);
      setActionLogsTotal(0);
    } finally {
      setActionLogsLoading(false);
    }
  };

  // 获取行为类型标签
  const getActionTypeTag = (actionType: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      view: { color: 'blue', text: '查看' },
      like: { color: 'red', text: '点赞' },
      favorite: { color: 'gold', text: '收藏' },
      share: { color: 'green', text: '分享' },
      comment: { color: 'purple', text: '评论' },
      create_post: { color: 'cyan', text: '发帖' },
      create_comment: { color: 'orange', text: '评论' },
    };
    const config = typeMap[actionType] || { color: 'default', text: actionType };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取内容类型标签
  const getContentTypeTag = (contentType: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      paper: { color: 'blue', text: '论文' },
      video: { color: 'purple', text: '视频' },
      repo: { color: 'green', text: 'GitHub' },
      huggingface: { color: 'orange', text: 'HF模型' },
      job: { color: 'red', text: '岗位' },
      post: { color: 'cyan', text: '帖子' },
    };
    const config = typeMap[contentType] || { color: 'default', text: contentType };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRegisterTypeTag = (registerType: string) => {
    switch (registerType) {
      case 'github':
        return <Tag color="purple" icon={<GithubOutlined />}>GitHub</Tag>;
      case 'email':
        return <Tag color="blue" icon={<MailOutlined />}>邮箱</Tag>;
      case 'github_and_email':
        return (
          <Space size="small">
            <Tag color="purple" icon={<GithubOutlined />}>GitHub</Tag>
            <Tag color="blue" icon={<MailOutlined />}>邮箱</Tag>
          </Space>
        );
      default:
        return <Tag>未知</Tag>;
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return dayjs(d).format('YYYY-MM-DD HH:mm:ss');
    } catch {
      return '-';
    }
  };

  const columns = [
    {
      title: '编号',
      dataIndex: 'userNumber',
      key: 'userNumber',
      width: 100,
      render: (userNumber: string) => userNumber || '-',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (email: string) => email || '-',
    },
    {
      title: '注册方式',
      dataIndex: 'registerType',
      key: 'registerType',
      width: 150,
      render: (registerType: string) => getRegisterTypeTag(registerType),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => <Tag color="blue">LV{level}</Tag>,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 80,
    },
    {
      title: 'VIP',
      dataIndex: 'isVip',
      key: 'isVip',
      width: 120,
      render: (isVip: boolean, record: any) => (
        <Space>
          {isVip ? <Tag color="gold">VIP</Tag> : <Tag>普通</Tag>}
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditVip(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => isActive ? <Tag color="success">正常</Tag> : <Tag color="error">已禁用</Tag>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[] | null, record: any) => (
        <Space>
          {Array.isArray(tags) && tags.length > 0 ? (
            tags.map((tag, index) => <Tag key={index} color="cyan">{tag}</Tag>)
          ) : (
            <Tag>无标签</Tag>
          )}
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditTags(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string | Date) => formatDate(date),
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (date: string | Date | null) => formatDate(date),
    },
    {
      title: 'GitHub信息',
      key: 'githubInfo',
      width: 200,
      render: (_: any, record: any) => {
        if (!record.githubId && !record.githubData) {
          return <Tag>-</Tag>;
        }
        
        const githubData = record.githubData || {};
        const hasData = githubData.name || githubData.company || githubData.location || 
                       githubData.followers !== undefined || githubData.publicRepos !== undefined;
        
        if (!hasData) {
          return <Tag color="purple">GitHub用户</Tag>;
        }
        
        return (
          <Space direction="vertical" size="small" style={{ fontSize: 12 }}>
            {githubData.name && (
              <div><strong>姓名:</strong> {githubData.name}</div>
            )}
            {githubData.company && (
              <div><strong>公司:</strong> {githubData.company}</div>
            )}
            {githubData.location && (
              <div><strong>位置:</strong> {githubData.location}</div>
            )}
            {(githubData.followers !== undefined || githubData.following !== undefined || githubData.publicRepos !== undefined) && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {githubData.followers !== undefined && githubData.followers > 0 && (
                  <Tag color="blue">粉丝: {githubData.followers}</Tag>
                )}
                {githubData.following !== undefined && githubData.following > 0 && (
                  <Tag color="green">关注: {githubData.following}</Tag>
                )}
                {githubData.publicRepos !== undefined && githubData.publicRepos > 0 && (
                  <Tag color="orange">仓库: {githubData.publicRepos}</Tag>
                )}
              </div>
            )}
            {(githubData.blog || githubData.htmlUrl) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {githubData.blog && (
                  <a href={githubData.blog} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                    博客
                  </a>
                )}
                {githubData.htmlUrl && (
                  <a href={githubData.htmlUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                    GitHub主页
                  </a>
                )}
              </div>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewProfile(record)}
          >
            画像
          </Button>
          <Button 
            size="small" 
            icon={<FileTextOutlined />}
            onClick={() => handleViewActionLogs(record)}
          >
            日志
          </Button>
          <Button size="small" onClick={() => handleBan(record.id, record.isActive ? 'ban' : 'unban')}>
            {record.isActive ? '禁用' : '解禁'}
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>注册用户</h1>
        <Space>
          <Input.Search
            placeholder="搜索用户名或邮箱..."
            style={{ width: 250 }}
            onSearch={setKeyword}
            enterButton={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="注册方式"
            style={{ width: 150 }}
            value={registerType || undefined}
            onChange={(value) => setRegisterType(value)}
            allowClear
          >
            <Select.Option value="github">GitHub</Select.Option>
            <Select.Option value="email">邮箱</Select.Option>
            <Select.Option value="github_and_email">GitHub+邮箱</Select.Option>
          </Select>
          <Select
            placeholder="用户状态"
            style={{ width: 120 }}
            value={status || undefined}
            onChange={(value) => setStatus(value)}
            allowClear
          >
            <Select.Option value="active">正常</Select.Option>
            <Select.Option value="banned">已禁用</Select.Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={() => setAdvancedFilterVisible(true)}>
            高级筛选
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="VIP用户"
              value={stats.vip}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={stats.today}
              prefix={<PlusOutlined />}
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
        dataSource={users}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1600 }}
        rowSelection={rowSelection}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: false,
        }}
      />

      {/* 标签编辑抽屉 */}
      <Drawer
        title={`编辑标签 - ${editingUser?.username}`}
        width={500}
        open={tagsDrawerOpen}
        onClose={() => {
          setTagsDrawerOpen(false);
          setEditingUser(null);
          setTags([]);
          setNewTagInput('');
        }}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => {
              setTagsDrawerOpen(false);
              setEditingUser(null);
              setTags([]);
              setNewTagInput('');
            }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSaveTags}>
              保存
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>添加新标签:</div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="输入标签名称"
              onPressEnter={handleAddTag}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
              添加
            </Button>
          </Space.Compact>
        </div>
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>当前标签 ({tags.length}):</div>
          {tags.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  color="cyan"
                  style={{ fontSize: 14, padding: '4px 8px' }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>
              暂无标签，请添加标签
            </div>
          )}
        </div>
      </Drawer>

      {/* VIP状态编辑弹窗 */}
      <Modal
        title={`编辑VIP状态 - ${vipEditingUser?.username}`}
        open={vipModalVisible}
        onOk={handleSaveVip}
        onCancel={() => {
          setVipModalVisible(false);
          setVipEditingUser(null);
          setVipSwitchChecked(false);
        }}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>当前VIP状态:</div>
            {vipEditingUser?.isVip ? (
              <Tag color="gold" style={{ fontSize: 16, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>VIP</Tag>
            ) : (
              <Tag style={{ fontSize: 16, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>普通用户</Tag>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>修改为:</div>
            <Switch
              checked={vipSwitchChecked}
              onChange={(checked) => {
                setVipSwitchChecked(checked);
              }}
              checkedChildren="VIP"
              unCheckedChildren="普通"
            />
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              {vipSwitchChecked 
                ? '点击确定将设置该用户为VIP' 
                : vipEditingUser?.isVip
                  ? '点击确定将取消该用户的VIP状态'
                  : '点击确定将保持该用户为普通用户'}
            </div>
          </div>
        </div>
      </Modal>

      {/* 用户行为日志抽屉 */}
      <Drawer
        title={`用户行为日志 - ${actionLogsUser?.username}`}
        width={800}
        open={actionLogsDrawerOpen}
        onClose={() => {
          setActionLogsDrawerOpen(false);
          setActionLogsUser(null);
          setActionLogs([]);
          setActionLogsTotal(0);
          setActionLogsPage(1);
        }}
        footer={null}
      >
        <Table
          columns={[
            {
              title: '时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 180,
              render: (time: string) => formatDate(time),
            },
            {
              title: '行为类型',
              dataIndex: 'actionType',
              key: 'actionType',
              width: 120,
              render: (actionType: string) => getActionTypeTag(actionType),
            },
            {
              title: '内容类型',
              dataIndex: 'contentType',
              key: 'contentType',
              width: 120,
              render: (contentType: string) => getContentTypeTag(contentType),
            },
            {
              title: '内容ID',
              dataIndex: 'contentId',
              key: 'contentId',
              width: 200,
              ellipsis: true,
            },
            {
              title: '元数据',
              dataIndex: 'metadata',
              key: 'metadata',
              ellipsis: true,
              render: (metadata: any) => {
                if (!metadata) return '-';
                try {
                  if (typeof metadata === 'string') {
                    const parsed = JSON.parse(metadata);
                    return <pre style={{ margin: 0, fontSize: 12, maxWidth: 200 }}>{JSON.stringify(parsed, null, 2)}</pre>;
                  }
                  return <pre style={{ margin: 0, fontSize: 12, maxWidth: 200 }}>{JSON.stringify(metadata, null, 2)}</pre>;
                } catch {
                  return String(metadata);
                }
              },
            },
          ]}
          dataSource={actionLogs}
          rowKey="id"
          loading={actionLogsLoading}
          pagination={{
            current: actionLogsPage,
            pageSize: 20,
            total: actionLogsTotal,
            onChange: (page) => {
              setActionLogsPage(page);
              if (actionLogsUser) {
                loadActionLogs(actionLogsUser.id, page);
              }
            },
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: '暂无行为日志',
          }}
        />
      </Drawer>

      {/* 高级筛选弹窗 */}
      <Modal
        title="高级筛选"
        open={advancedFilterVisible}
        onOk={() => {
          setAdvancedFilterVisible(false);
          setPage(1);
          loadUsers();
        }}
        onCancel={() => setAdvancedFilterVisible(false)}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>用户等级</div>
              <Select
                style={{ width: '100%' }}
                value={filterLevel || undefined}
                onChange={setFilterLevel}
                allowClear
                placeholder="选择等级"
              >
                <Select.Option value="1">LV1</Select.Option>
                <Select.Option value="2">LV2</Select.Option>
                <Select.Option value="3">LV3</Select.Option>
                <Select.Option value="4">LV4</Select.Option>
                <Select.Option value="5">LV5</Select.Option>
              </Select>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>VIP状态</div>
              <Select
                style={{ width: '100%' }}
                value={filterIsVip || undefined}
                onChange={setFilterIsVip}
                allowClear
                placeholder="选择VIP状态"
              >
                <Select.Option value="true">VIP用户</Select.Option>
                <Select.Option value="false">普通用户</Select.Option>
              </Select>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>最小积分</div>
              <Input
                type="number"
                value={filterPointsMin}
                onChange={(e) => setFilterPointsMin(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="输入最小积分"
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>最大积分</div>
              <Input
                type="number"
                value={filterPointsMax}
                onChange={(e) => setFilterPointsMax(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="输入最大积分"
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>注册开始日期</div>
              <Input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>注册结束日期</div>
              <Input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
              />
            </Col>
          </Row>

          <div>
            <div style={{ marginBottom: 8 }}>标签筛选</div>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              value={filterTags}
              onChange={setFilterTags}
              placeholder="输入标签并回车添加"
            />
          </div>

          <Button onClick={() => {
            setFilterLevel('');
            setFilterIsVip('');
            setFilterPointsMin(undefined);
            setFilterPointsMax(undefined);
            setFilterDateStart('');
            setFilterDateEnd('');
            setFilterTags([]);
          }}>
            清空筛选条件
          </Button>
        </Space>
      </Modal>

      {/* 用户画像弹窗 */}
      <Drawer
        title="用户画像"
        width={800}
        open={userProfileVisible}
        onClose={() => {
          setUserProfileVisible(false);
          setProfileUser(null);
        }}
      >
        {profileUser && (
          <Spin spinning={profileLoading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <Avatar size={80} icon={<UserOutlined />} src={profileUser.avatar} />
                  <div>
                    <h2 style={{ margin: 0 }}>{profileUser.username}</h2>
                    <div style={{ color: '#666', marginTop: 4 }}>{profileUser.email || '-'}</div>
                    <Space style={{ marginTop: 8 }}>
                      {profileUser.isVip && <Tag color="gold">VIP</Tag>}
                      <Tag color="blue">LV{profileUser.level}</Tag>
                      <Tag color={profileUser.isActive ? 'success' : 'error'}>
                        {profileUser.isActive ? '正常' : '已禁用'}
                      </Tag>
                    </Space>
                  </div>
                </div>
              </Card>

              <Card title="基本信息">
                <Descriptions column={2}>
                  <Descriptions.Item label="用户编号">{profileUser.userNumber || '-'}</Descriptions.Item>
                  <Descriptions.Item label="注册方式">{getRegisterTypeTag(profileUser.registerType)}</Descriptions.Item>
                  <Descriptions.Item label="积分">{profileUser.points || 0}</Descriptions.Item>
                  <Descriptions.Item label="注册时间">{formatDate(profileUser.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="最近登录">{formatDate(profileUser.lastLoginAt)}</Descriptions.Item>
                  <Descriptions.Item label="标签">
                    {Array.isArray(profileUser.tags) && profileUser.tags.length > 0 ? (
                      profileUser.tags.map((tag: string, index: number) => (
                        <Tag key={index} color="cyan">{tag}</Tag>
                      ))
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {profileUser.githubData && (
                <Card title="GitHub信息">
                  <Descriptions column={2}>
                    <Descriptions.Item label="GitHub ID">{profileUser.githubId || '-'}</Descriptions.Item>
                    <Descriptions.Item label="姓名">{profileUser.githubData.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="公司">{profileUser.githubData.company || '-'}</Descriptions.Item>
                    <Descriptions.Item label="位置">{profileUser.githubData.location || '-'}</Descriptions.Item>
                    <Descriptions.Item label="粉丝数">{profileUser.githubData.followers || 0}</Descriptions.Item>
                    <Descriptions.Item label="关注数">{profileUser.githubData.following || 0}</Descriptions.Item>
                    <Descriptions.Item label="公开仓库">{profileUser.githubData.publicRepos || 0}</Descriptions.Item>
                    <Descriptions.Item label="博客">
                      {profileUser.githubData.blog ? (
                        <a href={profileUser.githubData.blog} target="_blank" rel="noopener noreferrer">
                          {profileUser.githubData.blog}
                        </a>
                      ) : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              <Card title="行为统计">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="查看次数"
                      value={profileUser.actionStats?.view || 0}
                      prefix={<EyeOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="点赞次数"
                      value={profileUser.actionStats?.like || 0}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="收藏次数"
                      value={profileUser.actionStats?.favorite || 0}
                      prefix={<StarOutlined />}
                    />
                  </Col>
                </Row>
              </Card>

              {profileUser.contentStats && (
                <Card title="内容偏好">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {Object.entries(profileUser.contentStats).map(([type, count]: [string, any]) => (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{getContentTypeLabel(type)}</span>
                          <span>{count} 次</span>
                        </div>
                        <Progress 
                          percent={Math.min((count / Math.max(...Object.values(profileUser.contentStats) as number[])) * 100, 100)}
                          size="small"
                        />
                      </div>
                    ))}
                  </Space>
                </Card>
              )}
            </Space>
          </Spin>
        )}
      </Drawer>
    </div>
  );
}

function getContentTypeLabel(contentType: string): string {
  const labels: Record<string, string> = {
    paper: '论文',
    video: '视频',
    repo: 'GitHub项目',
    huggingface: 'HuggingFace模型',
    job: '招聘岗位',
    post: '帖子',
  };
  return labels[contentType] || contentType;
}
