'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Button, Space, Select, Input, Card, Empty, Pagination, Tag, Tooltip, Skeleton, App, List, Radio, Divider } from 'antd';
import { SearchOutlined, FileTextOutlined, HeartOutlined, StarOutlined, StarFilled, EyeOutlined, NumberOutlined, CalendarOutlined, AppstoreOutlined, UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons';
import { paperApi } from '@/lib/api/paper';
import { Paper } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Option } = Select;

export default function PapersPage() {
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<'latest' | 'hot' | 'citation'>('latest');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPapers(page);
  }, [page, pageSize, sort, category]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const loadPapers = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await paperApi.getPapers({
        page: pageNum,
        size: pageSize,
        sort,
        category,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setPapers([]);
        setTotal(0);
        return;
      }

      setPapers(data.items);
      setTotal(data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Load papers error:', error);
      if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        message.error('网络连接失败，请检查网络或稍后重试');
      } else {
        message.error(error.message || '加载论文失败');
      }
      setPapers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPapers(1);
  };

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    } else {
      setPage(newPage);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'paper' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Load favorites error:', error);
    }
  };

  const handleToggleFavorite = (paperId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(paperId);
    const action = already
      ? communityApi.deleteFavorite('paper', paperId)
      : communityApi.createFavorite({ contentType: 'paper', contentId: paperId });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const formatCitationCount = (count: number) => {
    if (!count) return '0';
    if (count >= 10000) return (count / 10000).toFixed(1) + '万';
    return count.toString();
  };

  const PaperCard = ({ paper }: { paper: Paper }) => {
    const isFavorite = favoriteIds.has(paper.id);
    const formattedDate = paper.publishedDate ? dayjs(paper.publishedDate).format('YYYY-MM-DD') : '';
    const authors = Array.isArray(paper.authors) ? paper.authors : [];
    const categories = Array.isArray(paper.categories) ? paper.categories : [];

    return (
      <Card
        hoverable
        style={{
          height: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #f0f0f0',
          transition: 'all 0.3s',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        styles={{
          body: {
            padding: 16,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(9, 109, 217, 0.1) 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tooltip title={paper.title}>
              <Link href={`/papers/${paper.id}`}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: 0,
                    color: '#262626',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    cursor: 'pointer',
                  }}
                >
                  {paper.title}
                </h3>
              </Link>
            </Tooltip>
          </div>
        </div>

        {authors.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Tooltip title={authors.join(', ')}>
              <span
                style={{
                  fontSize: 13,
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {authors.slice(0, 3).join(', ')}
                {authors.length > 3 && ' 等'}
              </span>
            </Tooltip>
          </div>
        )}

        {paper.abstract && (
          <p
            style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 1.6,
              margin: '0 0 12px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              flex: 1,
            }}
          >
            {paper.abstract}
          </p>
        )}

        <div style={{ marginBottom: 12 }}>
          <Space size={[4, 8]} wrap>
            {paper.venue && (
              <Tag color="green" style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
                {paper.venue}
              </Tag>
            )}
            {paper.arxivId && (
              <Tag color="blue" style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
                arXiv: {paper.arxivId}
              </Tag>
            )}
            {categories.slice(0, 2).map((cat) => (
              <Tag key={cat} style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
                {cat}
              </Tag>
            ))}
          </Space>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#9499a0', marginTop: 'auto', marginBottom: 12 }}>
          <Space size="small">
            {paper.citationCount > 0 && (
              <Tooltip title="引用次数">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <NumberOutlined style={{ fontSize: 11, marginRight: 2 }} />
                  {formatCitationCount(paper.citationCount)}
                </span>
              </Tooltip>
            )}
            {paper.viewCount > 0 && (
              <Tooltip title="浏览次数">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <EyeOutlined style={{ fontSize: 11, marginRight: 2 }} />
                  {paper.viewCount}
                </span>
              </Tooltip>
            )}
            {formattedDate && (
              <Tooltip title="发布日期">
                <span style={{ fontSize: 11 }}>
                  {formattedDate}
                </span>
              </Tooltip>
            )}
          </Space>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type={isFavorite ? 'primary' : 'default'}
            size="small"
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            onClick={() => handleToggleFavorite(paper.id)}
            style={{ flex: 1, borderRadius: 6, height: 32, fontSize: 13 }}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
          {paper.pdfUrl && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderRadius: 6, height: 32 }}
            >
              PDF
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const PaperListItem = ({ paper }: { paper: Paper }) => {
    const isFavorite = favoriteIds.has(paper.id);
    const formattedDate = paper.publishedDate ? dayjs(paper.publishedDate).format('YYYY-MM-DD') : '';
    const authors = Array.isArray(paper.authors) ? paper.authors : [];
    const categories = Array.isArray(paper.categories) ? paper.categories : [];

    return (
      <List.Item
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          transition: 'all 0.3s',
        }}
        actions={[
          <Button
            key="favorite"
            type={isFavorite ? 'primary' : 'default'}
            size="small"
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            onClick={() => handleToggleFavorite(paper.id)}
            style={{ borderRadius: 6, height: 32, fontSize: 13 }}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>,
          paper.pdfUrl && (
            <Button
              key="pdf"
              size="small"
              icon={<DownloadOutlined />}
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderRadius: 6, height: 32 }}
            >
              PDF
            </Button>
          ),
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(9, 109, 217, 0.1) 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
          }
          title={
            <Link href={`/papers/${paper.id}`}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#262626',
                  cursor: 'pointer',
                }}
              >
                {paper.title}
              </span>
            </Link>
          }
          description={
            <div style={{ marginTop: 8 }}>
              {authors.length > 0 && (
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                  {authors.slice(0, 5).join(', ')}
                  {authors.length > 5 && ' 等'}
                </div>
              )}
              <Space size="middle" style={{ fontSize: 13, color: '#61666d' }}>
                {paper.venue && (
                  <Tag color="green" style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
                    {paper.venue}
                  </Tag>
                )}
                {paper.citationCount > 0 && (
                  <Tooltip title="引用次数">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <NumberOutlined style={{ marginRight: 4 }} />
                      {formatCitationCount(paper.citationCount)}
                    </span>
                  </Tooltip>
                )}
                {paper.viewCount > 0 && (
                  <Tooltip title="浏览次数">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <EyeOutlined style={{ marginRight: 4 }} />
                      {paper.viewCount}
                    </span>
                  </Tooltip>
                )}
                {formattedDate && (
                  <Tooltip title="发布日期">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {formattedDate}
                    </span>
                  </Tooltip>
                )}
              </Space>
            </div>
          }
        />
      </List.Item>
    );
  };

  const renderSkeleton = () => {
    if (viewMode === 'card') {
      return (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={n}>
              <Card style={{ height: '100%' }}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      );
    } else {
      return (
        <Card variant="borderless" style={{ borderRadius: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </Card>
      );
    }
  };

  return (
    <div style={{ background: '#fafafa', minHeight: '100%', padding: '0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 8, color: '#1a1a1a' }}>
            📄 论文
            <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 12 }}>
              共 {total} 篇论文
            </span>
          </h1>
        </div>

        <Row gutter={16}>
          <Col xs={24} lg={18}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Space wrap>
                  <Input.Search
                    placeholder="搜索论文标题、摘要..."
                    style={{ width: 320 }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onSearch={handleSearch}
                    enterButton={<SearchOutlined />}
                    size="large"
                  />
                </Space>
                <Space>
                  <Select value={sort} onChange={setSort} style={{ width: 120 }} size="large">
                    <Option value="latest">最新</Option>
                    <Option value="hot">最热</Option>
                    <Option value="citation">引用量</Option>
                  </Select>
                  <Radio.Group
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    size="large"
                  >
                    <Radio.Button value="card">
                      <AppstoreOutlined /> 卡片
                    </Radio.Button>
                    <Radio.Button value="list">
                      <UnorderedListOutlined /> 列表
                    </Radio.Button>
                  </Radio.Group>
                </Space>
              </Space>

              {loading && papers.length === 0 ? (
                renderSkeleton()
              ) : (
                <>
                  {viewMode === 'card' ? (
                    <Row gutter={[16, 16]}>
                      {papers.map((paper) => (
                        <Col xs={24} sm={12} md={8} key={paper.id}>
                          <PaperCard paper={paper} />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <List
                      dataSource={papers}
                      renderItem={(paper) => <PaperListItem paper={paper} />}
                      style={{ background: '#fff' }}
                    />
                  )}

                  {papers.length === 0 && !loading && (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: '#999', fontSize: 15 }}>暂无论文数据</span>}
                      style={{ padding: '60px 0' }}
                    />
                  )}

                  {papers.length > 0 && (
                    <div style={{ marginTop: 32, textAlign: 'center' }}>
                      <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                        pageSizeOptions={['12', '20', '30', '50']}
                        onChange={handlePageChange}
                        onShowSizeChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </Col>
          <Col xs={24} lg={6}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>分类筛选</h2>
              <Divider style={{ margin: '16px 0' }} />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type={category === undefined ? 'primary' : 'default'}
                  block
                  onClick={() => {
                    setCategory(undefined);
                    setPage(1);
                  }}
                >
                  全部
                </Button>
                <Button
                  type={category === 'cs.RO' ? 'primary' : 'default'}
                  block
                  onClick={() => {
                    setCategory('cs.RO');
                    setPage(1);
                  }}
                >
                  机器人学
                </Button>
                <Button
                  type={category === 'cs.AI' ? 'primary' : 'default'}
                  block
                  onClick={() => {
                    setCategory('cs.AI');
                    setPage(1);
                  }}
                >
                  人工智能
                </Button>
                <Button
                  type={category === 'cs.CV' ? 'primary' : 'default'}
                  block
                  onClick={() => {
                    setCategory('cs.CV');
                    setPage(1);
                  }}
                >
                  计算机视觉
                </Button>
                <Button
                  type={category === 'cs.LG' ? 'primary' : 'default'}
                  block
                  onClick={() => {
                    setCategory('cs.LG');
                    setPage(1);
                  }}
                >
                  机器学习
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
