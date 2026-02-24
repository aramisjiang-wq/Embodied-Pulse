/**
 * 管理端 - 管理员管理页面
 * 管理所有管理员账号和权限
 */

'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Tag, Modal, Drawer, Checkbox, Form, Select, Input as AntInput, App } from 'antd';
import { SearchOutlined, SettingOutlined, UserOutlined, LockOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import styles from './page.module.css';

const MODULES = [
  { key: 'users', label: '用户管理' },
  { key: 'content', label: '内容管理' },
  { key: 'subscriptions', label: '订阅管理' },
  { key: 'community', label: '市集管理' },
  { key: 'stats', label: '数据统计' },
  { key: 'banners', label: 'Banner管理' },
  { key: 'announcements', label: '公告管理' },
  { key: 'home-modules', label: '首页模块' },
];

const PERMISSION_TEMPLATES = [
  {
    id: 'full_access',
    name: '完全访问',
    description: '所有模块的完整权限',
    permissions: MODULES.map(m => ({
      module: m.key,
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    })),
  },
  {
    id: 'read_only',
    name: '只读权限',
    description: '仅查看权限，无编辑权限',
    permissions: MODULES.map(m => ({
      module: m.key,
      canView: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    })),
  },
  {
    id: 'content_manager',
    name: '内容管理员',
    description: '内容管理相关权限',
    permissions: MODULES.map(m => {
      const isContentModule = ['content', 'community', 'banners', 'announcements', 'home-modules'].includes(m.key);
      return {
        module: m.key,
        canView: isContentModule,
        canCreate: isContentModule,
        canUpdate: isContentModule,
        canDelete: isContentModule,
      };
    }),
  },
  {
    id: 'user_manager',
    name: '用户管理员',
    description: '用户管理相关权限',
    permissions: MODULES.map(m => {
      const isUserModule = ['users', 'subscriptions'].includes(m.key);
      return {
        module: m.key,
        canView: isUserModule,
        canCreate: isUserModule,
        canUpdate: isUserModule,
        canDelete: isUserModule,
      };
    }),
  },
];

export default function AdminAdminsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<string>('');
  const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [permissionForm] = Form.useForm();
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [auditLogsDrawerOpen, setAuditLogsDrawerOpen] = useState(false);
  const [auditLogsAdmin, setAuditLogsAdmin] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);
  const [permissionVisualizationVisible, setPermissionVisualizationVisible] = useState(false);
  const [visualizationAdmin, setVisualizationAdmin] = useState<any>(null);

  useEffect(() => {
    loadAdmins();
  }, [page, keyword, role]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.get('/admin/admins', {
        params: { 
          page, 
          size: 20, 
          keyword: keyword || undefined,
          role: role || undefined,
        },
      });
      if (response.code === 0) {
        setAdmins(Array.isArray(response.data.items) ? response.data.items : []);
        setTotal(response.data.pagination?.total || 0);
      } else {
        message.error(response.message || '加载失败');
        setAdmins([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Load admins error:', error);
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
      setAdmins([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPermissionDrawer = (admin: any) => {
    setSelectedAdmin(admin);
    // 初始化权限表单
    const permissions: any = {};
    MODULES.forEach(module => {
      const existingPermission = admin.permissions?.find((p: any) => p.module === module.key);
      permissions[`${module.key}_view`] = existingPermission?.canView || false;
      permissions[`${module.key}_create`] = existingPermission?.canCreate || false;
      permissions[`${module.key}_update`] = existingPermission?.canUpdate || false;
      permissions[`${module.key}_delete`] = existingPermission?.canDelete || false;
    });
    permissionForm.setFieldsValue(permissions);
    setPermissionDrawerOpen(true);
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = PERMISSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const permissions: any = {};
    template.permissions.forEach(p => {
      permissions[`${p.module}_view`] = p.canView;
      permissions[`${p.module}_create`] = p.canCreate;
      permissions[`${p.module}_update`] = p.canUpdate;
      permissions[`${p.module}_delete`] = p.canDelete;
    });
    permissionForm.setFieldsValue(permissions);
    message.success(`已应用权限模板: ${template.name}`);
  };

  const handleViewAuditLogs = async (admin: any) => {
    setAuditLogsAdmin(admin);
    setAuditLogsDrawerOpen(true);
    setAuditLogsPage(1);
    await loadAuditLogs(admin.id, 1);
  };

  const loadAuditLogs = async (adminId: string, page: number) => {
    setAuditLogsLoading(true);
    try {
      const response: any = await apiClient.get(`/admin/admins/${adminId}/audit-logs`, {
        params: { page, size: 20 },
      });
      if (response.code === 0) {
        setAuditLogs(Array.isArray(response.data.items) ? response.data.items : []);
        setAuditLogsTotal(response.data.pagination?.total || 0);
      } else {
        message.error(response.message || '加载审计日志失败');
        setAuditLogs([]);
        setAuditLogsTotal(0);
      }
    } catch (error: any) {
      console.error('Load audit logs error:', error);
      message.error(error.message || '加载审计日志失败');
      setAuditLogs([]);
      setAuditLogsTotal(0);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const handleViewPermissionVisualization = (admin: any) => {
    setVisualizationAdmin(admin);
    setPermissionVisualizationVisible(true);
  };

  const handleSavePermissions = async () => {
    try {
      const values = permissionForm.getFieldsValue();
      const permissions = MODULES.map(module => ({
        module: module.key,
        canView: values[`${module.key}_view`] || false,
        canCreate: values[`${module.key}_create`] || false,
        canUpdate: values[`${module.key}_update`] || false,
        canDelete: values[`${module.key}_delete`] || false,
      }));

      await apiClient.put(`/admin/admins/${selectedAdmin.id}/permissions`, { permissions });
      message.success('权限更新成功');
      setPermissionDrawerOpen(false);
      loadAdmins();
    } catch (error: any) {
      message.error(error.message || '权限更新失败');
    }
  };

  const handleEditTags = (admin: any) => {
    setEditingAdmin(admin);
    setTagsInput(Array.isArray(admin.tags) ? admin.tags.join(',') : '');
  };

  const handleSaveTags = async () => {
    if (!editingAdmin) return;
    
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
      await apiClient.put(`/admin/admins/${editingAdmin.id}/tags`, { tags });
      message.success('标签更新成功');
      setEditingAdmin(null);
      setTagsInput('');
      loadAdmins();
    } catch (error: any) {
      message.error(error.message || '标签更新失败');
    }
  };

  // 创建管理员
  const handleCreateAdmin = async () => {
    try {
      const values = await createForm.validateFields();
      const response: any = await apiClient.post('/admin/admins', {
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role || 'admin',
      });
      
      if (response.code === 0) {
        message.success('管理员创建成功');
        setCreateModalVisible(false);
        createForm.resetFields();
        loadAdmins();
      } else {
        message.error(response.message || '创建失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        return; // 表单验证错误
      }
      console.error('Create admin error:', error);
      if (error.response?.data?.code === 1002) {
        message.error('该邮箱已被使用');
      } else {
        message.error(error.message || error.response?.data?.message || '创建失败');
      }
    }
  };

  // 权限一键全选
  const handleSelectAllPermissions = (checked: boolean) => {
    const permissions: any = {};
    MODULES.forEach(module => {
      permissions[`${module.key}_view`] = checked;
      permissions[`${module.key}_create`] = checked;
      permissions[`${module.key}_update`] = checked;
      permissions[`${module.key}_delete`] = checked;
    });
    permissionForm.setFieldsValue(permissions);
  };

  const getRoleTag = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Tag color="red">超级管理员</Tag>;
      case 'admin':
        return <Tag color="orange">管理员</Tag>;
      default:
        return <Tag>普通用户</Tag>;
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
      dataIndex: 'adminNumber',
      key: 'adminNumber',
      width: 100,
      render: (adminNumber: string) => adminNumber || '-',
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
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => isActive ? <Tag color="success">正常</Tag> : <Tag color="error">已禁用</Tag>,
    },
    {
      title: '权限模块数',
      key: 'permissionCount',
      width: 120,
      render: (_: any, record: any) => {
        // 计算至少有一个权限（查看/创建/更新/删除）为true的模块数
        const permissions = record.permissions || [];
        const count = permissions.filter((p: any) => 
          p.canView || p.canCreate || p.canUpdate || p.canDelete
        ).length;
        return <Tag>{count} 个模块</Tag>;
      },
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
      title: '创建时间',
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
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<SettingOutlined />}
            onClick={() => handleOpenPermissionDrawer(record)}
          >
            权限配置
          </Button>
          <Button 
            size="small" 
            icon={<UserOutlined />}
            onClick={() => handleViewPermissionVisualization(record)}
          >
            权限视图
          </Button>
          <Button 
            size="small" 
            icon={<LockOutlined />}
            onClick={() => handleViewAuditLogs(record)}
          >
            审计日志
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>管理员</h1>
        <Space>
          <Input.Search
            placeholder="搜索用户名或邮箱..."
            style={{ width: 250 }}
            onSearch={setKeyword}
            enterButton={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="角色筛选"
            style={{ width: 150 }}
            value={role || undefined}
            onChange={(value) => setRole(value)}
            allowClear
          >
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="super_admin">超级管理员</Select.Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateModalVisible(true);
              createForm.resetFields();
            }}
          >
            新增管理员
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: false,
        }}
      />

      <Drawer
        title={`权限配置 - ${selectedAdmin?.username}`}
        width={600}
        open={permissionDrawerOpen}
        onClose={() => setPermissionDrawerOpen(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setPermissionDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSavePermissions}>
              保存权限
            </Button>
          </Space>
        }
      >
        <div className={styles.templateSection}>
          <div className={styles.templateLabel}>快速应用权限模板:</div>
          <Space wrap>
            {PERMISSION_TEMPLATES.map(template => (
              <Button 
                key={template.id} 
                size="small" 
                onClick={() => handleApplyTemplate(template.id)}
              >
                {template.name}
              </Button>
            ))}
          </Space>
        </div>
        <div className={styles.quickActions}>
          <Space>
            <Button size="small" onClick={() => handleSelectAllPermissions(true)}>
              一键全选
            </Button>
            <Button size="small" onClick={() => handleSelectAllPermissions(false)}>
              一键清空
            </Button>
          </Space>
        </div>
        <Form form={permissionForm} layout="vertical">
          {MODULES.map(module => (
            <div key={module.key} className={styles.permissionModule}>
              <div className={styles.moduleTitle}>{module.label}</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item name={`${module.key}_view`} valuePropName="checked">
                  <Checkbox>查看权限</Checkbox>
                </Form.Item>
                <Form.Item name={`${module.key}_create`} valuePropName="checked">
                  <Checkbox>创建权限</Checkbox>
                </Form.Item>
                <Form.Item name={`${module.key}_update`} valuePropName="checked">
                  <Checkbox>更新权限</Checkbox>
                </Form.Item>
                <Form.Item name={`${module.key}_delete`} valuePropName="checked">
                  <Checkbox>删除权限</Checkbox>
                </Form.Item>
              </Space>
            </div>
          ))}
        </Form>
      </Drawer>

      {/* 新增管理员弹窗 */}
      <Modal
        title="新增管理员"
        open={createModalVisible}
        onOk={handleCreateAdmin}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入密码（至少6位）" />
          </Form.Item>
          <Form.Item
            label="角色"
            name="role"
            initialValue="admin"
          >
            <Select placeholder="请选择角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="super_admin">超级管理员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`编辑标签 - ${editingAdmin?.username}`}
        open={!!editingAdmin}
        onOk={handleSaveTags}
        onCancel={() => {
          setEditingAdmin(null);
          setTagsInput('');
        }}
      >
        <div className={styles.tagEditInput}>
          <div className={styles.tagEditLabel}>标签（用逗号分隔）:</div>
          <AntInput
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例如: 核心管理员,技术负责人,运营负责人"
          />
          <div className={styles.tagEditHint}>
            提示：多个标签用逗号分隔
          </div>
        </div>
      </Modal>

      {/* 权限可视化弹窗 */}
      <Modal
        title={`权限视图 - ${visualizationAdmin?.username}`}
        open={permissionVisualizationVisible}
        onCancel={() => setPermissionVisualizationVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPermissionVisualizationVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {visualizationAdmin && (
          <div>
            <div className={styles.visualizationHeader}>
              <Space>
                <Tag color="blue">用户名: {visualizationAdmin.username}</Tag>
                <Tag color="green">角色: {getRoleTag(visualizationAdmin.role)}</Tag>
                <Tag>邮箱: {visualizationAdmin.email}</Tag>
              </Space>
            </div>
            <Table
              columns={[
                {
                  title: '模块',
                  dataIndex: 'module',
                  key: 'module',
                  width: 150,
                  render: (key: string) => {
                    const module = MODULES.find(m => m.key === key);
                    return module?.label || key;
                  },
                },
                {
                  title: '查看',
                  dataIndex: 'canView',
                  key: 'canView',
                  width: 100,
                  align: 'center',
                  render: (canView: boolean) => (
                    <Tag color={canView ? 'success' : 'default'}>
                      {canView ? '✓' : '✗'}
                    </Tag>
                  ),
                },
                {
                  title: '创建',
                  dataIndex: 'canCreate',
                  key: 'canCreate',
                  width: 100,
                  align: 'center',
                  render: (canCreate: boolean) => (
                    <Tag color={canCreate ? 'success' : 'default'}>
                      {canCreate ? '✓' : '✗'}
                    </Tag>
                  ),
                },
                {
                  title: '更新',
                  dataIndex: 'canUpdate',
                  key: 'canUpdate',
                  width: 100,
                  align: 'center',
                  render: (canUpdate: boolean) => (
                    <Tag color={canUpdate ? 'success' : 'default'}>
                      {canUpdate ? '✓' : '✗'}
                    </Tag>
                  ),
                },
                {
                  title: '删除',
                  dataIndex: 'canDelete',
                  key: 'canDelete',
                  width: 100,
                  align: 'center',
                  render: (canDelete: boolean) => (
                    <Tag color={canDelete ? 'success' : 'default'}>
                      {canDelete ? '✓' : '✗'}
                    </Tag>
                  ),
                },
              ]}
              dataSource={visualizationAdmin.permissions || []}
              rowKey="module"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* 审计日志抽屉 */}
      <Drawer
        title={`审计日志 - ${auditLogsAdmin?.username}`}
        width={800}
        open={auditLogsDrawerOpen}
        onClose={() => setAuditLogsDrawerOpen(false)}
      >
        <Table
          columns={[
            {
              title: '操作时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 160,
              render: (date: string) => formatDate(date),
            },
            {
              title: '操作类型',
              dataIndex: 'action',
              key: 'action',
              width: 120,
              render: (action: string) => {
                const actionMap: Record<string, { text: string; color: string }> = {
                  'login': { text: '登录', color: 'blue' },
                  'logout': { text: '登出', color: 'default' },
                  'create_user': { text: '创建用户', color: 'green' },
                  'update_user': { text: '更新用户', color: 'orange' },
                  'delete_user': { text: '删除用户', color: 'red' },
                  'update_permission': { text: '更新权限', color: 'purple' },
                  'ban_user': { text: '禁用用户', color: 'red' },
                  'unban_user': { text: '解禁用户', color: 'green' },
                };
                const info = actionMap[action] || { text: action, color: 'default' };
                return <Tag color={info.color}>{info.text}</Tag>;
              },
            },
            {
              title: '操作对象',
              dataIndex: 'target',
              key: 'target',
              width: 150,
              ellipsis: true,
            },
            {
              title: '操作详情',
              dataIndex: 'details',
              key: 'details',
              ellipsis: true,
              render: (details: any) => {
                if (!details) return '-';
                try {
                  if (typeof details === 'string') {
                    const parsed = JSON.parse(details);
                    return <pre style={{ margin: 0, fontSize: 12, maxWidth: 300 }}>{JSON.stringify(parsed, null, 2)}</pre>;
                  }
                  return <pre style={{ margin: 0, fontSize: 12, maxWidth: 300 }}>{JSON.stringify(details, null, 2)}</pre>;
                } catch {
                  return String(details);
                }
              },
            },
            {
              title: 'IP地址',
              dataIndex: 'ip',
              key: 'ip',
              width: 120,
            },
          ]}
          dataSource={auditLogs}
          rowKey="id"
          loading={auditLogsLoading}
          pagination={{
            current: auditLogsPage,
            pageSize: 20,
            total: auditLogsTotal,
            onChange: (page) => {
              setAuditLogsPage(page);
              if (auditLogsAdmin) {
                loadAuditLogs(auditLogsAdmin.id, page);
              }
            },
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: '暂无审计日志',
          }}
        />
      </Drawer>
    </div>
  );
}
