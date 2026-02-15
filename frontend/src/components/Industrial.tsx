'use client';

import { Card, Tag, Button, theme, Typography, Space, Tooltip } from 'antd';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { ReactNode, CSSProperties } from 'react';

const { Text } = Typography;

interface IndustrialCardProps {
  children: ReactNode;
  style?: CSSProperties;
  hoverable?: boolean;
}

export function IndustrialCard({ children, style, hoverable = true }: IndustrialCardProps) {
  const { token } = theme.useToken();

  const baseStyle: CSSProperties = {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    background: token.colorBgContainer,
    transition: 'none',
    ...style,
  };

  return (
    <Card
      style={baseStyle}
      styles={{
        body: { padding: token.paddingLG },
      }}
      hoverable={hoverable}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = token.colorPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = token.colorBorder;
        }
      }}
    >
      {children}
    </Card>
  );
}

interface IndustrialTagProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function IndustrialTag({ children, style }: IndustrialTagProps) {
  const { token } = theme.useToken();

  return (
    <Tag
      style={{
        border: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        color: token.colorTextSecondary,
        borderRadius: 2,
        margin: 0,
        marginRight: 6,
        marginBottom: 4,
        fontSize: 14,
        padding: '4px 10px',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

interface IndustrialButtonProps {
  children: ReactNode;
  type?: 'primary' | 'default';
  onClick?: () => void;
  icon?: ReactNode;
  style?: CSSProperties;
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  disabled?: boolean;
}

export function IndustrialButton({
  children,
  type = 'default',
  onClick,
  icon,
  style,
  size = 'middle',
  loading,
  disabled,
}: IndustrialButtonProps) {
  const { token } = theme.useToken();

  const height = size === 'small' ? 36 : size === 'large' ? 52 : 44;

  return (
    <Button
      type={type}
      onClick={onClick}
      icon={icon}
      loading={loading}
      disabled={disabled}
      style={{
        borderRadius: token.borderRadius,
        height,
        fontWeight: 500,
        fontSize: 16,
        boxShadow: 'none',
        ...style,
      }}
    >
      {children}
    </Button>
  );
}

interface IndustrialFavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
}

export function IndustrialFavoriteButton({ isFavorite, onClick }: IndustrialFavoriteButtonProps) {
  const { token } = theme.useToken();

  return (
    <Button
      type={isFavorite ? 'primary' : 'default'}
      size="small"
      onClick={onClick}
      icon={isFavorite ? <StarFilled /> : <StarOutlined />}
      style={{
        borderRadius: token.borderRadius,
        height: 36,
        fontSize: 14,
        boxShadow: 'none',
      }}
    >
      {isFavorite ? '已收藏' : '收藏'}
    </Button>
  );
}

interface IndustrialSalaryTagProps {
  min?: number;
  max?: number;
}

export function IndustrialSalaryTag({ min, max }: IndustrialSalaryTagProps) {
  const { token } = theme.useToken();

  if (!min || !max) return null;

  return (
    <Tag
      style={{
        border: `1px solid ${token.colorPrimary}`,
        background: token.colorBgContainer,
        color: token.colorPrimary,
        borderRadius: 2,
        fontSize: 15,
        fontWeight: 600,
        padding: '4px 10px',
        margin: 0,
      }}
    >
      {min}-{max}K
    </Tag>
  );
}

interface IndustrialMetaRowProps {
  icon?: ReactNode;
  text: string;
}

export function IndustrialMetaRow({ icon, text }: IndustrialMetaRowProps) {
  const { token } = theme.useToken();

  return (
    <Space size={6} style={{ fontSize: 15, color: token.colorTextSecondary }}>
      {icon}
      <Text style={{ color: token.colorTextSecondary, fontSize: 15 }}>{text}</Text>
    </Space>
  );
}

interface IndustrialTitleProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  style?: CSSProperties;
}

export function IndustrialTitle({ children, level = 2, style }: IndustrialTitleProps) {
  const { token } = theme.useToken();

  const sizes = {
    1: token.fontSizeHeading1,
    2: token.fontSizeHeading2,
    3: token.fontSizeHeading3,
    4: token.fontSizeHeading4,
  };

  return (
    <h1
      style={{
        fontSize: sizes[level],
        fontWeight: 600,
        color: token.colorText,
        margin: 0,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

interface IndustrialSearchBarProps {
  children: ReactNode;
}

export function IndustrialSearchBar({ children }: IndustrialSearchBarProps) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: 'flex',
        gap: token.margin,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

interface IndustrialEmptyProps {
  description?: string;
}

export function IndustrialEmpty({ description = '暂无数据' }: IndustrialEmptyProps) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: token.paddingLG * 2,
        textAlign: 'center',
        color: token.colorTextTertiary,
        fontSize: 16,
      }}
    >
      {description}
    </div>
  );
}
