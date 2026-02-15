import { create } from 'zustand';
import { User } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null, isAdmin?: boolean) => void;
  logout: () => void;
  initialize: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const isAdminPath = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
};

const getTokenKey = (isAdmin = false): string => {
  return isAdmin ? 'admin_token' : 'user_token';
};

const getUserKey = (isAdmin = false): string => {
  return isAdmin ? 'admin_user' : 'user_user';
};

const getTokenFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('user_token');
    if (token) return token;
    
    token = localStorage.getItem('admin_token');
    if (token) return token;
  }
  return null;
};

const getUserFromStorage = (): User | null => {
  if (typeof window !== 'undefined') {
    let raw = localStorage.getItem('user_user');
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        // 忽略解析错误
      }
    }
    
    raw = localStorage.getItem('admin_user');
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        // 忽略解析错误
      }
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  hydrated: false,
  
  setUser: (user) => {
    const isAdmin = get().isAdmin;
    if (typeof window !== 'undefined') {
      const key = getUserKey(isAdmin);
      if (user) {
        localStorage.setItem(key, JSON.stringify(user));
      } else {
        localStorage.removeItem(key);
      }
    }
    set({ user, isAuthenticated: !!user });
  },
  
  setToken: (token, isAdmin = false) => {
    if (typeof window !== 'undefined') {
      const key = getTokenKey(isAdmin);
      const userKey = getUserKey(isAdmin);
      
      if (token) {
        localStorage.setItem(key, token);
        
        const currentUser = get().user;
        if (currentUser) {
          localStorage.setItem(userKey, JSON.stringify(currentUser));
        }
        
        const otherKey = getTokenKey(!isAdmin);
        const otherUserKey = getUserKey(!isAdmin);
        localStorage.removeItem(otherKey);
        localStorage.removeItem(otherUserKey);
      } else {
        localStorage.removeItem(key);
      }
    }
    set({ token, isAuthenticated: !!token, isAdmin, hydrated: true });
  },
  
  logout: () => {
    const isAdmin = get().isAdmin;
    if (typeof window !== 'undefined') {
      const key = getTokenKey(isAdmin);
      const userKey = getUserKey(isAdmin);
      localStorage.removeItem(key);
      localStorage.removeItem(userKey);
    }
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },
  
  initialize: () => {
    if (typeof window === 'undefined') return;
    
    const savedToken = getTokenFromStorage();
    const savedUser = getUserFromStorage();
    const currentIsAdmin = !!localStorage.getItem('admin_token');
    
    if (get().hydrated && get().token) return;
    
    set({ 
      token: savedToken, 
      isAuthenticated: !!savedToken, 
      isAdmin: currentIsAdmin, 
      user: savedUser,
      hydrated: true
    });
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
}));