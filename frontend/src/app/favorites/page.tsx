'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { App } from 'antd';
import {
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
  LinkOutlined,
  SearchOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CloseOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { paperApi } from '@/lib/api/paper';
import { videoApi } from '@/lib/api/video';
import { repoApi } from '@/lib/api/repo';
import { jobApi } from '@/lib/api/job';
import { huggingfaceApi } from '@/lib/api/huggingface';
import dayjs from 'dayjs';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

// Keep export for backward compatibility
export interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  favoriteIds: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface FavoriteDetail {
  title?: string;
  fullName?: string;
  name?: string;
  description?: string;
  tags?: string[];
  language?: string;
  arxivId?: string;
  pdfUrl?: string;
  platform?: string;
  videoId?: string;
  bvid?: string;
  htmlUrl?: string;
  applyUrl?: string;
  hfId?: string;
}

interface FavoriteItem {
  id: string;
  contentType: string;
  contentId: string;
  createdAt: string;
  detail?: FavoriteDetail;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paper:       { label: '论文',   color: '#1677ff', bg: '#e6f4ff', icon: <FileTextOutlined /> },
  video:       { label: '视频',   color: '#52c41a', bg: '#f6ffed', icon: <PlayCircleOutlined /> },
  repo:        { label: '项目',   color: '#722ed1', bg: '#f9f0ff', icon: <GithubOutlined /> },
  huggingface: { label: '模型',   color: '#fa8c16', bg: '#fff7e6', icon: <RobotOutlined /> },
  job:         { label: '招聘',   color: '#eb2f96', bg: '#fff0f6', icon: <TeamOutlined /> },
};

const ALL_TABS = [
  { key: 'all',         label: '全部' },
  { key: 'paper',       label: '论文' },
  { key: 'video',       label: '视频' },
  { key: 'repo',        label: '项目' },
  { key: 'huggingface', label: '模型' },
  { key: 'job',         label: '招聘' },
];

function buildLink(fav: FavoriteItem): string {
  const d = fav.detail;
  if (!d) return '#';
  switch (fav.contentType) {
    case 'paper':
      return d.arxivId ? `https://arxiv.org/abs/${d.arxivId}` : (d.pdfUrl || '#');
    case 'video':
      if (d.platform === 'bilibili') return `https://www.bilibili.com/video/${d.videoId || d.bvid || ''}`;
      if (d.platform === 'youtube')  return `https://www.youtube.com/watch?v=${d.videoId || ''}`;
      return '#';
    case 'repo':
      return d.htmlUrl || (d.fullName ? `https://github.com/${d.fullName}` : '#');
    case 'job':
      return d.applyUrl || 'https://github.com/StarCycle/Awesome-Embodied-AI-Job';
    case 'huggingface':
      const hfContentType = d.contentType || 'model';
      if (hfContentType === 'dataset') {
        return d.fullName ? `https://huggingface.co/datasets/${d.fullName}` : (d.hfId ? `https://huggingface.co/datasets/${d.hfId}` : '#');
      } else if (hfContentType === 'space') {
        return d.fullName ? `https://huggingface.co/spaces/${d.fullName}` : (d.hfId ? `https://huggingface.co/spaces/${d.hfId}` : '#');
      }
      return d.fullName ? `https://huggingface.co/${d.fullName}` : (d.hfId ? `https://huggingface.co/${d.hfId}` : '#');
    default:
      return '#';
  }
}

function getTitle(fav: FavoriteItem): string {
  return fav.detail?.title || fav.detail?.fullName || fav.detail?.name || fav.contentId;
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface SkeletonGridProps { count: number; mode: 'card' | 'list' }

function SkeletonGrid({ count, mode }: SkeletonGridProps) {
  if (mode === 'list') {
    return (
      <div className={styles.listWrap}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonListItem}>
            <div className={styles.skBadge} />
            <div className={styles.skBody}>
              <div className={styles.skLine} style={{ width: '55%' }} />
              <div className={styles.skLine} style={{ width: '35%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skBadge} />
          <div className={styles.skLine} style={{ width: '90%' }} />
          <div className={styles.skLine} style={{ width: '72%' }} />
          <div className={styles.skLine} style={{ width: '50%', marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

interface FavProps { fav: FavoriteItem; onDelete: (fav: FavoriteItem) => void }

function FavCard({ fav, onDelete }: FavProps) {
  const cfg = TYPE_CONFIG[fav.contentType];
  const link = buildLink(fav);
  const isExternal = link !== '#' && !link.startsWith('/');
  const title = getTitle(fav);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        {cfg && (
          <span className={styles.typeBadge} style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.icon}
            <span>{cfg.label}</span>
          </span>
        )}
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(fav)}
          title="取消收藏"
          type="button"
        >
          <DeleteOutlined />
        </button>
      </div>

      <a
        href={link}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={styles.cardTitle}
      >
        <span className={styles.cardTitleText}>{title}</span>
        {isExternal && <LinkOutlined className={styles.extIcon} />}
      </a>

      {fav.detail?.description ? (
        <p className={styles.cardDesc}>{fav.detail.description}</p>
      ) : !fav.detail ? (
        <div className={styles.inlineLoading}>
          <div className={styles.skLine} style={{ width: '80%' }} />
          <div className={styles.skLine} style={{ width: '55%' }} />
        </div>
      ) : null}

      <div className={styles.cardFoot}>
        <span className={styles.cardTime}>{dayjs(fav.createdAt).fromNow()}</span>
      </div>
    </div>
  );
}

function FavListItem({ fav, onDelete }: FavProps) {
  const cfg = TYPE_CONFIG[fav.contentType];
  const link = buildLink(fav);
  const isExternal = link !== '#' && !link.startsWith('/');
  const title = getTitle(fav);

  return (
    <div className={styles.listItem}>
      {cfg && (
        <span className={styles.typeBadge} style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.icon}
          <span className={styles.typeBadgeText}>{cfg.label}</span>
        </span>
      )}
      <div className={styles.listBody}>
        <a
          href={link}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={styles.listTitle}
        >
          <span>{title}</span>
          {isExternal && <LinkOutlined className={styles.extIcon} />}
        </a>
        {fav.detail?.description && (
          <p className={styles.listDesc}>{fav.detail.description}</p>
        )}
      </div>
      <span className={styles.listTime}>{dayjs(fav.createdAt).fromNow()}</span>
      <button
        className={styles.deleteBtn}
        onClick={() => onDelete(fav)}
        title="取消收藏"
        type="button"
      >
        <DeleteOutlined />
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  const [loading, setLoading]     = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [viewMode, setViewMode]   = useState<'card' | 'list'>('card');

  // Generation counter to prevent stale async updates
  const generationRef = useRef(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      message.warning('请先登录');
      router.push('/login');
      return;
    }
    loadFavorites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, activeTab]);

  const loadFavorites = async () => {
    if (!user) return;
    const generation = ++generationRef.current;
    setLoading(true);

    try {
      const params: Record<string, unknown> = { page: 1, size: 100 };
      if (activeTab !== 'all') params.type = activeTab;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await communityApi.getFavorites(params as any);
      const raw: FavoriteItem[] = Array.isArray(data)
        ? (data as FavoriteItem[])
        : Array.isArray((data as unknown as { items?: unknown[] })?.items)
          ? ((data as unknown as { items: FavoriteItem[] }).items)
          : [];

      if (generation !== generationRef.current) return;

      // Show list immediately — no details yet
      setFavorites(raw);
      setLoading(false);

      // Progressively enrich with details in background
      const enriched = raw.map(f => ({ ...f }));

      await Promise.allSettled(
        raw.map(async (fav, i) => {
          if (generation !== generationRef.current) return;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let detail: any;
            switch (fav.contentType) {
              case 'paper':       detail = await paperApi.getPaper(fav.contentId);         break;
              case 'video':       detail = await videoApi.getVideo(fav.contentId);         break;
              case 'repo':        detail = await repoApi.getRepo(fav.contentId);           break;
              case 'job':         detail = await jobApi.getJob(fav.contentId);             break;
              case 'huggingface': detail = await huggingfaceApi.getModel(fav.contentId);   break;
            }
            if (detail && generation === generationRef.current) {
              enriched[i] = { ...enriched[i], detail };
              setFavorites([...enriched]);
            }
          } catch {
            // Silently ignore individual failures
          }
        })
      );
    } catch (error: unknown) {
      if (generation !== generationRef.current) return;
      setLoading(false);
      const err = error as { status?: number; code?: string; message?: string };
      if (err.status === 401 || err.code === 'UNAUTHORIZED') {
        router.push('/login');
      } else {
        message.error('加载失败，请稍后重试');
      }
      setFavorites([]);
    }
  };

  const handleDelete = async (fav: FavoriteItem) => {
    try {
      await communityApi.deleteFavorite(fav.contentType, fav.contentId);
      setFavorites(prev => prev.filter(f => f.id !== fav.id));
      message.success('已取消收藏');
    } catch {
      message.error('操作失败');
    }
  };

  const counts = useMemo(
    () => favorites.reduce((acc, f) => {
      acc[f.contentType] = (acc[f.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    [favorites]
  );

  const filtered = useMemo(() => {
    if (!search) return favorites;
    const kw = search.toLowerCase();
    return favorites.filter(f => {
      const t = getTitle(f).toLowerCase();
      const d = f.detail?.description?.toLowerCase() || '';
      return t.includes(kw) || d.includes(kw);
    });
  }, [favorites, search]);

  const visibleTabs = ALL_TABS.filter(t => t.key === 'all' || (counts[t.key] || 0) > 0);

  if (!user) return null;

  return (
    <PageContainer>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>收藏</h1>
            <span className={styles.subtitle}>
              {loading ? '加载中…' : `共 ${favorites.length} 项`}
            </span>
          </div>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'card' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('card')}
              title="卡片视图"
            >
              <AppstoreOutlined />
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              <UnorderedListOutlined />
            </button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className={styles.filterBar}>
          <div className={styles.tabs}>
            {visibleTabs.map(tab => {
              const cnt = tab.key === 'all' ? favorites.length : (counts[tab.key] || 0);
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {cnt > 0 && <span className={styles.tabBadge}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          <div className={styles.searchBox}>
            <SearchOutlined className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="搜索…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className={styles.clearBtn} onClick={() => setSearch('')}>
                <CloseOutlined />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <SkeletonGrid count={6} mode={viewMode} />
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <StarFilled className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>{search ? '无匹配结果' : '暂无收藏'}</p>
            <p className={styles.emptyHint}>
              {search ? '换个关键词试试' : '浏览内容时点击 ☆ 即可收藏'}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className={styles.grid}>
            {filtered.map(fav => (
              <FavCard key={fav.id} fav={fav} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className={styles.listWrap}>
            {filtered.map(fav => (
              <FavListItem key={fav.id} fav={fav} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </PageContainer>
  );
}
