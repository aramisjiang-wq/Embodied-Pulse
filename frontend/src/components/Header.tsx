'use client';

import { Avatar, Dropdown, Button, Space, Badge, theme } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  GithubOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  BellOutlined,
  MenuOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  RiseOutlined,
  TeamOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import NotificationList from './NotificationList';
import { getUnreadCount } from '@/api/notifications';
import MobileNav from './MobileNav';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onSidebarCollapse?: (collapsed: boolean) => void;
}

export default function Header({ sidebarCollapsed = false, onSidebarCollapse }: HeaderProps) {
  const { token } = theme.useToken();
  const handleSidebarToggle = () => {
    if (onSidebarCollapse) {
      onSidebarCollapse(!sidebarCollapsed);
    }
  };
  const { user, logout, hydrated } = useAuthStore();
  const router = useRouter();
  
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('user_token');
    if (hydrated && user && hasToken) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [hydrated, user, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userMenu = user ? {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => router.push('/profile'),
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
        onClick: () => router.push('/settings'),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  } : undefined;

  const logoWidth = sidebarCollapsed ? 80 : 200;
  const showUserMenu = mounted && user;
  const showAuthButtons = !mounted || !user;

  return (
    <header 
      style={{ 
        background: token.colorBgContainer, 
        padding: '0', 
        borderBottom: `1px solid ${token.colorBorder}`,
        display: 'flex',
        alignItems: 'center',
        height: 64,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          width: logoWidth,
          padding: '0 16px',
          borderRight: `1px solid ${token.colorBorder}`,
          transition: 'width 0.2s',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}
      >
        <Link 
          href="/" 
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: 1 }}
        >
          {sidebarCollapsed ? (
            <GithubOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GithubOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
              <span style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: token.colorPrimary,
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.5px'
              }}>
                Embodied Pulse
              </span>
            </div>
          )}
        </Link>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'visible' }}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={handleSidebarToggle}
            style={{ fontSize: 16, padding: 0, width: 24, height: 24, marginRight: 16 }}
          />
          
          <div className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFF7ED';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <HomeOutlined style={{ fontSize: 16, color: '#EA580C' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>首页</span>
              </div>
            </Link>
            <Link href="/papers" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <FileTextOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>论文</span>
              </div>
            </Link>
            <Link href="/repos" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FAF5FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <GithubOutlined style={{ fontSize: 16, color: '#9333EA' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>Github</span>
              </div>
            </Link>
            <Link href="/huggingface" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ECFDF5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <RobotOutlined style={{ fontSize: 16, color: '#10B981' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>Huggingface</span>
              </div>
            </Link>
            <Link href="/videos" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FDF2F8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <PlayCircleOutlined style={{ fontSize: 16, color: '#EC4899' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>视频</span>
              </div>
            </Link>
            <Link href="/jobs" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFFBEB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <RiseOutlined style={{ fontSize: 16, color: '#F59E0B' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>招聘</span>
              </div>
            </Link>
            <Link href="/community" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F0FDF4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <TeamOutlined style={{ fontSize: 16, color: '#22C55E' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>市集</span>
              </div>
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileNavVisible(true)}
            className="mobile-menu-btn"
            style={{ fontSize: 18, display: 'none' }}
          />

          <div 
            className="desktop-auth-buttons"
            style={{ display: showAuthButtons ? 'flex' : 'none', gap: 8 }}
          >
            <Link href="/login">
              <Button type="default">登录</Button>
            </Link>
            <Link href="/register">
              <Button type="primary">注册</Button>
            </Link>
          </div>
          
          {showUserMenu && (
            <div className="desktop-user-menu" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'notifications',
                      label: (
                        <div style={{ width: 400, maxHeight: 600 }}>
                          <NotificationList onClose={() => setNotificationVisible(false)} />
                        </div>
                      ),
                    },
                  ],
                }}
                open={notificationVisible}
                onOpenChange={setNotificationVisible}
                placement="bottomRight"
                trigger={['click']}
              >
                <Badge count={unreadCount} size="small" offset={[-5, 5]}>
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    style={{ fontSize: 18 }}
                  />
                </Badge>
              </Dropdown>

              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar src={user!.avatarUrl} icon={<UserOutlined />} />
                  <span>{user!.username}</span>
                  <span style={{ color: token.colorPrimary }}>LV{user!.level}</span>
                  <span style={{ color: token.colorTextSecondary }}>{user!.points}积分</span>
                </Space>
              </Dropdown>
            </div>
          )}
        </div>
      </div>

      <MobileNav visible={mobileNavVisible} onClose={() => setMobileNavVisible(false)} />

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-user-menu {
            display: none !important;
          }
          .desktop-auth-buttons {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-nav-tabs {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
