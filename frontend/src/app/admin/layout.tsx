/**
 * 管理端布局
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, App } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  CommentOutlined,
  BarChartOutlined,
  BellOutlined,
  LockOutlined,
  ReloadOutlined,
  LogoutOutlined,
  SettingOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/auth';

const { Sider, Content, Header } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, initialize, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    // 初始化token（从localStorage加载）
    initialize();
  }, [initialize]);

  useEffect(() => {
    // 跳过登录页面的检查
    if (pathname === '/admin/login') {
      setAuthChecked(false);
      return;
    }
    
    // 检查是否有登录成功标志（在登录后的短时间内，跳过检查）
    const loginSuccess = typeof window !== 'undefined' ? sessionStorage.getItem('admin_login_success') : null;
    const loginTimestamp = typeof window !== 'undefined' ? sessionStorage.getItem('admin_login_timestamp') : null;
    const savedUser = typeof window !== 'undefined' ? sessionStorage.getItem('admin_user') : null;
    
    if (loginSuccess === 'true' && loginTimestamp) {
      const timeSinceLogin = Date.now() - parseInt(loginTimestamp, 10);
      // 如果登录成功标志存在且距离登录时间少于5秒，恢复用户信息
      if (timeSinceLogin < 5000) {
        console.log('[AdminLayout] Login success flag found, restoring user info');
        
        // 恢复用户信息
        if (savedUser && !user) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            console.log('[AdminLayout] User info restored from sessionStorage:', userData.email);
          } catch (e) {
            console.error('[AdminLayout] Failed to parse saved user:', e);
          }
        }
        
        // 初始化token
        initialize();
        
        // 清除标志（但保留用户信息，以防需要）
        if (timeSinceLogin > 2000) {
          sessionStorage.removeItem('admin_login_success');
          sessionStorage.removeItem('admin_login_timestamp');
        }
        
        // 如果已经有token和user，直接返回，不进行后续检查
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);
        if (savedToken && currentUser) {
          console.log('[AdminLayout] Token and user ready, skipping auth check');
          if (!user && currentUser) {
            setUser(currentUser);
          }
          setAuthChecked(true);
          return;
        }
      } else {
        // 超过5秒，清除过期标志
        sessionStorage.removeItem('admin_login_success');
        sessionStorage.removeItem('admin_login_timestamp');
        sessionStorage.removeItem('admin_user');
      }
    }
    
    // 如果已经检查过且用户已登录，不再重复检查
    if (authChecked && user && token) {
      console.log('[AdminLayout] Already authenticated and checked, skipping');
      return;
    }
    
    // 延迟检查，确保登录后的 token 已经保存
    const checkAuth = setTimeout(() => {
      // 检查Token和用户信息（管理端使用admin_token）
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const currentToken = token || savedToken;
      
      console.log('[AdminLayout] Auth check:', {
        pathname,
        hasToken: !!currentToken,
        hasUser: !!user,
        tokenFromStore: !!token,
        tokenFromStorage: !!savedToken,
        loading,
        authChecked,
      });
      
      // 检查是否已登录（至少要有token）
      if (!currentToken) {
        console.warn('[AdminLayout] No token found, redirecting to login');
        setAuthChecked(true);
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        return;
      }
      
      // 如果有token且有user信息，说明已经登录成功
      if (currentToken && user) {
        console.log('[AdminLayout] User authenticated:', user.username);
        setAuthChecked(true);
        return;
      }
      
      // 如果有token但没有user信息，尝试获取用户信息
      if (currentToken && !user && !loading) {
        console.log('[AdminLayout] Token found but no user, loading user info...');
        // 先尝试从 sessionStorage 恢复用户信息
        const savedUser = typeof window !== 'undefined' ? sessionStorage.getItem('admin_user') : null;
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            console.log('[AdminLayout] User info restored from sessionStorage:', userData.email);
            setAuthChecked(true);
            return;
          } catch (e) {
            console.error('[AdminLayout] Failed to parse saved user:', e);
          }
        }
        // 如果 sessionStorage 没有，则从 API 加载
        loadUserInfo();
      }
      
      setAuthChecked(true);
    }, 200); // 增加延迟时间，确保登录后的状态已保存
    
    return () => clearTimeout(checkAuth);
  }, [user, token, pathname, router, loading, authChecked, initialize, setUser]);

  const loadUserInfo = async () => {
    // 防止重复调用
    if (loading) {
      console.log('[AdminLayout] loadUserInfo already in progress, skipping');
      return;
    }
    
    // 再次检查token是否存在
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!savedToken) {
      console.warn('[AdminLayout] No token found before loadUserInfo');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[AdminLayout] Loading user info...');
      const userInfo = await authApi.getAdminMe();
      console.log('[AdminLayout] User info loaded:', userInfo?.email);
      setUser(userInfo);
      setAuthChecked(true);
    } catch (error: any) {
      console.error('[AdminLayout] Failed to load user info:', error);
      
      // 再次检查token是否仍然存在
      const stillHasToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      
      // 只有明确的认证错误且token确实不存在时才跳转
      const errorCode = error.code || error.status;
      const errorMessage = error.message || '';
      
      const isAuthError = (
        errorCode === 401 || 
        errorCode === 'UNAUTHORIZED' ||
        errorMessage.includes('401') || 
        errorMessage.includes('未登录') ||
        errorMessage.includes('token') ||
        errorMessage.includes('认证')
      );
      
      if (isAuthError && !stillHasToken) {
        // 确认是认证错误且token不存在，清除并跳转
        console.warn('[AdminLayout] Auth error and no token, redirecting to login');
        logout();
        router.push('/admin/login');
      } else if (isAuthError && stillHasToken) {
        // 认证错误但token存在，说明token无效，清除并跳转
        console.warn('[AdminLayout] Auth error but token exists, clearing token and redirecting to login');
        logout();
        router.push('/admin/login');
      } else {
        // 其他错误（如网络错误），不跳转，只记录日志
        console.warn('[AdminLayout] Non-auth error, keeping user on page:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    router.push('/admin/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      message.info('个人信息功能开发中');
    } else if (key === 'settings') {
      message.info('设置功能开发中');
    }
  };

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '数据看板',
      onClick: () => router.push('/admin'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'paper-management',
      icon: <FileTextOutlined />,
      label: '论文',
      children: [
        {
          key: '/admin/content/papers',
          icon: <FileTextOutlined />,
          label: '论文管理',
          onClick: () => router.push('/admin/content/papers'),
        },
        {
          key: '/admin/paper-search-keywords',
          icon: <FileTextOutlined />,
          label: '论文搜索关键词管理',
          onClick: () => router.push('/admin/paper-search-keywords'),
        },
      ],
    },
    {
      key: 'news-management',
      icon: <FileTextOutlined />,
      label: '新闻',
      children: [
        {
          key: '/admin/content/news',
          icon: <FileTextOutlined />,
          label: '新闻管理',
          onClick: () => router.push('/admin/content/news'),
        },
        {
          key: '/admin/news-search-keywords',
          icon: <FileTextOutlined />,
          label: '新闻搜索关键词管理',
          onClick: () => router.push('/admin/news-search-keywords'),
        },
      ],
    },
    {
      key: 'github-management',
      icon: <GithubOutlined />,
      label: 'GitHub',
      children: [
        {
          key: '/admin/content/repos',
          icon: <GithubOutlined />,
          label: 'GitHub项目管理',
          onClick: () => router.push('/admin/content/repos'),
        },
      ],
    },
    {
      key: 'content-management',
      icon: <FileTextOutlined />,
      label: '内容管理',
      children: [
        {
          key: '/admin/content/huggingface',
          icon: <RobotOutlined />,
          label: 'HuggingFace模型',
          onClick: () => router.push('/admin/content/huggingface'),
        },
        {
          key: '/admin/content/jobs',
          icon: <TeamOutlined />,
          label: '招聘岗位管理',
          onClick: () => router.push('/admin/content/jobs'),
        },
        {
          key: '/admin/subscriptions',
          icon: <BellOutlined />,
          label: '订阅管理',
          onClick: () => router.push('/admin/subscriptions'),
        },
      ],
    },
    {
      key: 'bilibili-management',
      icon: <PlayCircleOutlined />,
      label: 'B站',
      children: [
        {
          key: '/admin/content/videos',
          icon: <PlayCircleOutlined />,
          label: '视频管理',
          onClick: () => router.push('/admin/content/videos'),
        },
        {
          key: '/admin/bilibili-uploaders',
          icon: <UserOutlined />,
          label: 'UP主订阅',
          onClick: () => router.push('/admin/bilibili-uploaders'),
        },
        {
          key: '/admin/bilibili-search-keywords',
          icon: <FileTextOutlined />,
          label: '搜索词管理',
          onClick: () => router.push('/admin/bilibili-search-keywords'),
        },
      ],
    },
    {
      key: 'operations-management',
      icon: <BarChartOutlined />,
      label: '运营管理',
      children: [
        {
          key: '/admin/banners',
          icon: <FileTextOutlined />,
          label: 'Banner管理',
          onClick: () => router.push('/admin/banners'),
        },
        {
          key: '/admin/home-modules',
          icon: <FileTextOutlined />,
          label: '首页模块',
          onClick: () => router.push('/admin/home-modules'),
        },
        {
          key: '/admin/pages',
          icon: <FileTextOutlined />,
          label: '自定义页面',
          onClick: () => router.push('/admin/pages'),
        },
      ],
    },
    {
      key: 'user-management',
      icon: <UserOutlined />,
      label: '用户管理',
      children: [
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: '注册用户',
          onClick: () => router.push('/admin/users'),
        },
      ],
    },
    {
      key: 'community-management',
      icon: <CommentOutlined />,
      label: '市集管理',
      children: [
        {
          key: '/admin/community',
          icon: <CommentOutlined />,
          label: '市集管理',
          onClick: () => router.push('/admin/community'),
        },
      ],
    },
    {
      key: 'system-management',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        {
          key: '/admin/admins',
          icon: <LockOutlined />,
          label: '管理员',
          onClick: () => router.push('/admin/admins'),
        },
        {
          key: '/admin/data-sources',
          icon: <ReloadOutlined />,
          label: '第三方API管理',
          onClick: () => router.push('/admin/data-sources'),
        },
      ],
    },
  ];

  // 如果是登录页面，不显示侧边栏和布局
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff', boxShadow: '2px 0 8px rgba(0,0,0,0.08)' }}>
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <GithubOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
            Embodied Pulse
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname || '']}
          defaultOpenKeys={['paper-management', 'news-management', 'github-management', 'content-management', 'bilibili-management', 'operations-management', 'user-management', 'community-management', 'system-management']}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ background: '#f0f2f5' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
            管理后台
          </div>
          <Space>
            {user ? (
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                  <Avatar
                    src={user.avatarUrl}
                    icon={!user.avatarUrl && <UserOutlined />}
                    size="default"
                  />
                  <span>{user.username || user.email}</span>
                </Space>
              </Dropdown>
            ) : (
              <Button type="link" onClick={handleLogout} icon={<LogoutOutlined />}>
                退出登录
              </Button>
            )}
          </Space>
        </Header>
        <Content
          style={{
            padding: 24,
            margin: '16px',
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
