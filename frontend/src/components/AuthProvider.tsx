'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // 在组件挂载时初始化认证状态
    initialize();
  }, [initialize]);

  return <>{children}</>;
}