/**
 * 页面预加载 Hook
 * 用于在用户悬停或即将访问时预加载页面数据
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 预加载指定路由的页面和数据
 */
export function usePrefetch(href: string, enabled: boolean = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 预加载路由
    router.prefetch(href);
  }, [href, enabled, router]);
}

/**
 * 鼠标悬停时预加载
 */
export function usePrefetchOnHover(href: string) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(href);
  };

  return { onMouseEnter: handleMouseEnter };
}
