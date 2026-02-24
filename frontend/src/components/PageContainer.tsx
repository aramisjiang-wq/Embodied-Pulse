/**
 * 页面容器组件
 * 统一页面布局、间距和样式
 * 注意：布局由 GlobalSidebarWrapper 处理，此组件只负责内容区域样式
 */

'use client';

import React from 'react';
import { Spin } from 'antd';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  loading?: boolean;
  showSidebar?: boolean;
  maxWidth?: string;
  className?: string;
  contentClassName?: string;
}

export default function PageContainer({
  children,
  title,
  loading = false,
  showSidebar = true,
  maxWidth = 'var(--content-max-width)',
  className = '',
  contentClassName = '',
}: PageContainerProps) {
  return (
    <div className={`${styles.pageWrapper} ${className}`}>
      <main
        className={`${styles.contentArea} ${contentClassName}`}
        style={{ maxWidth }}
      >
        {title && (
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{title}</h1>
          </div>
        )}
        {loading ? (
          <div className={styles.loadingWrapper}>
            <Spin size="large" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
