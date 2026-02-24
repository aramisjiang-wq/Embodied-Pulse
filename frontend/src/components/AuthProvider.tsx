'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initialize, setUser, token, isAuthenticated, hydrated, isAdmin } = useAuthStore();
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    console.log('[AuthProvider] initialize called, pathname:', pathname);
    initialize(pathname ?? undefined);
  }, [initialize, pathname]);

  useEffect(() => {
    console.log('[AuthProvider] Effect triggered:', { hydrated, hasToken: !!token, isAuthenticated, hasRefreshed: hasRefreshedRef.current });
    
    if (!hydrated) return;
    if (!token || !isAuthenticated) return;
    if (hasRefreshedRef.current) return;
    
    console.log('[AuthProvider] Calling getMe()...');
    hasRefreshedRef.current = true;
    authApi.getMe()
      .then((user) => {
        setUser(user, isAdmin);
        console.log('[AuthProvider] User data refreshed from server:', user.email, { identityType: user.identityType, region: user.region });
      })
      .catch((err) => {
        console.warn('[AuthProvider] Failed to refresh user data:', err.message, err);
        hasRefreshedRef.current = false;
      });
  }, [hydrated, token, isAuthenticated, isAdmin, setUser]);

  return <>{children}</>;
}