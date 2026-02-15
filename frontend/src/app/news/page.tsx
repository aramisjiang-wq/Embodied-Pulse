'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Select,
  Input,
  Card,
  Empty,
  Skeleton,
  Tag,
  Pagination,
  App,
} from 'antd';
import {
  SearchOutlined,
  FireOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { newsApi } from '@/lib/api/news';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Option } = Select;

export default function NewsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<'latest' | 'hot'>('latest');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const { user } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hotNews, setHotNews] = useState<any[]>([]);
  const [newsError, setNewsError] = useState('');
  const [hotNewsError, setHotNewsError] = useState('');

  useEffect(() => {
    loadNews(1);
    loadHotNews();
  }, [sort, category]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const loadNews = async (pageNum: number) => {
    setLoading(true);
    setNewsError('');
    try {
      const data = await newsApi.getNews({
        page: pageNum,
        size: pageSize,
        sort,
        category,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setNews([]);
        setTotal(0);
        setNewsError('数据格式异常');
        return;
      }

      setNews(data.items);
      setPage(pageNum);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Load news error:', error);
      setNews([]);
      setTotal(0);
      setNewsError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadHotNews = async () => {
    try {
      const data = await newsApi.getHotNews({ days: 7, limit: 10 });
      console.log('[loadHotNews] Received data:', data, 'isArray:', Array.isArray(data));
      if (Array.isArray(data)) {
        setHotNews(data);
        setHotNewsError('');
      } else {
        console.error('[loadHotNews] Data is not array:', data);
        setHotNews([]);
        setHotNewsError('数据格式异常');
      }
    } catch (error: any) {
      console.error('Load hot news error:', error);
      setHotNews([]);
      setHotNewsError('加载失败');
    }
  };

  const handleSearch = () => {
    loadNews(1);
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'news' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Load favorites error:', error);
    }
  };

  const handleToggleFavorite = (newsId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(newsId);
    const action = already
      ? communityApi.deleteFavorite('news', newsId)
      : communityApi.createFavorite({ contentType: 'news', contentId: newsId });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technology: 'blue',
      product: 'green',
      funding: 'orange',
      research: 'purple',
    };
    return colors[category] || 'default';
  };

  const getCategoryText = (category: string) => {
    const texts: Record<string, string> = {
      technology: '技术',
      product: '产品',
      funding: '融资',
      research: '研究',
    };
    return texts[category] || category;
  };

  const newsEmptyText = newsError || (keyword ? '暂无匹配结果' : '暂无新闻');
  const hotNewsEmptyText = hotNewsError || '暂无热门资讯';

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100%', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            background: '#ffffff',
            padding: 24,
            borderRadius: 10,
            border: '1px solid #e6e8eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <FileTextOutlined style={{ fontSize: 28, color: '#1f2937' }} />
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  color: '#111827',
                  lineHeight: 1.2,
                }}
              >
                具身智能资讯
              </h1>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>共 {total} 条资讯</div>
            </div>
          </div>

          <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Space wrap>
              <Input.Search
                placeholder="搜索新闻标题、摘要..."
                style={{ width: 360 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
                size="middle"
              />
              <Select
                value={category}
                onChange={(value) => setCategory(value)}
                style={{ width: 140 }}
                allowClear
                placeholder="分类"
                size="middle"
              >
                <Option value="technology">技术</Option>
                <Option value="product">产品</Option>
                <Option value="funding">融资</Option>
                <Option value="research">研究</Option>
              </Select>
            </Space>
            <Select value={sort} onChange={setSort} style={{ width: 140 }} size="middle">
              <Option value="latest">最新发布</Option>
              <Option value="hot">最热</Option>
            </Select>
          </Space>
        </div>

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          <div>
            <Card
              variant="borderless"
              style={{
                borderRadius: 10,
                border: '1px solid #e6e8eb',
                minHeight: 400,
              }}
            >
              {loading && news.length === 0 ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : Array.isArray(news) && news.length > 0 ? (
                news.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    style={{
                      marginBottom: 12,
                      borderRadius: 8,
                      border: '1px solid #eef0f2',
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ display: 'flex', gap: 16 }}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <Link href={`/news/${item.id}`} style={{ textDecoration: 'none' }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              lineHeight: 1.5,
                              marginBottom: 8,
                              color: '#111827',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.title}
                          </div>
                        </Link>
                        {item.summary && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              marginBottom: 12,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.5,
                            }}
                          >
                            {item.summary}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                            marginBottom: 12,
                          }}
                        >
                          <Space size={8} style={{ fontSize: 12, color: '#6b7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ClockCircleOutlined style={{ fontSize: 11 }} />
                              {item.publishedDate
                                ? dayjs(item.publishedDate).format('YYYY-MM-DD')
                                : '--'}
                            </span>
                            <span>{item.source}</span>
                            <span>👁 {item.viewCount || 0}</span>
                          </Space>
                          {item.category && (
                            <Tag
                              color={getCategoryColor(item.category)}
                              style={{ fontSize: 12, borderRadius: 4, padding: '2px 8px' }}
                            >
                              {getCategoryText(item.category)}
                            </Tag>
                          )}
                          {item.tags &&
                            item.tags.length > 0 &&
                            item.tags.slice(0, 2).map((tag: string) => (
                              <Tag
                                key={tag}
                                color="blue"
                                style={{ fontSize: 11, borderRadius: 4, padding: '2px 8px' }}
                              >
                                {tag}
                              </Tag>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            type={favoriteIds.has(item.id) ? 'primary' : 'default'}
                            onClick={() => handleToggleFavorite(item.id)}
                            style={{ borderRadius: 6, fontSize: 12, height: 30 }}
                          >
                            {favoriteIds.has(item.id) ? '已收藏' : '收藏'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: '#6b7280', fontSize: 14 }}>{newsEmptyText}</span>}
                  style={{ padding: '72px 0' }}
                />
              )}

              {Array.isArray(news) && news.length > 0 && (
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                    pageSizeOptions={['12', '20', '30', '50']}
                    onChange={(newPage, newPageSize) => {
                      if (newPageSize && newPageSize !== pageSize) {
                        setPageSize(newPageSize);
                        setPage(1);
                        loadNews(1);
                      } else {
                        setPage(newPage);
                        loadNews(newPage);
                      }
                    }}
                  />
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#ef4444' }} />
                  <span style={{ color: '#111827' }}>热门资讯</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #e6e8eb' }}
            >
              {Array.isArray(hotNews) && hotNews.length > 0 ? (
                hotNews.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    style={{
                      display: 'block',
                      padding: '8px 0',
                      borderBottom: index < hotNews.length - 1 ? '1px solid #eef0f2' : 'none',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: '#111827',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {item.publishedDate ? dayjs(item.publishedDate).format('MM-DD') : '--'} ·{' '}
                      {item.viewCount || 0} 阅读
                    </div>
                  </Link>
                ))
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center', color: '#6b7280' }}>
                  {hotNewsEmptyText}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
