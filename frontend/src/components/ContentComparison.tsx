'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Descriptions, Empty, Select, Checkbox } from 'antd';
import { SwapOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Paper } from '@/lib/api/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ContentComparisonProps {
  items: Paper[];
  onRemove?: (id: string) => void;
  onAdd?: () => void;
}

export default function ContentComparison({ items, onRemove, onAdd }: ContentComparisonProps) {
  const [compareFields, setCompareFields] = useState<string[]>([
    'title',
    'authors',
    'publishedDate',
    'citationCount',
    'abstract',
  ]);
  const [sortBy, setSortBy] = useState<string>('publishedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const allFields = [
    { value: 'title', label: '标题' },
    { value: 'authors', label: '作者' },
    { value: 'publishedDate', label: '发布日期' },
    { value: 'venue', label: '会议/期刊' },
    { value: 'citationCount', label: '引用数' },
    { value: 'abstract', label: '摘要' },
    { value: 'categories', label: '分类' },
  ];

  const sortedItems = [...items].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'publishedDate':
        comparison = new Date(a.publishedDate || 0).getTime() - new Date(b.publishedDate || 0).getTime();
        break;
      case 'citationCount':
        comparison = (a.citationCount || 0) - (b.citationCount || 0);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatAuthors = (authors: string[]) => {
    if (!Array.isArray(authors)) return '-';
    return authors.length > 3 
      ? `${authors.slice(0, 3).join(', ')}... (+${authors.length - 3})`
      : authors.join(', ');
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  const getDifference = (field: string, valueA: any, valueB: any) => {
    if (valueA === valueB) return null;
    if (valueA === undefined || valueA === null) return <span style={{ color: '#999' }}>-</span>;
    if (valueB === undefined || valueB === null) return <span style={{ color: '#999' }}>-</span>;

    if (field === 'citationCount') {
      const diff = (valueB || 0) - (valueA || 0);
      if (diff > 0) {
        return <Tag color="green">+{diff}</Tag>;
      } else if (diff < 0) {
        return <Tag color="red">{diff}</Tag>;
      }
    }

    return null;
  };

  if (items.length === 0) {
    return (
      <Card>
        <Empty
          description="暂无对比内容"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {onAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              添加对比项
            </Button>
          )}
        </Empty>
      </Card>
    );
  }

  if (items.length === 1) {
    return (
      <Card>
        <Empty
          description="请至少选择2项内容进行对比"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {onAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              添加对比项
            </Button>
          )}
        </Empty>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <SwapOutlined />
            <span>内容对比 ({items.length}项)</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 120 }}
              options={[
                { label: '发布日期', value: 'publishedDate' },
                { label: '引用数', value: 'citationCount' },
              ]}
            />
            <Button
              icon={<SwapOutlined />}
              onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '升序' : '降序'}
            </Button>
            {onAdd && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                添加
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <span>对比字段：</span>
            <Checkbox.Group
              value={compareFields}
              onChange={setCompareFields}
              options={allFields}
            />
          </Space>
        </div>
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #1890ff', fontWeight: 600 }}>
                  字段
                </th>
                {sortedItems.map((item, index) => (
                  <th
                    key={item.id}
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      borderBottom: '2px solid #1890ff',
                      fontWeight: 600,
                      minWidth: 200,
                    }}
                  >
                    <Space direction="vertical" size={0}>
                      <span>项目 {index + 1}</span>
                      {onRemove && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => onRemove(item.id)}
                          style={{ padding: 0, height: 'auto' }}
                        />
                      )}
                    </Space>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFields
                .filter(field => compareFields.includes(field.value))
                .map(field => (
                  <tr key={field.value} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 12, fontWeight: 500, background: '#fafafa', minWidth: 120 }}>
                      {field.label}
                    </td>
                    {sortedItems.map(item => {
                      const value = item[field.value as keyof Paper];
                      const nextValue = sortedItems[sortedItems.indexOf(item) + 1]?.[field.value as keyof Paper];
                      const diff = sortedItems.indexOf(item) < sortedItems.length - 1
                        ? getDifference(field.value, value, nextValue)
                        : null;

                      return (
                        <td
                          key={item.id}
                          style={{
                            padding: 12,
                            verticalAlign: 'top',
                            minWidth: 200,
                          }}
                        >
                          <Space direction="vertical" size={4}>
                            <div>
                              {field.value === 'title' && (
                                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                  {value as string}
                                </div>
                              )}
                              {field.value === 'authors' && (
                                <div style={{ marginBottom: 4 }}>
                                  {formatAuthors(value as string[])}
                                </div>
                              )}
                              {field.value === 'publishedDate' && (
                                <div style={{ marginBottom: 4 }}>
                                  {formatDate(value as string)}
                                </div>
                              )}
                              {field.value === 'venue' && (
                                <div style={{ marginBottom: 4 }}>
                                  {value as string || '-'}
                                </div>
                              )}
                              {field.value === 'citationCount' && (
                                <div style={{ marginBottom: 4 }}>
                                  <Space>
                                    <span style={{ fontWeight: 600 }}>{value as number}</span>
                                    {diff}
                                  </Space>
                                </div>
                              )}
                              {field.value === 'abstract' && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: '#666',
                                    lineHeight: 1.6,
                                    maxHeight: 200,
                                    overflow: 'auto',
                                  }}
                                >
                                  {value as string}
                                </div>
                              )}
                              {field.value === 'categories' && (
                                <div>
                                  <Space wrap>
                                    {Array.isArray(value) ? (value as string[]).map((cat, idx) => (
                                      <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                                        {cat}
                                      </Tag>
                                    )) : '-'}
                                  </Space>
                                </div>
                              )}
                            </div>
                          </Space>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="对比总结" style={{ marginTop: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="最早发布">
            {formatDate(sortedItems[sortedItems.length - 1]?.publishedDate || '')}
          </Descriptions.Item>
          <Descriptions.Item label="最新发布">
            {formatDate(sortedItems[0]?.publishedDate || '')}
          </Descriptions.Item>
          <Descriptions.Item label="最高引用">
            {Math.max(...sortedItems.map(item => item.citationCount || 0))}
          </Descriptions.Item>
          <Descriptions.Item label="最低引用">
            {Math.min(...sortedItems.map(item => item.citationCount || 0))}
          </Descriptions.Item>
          <Descriptions.Item label="平均引用">
            {Math.round(
              sortedItems.reduce((sum, item) => sum + (item.citationCount || 0), 0) / sortedItems.length
            )}
          </Descriptions.Item>
          <Descriptions.Item label="作者数量">
            {sortedItems.reduce((sum, item) => sum + (item.authors?.length || 0), 0)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
