'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Tabs, Input, Spin, List, Space, Tag, Select, DatePicker, Button, App } from 'antd';
import type { InputRef } from 'antd';
import { SearchOutlined, ClockCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { searchApi, SearchResult } from '@/lib/api/search';
import { cleanText } from '@/lib/utils/htmlUtils';
import { searchUtils } from '@/lib/utils/searchUtils';
import Link from 'next/link';
import SearchSuggestions from '@/components/SearchSuggestions';
import PageContainer from '@/components/PageContainer';
import dayjs from 'dayjs';
import styles from './page.module.css';

const { RangePicker } = DatePicker;

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const { message } = App.useApp();
  const searchInputRef = useRef<InputRef | null>(null);

  const runSearch = useCallback(async (searchKeyword: string) => {
    if (!searchKeyword.trim()) {
      message.warning('请输入关键词');
      return;
    }
    
    setLoading(true);
    setShowSuggestions(false);
    
    try {
      const typeFilter = activeTab === 'all' ? undefined : activeTab;
      const params: {
        q: string;
        type?: string;
        page: number;
        size: number;
        sortBy: string;
        startDate?: string;
        endDate?: string;
      } = {
        q: searchKeyword,
        type: typeFilter,
        page: 1,
        size: 20,
        sortBy
      };
      
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      const data = await searchApi.search(params);
      
      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setItems([]);
        return;
      }
      
      setItems(data.items);
    } catch (error: unknown) {
      console.error('Search error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, message, sortBy]);

  const debouncedSearch = useMemo(
    () =>
      searchUtils.debounce((value: string) => {
        const v = String(value || '');
        if (v.trim()) {
          runSearch(v);
        } else {
          setItems([]);
        }
      }, 300),
    [runSearch]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        setKeyword(q);
        runSearch(q);
      }
    }
  }, [runSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (keyword.trim()) {
      debouncedSearch(keyword);
    } else {
      setItems([]);
    }
  }, [activeTab, keyword, debouncedSearch]);


  const handleSearch = (value: string) => {
    setKeyword(value);
    if (value.trim()) {
      searchUtils.addSearchHistory(value);
    }
  };

  const handleInputFocus = () => {
    if (keyword.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setKeyword(suggestion);
    searchUtils.addSearchHistory(suggestion);
    setShowSuggestions(false);
    runSearch(suggestion);
  };

  const buildLink = (itemType: string, item: SearchResult) => {
    switch (itemType) {
      case 'paper':
        return item.arxivId ? `https://arxiv.org/abs/${item.arxivId}` : (item.pdfUrl || '#');
      case 'video':
        return item.platform === 'bilibili'
          ? `https://www.bilibili.com/video/${item.videoId || item.bvid || ''}`
          : item.platform === 'youtube'
            ? `https://www.youtube.com/watch?v=${item.videoId || ''}`
            : '#';
      case 'repo':
        return item.htmlUrl || (item.fullName ? `https://github.com/${item.fullName}` : '#');
      case 'job':
        return item.applyUrl || 'https://github.com/StarCycle/Awesome-Embodied-AI-Job';
      case 'huggingface':
        const hfContentType = item.contentType || 'model';
        if (hfContentType === 'dataset') {
          return item.fullName ? `https://huggingface.co/datasets/${item.fullName}` : (item.hfId ? `https://huggingface.co/datasets/${item.hfId}` : '#');
        } else if (hfContentType === 'space') {
          return item.fullName ? `https://huggingface.co/spaces/${item.fullName}` : (item.hfId ? `https://huggingface.co/spaces/${item.hfId}` : '#');
        }
        return item.fullName ? `https://huggingface.co/${item.fullName}` : (item.hfId ? `https://huggingface.co/${item.hfId}` : '#');
      case 'post':
        return `/community/${item.id}`;
      default:
        return '#';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      paper: { label: '论文', color: 'blue' },
      video: { label: '视频', color: 'green' },
      repo: { label: 'GitHub', color: 'purple' },
      huggingface: { label: 'HF模型', color: 'orange' },
      job: { label: '岗位', color: 'red' },
      post: { label: '帖子', color: 'geekblue' },
    };
    return labels[type] || { label: type, color: 'default' };
  };

  return (
    <PageContainer title="搜索" loading={loading && items.length === 0}>
      <div className={styles.container}>
        <div className={styles.searchCard}>
          <div className={styles.searchInputWrapper}>
            <Input.Search
              ref={searchInputRef}
              size="large"
              placeholder="搜索论文、视频、项目、模型、岗位..."
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={(value) => {
                handleSearch(value);
                runSearch(value);
              }}
              onFocus={handleInputFocus}
              enterButton="搜索"
              style={{ marginBottom: 16 }}
            />
            
            <SearchSuggestions
              keyword={keyword}
              visible={showSuggestions}
              onSelect={handleSelectSuggestion}
              onClose={() => setShowSuggestions(false)}
            />
          </div>

          <div className={styles.filterSection}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setAdvancedFilter(!advancedFilter)}
              >
                高级筛选
              </Button>
              
              {advancedFilter && (
                <Space>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 120 }}
                  >
                    <Select.Option value="relevance">相关性</Select.Option>
                    <Select.Option value="date">时间</Select.Option>
                    <Select.Option value="popularity">热度</Select.Option>
                  </Select>
                  
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                    placeholder={['开始日期', '结束日期']}
                    style={{ width: 260 }}
                  />
                  
                  <Button onClick={() => {
                    setDateRange(null);
                    setSortBy('relevance');
                  }}>
                    重置
                  </Button>
                </Space>
              )}
            </Space>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all', label: '全部' },
              { key: 'paper', label: '论文' },
              { key: 'video', label: '视频' },
              { key: 'repo', label: 'GitHub' },
              { key: 'huggingface', label: 'HuggingFace' },
              { key: 'job', label: '求职' },
            ]}
          />

          <Spin spinning={loading}>
            {items.length > 0 ? (
              <List
                dataSource={items}
                renderItem={(item: SearchResult) => {
                  const itemType = activeTab === 'all' ? (item.type || 'paper') : activeTab;
                  const linkUrl = buildLink(itemType, item);
                  const isExternal = itemType !== 'post' && !linkUrl.startsWith('/');
                  const typeInfo = getTypeLabel(itemType);
                  
                  return (
                    <List.Item className={styles.resultItem}>
                      <div className={styles.resultContent}>
                        <div className={styles.resultHeader}>
                          <Tag color={typeInfo.color} className={styles.typeTag}>
                            {typeInfo.label}
                          </Tag>
                          
                          <div className={styles.resultBody}>
                            <div style={{ marginBottom: 8 }}>
                              {isExternal ? (
                                <a
                                  href={linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.resultTitle}
                                  dangerouslySetInnerHTML={{
                                    __html: searchUtils.highlightText(
                                      cleanText(item.title || item.fullName || item.name || ''),
                                      keyword
                                    )
                                  }}
                                />
                              ) : (
                                <Link
                                  href={linkUrl}
                                  className={styles.resultTitle}
                                  dangerouslySetInnerHTML={{
                                    __html: searchUtils.highlightText(
                                      cleanText(item.title || item.fullName || item.name || ''),
                                      keyword
                                    )
                                  }}
                                />
                              )}
                            </div>
                            
                            <div
                              className={styles.resultDescription}
                              dangerouslySetInnerHTML={{
                                __html: searchUtils.highlightText(
                                  cleanText(item.description || item.abstract || ''),
                                  keyword
                                )
                              }}
                            />
                            
                            {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                              <div className={styles.resultTags}>
                                {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                                  <Tag key={idx} color="blue" className={styles.resultTag}>
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                            )}
                            
                            {item.createdAt && (
                              <div className={styles.resultMeta}>
                                <ClockCircleOutlined />
                                {dayjs(item.createdAt).fromNow()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : keyword.trim() ? (
              <div className={styles.emptyState}>
                <SearchOutlined className={styles.emptyIcon} />
                <div className={styles.emptyTitle}>未找到相关结果</div>
                <div className={styles.emptyDescription}>试试其他关键词或调整筛选条件</div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <SearchOutlined className={styles.emptyIcon} />
                <div className={styles.emptyTitle}>搜索论文、视频、项目、模型、岗位</div>
                <div className={styles.emptyDescription}>输入关键词开始探索具身智能领域</div>
              </div>
            )}
          </Spin>
        </div>
      </div>
    </PageContainer>
  );
}
