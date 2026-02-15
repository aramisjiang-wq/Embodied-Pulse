'use client';

import { useState, useEffect, useCallback } from 'react';
import { Menu, Badge, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  StarOutlined,
  SearchOutlined,
  SettingOutlined,
  HeartOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { subscriptionApi } from '@/lib/api/subscription';

interface GlobalSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function GlobalSidebar({ collapsed: controlledCollapsed, onCollapse }: GlobalSidebarProps) {
  const { token } = theme.useToken();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [subscriptionNewCount, setSubscriptionNewCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = (value: boolean) => {
    if (onCollapse) {
      onCollapse(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  const loadSubscriptionNewCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await subscriptionApi.getSubscriptions({ page: 1, size: 100 });
      const totalNewCount = (data.items || []).reduce((sum: number, sub) => {
        if (sub && typeof sub === 'object' && 'newCount' in sub) {
          const value = (sub as { newCount?: unknown }).newCount;
          return sum + (typeof value === 'number' ? value : 0);
        }
        return sum;
      }, 0);
      setSubscriptionNewCount(totalNewCount);
    } catch (error) {
      console.error('Load subscription new count error:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSubscriptionNewCount();
      const interval = setInterval(loadSubscriptionNewCount, 30000);
      return () => clearInterval(interval);
    } else {
      setSubscriptionNewCount(0);
    }
  }, [user, loadSubscriptionNewCount]);

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/subscriptions',
      icon: <StarOutlined />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>我的订阅</span>
          {user && subscriptionNewCount > 0 && (
            <Badge count={subscriptionNewCount} size="small" />
          )}
        </span>
      ),
    },
    {
      key: '/favorites',
      icon: <HeartOutlined />,
      label: '我的收藏',
    },
    {
      key: '/my-community',
      icon: <UsergroupAddOutlined />,
      label: '我的市集',
    },
    {
      type: 'divider',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '搜索',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 64,
        height: 'calc(100vh - 64px)',
        width: collapsed ? 80 : 200,
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorder}`,
        zIndex: 100,
        overflow: 'auto',
        transition: 'width 0.2s',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={pathname ? [pathname] : []}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ 
          height: '100%',
          borderRight: 'none',
          paddingTop: 8
        }}
        inlineCollapsed={collapsed}
      />
    </aside>
  );
}
