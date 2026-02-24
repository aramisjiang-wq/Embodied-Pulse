/**
 * 管理端首页 - 数据看板（重构版）
 * 现代紧凑 SaaS 风格，按业务维度分层展示
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Spin, Tag, Progress, App, Button } from 'antd';
import {
  UserOutlined, FileTextOutlined, CommentOutlined,
  GithubOutlined, RiseOutlined, FallOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  DatabaseOutlined, SyncOutlined, HeartOutlined, ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api/client';
import styles from './page.module.css';

// ─────────────────────────── Types ─────────────────────────────────────

interface ContentStats {
  total: number;
  newToday: number;
  newThisWeek: number;
}

interface CommunityStats extends ContentStats {
  growthRate: number;
}

interface DataSource {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  healthStatus: string;
  lastSyncAt?: string;
}

interface RepoItem {
  id: string;
  name: string;
  fullName: string;
  starsCount: number;
  language: string | null;
  viewCount: number;
  description: string | null;
  updatedDate?: string | null;
  createdAt?: string;
}

interface PaperItem {
  id: string;
  title: string;
  citationCount: number;
  publishedDate: string | null;
  viewCount: number;
  createdAt?: string;
}

interface VideoItem {
  id: string;
  title: string;
  playCount: number;
  publishedDate: string | null;
  viewCount: number;
  createdAt?: string;
}

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
    growthRate: number;
  };
  content: {
    total: number;
    papers: ContentStats;
    videos: ContentStats;
    repos: ContentStats;
    jobs: number;
    huggingface: number;
    banners: number;
    distribution: Record<string, number>;
  };
  community: {
    posts: CommunityStats;
    comments: CommunityStats;
    favorites: ContentStats;
  };
  subscriptions: { active: number };
  dataSources?: {
    total: number;
    enabled: number;
    healthy: number;
    unhealthy: number;
    sources: DataSource[];
  };
  recentItems?: {
    repos?: RepoItem[];
    papers?: PaperItem[];
    videos?: VideoItem[];
  };
  retention?: {
    day1: { rate: number; users: number };
    day7: { rate: number; users: number };
    day30: { rate: number; users: number };
    trend: Array<{ date: string; rate: number }>;
  };
  traffic?: {
    pvToday: number;
    uvToday: number;
    pvThisWeek: number;
    uvThisWeek: number;
    topPages: Array<{ page: string; views: number }>;
  };
  contentQuality?: {
    avgViewCount: number;
    avgInteractionRate: number;
    topPapers: Array<{ id: string; title: string; viewCount: number; citationCount: number; createdAt: string }>;
    topVideos: Array<{ id: string; title: string; viewCount: number; playCount: number; createdAt: string }>;
    topRepos: Array<{ id: string; name: string; fullName: string; viewCount: number; starsCount: number; createdAt: string }>;
  };
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

/** 数据看板空结构兜底（API 返回 code=0 但 data 缺失时使用，避免一直 loading） */
function getDefaultDashboardStats(): DashboardStats {
  return {
    users: {
      total: 0,
      newToday: 0,
      newThisWeek: 0,
      newThisMonth: 0,
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0,
      growthRate: 0,
    },
    content: {
      total: 0,
      papers: { total: 0, newToday: 0, newThisWeek: 0 },
      videos: { total: 0, newToday: 0, newThisWeek: 0 },
      repos: { total: 0, newToday: 0, newThisWeek: 0 },
      jobs: 0,
      huggingface: 0,
      banners: 0,
      distribution: {},
    },
    community: {
      posts: { total: 0, newToday: 0, newThisWeek: 0, growthRate: 0 },
      comments: { total: 0, newToday: 0, newThisWeek: 0, growthRate: 0 },
      favorites: { total: 0, newToday: 0, newThisWeek: 0 },
    },
    subscriptions: { active: 0 },
    retention: {
      day1: { rate: 0, users: 0 },
      day7: { rate: 0, users: 0 },
      day30: { rate: 0, users: 0 },
      trend: [],
    },
    traffic: {
      pvToday: 0,
      uvToday: 0,
      pvThisWeek: 0,
      uvThisWeek: 0,
      topPages: [],
    },
    contentQuality: {
      avgViewCount: 0,
      avgInteractionRate: 0,
      topPapers: [],
      topVideos: [],
      topRepos: [],
    },
  };
}

// ─────────────────────────── Sub Components ────────────────────────────

function GrowthBadge({ rate }: { rate: number }) {
  const isPos = rate >= 0;
  return (
    <span className={`${styles.growthBadge} ${isPos ? styles.growthPos : styles.growthNeg}`}>
      {isPos ? <RiseOutlined /> : <FallOutlined />}
      {' '}{Math.abs(rate).toFixed(1)}%
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value: number;
  trend?: number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}

function KpiCard({ title, value, trend, sub, color, icon }: KpiCardProps) {
  const colorMap: Record<string, { main: string; light: string }> = {
    '#0052D9': { main: '#0052D9', light: '#4096ff' },
    '#1677ff': { main: '#1677ff', light: '#4096ff' },
    '#366EF4': { main: '#366EF4', light: '#69b1ff' },
    '#00A870': { main: '#00A870', light: '#52c41a' },
    '#E37318': { main: '#E37318', light: '#fa8c16' },
  };
  const colors = colorMap[color] || { main: color, light: color };
  
  return (
    <div 
      className={styles.kpiCard} 
      style={{ 
        '--card-color': colors.main, 
        '--card-color-light': colors.light 
      } as React.CSSProperties}
    >
      <div className={styles.kpiTop}>
        <span className={styles.kpiIcon} style={{ color }}>{icon}</span>
        <span className={styles.kpiTitle}>{title}</span>
        {trend !== undefined && <GrowthBadge rate={trend} />}
      </div>
      <div className={styles.kpiValue} style={{ color }}>{value.toLocaleString()}</div>
      <div className={styles.kpiSub}>{sub}</div>
    </div>
  );
}

// ─────────────── Section: 用户增长 ─────────────────────────────────────

function UserGrowthPanel({ users }: { users: DashboardStats['users'] }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <UserOutlined style={{ color: '#0052D9' }} />
        <span>用户增长</span>
        <GrowthBadge rate={users.growthRate} />
      </div>
      <div className={styles.metricGrid3}>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>今日新增</div>
          <div className={styles.metricCellVal} style={{ color: '#0052D9' }}>
            +{users.newToday}
          </div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>本周新增</div>
          <div className={styles.metricCellVal} style={{ color: '#0052D9' }}>
            +{users.newThisWeek}
          </div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>本月新增</div>
          <div className={styles.metricCellVal} style={{ color: '#0052D9' }}>
            +{users.newThisMonth}
          </div>
        </div>
      </div>
      <div className={styles.panelDivider} />
      <div className={styles.userTotalRow}>
        <span className={styles.userTotalLabel}>注册总用户</span>
        <span className={styles.userTotalVal}>{users.total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─────────────── Section: 用户活跃度 ───────────────────────────────────

function UserActivityPanel({ users }: { users: DashboardStats['users'] }) {
  const pct = (n: number) =>
    users.total > 0 ? parseFloat(((n / users.total) * 100).toFixed(1)) : 0;
  const dauPct = pct(users.activeToday);
  const wauPct = pct(users.activeThisWeek);
  const mauPct = pct(users.activeThisMonth);
  const stickiness =
    users.activeThisMonth > 0
      ? ((users.activeToday / users.activeThisMonth) * 100).toFixed(1)
      : '—';

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <EyeOutlined style={{ color: '#0052D9' }} />
        <span>用户活跃度</span>
        <span className={styles.panelMeta}>DAU/MAU 粘性 {stickiness}%</span>
      </div>
      <div className={styles.activityList}>
        {[
          { label: 'DAU 今日', value: users.activeToday, pct: dauPct },
          { label: 'WAU 7天', value: users.activeThisWeek, pct: wauPct },
          { label: 'MAU 30天', value: users.activeThisMonth, pct: mauPct },
        ].map((row) => (
          <div key={row.label} className={styles.activityRow}>
            <span className={styles.activityLabel}>{row.label}</span>
            <span className={styles.activityVal}>{row.value.toLocaleString()}</span>
            <div className={styles.activityBarWrap}>
              <Progress
                percent={row.pct}
                strokeColor="#0052D9"
                showInfo={false}
                size="small"
              />
            </div>
            <span className={styles.activityPct}>{row.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Section: 社区互动 ─────────────────────────────────────

function CommunityPanel({ community }: { community: DashboardStats['community'] }) {
  const { posts, comments, favorites } = community;
  const total = posts.total + comments.total + favorites.total;
  const rows = [
    { icon: '💬', label: '帖子', data: posts, showRate: true },
    { icon: '📝', label: '评论', data: comments, showRate: true },
    { icon: '❤️', label: '收藏', data: favorites as CommunityStats, showRate: false },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <CommentOutlined style={{ color: '#00A870' }} />
        <span>社区互动</span>
        <span className={styles.panelMeta}>{total.toLocaleString()} 总互动</span>
      </div>
      <div className={styles.communityList}>
        {rows.map((row) => (
          <div key={row.label} className={styles.communityRow}>
            <span className={styles.communityEmoji}>{row.icon}</span>
            <div className={styles.communityInfo}>
              <span className={styles.communityName}>{row.label}</span>
              <span className={styles.communityMeta}>
                今日 +{row.data.newToday} · 本周 +{row.data.newThisWeek}
              </span>
            </div>
            <span className={styles.communityVal}>{row.data.total.toLocaleString()}</span>
            {row.showRate && (
              <GrowthBadge rate={(row.data as CommunityStats).growthRate} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Section: 内容健康度 ───────────────────────────────────

interface ContentTypeCardProps {
  label: string;
  total: number;
  color: string;
  icon: React.ReactNode;
  newToday?: number;
  newThisWeek?: number;
  pct: number;
}

function ContentTypeCard({ label, total, color, icon, newToday, newThisWeek, pct }: ContentTypeCardProps) {
  const colorMap: Record<string, { main: string; light: string }> = {
    '#0052D9': { main: '#0052D9', light: '#4096ff' },
    '#1677ff': { main: '#1677ff', light: '#4096ff' },
    '#366EF4': { main: '#366EF4', light: '#69b1ff' },
    '#00A870': { main: '#00A870', light: '#52c41a' },
    '#E37318': { main: '#E37318', light: '#fa8c16' },
  };
  const colors = colorMap[color] || { main: color, light: color };
  
  return (
    <div 
      className={styles.contentCard} 
      style={{ 
        '--card-color': colors.main, 
        '--card-color-light': colors.light 
      } as React.CSSProperties}
    >
      <div className={styles.contentCardTop}>
        <span className={styles.contentCardIcon} style={{ color }}>{icon}</span>
        <span className={styles.contentCardLabel}>{label}</span>
      </div>
      <div className={styles.contentCardVal} style={{ color }}>{total.toLocaleString()}</div>
      {(newToday !== undefined || newThisWeek !== undefined) && (
        <div className={styles.contentCardGrowth}>
          {newToday !== undefined && <span>今日 +{newToday}</span>}
          {newThisWeek !== undefined && <span>本周 +{newThisWeek}</span>}
        </div>
      )}
      <Progress percent={parseFloat(pct.toFixed(1))} strokeColor={color} showInfo={false} size="small" style={{ marginTop: 6 }} />
      <div className={styles.contentCardPct}>{pct.toFixed(1)}%</div>
    </div>
  );
}

function ContentHealthPanel({ content }: { content: DashboardStats['content'] }) {
  const p = (n: number) => (content.total > 0 ? (n / content.total) * 100 : 0);
  const items = [
    { label: '论文', total: content.papers.total, color: '#0052D9', icon: <FileTextOutlined />, newToday: content.papers.newToday, newThisWeek: content.papers.newThisWeek },
    { label: '视频', total: content.videos.total, color: '#00A870', icon: <FileTextOutlined />, newToday: content.videos.newToday, newThisWeek: content.videos.newThisWeek },
    { label: 'GitHub', total: content.repos.total, color: '#E37318', icon: <GithubOutlined />, newToday: content.repos.newToday, newThisWeek: content.repos.newThisWeek },
    { label: 'HuggingFace', total: content.huggingface, color: '#366EF4', icon: <DatabaseOutlined /> },
    { label: '招聘岗位', total: content.jobs, color: '#E37318', icon: <DatabaseOutlined /> },
  ];

  return (
    <div className={styles.widePanel}>
      <div className={styles.panelHeader}>
        <DatabaseOutlined style={{ color: '#E37318' }} />
        <span>内容健康度</span>
        <span className={styles.panelMeta}>{content.total.toLocaleString()} 条内容</span>
      </div>
      <div className={styles.contentGrid}>
        {items.map((item) => (
          <ContentTypeCard key={item.label} {...item} pct={p(item.total)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────── Section: 数据源状态 ───────────────────────────────────

function DataSourcePanel({ ds }: { ds: NonNullable<DashboardStats['dataSources']> }) {
  const statusIcon = (s: string) => {
    if (s === 'healthy') return <CheckCircleOutlined style={{ color: '#00A870' }} />;
    if (s === 'unhealthy') return <CloseCircleOutlined style={{ color: '#D54941' }} />;
    return <WarningOutlined style={{ color: '#E37318' }} />;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <SyncOutlined style={{ color: '#0052D9' }} />
        <span>数据源状态</span>
        {ds.unhealthy > 0 && (
          <Tag color="error" style={{ marginLeft: 'auto' }}>{ds.unhealthy} 异常</Tag>
        )}
      </div>
      <div className={styles.sourceStats}>
        {[
          { label: '总数', val: ds.total, color: undefined },
          { label: '已启用', val: ds.enabled, color: '#0052D9' },
          { label: '健康', val: ds.healthy, color: '#00A870' },
        ].map((s) => (
          <div key={s.label} className={styles.sourceStat}>
            <span className={styles.sourceStatVal} style={{ color: s.color }}>{s.val}</span>
            <span className={styles.sourceStatLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.sourceList}>
        {ds.sources.map((src) => (
          <div key={src.id} className={styles.sourceRow}>
            {statusIcon(src.healthStatus)}
            <span className={styles.sourceName}>{src.displayName}</span>
            <Tag color={src.enabled ? 'success' : 'default'} style={{ marginLeft: 'auto', fontSize: 11 }}>
              {src.enabled ? '启用' : '禁用'}
            </Tag>
            {src.lastSyncAt && (
              <span className={styles.sourceTime}>
                {new Date(src.lastSyncAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Section: 近期内容 ─────────────────────────────────────

function formatSyncTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffH < 1) return '刚刚';
  if (diffH < 24) return `${diffH}小时前`;
  if (diffD < 7) return `${diffD}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function RecentItemsPanel({ items }: { items: NonNullable<DashboardStats['recentItems']> }) {
  const totalCount = (items.repos?.length ?? 0) + (items.papers?.length ?? 0) + (items.videos?.length ?? 0);

  return (
    <div className={styles.widePanel}>
      <div className={styles.panelHeader}>
        <SyncOutlined style={{ color: '#366EF4' }} />
        <span>近期同步内容</span>
        <span className={styles.panelMeta}>{totalCount} 条最新数据</span>
      </div>
      <div className={styles.recentTabs}>

        {/* GitHub 仓库 */}
        {items.repos && items.repos.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentSectionTitle}>
              <GithubOutlined />
              <span>GitHub 仓库</span>
              <span className={styles.recentSectionCount}>{items.repos.length}</span>
            </div>
            <div className={styles.recentList}>
              {items.repos.map((repo) => (
                <div key={repo.id} className={styles.recentCard}>
                  <div className={styles.recentCardMain}>
                    <div className={styles.recentCardName}>{repo.fullName || repo.name}</div>
                    {repo.description && (
                      <div className={styles.recentCardDesc}>{repo.description}</div>
                    )}
                    <div className={styles.recentCardMeta}>
                      {repo.starsCount > 0 && (
                        <span className={styles.recentBadge} style={{ color: '#E37318' }}>
                          ⭐ {repo.starsCount.toLocaleString()}
                        </span>
                      )}
                      {repo.language && (
                        <span className={styles.recentBadge} style={{ color: '#0052D9' }}>
                          {repo.language}
                        </span>
                      )}
                      {repo.viewCount > 0 && (
                        <span className={styles.recentBadge}>
                          👁 {repo.viewCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.recentCardTime}>
                    <div className={styles.recentTimeLabel}>入库时间</div>
                    <div className={styles.recentTimeVal}>{formatSyncTime(repo.createdAt)}</div>
                    {repo.updatedDate && (
                      <>
                        <div className={styles.recentTimeLabel} style={{ marginTop: 4 }}>GitHub更新</div>
                        <div className={styles.recentTimeVal}>{formatDate(repo.updatedDate)}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 论文 */}
        {items.papers && items.papers.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentSectionTitle}>
              <FileTextOutlined />
              <span>论文</span>
              <span className={styles.recentSectionCount}>{items.papers.length}</span>
            </div>
            <div className={styles.recentList}>
              {items.papers.map((paper) => (
                <div key={paper.id} className={styles.recentCard}>
                  <div className={styles.recentCardMain}>
                    <div className={styles.recentCardName}>{paper.title}</div>
                    <div className={styles.recentCardMeta}>
                      {paper.citationCount > 0 && (
                        <span className={styles.recentBadge} style={{ color: '#0052D9' }}>
                          📚 {paper.citationCount} 引用
                        </span>
                      )}
                      {paper.viewCount > 0 && (
                        <span className={styles.recentBadge}>
                          👁 {paper.viewCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.recentCardTime}>
                    <div className={styles.recentTimeLabel}>入库时间</div>
                    <div className={styles.recentTimeVal}>{formatSyncTime(paper.createdAt)}</div>
                    {paper.publishedDate && (
                      <>
                        <div className={styles.recentTimeLabel} style={{ marginTop: 4 }}>发布日期</div>
                        <div className={styles.recentTimeVal}>{formatDate(paper.publishedDate)}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 视频 */}
        {items.videos && items.videos.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentSectionTitle}>
              <span>🎬</span>
              <span>视频</span>
              <span className={styles.recentSectionCount}>{items.videos.length}</span>
            </div>
            <div className={styles.recentList}>
              {items.videos.map((video) => (
                <div key={video.id} className={styles.recentCard}>
                  <div className={styles.recentCardMain}>
                    <div className={styles.recentCardName}>{video.title}</div>
                    <div className={styles.recentCardMeta}>
                      {video.playCount > 0 && (
                        <span className={styles.recentBadge} style={{ color: '#00A870' }}>
                          ▶ {video.playCount.toLocaleString()} 播放
                        </span>
                      )}
                      {video.viewCount > 0 && (
                        <span className={styles.recentBadge}>
                          👁 {video.viewCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.recentCardTime}>
                    <div className={styles.recentTimeLabel}>入库时间</div>
                    <div className={styles.recentTimeVal}>{formatSyncTime(video.createdAt)}</div>
                    {video.publishedDate && (
                      <>
                        <div className={styles.recentTimeLabel} style={{ marginTop: 4 }}>发布日期</div>
                        <div className={styles.recentTimeVal}>{formatDate(video.publishedDate)}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RetentionPanel({ retention }: { retention: NonNullable<DashboardStats['retention']> }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <UserOutlined style={{ color: '#0052D9' }} />
        <span>用户留存分析</span>
        <span className={styles.panelMeta}>次日/7日/30日留存</span>
      </div>
      <div className={styles.metricGrid3}>
        {[
          { label: '次日留存', ...retention.day1 },
          { label: '7日留存', ...retention.day7 },
          { label: '30日留存', ...retention.day30 },
        ].map((item) => (
          <div key={item.label} className={styles.metricCell}>
            <div className={styles.metricCellLabel}>{item.label}</div>
            <div className={styles.metricCellVal} style={{ color: item.rate > 30 ? '#00A870' : item.rate > 10 ? '#E37318' : '#D54941' }}>
              {item.rate}%
            </div>
            <div className={styles.metricCellLabel} style={{ fontSize: 10, marginTop: 2 }}>
              {item.users} 用户
            </div>
          </div>
        ))}
      </div>
      {retention.trend && retention.trend.length > 0 && (
        <>
          <div className={styles.panelDivider} />
          <div className={styles.activityList}>
            <div className={styles.activityRow} style={{ marginBottom: 4 }}>
              <span className={styles.activityLabel} style={{ fontSize: 11, fontWeight: 600 }}>日期</span>
              <span className={styles.activityPct} style={{ flex: 1, textAlign: 'center' }}>留存率</span>
            </div>
            {retention.trend.slice(-5).map((t) => (
              <div key={t.date} className={styles.activityRow}>
                <span className={styles.activityLabel}>{t.date.slice(5)}</span>
                <div className={styles.activityBarWrap}>
                  <Progress
                    percent={t.rate}
                    strokeColor={t.rate > 30 ? '#00A870' : t.rate > 10 ? '#E37318' : '#D54941'}
                    showInfo={false}
                    size="small"
                  />
                </div>
                <span className={styles.activityPct}>{t.rate}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TrafficPanel({ traffic }: { traffic: NonNullable<DashboardStats['traffic']> }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <EyeOutlined style={{ color: '#366EF4' }} />
        <span>流量分析</span>
        <span className={styles.panelMeta}>PV/UV</span>
      </div>
      <div className={styles.metricGrid3}>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>今日PV</div>
          <div className={styles.metricCellVal} style={{ color: '#0052D9' }}>
            {traffic.pvToday.toLocaleString()}
          </div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>今日UV</div>
          <div className={styles.metricCellVal} style={{ color: '#0052D9' }}>
            {traffic.uvToday.toLocaleString()}
          </div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>人均浏览</div>
          <div className={styles.metricCellVal} style={{ color: '#00A870' }}>
            {traffic.uvToday > 0 ? (traffic.pvToday / traffic.uvToday).toFixed(1) : '0'}
          </div>
        </div>
      </div>
      {traffic.topPages && traffic.topPages.length > 0 && (
        <>
          <div className={styles.panelDivider} />
          <div className={styles.activityList}>
            <div className={styles.activityRow} style={{ marginBottom: 4 }}>
              <span className={styles.activityLabel} style={{ fontSize: 11, fontWeight: 600 }}>热门页面</span>
              <span className={styles.activityPct} style={{ flex: 1, textAlign: 'right' }}>浏览量</span>
            </div>
            {traffic.topPages.slice(0, 5).map((p, idx) => (
              <div key={p.page} className={styles.activityRow}>
                <span className={styles.activityLabel} style={{ color: '#1D2129' }}>
                  {idx + 1}. {p.page}
                </span>
                <span className={styles.activityPct} style={{ flex: 1, textAlign: 'right', color: '#0052D9', fontWeight: 600 }}>
                  {p.views.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ContentQualityPanel({ contentQuality }: { contentQuality: NonNullable<DashboardStats['contentQuality']> }) {
  return (
    <div className={styles.widePanel}>
      <div className={styles.panelHeader}>
        <DatabaseOutlined style={{ color: '#00A870' }} />
        <span>内容质量指标</span>
        <span className={styles.panelMeta}>
          平均浏览 {contentQuality.avgViewCount} | 互动率 {contentQuality.avgInteractionRate}%
        </span>
      </div>
      <div className={styles.recentTabs}>
        {contentQuality.topPapers && contentQuality.topPapers.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentSectionTitle}>
              <span>📚</span>
              <span>热门论文</span>
            </div>
            <div className={styles.recentList}>
              {contentQuality.topPapers.slice(0, 5).map((paper) => (
                <div key={paper.id} className={styles.recentCard}>
                  <div className={styles.recentCardMain}>
                    <div className={styles.recentCardName}>{paper.title}</div>
                    <div className={styles.recentCardMeta}>
                      <span className={styles.recentBadge} style={{ color: '#0052D9' }}>
                        👁 {paper.viewCount}
                      </span>
                      {paper.citationCount > 0 && (
                        <span className={styles.recentBadge} style={{ color: '#00A870' }}>
                          📚 {paper.citationCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {contentQuality.topVideos && contentQuality.topVideos.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentSectionTitle}>
              <span>🎬</span>
              <span>热门视频</span>
            </div>
            <div className={styles.recentList}>
              {contentQuality.topVideos.slice(0, 5).map((video) => (
                <div key={video.id} className={styles.recentCard}>
                  <div className={styles.recentCardMain}>
                    <div className={styles.recentCardName}>{video.title}</div>
                    <div className={styles.recentCardMeta}>
                      <span className={styles.recentBadge} style={{ color: '#00A870' }}>
                        ▶ {video.playCount?.toLocaleString() || 0}
                      </span>
                      <span className={styles.recentBadge} style={{ color: '#366EF4' }}>
                        👁 {video.viewCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {contentQuality.topRepos && contentQuality.topRepos.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentSectionTitle}>
              <span>💻</span>
              <span>热门仓库</span>
            </div>
            <div className={styles.recentList}>
              {contentQuality.topRepos.slice(0, 5).map((repo) => (
                <div key={repo.id} className={styles.recentCard}>
                  <div className={styles.recentCardMain}>
                    <div className={styles.recentCardName}>{repo.fullName || repo.name}</div>
                    <div className={styles.recentCardMeta}>
                      <span className={styles.recentBadge} style={{ color: '#E37318' }}>
                        ⭐ {repo.starsCount?.toLocaleString() || 0}
                      </span>
                      <span className={styles.recentBadge} style={{ color: '#366EF4' }}>
                        👁 {repo.viewCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── Main Component ────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { message } = App.useApp();

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/stats') as ApiResponse<DashboardStats>;
      if (res.code === 0) {
        setStats(res.data && typeof res.data === 'object' ? res.data : getDefaultDashboardStats());
        setLastUpdated(new Date());
      } else {
        message.error(res.message || '加载失败');
      }
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string; message?: string };
      setStats(getDefaultDashboardStats());
      setLastUpdated(new Date());
      if (e.status === 401 || e.code === 'UNAUTHORIZED') {
        message.error('未登录或登录已过期，请重新登录');
      } else if (e.code === 'CONNECTION_REFUSED' || e.code === 'TIMEOUT') {
        message.error('后端服务未运行，请确保后端服务已启动');
      } else {
        message.error(e.message || '加载失败');
      }
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (!stats) {
    return (
      <div className={styles.spinWrap}>
        <Spin size="large" />
        <span className={styles.spinText}>正在加载数据...</span>
      </div>
    );
  }

  const communityTotal =
    stats.community.posts.total +
    stats.community.comments.total +
    stats.community.favorites.total;

  const isAllEmpty =
    stats.users.total === 0 &&
    stats.content.total === 0 &&
    communityTotal === 0;

  const weekContentNew =
    stats.content.papers.newThisWeek +
    stats.content.videos.newThisWeek +
    stats.content.repos.newThisWeek;

  return (
    <div className={styles.dashboard}>
      {/* ── 顶部 Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <DatabaseOutlined className={styles.headerIcon} />
          <div>
            <h1 className={styles.headerTitle}>数据看板</h1>
            <span className={styles.headerSub}>实时监控平台核心业务指标</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              更新于 {lastUpdated.toLocaleTimeString('zh-CN')}
            </span>
          )}
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={loadStats}
            loading={loading}
            size="small"
          >
            刷新
          </Button>
        </div>
      </div>

      {/* ── 暂无数据提示 ── */}
      {isAllEmpty && (
        <div className={styles.emptyHint}>
          <DatabaseOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
          <p>暂无数据</p>
          <span>数据来自用户库（USER_DATABASE_URL / dev-user.db）。请先执行用户库迁移：npm run db:migrate:user，再进行内容同步或用户注册</span>
        </div>
      )}

      {/* ── KPI 行 ── */}
      <div className={styles.kpiRow}>
        <KpiCard
          title="注册用户"
          value={stats.users.total}
          trend={stats.users.growthRate}
          sub={`本周新增 +${stats.users.newThisWeek}`}
          color="#0052D9"
          icon={<UserOutlined />}
        />
        <KpiCard
          title="今日活跃 DAU"
          value={stats.users.activeToday}
          sub={`占比 ${stats.users.total > 0 ? ((stats.users.activeToday / stats.users.total) * 100).toFixed(1) : 0}%`}
          color="#366EF4"
          icon={<EyeOutlined />}
        />
        <KpiCard
          title="内容总量"
          value={stats.content.total}
          sub={`本周新增 +${weekContentNew}`}
          color="#00A870"
          icon={<DatabaseOutlined />}
        />
        <KpiCard
          title="社区互动"
          value={communityTotal}
          sub={`帖 ${stats.community.posts.total} · 评 ${stats.community.comments.total}`}
          color="#E37318"
          icon={<CommentOutlined />}
        />
        <KpiCard
          title="活跃订阅"
          value={stats.subscriptions.active}
          sub="邮件订阅用户"
          color="#0052D9"
          icon={<HeartOutlined />}
        />
      </div>

      {/* ── 三栏分析区 ── */}
      <div className={styles.tripleGrid}>
        <UserGrowthPanel users={stats.users} />
        <UserActivityPanel users={stats.users} />
        <CommunityPanel community={stats.community} />
      </div>

      {/* ── 内容健康度 ── */}
      <ContentHealthPanel content={stats.content} />

      {/* ── 用户留存 & 流量分析 ── */}
      <div className={styles.tripleGrid}>
        {stats.retention && <RetentionPanel retention={stats.retention} />}
        {stats.traffic && <TrafficPanel traffic={stats.traffic} />}
        <UserGrowthPanel users={stats.users} />
      </div>

      {/* ── 内容质量指标 ── */}
      {stats.contentQuality && <ContentQualityPanel contentQuality={stats.contentQuality} />}

      {/* ── 数据源状态（如有）── */}
      {stats.dataSources && (
        <div className={styles.dualGrid}>
          <DataSourcePanel ds={stats.dataSources} />
        </div>
      )}

      {/* ── 近期同步内容（全宽）── */}
      {stats.recentItems && <RecentItemsPanel items={stats.recentItems} />}
    </div>
  );
}
