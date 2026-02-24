'use client';

import { useState } from 'react';
import { Card, Tag, Typography, Button, Spin } from 'antd';
import {
  PushpinOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  ExperimentOutlined,
  TeamOutlined,
  ExpandOutlined,
  CompressOutlined,
  DownOutlined,
  UpOutlined,
  EyeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Text, Paragraph } = Typography;

interface PinnedItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  date?: string;
  viewCount?: number;
  isPinned?: boolean;
  pinnedAt?: string | null;
}

interface PinnedItemsProps {
  items: PinnedItem[];
  loading?: boolean;
}

const typeIcons: Record<string, any> = {
  news: FileTextOutlined,
  dailyNews: FileTextOutlined,
  paper: FileTextOutlined,
  video: PlayCircleOutlined,
  repo: GithubOutlined,
  huggingface: ExperimentOutlined,
  job: TeamOutlined,
};

const typeLabels: Record<string, string> = {
  news: '新闻',
  dailyNews: '新闻',
  paper: '论文',
  video: '视频',
  repo: 'GitHub',
  huggingface: 'HuggingFace',
  job: '招聘',
};

const typeColors: Record<string, string> = {
  news: '#1890ff',
  dailyNews: '#1890ff',
  paper: '#722ed1',
  video: '#ff4d4f',
  repo: '#52c41a',
  huggingface: '#13c2c2',
  job: '#fa8c16',
};

const typeRoutes: Record<string, string> = {
  news: '/news',
  dailyNews: '/news',
  paper: '/papers',
  video: '/videos',
  repo: '/repos',
  huggingface: '/huggingface',
  job: '/jobs',
};

export default function PinnedItems({ items, loading }: PinnedItemsProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <Card 
        className="mb-4"
        style={{ borderRadius: 12 }}
      >
        <div className="flex justify-center py-4">
          <Spin />
        </div>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  const displayItems = expanded ? items : items.slice(0, 3);
  const hasMore = items.length > 3;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getSummary = (content?: string, maxLength: number = 80) => {
    if (!content) return '';
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim();
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...' 
      : cleanContent;
  };

  const toggleItemExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderPinnedCard = (item: PinnedItem) => {
    const Icon = typeIcons[item.type] || FileTextOutlined;
    const route = typeRoutes[item.type];
    const color = typeColors[item.type] || '#8c8c8c';
    const isExpanded = expandedItems.has(item.id);

    return (
      <div
        key={item.id}
        style={{
          background: '#fafafa',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 12,
          border: '1px solid #f0f0f0',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 2px 8px ${color}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#f0f0f0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon style={{ color, fontSize: 18 }} />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Tag
                color={color}
                style={{
                  margin: 0,
                  padding: '0 6px',
                  fontSize: 11,
                  lineHeight: '18px',
                  borderRadius: 4,
                }}
              >
                {typeLabels[item.type] || '其他'}
              </Tag>
              {item.viewCount !== undefined && (
                <span style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EyeOutlined style={{ fontSize: 10 }} />
                  {item.viewCount}
                </span>
              )}
              {item.date && (
                <span style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarOutlined style={{ fontSize: 10 }} />
                  {formatDate(item.date)}
                </span>
              )}
            </div>
            
            <Link href={`${route}/${item.id}`} style={{ textDecoration: 'none' }}>
              <Text
                strong
                style={{
                  fontSize: 14,
                  color: '#262626',
                  display: 'block',
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
                className="hover:text-blue-500"
              >
                {item.title}
              </Text>
            </Link>
            
            {(item.content || item.description) && (
              <>
                {!isExpanded ? (
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#595959',
                      lineHeight: 1.6,
                    }}
                  >
                    {getSummary(item.content || item.description)}
                  </Paragraph>
                ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: '#595959',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background: '#fff',
                      padding: '12px',
                      borderRadius: 8,
                      marginTop: 8,
                      border: '1px solid #e8e8e8',
                    }}
                  >
                    {item.content || item.description}
                  </div>
                )}
              </>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Link href={`${route}/${item.id}`}>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto', fontSize: 13 }}
                >
                  查看详情 →
                </Button>
              </Link>
              
              {(item.content || item.description) && ((item.content?.length || 0) > 80 || (item.description?.length || 0) > 80) && (
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={() => toggleItemExpand(item.id)}
                  style={{
                    padding: '0 8px',
                    height: 24,
                    fontSize: 12,
                    color: '#8c8c8c',
                  }}
                >
                  {isExpanded ? '收起' : '展开'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card
      className="mb-4"
      style={{
        borderRadius: 12,
        border: '1px solid #e8e8e8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{
        body: { padding: '16px' },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PushpinOutlined style={{ color: '#1890ff', fontSize: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>置顶内容</span>
          <Tag
            color="blue"
            style={{
              margin: 0,
              padding: '0 8px',
              fontSize: 11,
              lineHeight: '20px',
              borderRadius: 10,
            }}
          >
            {items.length}
          </Tag>
        </div>
      }
      extra={
        hasMore && (
          <Button
            type="text"
            icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={() => setExpanded(!expanded)}
            style={{ fontSize: 13, color: '#1890ff' }}
          >
            {expanded ? '收起' : `展开全部`}
          </Button>
        )
      }
    >
      <div>
        {displayItems.map((item) => renderPinnedCard(item))}
      </div>
    </Card>
  );
}
