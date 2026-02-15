/**
 * 全局侧边栏包装器
 * 管理侧边栏状态和主内容区域的响应式布局
 * L形布局：Logo和侧边栏在顶部左侧，Tab栏在顶部右侧
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('./Header'), { ssr: false });
const GlobalSidebar = dynamic(() => import('./GlobalSidebar'), { ssr: false });

export default function GlobalSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const hideLayoutPages = ['/login', '/register', '/forgot-password', '/auth/github/callback'];
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldHideLayout = isAdminPage || hideLayoutPages.some(page => pathname?.startsWith(page));

  if (shouldHideLayout) {
    return <>{children}</>;
  }

  const marginLeft = isMobile ? 0 : (collapsed ? 80 : 200);
  const width = isMobile ? '100%' : (collapsed ? 'calc(100% - 80px)' : 'calc(100% - 200px)');

  return (
    <>
      {mounted && <Header sidebarCollapsed={collapsed} onSidebarCollapse={setCollapsed} />}
      {mounted && !isMobile && <GlobalSidebar collapsed={collapsed} onCollapse={setCollapsed} />}
      <div 
        id="main-content"
        style={{ 
          marginTop: 64,
          marginLeft: mounted ? marginLeft : 200,
          width: mounted ? width : 'calc(100% - 200px)',
          transition: 'all 0.2s',
          minHeight: 'calc(100vh - 64px)',
          padding: 0,
          overflowX: 'hidden'
        }}
      >
        {children}
      </div>
    </>
  );
}
