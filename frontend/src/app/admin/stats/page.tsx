/**
 * 数据统计页面重定向到数据看板
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminStatsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return null;
}
