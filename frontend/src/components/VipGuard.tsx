'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useVipPermission } from '@/hooks/useVipPermission';
import { Result, Button, Spin } from 'antd';
import { CrownOutlined } from '@ant-design/icons';

interface VipGuardProps {
  children: React.ReactNode;
}

export default function VipGuard({ children }: VipGuardProps) {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useAuthStore();
  const { isVip } = useVipPermission();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && hydrated && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [mounted, hydrated, isAuthenticated, router]);

  if (!mounted || !hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="正在跳转到登录页面..." />
      </div>
    );
  }

  if (!isVip) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: '600px', margin: '0 auto' }}>
        <Result
          icon={<CrownOutlined style={{ color: '#faad14', fontSize: '72px' }} />}
          title="需要VIP权限"
          subTitle="此功能需要VIP权限才能访问，升级VIP即可解锁更多专属功能"
          extra={[
            <Button type="primary" key="upgrade" onClick={() => router.push('/settings?vip=true')}>
              升级VIP会员
            </Button>,
            <Button key="back" onClick={() => router.back()}>
              返回上一页
            </Button>,
          ]}
        />
        <div style={{ marginTop: '24px', textAlign: 'center', color: '#8c8c8c' }}>
          <p>VIP专属权益：</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>• B站UP主数据分析</li>
            <li>• 更多VIP专属功能即将上线</li>
          </ul>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
