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
  LogoutOutlined,
  SettingOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  ApiOutlined,
  ToolOutlined,
  PictureOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  WarningOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/auth';
import styles from './layout.module.css';

const { Sider, Content, Header } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, initialize, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    initialize(pathname ?? '/admin');
  }, [initialize, pathname, mounted]);

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
            setUser(userData, true);
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
            setUser(currentUser, true);
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
            setUser(userData, true);
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
      setUser(userInfo, true);
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
      key: 'site-data',
      icon: <BarChartOutlined />,
      label: '网站数据',
      children: [
        {
          key: '/admin',
          icon: <DashboardOutlined />,
          label: '数据看板',
          onClick: () => router.push('/admin'),
        },
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: '注册用户',
          onClick: () => router.push('/admin/users'),
        },
      ],
    },
    {
      key: 'content-management',
      icon: <AppstoreOutlined />,
      label: '内容管理',
      children: [
        {
          key: '/admin/content/papers',
          icon: <FileTextOutlined />,
          label: '论文管理',
          onClick: () => router.push('/admin/content/papers'),
        },
        {
          key: '/admin/paper-search-keywords',
          icon: <SearchOutlined />,
          label: '论文搜索关键词',
          onClick: () => router.push('/admin/paper-search-keywords'),
        },
        {
          key: '/admin/content/repos',
          icon: <GithubOutlined />,
          label: 'Github代码管理',
          onClick: () => router.push('/admin/content/repos'),
        },
        {
          key: '/admin/content/huggingface',
          icon: <RobotOutlined />,
          label: 'Huggingface管理',
          onClick: () => router.push('/admin/content/huggingface'),
        },
        {
          key: '/admin/content/videos',
          icon: <PlayCircleOutlined />,
          label: '视频管理',
          onClick: () => router.push('/admin/content/videos'),
        },
        {
          key: '/admin/bilibili-uploaders',
          icon: <TeamOutlined />,
          label: 'UP管理',
          onClick: () => router.push('/admin/bilibili-uploaders'),
        },
        {
          key: '/admin/bilibili-search-keywords',
          icon: <SearchOutlined />,
          label: '视频搜索词管理',
          onClick: () => router.push('/admin/bilibili-search-keywords'),
        },
        {
          key: '/admin/content/jobs',
          icon: <ThunderboltOutlined />,
          label: '招聘管理',
          onClick: () => router.push('/admin/content/jobs'),
        },
        {
          key: '/admin/news',
          icon: <NotificationOutlined />,
          label: '新闻管理',
          onClick: () => router.push('/admin/news'),
        },
        {
          key: '/admin/community',
          icon: <CommentOutlined />,
          label: '市集管理',
          onClick: () => router.push('/admin/community'),
        },
        {
          key: '/admin/subscriptions',
          icon: <BellOutlined />,
          label: '订阅管理',
          onClick: () => router.push('/admin/subscriptions'),
        },
        {
          key: '/admin/data-sources',
          icon: <ApiOutlined />,
          label: '第三方API管理',
          onClick: () => router.push('/admin/data-sources'),
        },
      ],
    },
    {
      key: 'operations-tools',
      icon: <ToolOutlined />,
      label: '运营工具',
      children: [
        {
          key: '/admin/banners',
          icon: <PictureOutlined />,
          label: 'Banner管理',
          onClick: () => router.push('/admin/banners'),
        },
        {
          key: '/admin/home-modules',
          icon: <AppstoreOutlined />,
          label: '首页模块管理',
          onClick: () => router.push('/admin/home-modules'),
        },
        {
          key: '/admin/admins',
          icon: <LockOutlined />,
          label: '管理员',
          onClick: () => router.push('/admin/admins'),
        },
      ],
    },
    {
      key: 'system-management',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        {
          key: '/admin/system',
          icon: <HeartOutlined />,
          label: '系统概览',
          onClick: () => router.push('/admin/system'),
        },
        {
          key: '/admin/system/health',
          icon: <HeartOutlined />,
          label: '健康状态',
          onClick: () => router.push('/admin/system/health'),
        },
        {
          key: '/admin/system/tech-debt',
          icon: <WarningOutlined />,
          label: '技术债务',
          onClick: () => router.push('/admin/system/tech-debt'),
        },
      ],
    },
  ];

  const isLoginPage = pathname === '/admin/login';

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={216}
        className={styles.sider}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 14, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
              Embodied Pulse
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.2, marginTop: 1 }}>
              管理后台
            </div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[pathname || '']}
          defaultOpenKeys={['site-data', 'content-management', 'operations-tools']}
          style={{
            borderRight: 0,
            fontSize: 13,
            paddingTop: 4,
          }}
          items={menuItems}
        />
      </Sider>

      <Layout style={{ marginLeft: 216, background: '#f5f6fa' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            height: 52,
            lineHeight: '52px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
            管理后台
          </div>
          <Space size={4}>
            {user ? (
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}
                  className="admin-user-dropdown"
                >
                  <Avatar
                    src={user.avatarUrl}
                    icon={!user.avatarUrl && <UserOutlined />}
                    size={28}
                    style={{ background: '#1677ff' }}
                  />
                  <span style={{ fontSize: 13, color: '#333' }}>{user.username || user.email}</span>
                </Space>
              </Dropdown>
            ) : (
              <Button size="small" type="text" onClick={handleLogout} icon={<LogoutOutlined />}>
                退出登录
              </Button>
            )}
          </Space>
        </Header>

        <Content
          style={{
            padding: 20,
            margin: '16px',
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
