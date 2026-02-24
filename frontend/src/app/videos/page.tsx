'use client';

import { useEffect, useState } from 'react';
import { Input, Empty, Skeleton, App, Pagination, Tooltip, Radio } from 'antd';
import {
  PlayCircleOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  EyeOutlined,
  RobotOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { videoApi } from '@/lib/api/video';
import { Video } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { cleanText } from '@/lib/utils/htmlUtils';
import dayjs from 'dayjs';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

type SortType = 'latest' | 'hot' | 'play';

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '最热门' },
  { value: 'play', label: '播放量' },
];

// 新视频判定窗口（24小时内同步过的视频算"新"）
const NEW_VIDEO_THRESHOLD_HOURS = 24;

const BilibiliLogo = ({ size = 24, color = '#fb7299' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
  </svg>
);

const formatViewCount = (count: number) => {
  if (!count) return '0';
  if (count >= 100000000) return (count / 100000000).toFixed(1) + '亿';
  if (count >= 10000) return (count / 10000).toFixed(1) + '万';
  return count.toString();
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function VideosPage() {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(21);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<SortType>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedUploaderId, setSelectedUploaderId] = useState<string | undefined>();
  // 默认列表模式，避免 SSR/hydration 时读 localStorage 导致白屏；持久化在 useEffect 中同步
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('videos-view-mode');
    if (saved === 'card' || saved === 'list') setViewMode(saved);
  }, []);
  const [uploaders, setUploaders] = useState<Array<{
    id: string;
    mid: string;
    name: string;
    avatar?: string;
    description?: string;
    tags: string[];
    videoCount: number;
    lastSyncAt?: string | null;
  }>>([]);
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVideos(1);
  }, [sort, selectedUploaderId]);

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
        setVideos([]);
        setTotal(0);
        return;
      }

      setVideos(data.items);
      setTotal(data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('加载UP主列表失败:', error);
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
    loadVideos(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadVideos(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'video' });
      if (!data || !Array.isArray(data.items)) {
        setFavoriteIds(new Set());
        return;
      }
      const ids = new Set(data.items.map((fav: { contentId?: string }) => fav.contentId).filter(Boolean) as string[]);
      setFavoriteIds(ids);
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || '收藏加载失败');
      setFavoriteIds(new Set());
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
      .catch((error: { message?: string }) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  // 按 tag 分组：有「中国厂商」tag 的归为机器人厂家，其余归为 UP主
  const manufacturerUploaders = uploaders.filter((u) => u.tags?.includes('中国厂商'));
  const creatorUploaders = uploaders.filter((u) => !u.tags?.includes('中国厂商'));

  // 判断某个 uploader 是否在阈值时间内有新视频同步
  const isRecentlySynced = (lastSyncAt?: string | null): boolean => {
    if (!lastSyncAt) return false;
    const diffHours = (Date.now() - new Date(lastSyncAt).getTime()) / 3600000;
    return diffHours <= NEW_VIDEO_THRESHOLD_HOURS;
  };

  const handleUploaderClick = (mid: string) => {
    const isSelected = selectedUploaderId === mid;
    setSelectedUploaderId(isSelected ? undefined : mid);
    setPage(1);
  };

  const VideoCard = ({ video }: { video: Video }) => {
    const isFavorite = favoriteIds.has(video.id);
    const playCount = video.playCount || video.viewCount || 0;
    const bvid = video.videoId || video.bvid || '';
    const url = `https://www.bilibili.com/video/${bvid}`;
    const title = cleanText(video.title);
    const desc = video.description ? cleanText(video.description) : '';
    const formattedDate = video.publishedDate
      ? dayjs(video.publishedDate).format('MM-DD')
      : '';
    const fullDate = video.publishedDate
      ? dayjs(video.publishedDate).format('YYYY-MM-DD')
      : '';
    const isToday = video.publishedDate
      ? dayjs(video.publishedDate).isSame(dayjs(), 'day')
      : false;
    const isRecent = video.publishedDate
      ? dayjs().diff(dayjs(video.publishedDate), 'day') <= 3
      : false;

    // 解析 tags
    let tags: string[] = [];
    try {
      tags = Array.isArray(video.tags)
        ? video.tags
        : typeof video.tags === 'string'
          ? JSON.parse(video.tags)
          : [];
    } catch { tags = []; }

    const engagementRate =
      playCount > 0 && video.likeCount > 0
        ? ((video.likeCount / playCount) * 100).toFixed(1)
        : null;

    return (
      <div className={styles.videoCard}>
        {/* 顶部：日期 badge + 收藏 */}
        <div className={styles.cardHeader}>
          {formattedDate ? (
            <Tooltip title={fullDate}>
              <span className={`${styles.cardDateBadge} ${isToday ? styles.cardDateBadgeToday : isRecent ? styles.cardDateBadgeRecent : ''}`}>
                {isToday ? '今日' : formattedDate}
              </span>
            </Tooltip>
          ) : <span />}
          <button
            className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
            onClick={(e) => { e.preventDefault(); handleToggleFavorite(video.id); }}
          >
            {isFavorite ? <StarFilled /> : <StarOutlined />}
          </button>
        </div>

        {/* 标题 */}
        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.cardTitle}>
          {title}
        </a>

        {/* 简介 */}
        {desc && <p className={styles.cardDesc}>{desc}</p>}

        {/* Tags */}
        {tags.length > 0 && (
          <div className={styles.cardTags}>
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
          </div>
        )}

        {/* 底部：UP主 + 数据 */}
        <div className={styles.cardFooter}>
          <span className={styles.cardUploader}>
            <BilibiliLogo size={11} color="#fb7299" />
            {video.uploader || '未知UP主'}
          </span>
          <div className={styles.cardStats}>
            {playCount > 0 && (
              <span className={styles.cardStat} title="播放量">
                <PlayCircleOutlined />
                {formatViewCount(playCount)}
              </span>
            )}
            {video.likeCount > 0 && (
              <span className={styles.cardStat} title="点赞">
                <StarOutlined />
                {formatViewCount(video.likeCount)}
              </span>
            )}
            {engagementRate && (
              <span className={styles.cardEngagement}>{engagementRate}%</span>
            )}
            {video.duration ? (
              <span className={styles.cardDuration}>{formatDuration(video.duration)}</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className={styles.listContainer}>
      {videos.map((video) => {
        const isFavorite = favoriteIds.has(video.id);
        const playCount = video.playCount || video.viewCount || 0;
        const bvid = video.videoId || video.bvid || '';
        const url = `https://www.bilibili.com/video/${bvid}`;
        const title = cleanText(video.title);
        const desc = video.description ? cleanText(video.description) : '';
        // 解析 tags
        let tags: string[] = [];
        try {
          tags = Array.isArray(video.tags)
            ? video.tags
            : typeof video.tags === 'string'
              ? JSON.parse(video.tags)
              : [];
        } catch { tags = []; }
        // 互动率：点赞数 / 播放量（百分比）
        const engagementRate =
          playCount > 0 && video.likeCount > 0
            ? ((video.likeCount / playCount) * 100).toFixed(1)
            : null;

        return (
          <div key={video.id} className={styles.listItem}>
            {/* 主内容区 */}
            <div className={styles.listContent}>
              {/* 标题行 */}
              <a href={url} target="_blank" rel="noopener noreferrer" className={styles.listTitle}>
                {title}
              </a>

              {/* 简介 */}
              {desc && <p className={styles.listDesc}>{desc}</p>}

              {/* Tags */}
              {tags.length > 0 && (
                <div className={styles.listTags}>
                  {tags.slice(0, 5).map((tag) => (
                    <span key={tag} className={styles.listTag}>{tag}</span>
                  ))}
                </div>
              )}

              {/* 数据行 */}
              <div className={styles.listMetaRow}>
                <span className={styles.listUploader}>
                  <BilibiliLogo size={11} color="#fb7299" />
                  {video.uploader || '未知UP主'}
                </span>

                <span className={styles.listDivider} />

                {playCount > 0 && (
                  <span className={styles.listStat} title="播放量">
                    <PlayCircleOutlined />
                    {formatViewCount(playCount)}
                  </span>
                )}
                {video.likeCount > 0 && (
                  <span className={styles.listStat} title="点赞数">
                    <StarOutlined />
                    {formatViewCount(video.likeCount)}
                  </span>
                )}
                {engagementRate && (
                  <span className={styles.listEngagement} title="互动率（点赞/播放）">
                    {engagementRate}% 互动
                  </span>
                )}
                {video.duration ? (
                  <span className={styles.listDuration} title="视频时长">
                    {formatDuration(video.duration)}
                  </span>
                ) : null}

                {video.publishedDate && (() => {
                  const isToday = dayjs(video.publishedDate).isSame(dayjs(), 'day');
                  const isRecent = dayjs().diff(dayjs(video.publishedDate), 'day') <= 3;
                  return (
                    <span
                      className={styles.listDate}
                      style={isToday ? { color: '#fb7299', fontWeight: 700 } : isRecent ? { color: '#d46b08' } : {}}
                    >
                      {isToday ? '今日' : dayjs(video.publishedDate).format('YYYY-MM-DD')}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* 右侧收藏 */}
            <div className={styles.listActions}>
              <button
                className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
                onClick={() => handleToggleFavorite(video.id)}
              >
                {isFavorite ? <StarFilled /> : <StarOutlined />}
                {isFavorite ? '已收藏' : '收藏'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSkeleton = () =>
    viewMode === 'card' ? (
      <div className={styles.cardGrid}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className={styles.videoCard} style={{ padding: '14px 16px' }}>
            <Skeleton active paragraph={{ rows: 3 }} title={{ width: '90%' }} />
          </div>
        ))}
      </div>
    ) : (
      <div className={styles.listContainer}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={styles.listItem}>
            <div style={{ flex: 1 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          </div>
        ))}
      </div>
    );

  const selectedUploader = uploaders.find((u) => u.mid === selectedUploaderId);

  return (
    <PageContainer loading={false}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ===== 左侧边栏 ===== */}
          <aside className={styles.sidebar}>
            {/* 具身机器人厂家（仅显示管理后台配置的、带「中国厂商」标签的 UP 主；有更新时红点提示，并显示视频数量） */}
            {/* 具身机器人厂家：仅显示管理后台配置的中国厂商；有更新时红点 + 显示视频数量 */}
            {manufacturerUploaders.length > 0 && (
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionHeader}>
                  <div className={styles.sidebarSectionTitle}>
                    <RobotOutlined style={{ fontSize: 11 }} />
                    具身机器人厂家
                    <span className={styles.sidebarSectionCount}>({manufacturerUploaders.length})</span>
                  </div>
                  {selectedUploaderId && (
                    <button
                      className={styles.clearBtn}
                      onClick={() => { setSelectedUploaderId(undefined); setPage(1); }}
                    >
                      清除
                    </button>
                  )}
                </div>
                <div className={styles.manufacturerList}>
                  <div className={`${styles.manufacturerItem} ${!selectedUploaderId ? styles.manufacturerItemActive : ''}`}>
                    <button
                      className={styles.manufacturerBtn}
                      onClick={() => { setSelectedUploaderId(undefined); setPage(1); }}
                    >
                      <div className={`${styles.manufacturerIcon} ${!selectedUploaderId ? styles.manufacturerIconActive : ''}`}>
                        <RobotOutlined style={{ fontSize: 11 }} />
                      </div>
                      <span className={styles.manufacturerName}>全部视频</span>
                      <span className={styles.manufacturerCount}>{total > 0 ? total : ''}</span>
                      {!selectedUploaderId && <span className={styles.uploaderDot} />}
                    </button>
                  </div>
                  {manufacturerUploaders.map((uploader) => {
                    const isSelected = selectedUploaderId === uploader.mid;
                    const hasNew = isRecentlySynced(uploader.lastSyncAt);
                    const biliUrl = `https://space.bilibili.com/${uploader.mid}`;
                    return (
                      <div
                        key={uploader.id}
                        className={`${styles.manufacturerItem} ${isSelected ? styles.manufacturerItemActive : ''}`}
                      >
                        <button
                          className={styles.manufacturerBtn}
                          onClick={() => handleUploaderClick(uploader.mid)}
                        >
                          <div className={`${styles.manufacturerIcon} ${isSelected ? styles.manufacturerIconActive : ''}`}>
                            <RobotOutlined style={{ fontSize: 11 }} />
                          </div>
                          {hasNew && <span className={styles.manufacturerNewDot} title="有视频更新" />}
                          <span className={styles.manufacturerName}>{uploader.name}</span>
                          <span className={styles.manufacturerCount}>{uploader.videoCount}</span>
                          {isSelected && <span className={styles.uploaderDot} />}
                        </button>
                        <a
                          href={biliUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.manufacturerLink}
                          title="访问 B 站主页"
                        >
                          <LinkOutlined style={{ fontSize: 10 }} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 排序方式 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>
                排序方式
              </div>
              <div className={styles.sortList}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.sortItem} ${sort === opt.value ? styles.sortItemActive : ''}`}
                    onClick={() => { setSort(opt.value); setPage(1); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 统计 */}
            <div className={styles.sidebarSection}>
              <div className={styles.statsCard}>
                <div className={styles.statsNumber}>{total.toLocaleString()}</div>
                <div className={styles.statsLabel}>个视频</div>
                <div className={styles.statsDesc}>具身智能 · 机器人领域内容</div>
              </div>
            </div>
          </aside>

          {/* ===== 主内容区 ===== */}
          <main className={styles.main}>
            {/* 工具栏 */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <h1 className={styles.pageTitle}>
                  {selectedUploader ? selectedUploader.name : 'B 站视频'}
                </h1>
              </div>
              <div className={styles.toolbarRight}>
                <Input.Search
                  placeholder="搜索视频标题..."
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={handleSearch}
                  allowClear
                />
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setViewMode(mode);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('videos-view-mode', mode);
                    }
                  }}
                  size="middle"
                >
                  <Radio.Button value="card" title="卡片视图">
                    <AppstoreOutlined />
                  </Radio.Button>
                  <Radio.Button value="list" title="列表视图">
                    <UnorderedListOutlined />
                  </Radio.Button>
                </Radio.Group>
              </div>
            </div>

            {/* 结果计数 */}
            {!loading && videos.length > 0 && (
              <div className={styles.resultInfo}>
                共 <strong>{total.toLocaleString()}</strong> 个视频
                {selectedUploader && <> · {selectedUploader.name}</>}
              </div>
            )}

            {/* 内容 */}
            {loading && videos.length === 0 ? (
              renderSkeleton()
            ) : videos.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: '#8c8c8c', fontSize: 15 }}>暂无视频数据</span>}
                style={{ padding: '80px 0' }}
              />
            ) : viewMode === 'card' ? (
              <div className={styles.cardGrid}>
                {videos.map((video) => <VideoCard key={video.id} video={video} />)}
              </div>
            ) : (
              renderListView()
            )}

            {/* 分页 */}
            {videos.length > 0 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showTotal={(t, range) => `第 ${range[0]}–${range[1]} 个，共 ${t} 个`}
                  showSizeChanger={false}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </PageContainer>
  );
}
