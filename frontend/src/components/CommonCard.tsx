/**
 * 通用卡片组件
 * 统一卡片样式和行为
 */

'use client';

import React from 'react';
import { Card } from 'antd';
import styles from './CommonCard.module.css';

interface CommonCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  loading?: boolean;
  hoverable?: boolean;
  className?: string;
  bodyClassName?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingMap = {
  none: '0',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
};

export default function CommonCard({
  children,
  title,
  extra,
  loading = false,
  hoverable = false,
  className = '',
  bodyClassName = '',
  padding = 'md',
  onClick,
}: CommonCardProps) {
  return (
    <Card
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`}
      title={title}
      extra={extra}
      loading={loading}
      hoverable={hoverable}
      onClick={onClick}
      styles={{
        body: {
          padding: paddingMap[padding],
        },
      }}
    >
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}
