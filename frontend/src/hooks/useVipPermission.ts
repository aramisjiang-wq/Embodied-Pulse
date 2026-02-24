'use client';

import { useAuthStore } from '@/store/authStore';

export function useVipPermission() {
  const { user, isAuthenticated } = useAuthStore();

  const hasVipPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (!user.isVip) {
      return false;
    }

    const permissions = user.vipPermissions || [];
    return permissions.includes(permission);
  };

  const isVip = (): boolean => {
    return isAuthenticated && user?.isVip === true;
  };

  return {
    isVip: isVip(),
    hasVipPermission,
    user,
    isAuthenticated,
  };
}
