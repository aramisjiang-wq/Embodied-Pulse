/**
 * 数据统计页面重定向到数据看板
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

export default function AdminStatsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <PageContainer title="数据统计">
      <div className={styles.pageWrapper}>
        <p className={styles.loadingText}>正在跳转到数据看板...</p>
      </div>
    </PageContainer>
  );
}
