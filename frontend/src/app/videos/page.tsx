'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Button, Space, Select, Input, Card, Tag, Empty, Pagination, Avatar, Tooltip, List, Radio, Divider, App } from 'antd';
import { SearchOutlined, PlayCircleOutlined, HeartOutlined, StarOutlined, StarFilled, FireOutlined, UserOutlined, ClockCircleOutlined, CalendarOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { videoApi } from '@/lib/api/video';
import { Video } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { parseTags } from '@/lib/utils/jsonParse';
import { cleanText } from '@/lib/utils/htmlUtils';
import dayjs from 'dayjs';

const { Option } = Select;

export default function VideosPage() {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(21);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<'latest' | 'hot' | 'play'>('latest');
  const [keyword, setKeyword] = useState('');
  const [selectedUploaderId, setSelectedUploaderId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [uploaders, setUploaders] = useState<Array<{
    id: string;
    mid: string;
    name: string;
    avatar?: string;
    description?: string;
    videoCount: number;
  }>>([]);
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVideos(page);
  }, [page, pageSize, sort, selectedUploaderId]);

  useEffect(() => {
    loadUploaders();
  }, []);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const loadVideos = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await videoApi.getVideos({
        page: pageNum,
        size: pageSize,
        sort,
        platform: 'bilibili',
        keyword: keyword || undefined,
        uploaderId: selectedUploaderId,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        console.error('Invalid data structure:', data);
        setVideos([]);
        setTotal(0);
        return;
      }

      setVideos(data.items);
      setTotal(data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Load videos error:', error);
      setVideos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadUploaders = async () => {
    try {
      const data = await videoApi.getUploaders();
      setUploaders(data);
    } catch (error: any) {
      console.error('加载UP主列表失败:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadVideos(1);
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
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'video' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      message.error(error.message || '收藏加载失败');
    }
  };

  const handleToggleFavorite = (videoId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(videoId);
    const action = already
      ? communityApi.deleteFavorite('video', videoId)
      : communityApi.createFavorite({ contentType: 'video', contentId: videoId });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number) => {
    if (!count) return '0';
    if (count >= 100000000) return (count / 100000000).toFixed(1) + '亿';
    if (count >= 10000) return (count / 10000).toFixed(1) + '万';
    return count.toString();
  };

  const VideoCard = ({ video }: { video: Video }) => {
    const isFavorite = favoriteIds.has(video.id);
    const duration = formatDuration(video.duration);
    const playCount = video.playCount || video.viewCount || 0;
    const formattedDate = video.publishedDate ? dayjs(video.publishedDate).format('YYYY-MM-DD') : '';
    
    const uploader = uploaders.find(u => u.mid === video.uploaderId);

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
        <Tooltip title={cleanText(video.title)} placement="topLeft">
          <a
            href={`https://www.bilibili.com/video/${video.videoId || video.bvid || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: '#262626',
              display: 'block',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.5,
              marginBottom: 12,
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              overflow: 'visible',
              maxHeight: 'none',
            }}
          >
            {cleanText(video.title)}
          </a>
        </Tooltip>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <div
            style={{ 
              flexShrink: 0, 
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Avatar
              size={24}
              icon={
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#fb7299" style={{ transition: 'all 0.3s ease', filter: 'drop-shadow(0 2px 4px rgba(251,114,153,0.2))' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              }
            />
          </div>
          <Tooltip title={video.uploader}>
            <span
              style={{
                fontSize: 12,
                color: '#61666d',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                display: 'inline-block',
                fontWeight: 400,
                backgroundColor: '#fff',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {video.uploader || '未知UP主'}
            </span>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#9499a0', marginTop: 'auto' }}>
          <Space size="small">
            {playCount > 0 && (
              <Tooltip title="播放量">
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <PlayCircleOutlined style={{ fontSize: 11, marginRight: 2 }} />
                  {formatViewCount(playCount)}
                </span>
              </Tooltip>
            )}
            {formattedDate && (
              <Tooltip title="发布日期">
                <span style={{ fontSize: 11, color: '#9499a0' }}>
                  {formattedDate}
                </span>
              </Tooltip>
            )}
          </Space>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Button
            type={isFavorite ? 'primary' : 'default'}
            size="small"
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            onClick={(e) => {
              e.preventDefault();
              handleToggleFavorite(video.id);
            }}
            style={{ width: '100%', borderRadius: 6, height: 32, fontSize: 13 }}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
        </div>
      </Card>
    );
  };

  const VideoListItem = ({ video }: { video: Video }) => {
    const isFavorite = favoriteIds.has(video.id);
    const duration = formatDuration(video.duration || 0);
    const playCount = video.playCount || video.viewCount || 0;
    const formattedDate = video.publishedDate ? dayjs(video.publishedDate).format('YYYY-MM-DD') : '';
    
    const uploader = uploaders.find(u => u.mid === video.uploaderId);

    return (
      <List.Item
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          transition: 'all 0.3s',
        }}
        actions={[
          <Button
            type={isFavorite ? 'primary' : 'default'}
            size="small"
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            onClick={(e) => {
              e.preventDefault();
              handleToggleFavorite(video.id);
            }}
            style={{ borderRadius: 6, height: 32, fontSize: 13 }}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{ 
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Avatar
                size={48}
                icon={
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="#fb7299" style={{ transition: 'all 0.3s ease', filter: 'drop-shadow(0 2px 4px rgba(251,114,153,0.2))' }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                }
              />
            </div>
          }
          title={
            <Tooltip title={cleanText(video.title)} placement="topLeft">
              <a
                href={`https://www.bilibili.com/video/${video.videoId || video.bvid || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  color: '#262626',
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.6,
                  display: 'block',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflow: 'visible',
                  maxHeight: 'none',
                }}
              >
                {cleanText(video.title)}
              </a>
            </Tooltip>
          }
          description={
            <div style={{ marginTop: 8 }}>
              <Space size="middle" style={{ fontSize: 13, color: '#61666d' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {video.uploader || '未知UP主'}
                </span>
                {playCount > 0 && (
                  <Tooltip title="播放量">
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <PlayCircleOutlined style={{ marginRight: 4 }} />
                      {formatViewCount(playCount)}
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

  return (
    <div style={{ background: '#fafafa', minHeight: '100%', padding: '0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 8, color: '#1a1a1a' }}>
            🎬 B站视频
            <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666', marginLeft: 12 }}>
              共 {total} 个视频
            </span>
          </h1>
        </div>

        <Row gutter={16}>
          <Col xs={24} lg={18}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Space wrap>
                  <Input.Search
                    placeholder="搜索视频标题、描述..."
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
                    <Option value="play">播放量</Option>
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

              {loading && videos.length === 0 ? (
                <Row gutter={[16, 16]}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <Col xs={24} sm={12} md={8} key={n}>
                      <Card loading style={{ height: '100%' }} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <>
                  {viewMode === 'card' ? (
                    <Row gutter={[16, 16]}>
                      {videos.map((video) => (
                        <Col xs={24} sm={12} md={8} key={video.id}>
                          <VideoCard video={video} />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <List
                      dataSource={videos}
                      renderItem={(video) => <VideoListItem video={video} />}
                      style={{ background: '#fff' }}
                    />
                  )}

                  {videos.length === 0 && !loading && (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: '#999', fontSize: 15 }}>暂无视频数据</span>}
                      style={{ padding: '60px 0' }}
                    />
                  )}

                  {videos.length > 0 && (
                    <div style={{ marginTop: 32, textAlign: 'center' }}>
                      <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                        pageSizeOptions={['18', '21', '24', '27', '30']}
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
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>具身机器人厂家</h2>
              {selectedUploaderId && (
                <div style={{ marginBottom: 12 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedUploaderId(undefined);
                      setPage(1);
                    }}
                  >
                    清除筛选
                  </Button>
                </div>
              )}
              <Divider style={{ margin: '16px 0' }} />
              {uploaders.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: '#999', fontSize: 13 }}>暂无UP主</span>}
                  style={{ padding: '20px 0' }}
                />
              ) : (
                <List
                  dataSource={uploaders}
                  renderItem={(uploader) => {
                    const isSelected = selectedUploaderId === uploader.mid;
                    return (
                      <div
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                          cursor: 'pointer',
                          borderRadius: 4,
                          marginBottom: 4,
                          padding: 8,
                        }}
                        onClick={() => {
                          setSelectedUploaderId(isSelected ? undefined : uploader.mid);
                          setPage(1);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{ 
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.transform = 'scale(1.08)';
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Avatar
                              size="default"
                              icon={
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="#fb7299" style={{ transition: 'all 0.3s ease', filter: 'drop-shadow(0 2px 4px rgba(251,114,153,0.2))' }}>
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                              }
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <a
                                href={`https://space.bilibili.com/${uploader.mid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: isSelected ? '#1890ff' : '#1890ff',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 'calc(100% - 50px)',
                                  display: 'inline-block',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {uploader.name}
                              </a>
                              {isSelected && <Tag color="blue">已筛选</Tag>}
                            </div>
                            <div style={{ fontSize: 12, color: '#9499a0', marginTop: 2 }}>
                              视频数: {uploader.videoCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
