import { create } from 'zustand';
import { User } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hydrated: boolean;
  isInitializing: boolean;
  setUser: (user: User | null, isAdmin?: boolean) => void;
  setToken: (token: string | null, isAdmin?: boolean) => void;
  setRefreshToken: (refreshToken: string | null, isAdmin?: boolean) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
  updateProfile: (data: Partial<User>) => void;
  initialize: (pathname?: string) => void;
}

const getTokenKey = (isAdmin: boolean): string => {
  return isAdmin ? 'admin_token' : 'user_token';
};

const getRefreshTokenKey = (isAdmin: boolean): string => {
  return isAdmin ? 'admin_refresh_token' : 'user_refresh_token';
};

const getUserKey = (isAdmin: boolean): string => {
  return isAdmin ? 'admin_user' : 'user_user';
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  hydrated: false,
  isInitializing: false,
  
  setUser: (user, isAdmin) => {
    const effectiveIsAdmin = isAdmin ?? get().isAdmin;
    if (typeof window !== 'undefined') {
      const key = getUserKey(effectiveIsAdmin);
      if (user) {
        localStorage.setItem(key, JSON.stringify(user));
      } else {
        localStorage.removeItem(key);
      }
    }
    set({ user, isAuthenticated: !!user });
  },
  
  setToken: (token, isAdmin = false) => {
    console.log(`[AuthStore] setToken called, isAdmin=${isAdmin}, hasToken=${!!token}`);
    if (typeof window !== 'undefined') {
      const key = getTokenKey(isAdmin);
      const userKey = getUserKey(isAdmin);
      
      if (token) {
        localStorage.setItem(key, token);
        const currentUser = get().user;
        if (currentUser) {
          localStorage.setItem(userKey, JSON.stringify(currentUser));
        }
        console.log(`[AuthStore] Token saved for ${isAdmin ? 'admin' : 'user'} context`);
      } else {
        localStorage.removeItem(key);
      }
    }
    set({ token, isAuthenticated: !!token, isAdmin, hydrated: true });
    console.log(`[AuthStore] State: isAuthenticated=${!!token}, isAdmin=${isAdmin}, hydrated=true`);
  },

  setRefreshToken: (refreshToken, isAdmin = false) => {
    if (typeof window !== 'undefined') {
      const key = getRefreshTokenKey(isAdmin);
      if (refreshToken) {
        localStorage.setItem(key, refreshToken);
      } else {
        localStorage.removeItem(key);
      }
    }
  },

  logout: () => {
    const isAdmin = get().isAdmin;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getTokenKey(isAdmin));
      localStorage.removeItem(getRefreshTokenKey(isAdmin));
      localStorage.removeItem(getUserKey(isAdmin));
    }
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },
  
  setHydrated: (hydrated) => {
    set({ hydrated });
    console.log(`[AuthStore] hydrated set to ${hydrated}`);
  },
  
  updateProfile: (data) => {
    const currentUser = get().user;
    const isAdmin = get().isAdmin;
    if (currentUser) {
      const nextUser = { ...currentUser, ...data };
      if (typeof window !== 'undefined') {
        const key = getUserKey(isAdmin);
        localStorage.setItem(key, JSON.stringify(nextUser));
      }
      set({ user: nextUser });
    }
  },

  initialize: (pathname?: string) => {
    if (typeof window === 'undefined') return;

    const current = get();
    
    // 如果正在初始化，跳过
    if (current.isInitializing) {
      console.log('[AuthStore] Already initializing, skip');
      return;
    }

    // 如果已经 hydrated 且有 token，说明登录状态已建立，跳过重复初始化
    // 这可以防止登录成功后 initialize 覆盖刚设置的状态
    if (current.hydrated && current.token) {
      console.log('[AuthStore] Already hydrated with token, skip initialize');
      return;
    }

    // 设置初始化标志
    set({ isInitializing: true });

    const currentPath = pathname ?? window.location.pathname;
    const isAdminContext = currentPath.startsWith('/admin');

    const adminToken = localStorage.getItem('admin_token');
    const userToken = localStorage.getItem('user_token');

    const savedToken = isAdminContext ? adminToken : userToken;
    const isAdmin = isAdminContext;
    const userKey = getUserKey(isAdmin);
    const savedUserStr = localStorage.getItem(userKey);
    let savedUser: User | null = null;
    try {
      savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    } catch {
      savedUser = null;
    }

    console.log('[AuthStore] initialize:', {
      pathname: currentPath,
      isAdminContext,
      hasAdminToken: !!adminToken,
      hasUserToken: !!userToken,
      usingToken: isAdminContext ? 'admin' : 'user',
      hasUser: !!savedUser,
      userIdentityType: savedUser?.identityType,
      userRegion: savedUser?.region,
    });

    if (!savedToken && savedUser) {
      console.log('[AuthStore] Token missing but user data exists, clearing stale user data');
      localStorage.removeItem(userKey);
      savedUser = null;
    }

    set({
      token: savedToken,
      isAdmin,
      isAuthenticated: !!savedToken,
      user: savedToken ? savedUser : null,
      hydrated: true,
      isInitializing: false,
    });
  },
}));
