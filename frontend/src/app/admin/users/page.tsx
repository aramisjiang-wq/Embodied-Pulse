/**
 * 管理端 - 注册用户管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Select, App,
  Switch, Drawer, Row, Col, Badge, Dropdown, MenuProps,
  Descriptions, Avatar, Progress, Tooltip, Divider,
} from 'antd';
import {
  SearchOutlined,
  GithubOutlined,
  MailOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  MoreOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  StarOutlined,
  FilterOutlined,
  TeamOutlined,
  CrownOutlined,
  FireOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LikeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import styles from './page.module.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

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
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);

  const [vipModalVisible, setVipModalVisible] = useState(false);
  const [vipEditingUser, setVipEditingUser] = useState<any>(null);
  const [vipSwitchChecked, setVipSwitchChecked] = useState(false);
  const [vipPermissions, setVipPermissions] = useState<string[]>([]);

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

  const [profileEditVisible, setProfileEditVisible] = useState(false);
  const [profileEditUser, setProfileEditUser] = useState<any>(null);
  const [profileIdentityType, setProfileIdentityType] = useState<string>('');
  const [profileOrganizationName, setProfileOrganizationName] = useState('');
  const [profileRegion, setProfileRegion] = useState<string>('');
  const [profileEditLoading, setProfileEditLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const defaultUserStats = {
    total: 0,
    active: 0,
    vip: 0,
    github: 0,
    email: 0,
    today: 0,
    week: 0,
    month: 0,
  };
  const [stats, setStats] = useState(defaultUserStats);

  const hasAdvancedFilter = !!(
    filterLevel || filterIsVip || filterPointsMin || filterPointsMax ||
    filterDateStart || filterDateEnd || filterTags.length > 0
  );

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, keyword, registerType, status, filterLevel, filterIsVip, filterPointsMin, filterPointsMax, filterDateStart, filterDateEnd, filterTags]);

  const loadStats = async () => {
    try {
      const response: any = await apiClient.get('/admin/users/stats');
      if (response.code === 0) {
        setStats(response.data && typeof response.data === 'object' ? response.data : defaultUserStats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
      setStats(defaultUserStats);
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
      if (response?.code === 0 && response?.data) {
        const items = Array.isArray(response.data.items) ? response.data.items : [];
        const totalNum = typeof response.data.pagination?.total === 'number' ? response.data.pagination.total : 0;
        setUsers(items);
        setTotal(totalNum);
        if (process.env.NODE_ENV === 'development' && items.length === 0 && totalNum === 0) {
          console.info('[Admin Users] 接口返回成功但列表为空。若你曾注册过用户，请在后端目录执行: npx tsx scripts/check-user-count.ts 检查用户库是否有数据。');
        }
      } else {
        message.error(response?.message || '加载失败');
        setUsers([]);
        setTotal(0);
      }
    } catch (error: any) {
      if (
        error.status === 401 ||
        error.code === 'UNAUTHORIZED' ||
        error.response?.data?.code === 1002 ||
        error.response?.data?.code === 1003
      ) {
        message.error('未登录或登录已过期，请重新登录');
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
          setTimeout(() => { window.location.href = '/admin/login'; }, 1500);
        }
      } else {
        message.error(error.message || '加载失败');
      }
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = (userId: string, action: 'ban' | 'unban') => {
    Modal.confirm({
      title: `确认${action === 'ban' ? '禁用' : '解禁'}该用户？`,
      content: action === 'ban' ? '禁用后该用户将无法登录' : '解禁后该用户可正常登录',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: action === 'ban' ? { danger: true } : {},
      onOk: async () => {
        await apiClient.post(`/admin/users/${userId}/ban`, { action });
        message.success(`${action === 'ban' ? '禁用' : '解禁'}成功`);
        loadUsers();
      },
    });
  };

  const handleBatchBan = (action: 'ban' | 'unban') => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择用户'); return; }
    Modal.confirm({
      title: `确认批量${action === 'ban' ? '禁用' : '解禁'}选中的 ${selectedRowKeys.length} 个用户？`,
      okButtonProps: action === 'ban' ? { danger: true } : {},
      onOk: async () => {
        await apiClient.post('/admin/users/batch-ban', { userIds: selectedRowKeys, action });
        message.success(`批量${action === 'ban' ? '禁用' : '解禁'}成功`);
        setSelectedRowKeys([]);
        loadUsers();
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择用户'); return; }
    Modal.confirm({
      title: `确认删除选中的 ${selectedRowKeys.length} 个用户？`,
      content: '此操作不可恢复，请谨慎操作',
      okText: '确认删除',
      okType: 'danger',
      onOk: async () => {
        await apiClient.delete('/admin/users/batch', { data: { userIds: selectedRowKeys } });
        message.success('批量删除成功');
        setSelectedRowKeys([]);
        loadUsers();
      },
    });
  };

  const handleBatchSetVip = async (isVip: boolean) => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择用户'); return; }
    await apiClient.post('/admin/users/batch-vip', { userIds: selectedRowKeys, isVip });
    message.success(`批量设置${isVip ? 'VIP' : '普通用户'}成功`);
    setSelectedRowKeys([]);
    loadUsers();
  };

  const handleViewProfile = async (user: any) => {
    setProfileUser(user);
    setUserProfileVisible(true);
    setProfileLoading(true);
    try {
      const response: any = await apiClient.get(`/admin/users/${user.id}/profile`);
      if (response.code === 0) setProfileUser({ ...user, ...response.data });
    } catch (error: any) {
      message.error(error.message || '加载用户画像失败');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEditTags = (user: any) => {
    setEditingUser(user);
    setTags(Array.isArray(user.tags) ? user.tags : []);
    setNewTagInput('');
    setTagsDrawerOpen(true);
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleSaveTags = async () => {
    if (!editingUser) return;
    await apiClient.post(`/admin/users/${editingUser.id}/tags`, { tags });
    message.success('标签更新成功');
    setTagsDrawerOpen(false);
    setEditingUser(null);
    setTags([]);
    setNewTagInput('');
    loadUsers();
  };

  // 可配置的页面列表
  const availablePages = [
    { key: '/', label: '首页' },
    { key: '/papers', label: '论文' },
    { key: '/videos', label: '视频' },
    { key: '/repos', label: 'GitHub项目' },
    { key: '/huggingface', label: 'HuggingFace模型' },
    { key: '/jobs', label: '招聘岗位' },
    { key: '/community', label: '社区' },
    { key: '/subscriptions', label: '订阅管理' },
    { key: '/favorites', label: '收藏夹' },
    { key: '/profile', label: '个人资料' },
    { key: '/ranking', label: '排行榜' },
  ];

  const handleEditVip = (user: any) => {
    setVipEditingUser(user);
    setVipSwitchChecked(user.isVip || false);
    // 解析VIP权限（如果存在）
    let permissions: string[] = [];
    if (user.vipPermissions) {
      try {
        permissions = typeof user.vipPermissions === 'string' 
          ? JSON.parse(user.vipPermissions) 
          : user.vipPermissions;
      } catch (e) {
        permissions = [];
      }
    }
    setVipPermissions(permissions);
    setVipModalVisible(true);
  };

  const handleSaveVip = async () => {
    if (!vipEditingUser) return;
    try {
      await apiClient.put(`/admin/users/${vipEditingUser.id}/vip`, { 
        isVip: vipSwitchChecked,
        vipPermissions: vipSwitchChecked ? vipPermissions : []
      });
      message.success('VIP状态更新成功');
      setVipModalVisible(false);
      setVipEditingUser(null);
      setVipPermissions([]);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const handleViewActionLogs = async (user: any) => {
    setActionLogsUser(user);
    setActionLogsDrawerOpen(true);
    setActionLogsPage(1);
    await loadActionLogs(user.id, 1);
  };

  const loadActionLogs = async (userId: string, p: number = 1) => {
    setActionLogsLoading(true);
    try {
      const limit = 20;
      const offset = (p - 1) * limit;
      const response: any = await apiClient.get(`/admin/users/${userId}/action-logs`, { params: { limit, offset } });
      if (response.code === 0) {
        setActionLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
        setActionLogsTotal(response.data.total || 0);
      } else {
        setActionLogs([]);
        setActionLogsTotal(0);
      }
    } catch (error: any) {
      message.error(error.message || '加载日志失败');
      setActionLogs([]);
      setActionLogsTotal(0);
    } finally {
      setActionLogsLoading(false);
    }
  };

  const clearAdvancedFilters = () => {
    setFilterLevel('');
    setFilterIsVip('');
    setFilterPointsMin(undefined);
    setFilterPointsMax(undefined);
    setFilterDateStart('');
    setFilterDateEnd('');
    setFilterTags([]);
  };

  const handleExportUsers = async () => {
    setExporting(true);
    try {
      const params: Record<string, any> = {};
      if (keyword) params.keyword = keyword;
      if (registerType) params.registerType = registerType;
      if (status) params.status = status;
      if (filterLevel) params.level = filterLevel;
      if (filterIsVip) params.isVip = filterIsVip;
      if (filterPointsMin) params.pointsMin = filterPointsMin;
      if (filterPointsMax) params.pointsMax = filterPointsMax;
      if (filterDateStart) params.dateStart = filterDateStart;
      if (filterDateEnd) params.dateEnd = filterDateEnd;
      if (filterTags.length > 0) params.tags = filterTags.join(',');

      const response = await apiClient.get('/admin/users/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response as any], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `用户数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('导出成功');
    } catch (error: any) {
      message.error(error.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  /* ===== 渲染辅助 ===== */
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return dayjs(d).format('YYYY-MM-DD HH:mm');
    } catch { return '-'; }
  };

  const getRegisterTypeTags = (rt: string) => {
    if (rt === 'github') return <Tag color="purple" icon={<GithubOutlined />} style={{ margin: 0 }}>GitHub</Tag>;
    if (rt === 'email') return <Tag color="blue" icon={<MailOutlined />} style={{ margin: 0 }}>邮箱</Tag>;
    if (rt === 'github_and_email') return (
      <Space size={4}>
        <Tag color="purple" icon={<GithubOutlined />} style={{ margin: 0 }}>GitHub</Tag>
        <Tag color="blue" icon={<MailOutlined />} style={{ margin: 0 }}>邮箱</Tag>
      </Space>
    );
    return <Tag>未知</Tag>;
  };

  const identityTypeLabel: Record<string, string> = {
    university: '高校',
    enterprise: '企业',
    personal: '个人爱好',
    other: '其他',
  };

  const regionLabel: Record<string, string> = {
    mainland_china: '中国大陆',
    hongkong_macao_taiwan: '中国港澳台',
    overseas: '海外',
  };

  const handleEditProfile = (user: any) => {
    setProfileEditUser(user);
    setProfileIdentityType(user.identityType || '');
    setProfileOrganizationName(user.organizationName || '');
    setProfileRegion(user.region || '');
    setProfileEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!profileEditUser) return;
    setProfileEditLoading(true);
    try {
      await apiClient.put(`/admin/users/${profileEditUser.id}/profile`, {
        identityType: profileIdentityType || null,
        organizationName: profileOrganizationName?.trim() || null,
        region: profileRegion || null,
      });
      message.success('更新成功');
      setProfileEditVisible(false);
      setProfileEditUser(null);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setProfileEditLoading(false);
    }
  };

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
    const cfg = typeMap[actionType] || { color: 'default', text: actionType };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const getContentTypeTag = (contentType: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      paper: { color: 'blue', text: '论文' },
      video: { color: 'purple', text: '视频' },
      repo: { color: 'green', text: 'GitHub' },
      huggingface: { color: 'orange', text: 'HF模型' },
      job: { color: 'red', text: '岗位' },
      post: { color: 'cyan', text: '帖子' },
    };
    const cfg = typeMap[contentType] || { color: 'default', text: contentType };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  /* ===== 批量操作菜单 ===== */
  const batchMenuItems: MenuProps['items'] = [
    { key: 'ban', label: '批量禁用', icon: <StopOutlined />, onClick: () => handleBatchBan('ban') },
    { key: 'unban', label: '批量解禁', icon: <CheckCircleOutlined />, onClick: () => handleBatchBan('unban') },
    { type: 'divider' },
    { key: 'setVip', label: '批量设为 VIP', icon: <CrownOutlined />, onClick: () => handleBatchSetVip(true) },
    { key: 'unsetVip', label: '批量取消 VIP', icon: <StopOutlined />, onClick: () => handleBatchSetVip(false) },
    { type: 'divider' },
    { key: 'delete', label: '批量删除', icon: <DeleteOutlined />, danger: true, onClick: handleBatchDelete },
  ];

  /* ===== 表格列定义 ===== */
  const columns = [
    {
      title: '用户编码',
      dataIndex: 'userNumber',
      key: 'userNumber',
      width: 120,
      fixed: 'left' as const,
      ellipsis: { showTitle: true },
      render: (v: string | null) => (
        <Tooltip title={v ? `唯一标识：${v}` : '未分配'}>
          <span className={styles.userCodeCell}>{v || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 220,
      fixed: 'left' as const,
      render: (_: any, record: any) => (
        <div className={styles.userCell}>
          <Avatar
            size={36}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ background: '#1677ff', flexShrink: 0 }}
          />
          <div className={styles.userMeta}>
            <div className={styles.userName} title={record.username}>{record.username}</div>
            <div className={styles.userEmail} title={record.email}>{record.email || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '注册方式',
      dataIndex: 'registerType',
      key: 'registerType',
      width: 130,
      render: (rt: string) => getRegisterTypeTags(rt),
    },
    {
      title: '身份',
      dataIndex: 'identityType',
      key: 'identityType',
      width: 100,
      render: (v: string | null, record: any) => (
        <span style={{ fontSize: 12, color: v ? '#595959' : '#bfbfbf' }}>
          {v ? identityTypeLabel[v] || v : '-'}
        </span>
      ),
    },
    {
      title: '组织名称',
      dataIndex: 'organizationName',
      key: 'organizationName',
      width: 140,
      ellipsis: { showTitle: true },
      render: (v: string | null, record: any) => (
        <Tooltip title={v || '未填写'}>
          <span style={{ fontSize: 12, color: v ? '#595959' : '#bfbfbf' }}>
            {v ? (v.length > 12 ? `${v.slice(0, 12)}...` : v) : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '地域',
      dataIndex: 'region',
      key: 'region',
      width: 110,
      render: (v: string | null) => (
        <span style={{ fontSize: 12, color: v ? '#595959' : '#bfbfbf' }}>
          {v ? (regionLabel[v] || v) : '-'}
        </span>
      ),
    },
    {
      title: '等级 / 积分',
      key: 'levelPoints',
      width: 110,
      render: (_: any, record: any) => (
        <div className={styles.levelCell}>
          <span className={styles.levelBadge}>LV {record.level || 1}</span>
          <span className={styles.pointsText}>{(record.points || 0).toLocaleString()} 积分</span>
        </div>
      ),
    },
    {
      title: 'VIP',
      dataIndex: 'isVip',
      key: 'isVip',
      width: 90,
      render: (isVip: boolean, record: any) => (
        <Tooltip title="点击修改 VIP 状态">
          <Tag
            color={isVip ? 'gold' : 'default'}
            icon={isVip ? <CrownOutlined /> : undefined}
            style={{ cursor: 'pointer', margin: 0 }}
            onClick={() => handleEditVip(record)}
          >
            {isVip ? 'VIP' : '普通'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive: boolean) => (
        <span className={isActive ? styles.statusActive : styles.statusBanned}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {isActive ? '正常' : '已禁用'}
        </span>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: string[] | null, record: any) => {
        const list = Array.isArray(tags) ? tags : [];
        const shown = list.slice(0, 2);
        const extra = list.length - 2;
        return (
          <Space size={4} wrap>
            {shown.map((t, i) => <Tag key={i} color="cyan" style={{ margin: 0 }}>{t}</Tag>)}
            {extra > 0 && <Tag style={{ margin: 0 }}>+{extra}</Tag>}
            {list.length === 0 && <span style={{ color: '#bfbfbf', fontSize: 12 }}>无标签</span>}
            <Tooltip title="编辑标签">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditTags(record)} style={{ padding: '0 4px', height: 20 }} />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: '个人简介',
      dataIndex: 'bio',
      key: 'bio',
      width: 200,
      ellipsis: { showTitle: false },
      render: (bio: string | null) => (
        <Tooltip title={bio || '无简介'}>
          <span style={{ fontSize: 12, color: bio ? '#595959' : '#bfbfbf' }}>
            {bio ? (bio.length > 30 ? `${bio.substring(0, 30)}...` : bio) : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (location: string | null) => (
        <span style={{ fontSize: 12, color: location ? '#595959' : '#bfbfbf' }}>
          {location || '-'}
        </span>
      ),
    },
    {
      title: '技能/兴趣',
      key: 'skillsInterests',
      width: 180,
      render: (_: any, record: any) => {
        const skills = record.skills ? (typeof record.skills === 'string' ? record.skills.split(',').filter((s: string) => s.trim()) : []) : [];
        const interests = record.interests ? (typeof record.interests === 'string' ? record.interests.split(',').filter((i: string) => i.trim()) : []) : [];
        const all = [...skills.slice(0, 2), ...interests.slice(0, 1)];
        return (
          <Tooltip title={
            <div>
              {skills.length > 0 && <div>技能: {skills.join(', ')}</div>}
              {interests.length > 0 && <div>兴趣: {interests.join(', ')}</div>}
            </div>
          }>
            <Space size={4} wrap>
              {all.length > 0 ? (
                all.map((item: string, i: number) => (
                  <Tag key={i} color="blue" style={{ margin: 0, fontSize: 11 }}>{item.trim()}</Tag>
                ))
              ) : (
                <span style={{ color: '#bfbfbf', fontSize: 12 }}>-</span>
              )}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '社交链接',
      key: 'socialLinks',
      width: 150,
      render: (_: any, record: any) => {
        const links = [];
        if (record.githubUrl) links.push({ type: 'github', url: record.githubUrl, icon: <GithubOutlined /> });
        if (record.linkedinUrl) links.push({ type: 'linkedin', url: record.linkedinUrl });
        if (record.twitterUrl) links.push({ type: 'twitter', url: record.twitterUrl });
        if (record.websiteUrl) links.push({ type: 'website', url: record.websiteUrl });
        return (
          <Space size={4}>
            {links.length > 0 ? (
              links.slice(0, 3).map((link, i) => (
                <Tooltip key={i} title={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, color: '#1677ff' }}>
                    {link.icon || '🔗'}
                  </a>
                </Tooltip>
              ))
            ) : (
              <span style={{ color: '#bfbfbf', fontSize: 12 }}>-</span>
            )}
            {links.length > 3 && <span style={{ fontSize: 11, color: '#8c8c8c' }}>+{links.length - 3}</span>}
          </Space>
        );
      },
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (role: string | null) => (
        <Tag color={role === 'admin' ? 'red' : 'default'} style={{ margin: 0 }}>
          {role || 'user'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => (
        <Tooltip title={formatDate(date)}>
          <span style={{ fontSize: 12, color: '#595959' }}>{date ? dayjs(date).fromNow() : '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 130,
      render: (date: string | null) => (
        <Tooltip title={formatDate(date)}>
          <span style={{ fontSize: 12, color: date ? '#595959' : '#bfbfbf' }}>
            {date ? dayjs(date).fromNow() : '从未登录'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        const actionMenu: MenuProps['items'] = [
          { key: 'profile', label: '编辑身份/组织', icon: <TeamOutlined />, onClick: () => handleEditProfile(record) },
          { key: 'tags', label: '编辑标签', icon: <EditOutlined />, onClick: () => handleEditTags(record) },
          { key: 'vip', label: '编辑 VIP', icon: <CrownOutlined />, onClick: () => handleEditVip(record) },
          { key: 'logs', label: '行为日志', icon: <FileTextOutlined />, onClick: () => handleViewActionLogs(record) },
          { type: 'divider' },
          {
            key: 'ban',
            label: record.isActive ? '禁用用户' : '解禁用户',
            icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
            danger: record.isActive,
            onClick: () => handleBan(record.id, record.isActive ? 'ban' : 'unban'),
          },
        ];
        return (
          <div className={styles.actionCell}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewProfile(record)}
            >
              画像
            </Button>
            <Dropdown menu={{ items: actionMenu }} placement="bottomRight">
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  /* ===== 渲染 ===== */
  return (
    <div style={{ padding: 0 }}>
      {/* 页面顶部 */}
      <div className={styles.pageTop}>
        <div className={styles.pageTitleGroup}>
          <h1 className={styles.pageTitle}>用户管理</h1>
          <p className={styles.pageSubtitle}>管理所有注册用户 · 共 {total.toLocaleString()} 名用户</p>
        </div>

        <div className={styles.filterBar}>
          <Input.Search
            placeholder="搜索用户名 / 邮箱 / 用户编号"
            style={{ width: 220 }}
            onSearch={(val) => { setKeyword(val); setPage(1); }}
            enterButton={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="注册方式"
            style={{ width: 130 }}
            value={registerType || undefined}
            onChange={(v) => { setRegisterType(v); setPage(1); }}
            allowClear
          >
            <Select.Option value="github">GitHub</Select.Option>
            <Select.Option value="email">邮箱</Select.Option>
            <Select.Option value="github_and_email">GitHub + 邮箱</Select.Option>
          </Select>
          <Select
            placeholder="用户状态"
            style={{ width: 110 }}
            value={status || undefined}
            onChange={(v) => { setStatus(v); setPage(1); }}
            allowClear
          >
            <Select.Option value="active">正常</Select.Option>
            <Select.Option value="banned">已禁用</Select.Option>
          </Select>
          <Badge dot={hasAdvancedFilter} color="#1677ff">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setAdvancedFilterVisible(true)}
              type={hasAdvancedFilter ? 'primary' : 'default'}
              ghost={hasAdvancedFilter}
            >
              高级筛选
            </Button>
          </Badge>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExportUsers}
            style={{ marginLeft: 8 }}
          >
            导出Excel
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
            <TeamOutlined />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total.toLocaleString()}</div>
            <div className={styles.statLabel}>总用户数</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
            <CheckCircleOutlined />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.active.toLocaleString()}</div>
            <div className={styles.statLabel}>活跃用户</div>
            <div className={styles.statTrend}>
              {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}% 占比` : '-'}
            </div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGold}`}>
            <CrownOutlined />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.vip.toLocaleString()}</div>
            <div className={styles.statLabel}>VIP 用户</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconCyan}`}>
            <RiseOutlined />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.today.toLocaleString()}</div>
            <div className={styles.statLabel}>今日新增</div>
            <div className={styles.statTrend}>本周 {stats.week}</div>
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <div className={styles.batchBar}>
          <span className={styles.batchInfo}>已选择 {selectedRowKeys.length} 名用户</span>
          <Dropdown menu={{ items: batchMenuItems }}>
            <Button size="small" icon={<MoreOutlined />}>批量操作</Button>
          </Dropdown>
          <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
        </div>
      )}

      {/* 数据表格 */}
      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1920 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (p) => setPage(p),
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: false,
            style: { padding: '12px 16px', margin: 0 },
          }}
          size="middle"
        />
      </div>

      {/* ===== 标签编辑 Drawer ===== */}
      <Drawer
        title={
          <Space>
            <EditOutlined style={{ color: '#1677ff' }} />
            <span>编辑标签 · {editingUser?.username}</span>
          </Space>
        }
        width={460}
        open={tagsDrawerOpen}
        onClose={() => { setTagsDrawerOpen(false); setEditingUser(null); setTags([]); setNewTagInput(''); }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setTagsDrawerOpen(false); setEditingUser(null); setTags([]); setNewTagInput(''); }}>取消</Button>
              <Button type="primary" onClick={handleSaveTags}>保存标签</Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: '#1a1a1a' }}>添加标签</div>
          <div className={styles.tagInputRow}>
            <Input
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="输入标签名称，按回车添加"
              onPressEnter={handleAddTag}
              style={{ flex: 1 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>添加</Button>
          </div>
        </div>

        <Divider style={{ margin: '0 0 16px' }} />

        <div style={{ marginBottom: 8, fontWeight: 600, color: '#1a1a1a' }}>
          当前标签
          <span style={{ fontWeight: 400, color: '#8c8c8c', marginLeft: 6 }}>({tags.length})</span>
        </div>
        {tags.length > 0 ? (
          <div className={styles.tagGrid}>
            {tags.map((tag, i) => (
              <Tag
                key={i}
                closable
                onClose={() => setTags(tags.filter((_, idx) => idx !== i))}
                color="cyan"
                style={{ fontSize: 13, padding: '4px 10px' }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        ) : (
          <div className={styles.emptyPlaceholder}>暂无标签，请在上方添加</div>
        )}
      </Drawer>

      {/* ===== VIP 状态弹窗 ===== */}
      <Modal
        title={
          <Space>
            <CrownOutlined style={{ color: '#faad14' }} />
            <span>编辑 VIP 状态 · {vipEditingUser?.username}</span>
          </Space>
        }
        open={vipModalVisible}
        onOk={handleSaveVip}
        onCancel={() => { 
          setVipModalVisible(false); 
          setVipEditingUser(null); 
          setVipPermissions([]);
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 16, color: '#595959' }}>
            当前状态：
            {vipEditingUser?.isVip
              ? <Tag color="gold" icon={<CrownOutlined />} style={{ marginLeft: 8 }}>VIP 用户</Tag>
              : <Tag style={{ marginLeft: 8 }}>普通用户</Tag>
            }
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className={styles.vipSwitchRow} style={{ marginBottom: 12 }}>
              <Switch
                checked={vipSwitchChecked}
                onChange={setVipSwitchChecked}
                checkedChildren="VIP"
                unCheckedChildren="普通"
              />
              <span style={{ color: '#595959', fontSize: 13, marginLeft: 8 }}>
                {vipSwitchChecked ? '将设置为 VIP 用户' : '将设置为普通用户'}
              </span>
            </div>
            {vipSwitchChecked && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500, color: '#333' }}>
                  VIP 权限配置（可访问的页面）：
                </div>
                <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                  选择该VIP用户可以访问的页面。留空表示可访问所有页面。
                </div>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择可访问的页面（留空表示全部可访问）"
                  value={vipPermissions}
                  onChange={setVipPermissions}
                  options={availablePages.map(p => ({ label: p.label, value: p.key }))}
                />
                {vipPermissions.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {vipPermissions.map(key => {
                        const page = availablePages.find(p => p.key === key);
                        return (
                          <Tag key={key} color="blue" closable onClose={() => setVipPermissions(vipPermissions.filter(k => k !== key))}>
                            {page?.label || key}
                          </Tag>
                        );
                      })}
                    </Space>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.vipHint}>
            {vipSwitchChecked
              ? vipPermissions.length > 0
                ? `点击「保存」后，该用户将获得 VIP 权益，可访问：${vipPermissions.map(k => availablePages.find(p => p.key === k)?.label || k).join('、')}`
                : '点击「保存」后，该用户将获得 VIP 权益（可访问所有页面）'
              : vipEditingUser?.isVip
                ? '点击「保存」后，该用户的 VIP 权益将被取消'
                : '当前无变更'}
          </div>
        </div>
      </Modal>

      {/* ===== 身份/组织/地域 编辑弹窗 ===== */}
      <Modal
        title={`编辑资料 · ${profileEditUser?.username || ''}`}
        open={profileEditVisible}
        onOk={handleSaveProfile}
        onCancel={() => { setProfileEditVisible(false); setProfileEditUser(null); }}
        okText="保存"
        cancelText="取消"
        confirmLoading={profileEditLoading}
        width={420}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>身份</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择"
              value={profileIdentityType || undefined}
              onChange={setProfileIdentityType}
              allowClear
              options={[
                { value: 'university', label: '高校' },
                { value: 'enterprise', label: '企业' },
                { value: 'personal', label: '个人爱好' },
                { value: 'other', label: '其他' },
              ]}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>地域</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择"
              value={profileRegion || undefined}
              onChange={setProfileRegion}
              allowClear
              options={[
                { value: 'mainland_china', label: '中国大陆' },
                { value: 'hongkong_macao_taiwan', label: '中国港澳台' },
                { value: 'overseas', label: '海外' },
              ]}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>组织名称 <span style={{ fontWeight: 400, color: '#8c8c8c' }}>（选填）</span></div>
            <Input
              placeholder="学校、公司或组织名称"
              value={profileOrganizationName}
              onChange={e => setProfileOrganizationName(e.target.value)}
              maxLength={100}
              showCount
            />
          </div>
        </div>
      </Modal>

      {/* ===== 行为日志 Drawer ===== */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>行为日志 · {actionLogsUser?.username}</span>
          </Space>
        }
        width={820}
        open={actionLogsDrawerOpen}
        onClose={() => { setActionLogsDrawerOpen(false); setActionLogsUser(null); setActionLogs([]); setActionLogsTotal(0); setActionLogsPage(1); }}
        footer={null}
      >
        <Table
          columns={[
            { title: '时间', dataIndex: 'createdAt', key: 'time', width: 160, render: (t: string) => formatDate(t) },
            { title: '行为', dataIndex: 'actionType', key: 'action', width: 90, render: getActionTypeTag },
            { title: '内容类型', dataIndex: 'contentType', key: 'contentType', width: 100, render: getContentTypeTag },
            { title: '内容 ID', dataIndex: 'contentId', key: 'contentId', ellipsis: true },
            {
              title: '元数据', dataIndex: 'metadata', key: 'metadata', ellipsis: true,
              render: (meta: any) => {
                if (!meta) return '-';
                try {
                  const obj = typeof meta === 'string' ? JSON.parse(meta) : meta;
                  return <pre style={{ margin: 0, fontSize: 11, maxWidth: 220 }}>{JSON.stringify(obj, null, 2)}</pre>;
                } catch { return String(meta); }
              },
            },
          ]}
          dataSource={actionLogs}
          rowKey="id"
          loading={actionLogsLoading}
          size="small"
          pagination={{
            current: actionLogsPage,
            pageSize: 20,
            total: actionLogsTotal,
            onChange: (p) => {
              setActionLogsPage(p);
              if (actionLogsUser) loadActionLogs(actionLogsUser.id, p);
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
          locale={{ emptyText: '该用户暂无行为记录' }}
        />
      </Drawer>

      {/* ===== 高级筛选 Modal ===== */}
      <Modal
        title={<Space><FilterOutlined /><span>高级筛选</span></Space>}
        open={advancedFilterVisible}
        onOk={() => { setAdvancedFilterVisible(false); setPage(1); loadUsers(); }}
        onCancel={() => setAdvancedFilterVisible(false)}
        okText="应用筛选"
        cancelText="关闭"
        width={560}
      >
        <div style={{ paddingTop: 8 }}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>用户等级</div>
              <Select style={{ width: '100%' }} value={filterLevel || undefined} onChange={setFilterLevel} allowClear placeholder="选择等级">
                {[1, 2, 3, 4, 5].map(n => <Select.Option key={n} value={String(n)}>LV {n}</Select.Option>)}
              </Select>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>VIP 状态</div>
              <Select style={{ width: '100%' }} value={filterIsVip || undefined} onChange={setFilterIsVip} allowClear placeholder="选择 VIP 状态">
                <Select.Option value="true">VIP 用户</Select.Option>
                <Select.Option value="false">普通用户</Select.Option>
              </Select>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>积分范围（最小）</div>
              <Input type="number" value={filterPointsMin} onChange={(e) => setFilterPointsMin(e.target.value ? Number(e.target.value) : undefined)} placeholder="如：0" />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>积分范围（最大）</div>
              <Input type="number" value={filterPointsMax} onChange={(e) => setFilterPointsMax(e.target.value ? Number(e.target.value) : undefined)} placeholder="如：10000" />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>注册时间（起）</div>
              <Input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>注册时间（止）</div>
              <Input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} />
            </Col>
          </Row>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 6, fontWeight: 500, color: '#333' }}>标签筛选</div>
            <Select mode="tags" style={{ width: '100%' }} value={filterTags} onChange={setFilterTags} placeholder="输入标签后按回车" />
          </div>
          {hasAdvancedFilter && (
            <Button size="small" onClick={clearAdvancedFilters} style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}>
              清空所有筛选条件
            </Button>
          )}
        </div>
      </Modal>

      {/* ===== 用户画像 Drawer ===== */}
      <Drawer
        title={
          <Space>
            <UserOutlined style={{ color: '#1677ff' }} />
            <span>用户画像</span>
          </Space>
        }
        width={640}
        open={userProfileVisible}
        onClose={() => { setUserProfileVisible(false); setProfileUser(null); }}
        footer={null}
      >
        {profileUser && (
          <div style={{ position: 'relative' }}>
            {profileLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>加载中…</div>
              </div>
            )}

            {/* 用户信息头部 */}
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatarWrap}>
                <Avatar size={64} src={profileUser.avatar} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                {profileUser.isVip && <span className={styles.profileBadge}>VIP</span>}
              </div>
              <div className={styles.profileMeta}>
                <h2 className={styles.profileName}>{profileUser.username}</h2>
                <p className={styles.profileEmail}>{profileUser.email || '未绑定邮箱'}</p>
                <div className={styles.profileTags}>
                  <Tag color="blue">LV {profileUser.level || 1}</Tag>
                  <Tag color={profileUser.isActive ? 'success' : 'error'}>{profileUser.isActive ? '正常' : '已禁用'}</Tag>
                  {getRegisterTypeTags(profileUser.registerType)}
                </div>
              </div>
            </div>

            {/* 基本信息 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 12 }}>基本信息</div>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="用户编码">{profileUser.userNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="积分">{(profileUser.points || 0).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="注册时间">{formatDate(profileUser.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="最近登录">{formatDate(profileUser.lastLoginAt)}</Descriptions.Item>
                <Descriptions.Item label="标签" span={2}>
                  {Array.isArray(profileUser.tags) && profileUser.tags.length > 0
                    ? profileUser.tags.map((t: string, i: number) => <Tag key={i} color="cyan">{t}</Tag>)
                    : <span style={{ color: '#bfbfbf' }}>暂无标签</span>}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* GitHub 信息 */}
            {profileUser.githubData && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 12 }}>
                  <GithubOutlined style={{ marginRight: 6 }} />GitHub 信息
                </div>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="GitHub ID">{profileUser.githubId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="姓名">{profileUser.githubData.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="公司">{profileUser.githubData.company || '-'}</Descriptions.Item>
                  <Descriptions.Item label="城市">{profileUser.githubData.location || '-'}</Descriptions.Item>
                  <Descriptions.Item label="粉丝 / 关注">
                    {profileUser.githubData.followers || 0} / {profileUser.githubData.following || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="公开仓库">{profileUser.githubData.publicRepos || 0}</Descriptions.Item>
                  {(profileUser.githubData.blog || profileUser.githubData.htmlUrl) && (
                    <Descriptions.Item label="链接" span={2}>
                      <Space>
                        {profileUser.githubData.htmlUrl && <a href={profileUser.githubData.htmlUrl} target="_blank" rel="noopener noreferrer">GitHub 主页</a>}
                        {profileUser.githubData.blog && <a href={profileUser.githubData.blog} target="_blank" rel="noopener noreferrer">博客</a>}
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}

            {/* 行为统计 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 12 }}>行为统计</div>
              <div className={styles.miniStatGrid}>
                <div className={styles.miniStat}>
                  <div className={styles.miniStatValue}>{profileUser.actionStats?.view || 0}</div>
                  <div className={styles.miniStatLabel}><EyeOutlined /> 浏览</div>
                </div>
                <div className={styles.miniStat}>
                  <div className={styles.miniStatValue}>{profileUser.actionStats?.like || 0}</div>
                  <div className={styles.miniStatLabel}><LikeOutlined /> 点赞</div>
                </div>
                <div className={styles.miniStat}>
                  <div className={styles.miniStatValue}>{profileUser.actionStats?.favorite || 0}</div>
                  <div className={styles.miniStatLabel}><StarOutlined /> 收藏</div>
                </div>
              </div>
            </div>

            {/* 内容偏好 */}
            {profileUser.contentStats && Object.keys(profileUser.contentStats).length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 12 }}>
                  <FireOutlined style={{ marginRight: 6, color: '#fa8c16' }} />内容偏好
                </div>
                {Object.entries(profileUser.contentStats).map(([type, count]: [string, any]) => {
                  const maxVal = Math.max(...Object.values(profileUser.contentStats) as number[]);
                  return (
                    <div key={type} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span>{getContentTypeLabel(type)}</span>
                        <span style={{ color: '#8c8c8c' }}>{count} 次</span>
                      </div>
                      <Progress percent={Math.min(maxVal > 0 ? (count / maxVal) * 100 : 0, 100)} size="small" showInfo={false} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function getContentTypeLabel(contentType: string): string {
  const labels: Record<string, string> = {
    paper: '论文',
    video: '视频',
    repo: 'GitHub 项目',
    huggingface: 'HuggingFace 模型',
    job: '招聘岗位',
    post: '帖子',
  };
  return labels[contentType] || contentType;
}
