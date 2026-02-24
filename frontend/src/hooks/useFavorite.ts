/**
 * 收藏状态管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { communityApi } from '@/lib/api/community';
import { useAuthStore } from '@/store/authStore';

interface UseFavoriteOptions {
  showMessage?: (type: 'success' | 'info' | 'warning' | 'error', content: string) => void;
  initialFavorited?: boolean;
}

export function useFavorite(contentType: string, contentId: string, options: UseFavoriteOptions = {}) {
  const { showMessage, initialFavorited = false } = options;
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuthStore();

  const checkFavoriteStatus = useCallback(async () => {
    if (!user || !user.id || !contentId) return;
    
    setChecking(true);
    try {
      const data = await communityApi.getFavorites({ 
        page: 1, 
        size: 1000, 
        contentType 
      });
      const favorited = (data.items || []).some(
        (fav: { contentId?: string }) => fav.contentId === contentId
      );
      setIsFavorited(favorited);
    } catch {
      setIsFavorited(false);
    } finally {
      setChecking(false);
    }
  }, [contentType, contentId, user]);

  useEffect(() => {
    if (user && user.id && contentId) {
      checkFavoriteStatus();
    } else {
      setIsFavorited(false);
    }
  }, [user, contentId, checkFavoriteStatus]);

  const toggleFavorite = async () => {
    if (!user) {
      showMessage?.('warning', '请先登录');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await communityApi.deleteFavorite(contentType, contentId);
        showMessage?.('success', '已取消收藏');
        setIsFavorited(false);
      } else {
        await communityApi.createFavorite({ contentType, contentId });
        showMessage?.('success', '收藏成功! +5积分');
        setIsFavorited(true);
      }
    } catch (error: unknown) {
      showMessage?.('error', error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return {
    isFavorited,
    loading,
    checking,
    toggleFavorite,
    checkFavoriteStatus,
    setIsFavorited,
  };
}
