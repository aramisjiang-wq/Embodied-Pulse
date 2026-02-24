'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Card,
  Empty,
  Tooltip,
  Skeleton,
  App,
  Pagination,
  Modal,
  Form,
  Tag,
  Radio,
  Select,
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  GithubOutlined,
  PlusOutlined,
  StarOutlined,
  ForkOutlined,
  LinkOutlined,
  HeartOutlined,
  HeartFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { repoApi, RepoCounts } from '@/lib/api/repo';
import { GithubRepo } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import apiClient from '@/lib/api/client';
import { getDateStyle } from '@/lib/utils/dateUtils';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type ViewMode = 'card' | 'list';
type SortType = 'stars' | 'latest';

/** 具身智能资源清单 6 大板块 + 子分类（与 docs/具身智能GitHub仓库资源清单.md 一致） */
const REPO_CATEGORIES: { id: string; label: string; emoji: string; children?: { id: string; label: string }[] }[] = [
  { id: '1', emoji: '📌', label: '核心技术', children: [
    { id: '1.1', label: '视觉-语言-动作 (VLA)' },
    { id: '1.2', label: '模仿学习与行为克隆' },
    { id: '1.3', label: '强化学习框架与算法' },
    { id: '1.4', label: '世界模型与预测' },
  ]},
  { id: '2', emoji: '📊', label: '数据与仿真', children: [
    { id: '2.1', label: '核心数据集' },
    { id: '2.2', label: '机器人仿真环境' },
  ]},
  { id: '3', emoji: '🦾', label: '操作与控制', children: [
    { id: '3.1', label: '机器人操作与抓取' },
    { id: '3.2', label: '灵巧手与精细操作' },
    { id: '3.3', label: '运动规划与控制' },
  ]},
  { id: '4', emoji: '👁️', label: '感知与导航', children: [
    { id: '4.1', label: '机器人导航与SLAM' },
    { id: '4.2', label: '3D视觉与点云处理' },
    { id: '4.3', label: '机器人视觉与感知' },
  ]},
  { id: '5', emoji: '🤖', label: '平台与系统', children: [
    { id: '5.1', label: 'ROS与机器人操作系统' },
    { id: '5.2', label: '人形机器人与四足机器人' },
    { id: '5.3', label: '开源机器人硬件平台' },
    { id: '5.4', label: '大语言模型与机器人结合' },
    { id: '5.5', label: '遥操作与数据采集' },
    { id: '5.6', label: 'Sim2Real与域适应' },
  ]},
  { id: '6', emoji: '🛠️', label: '工具与资源', children: [
    { id: '6.1', label: '机器人学习框架' },
    { id: '6.2', label: '机器人工具与库' },
    { id: '6.3', label: '综合资源清单' },
    { id: '6.4', label: '自动驾驶与移动机器人' },
    { id: '6.5', label: '触觉感知与传感器' },
    { id: '6.6', label: '多机器人系统' },
    { id: '6.7', label: '机器人安全与可靠性' },
  ]},
];

const LANGUAGES = [
  { id: 'all', label: '全部语言', value: undefined as string | undefined, emoji: '🌐' },
  { id: 'python', label: 'Python', value: 'Python', emoji: '🐍' },
  { id: 'cpp', label: 'C++', value: 'C++', emoji: '🔧' },
  { id: 'javascript', label: 'JavaScript', value: 'JavaScript', emoji: '📦' },
  { id: 'typescript', label: 'TypeScript', value: 'TypeScript', emoji: '💎' },
  { id: 'jupyter', label: 'Jupyter Notebook', value: 'Jupyter Notebook', emoji: '📊' },
  { id: 'java', label: 'Java', value: 'Java', emoji: '☕' },
  { id: 'go', label: 'Go', value: 'Go', emoji: '🔵' },
  { id: 'rust', label: 'Rust', value: 'Rust', emoji: '🦀' },
  { id: 'lua', label: 'Lua', value: 'Lua', emoji: '🌙' },
];

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'stars', label: 'Star 数' },
  { value: 'latest', label: '最近更新' },
];

const formatNumber = (num: number): string => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    'C++': '#f34b7d',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    Lua: '#000080',
    'Jupyter Notebook': '#DA5B0B',
    Shell: '#89e051',
    C: '#555555',
    'C#': '#178600',
  };
  return colors[language] || '#6b7280';
};

export default function ReposPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<SortType>('latest');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { user, isAuthenticated } = useAuthStore();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [repoPreview, setRepoPreview] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm] = Form.useForm();
  const [counts, setCounts] = useState<RepoCounts>({ total: 0, categoryCounts: {}, languageCounts: {} });

  useEffect(() => {
    loadRepos(1);
  }, [sort, language, category]);

  useEffect(() => {
    repoApi.getRepoCounts().then(setCounts);
  }, []);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const loadRepos = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await repoApi.getRepos({
        page: pageNum,
        size: pageSize,
        sort,
        language,
        category,
        keyword: keyword || undefined,
      });

      if (!data) {
        setRepos([]);
        setPage(pageNum);
        setTotal(0);
        return;
      }

      const items = data?.items || [];
      const pagination = data?.pagination || { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false };

      setRepos(items);
      setPage(pageNum);
      setTotal(pagination.total);
    } catch (error: any) {
      message.error(error.message || '加载项目失败');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
    loadRepos(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadRepos(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (value: string | undefined) => {
    setCategory(value);
    setPage(1);
    // 切换分类时清空关键词，避免「分类+关键词」交集为空导致显示“无项目”
    setKeyword('');
    setSearchInput('');
  };

  const handleLanguageSelect = (value: string | undefined) => {
    setLanguage(value);
    setPage(1);
    setKeyword('');
    setSearchInput('');
  };

  const handleSortChange = (value: SortType) => {
    setSort(value);
    setPage(1);
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'repo' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Load favorites error:', error);
    }
  };

  const handleToggleFavorite = (repoId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(repoId);
    const action = already
      ? communityApi.deleteFavorite('repo', repoId)
      : communityApi.createFavorite({ contentType: 'repo', contentId: repoId });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        if (!already && (error.code === 1006 || error.message?.includes('已经收藏'))) {
          loadFavorites();
          return;
        }
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const fetchGitHubRepoInfo = async () => {
    if (!githubUrl.trim()) {
      message.warning('请输入GitHub仓库URL');
      return;
    }
    setFetchingRepo(true);
    try {
      const response = await apiClient.get('/github-repo-info/info', {
        params: { url: githubUrl.trim() },
      });
      if (response.code === 0) {
        const repoData = response.data as any;
        setRepoPreview(repoData);
        submitForm.setFieldsValue({ description: repoData?.description || '' });
        message.success('获取仓库信息成功！');
      } else {
        message.error(response.message || '获取仓库信息失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '获取仓库信息失败');
    } finally {
      setFetchingRepo(false);
    }
  };

  const handleSubmitRepo = async (values: any) => {
    if (!repoPreview) {
      message.warning('请先获取仓库信息');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        repoId: repoPreview.repoId,
        fullName: repoPreview.fullName,
        name: repoPreview.name,
        owner: repoPreview.owner,
        description: values.description || repoPreview.description,
        language: repoPreview.language,
        starsCount: repoPreview.starsCount,
        forksCount: repoPreview.forksCount,
        issuesCount: repoPreview.issuesCount,
        topics: repoPreview.topics || [],
        htmlUrl: `https://github.com/${repoPreview.fullName}`,
        createdDate: repoPreview.createdDate,
        updatedDate: repoPreview.updatedDate,
        category: values.category || null, // 分类字段，可选
      };
      const response = await apiClient.post('/repos', payload);
      if (response.code === 0) {
        message.success('提交成功！感谢您的贡献 🎉');
        setSubmitModalOpen(false);
        setGithubUrl('');
        setRepoPreview(null);
        submitForm.resetFields();
        loadRepos(1);
        repoApi.getRepoCounts().then(setCounts);
      } else if (response.code === 1007) {
        message.warning('该项目已在列表中，无需重复提交');
      } else {
        message.error(response.message || '提交失败');
      }
    } catch (error: any) {
      if (error.code === 'UNAUTHORIZED') {
        message.error('登录状态已过期，请重新登录后再试');
        setSubmitModalOpen(false);
        setGithubUrl('');
        setRepoPreview(null);
        submitForm.resetFields();
      } else if (error.response?.data?.code === 1007) {
        message.warning('该项目已在列表中，无需重复提交');
      } else {
        message.error(error.response?.data?.message || error.message || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const RepoCard = ({ repo }: { repo: GithubRepo }) => {
    const isFavorited = favoriteIds.has(repo.id);
    return (
      <div className={styles.repoCard}>
        <div className={styles.repoCardBody}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a
                href={repo.htmlUrl || `https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <GithubOutlined style={{ fontSize: 15, color: '#24292f', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#24292f', wordBreak: 'break-word', lineHeight: 1.4 }}>
                    {repo.name}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#8b949e', marginLeft: 21 }}>
                  {repo.owner || repo.fullName?.split('/')[0]}
                </div>
              </a>
            </div>
            {repo.language && (
              <Tag
                style={{
                  background: `${getLanguageColor(repo.language)}18`,
                  color: getLanguageColor(repo.language),
                  border: `1px solid ${getLanguageColor(repo.language)}35`,
                  borderRadius: 5,
                  fontSize: 11,
                  padding: '1px 8px',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {repo.language}
              </Tag>
            )}
          </div>

          <div style={{
            fontSize: 13,
            color: '#57606a',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 40,
          }}>
            {repo.description || '暂无描述'}
          </div>

          {repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {repo.topics.slice(0, 3).map((topic: string) => (
                <Tag
                  key={topic}
                  style={{ background: '#ddf4ff', color: '#0969da', border: 'none', borderRadius: 12, fontSize: 11, padding: '2px 8px' }}
                >
                  {topic}
                </Tag>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
            <span className={styles.repoStats}>
              <StarOutlined style={{ color: '#e3b341' }} />
              {formatNumber(repo.starsCount || 0)}
            </span>
            <span className={styles.repoStats}>
              <ForkOutlined />
              {formatNumber(repo.forksCount || 0)}
            </span>
            {repo.updatedDate && (
              <Tooltip title={`GitHub 仓库最后提交时间：${dayjs(repo.updatedDate).format('YYYY-MM-DD')}`}>
                <span className={styles.repoStats} style={{ ...getDateStyle(repo.updatedDate), fontSize: 11 }}>
                  <ClockCircleOutlined />
                  {dayjs(repo.updatedDate).fromNow()}
                </span>
              </Tooltip>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => handleToggleFavorite(repo.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 6,
                border: `1px solid ${isFavorited ? '#ff4d4f' : '#e8e8e8'}`,
                background: isFavorited ? '#fff1f0' : '#fff',
                color: isFavorited ? '#ff4d4f' : '#8c8c8c',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {isFavorited ? <HeartFilled style={{ fontSize: 12 }} /> : <HeartOutlined style={{ fontSize: 12 }} />}
              {isFavorited ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className={styles.listContainer}>
      {repos.map((repo) => {
        const isFavorited = favoriteIds.has(repo.id);
        return (
          <div key={repo.id} className={styles.listItem}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <GithubOutlined style={{ fontSize: 16, color: '#24292f' }} />
                  <a
                    href={repo.htmlUrl || `https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 15, fontWeight: 600, color: '#24292f', textDecoration: 'none' }}
                  >
                    {repo.fullName || repo.name}
                  </a>
                  {repo.language && (
                    <Tag
                      style={{
                        background: `${getLanguageColor(repo.language)}18`,
                        color: getLanguageColor(repo.language),
                        border: `1px solid ${getLanguageColor(repo.language)}35`,
                        borderRadius: 5,
                        fontSize: 11,
                        padding: '1px 8px',
                        fontWeight: 500,
                      }}
                    >
                      {repo.language}
                    </Tag>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#57606a', lineHeight: 1.6, marginBottom: 8 }}>
                  {repo.description || '暂无描述'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span className={styles.repoStats}>
                    <StarOutlined style={{ color: '#e3b341' }} />
                    {formatNumber(repo.starsCount || 0)} Stars
                  </span>
                  <span className={styles.repoStats}>
                    <ForkOutlined />
                    {formatNumber(repo.forksCount || 0)} Forks
                  </span>
                  {repo.updatedDate && (
                    <Tooltip title={`GitHub 仓库最后提交时间：${dayjs(repo.updatedDate).format('YYYY-MM-DD')}`}>
                      <span className={styles.repoStats} style={getDateStyle(repo.updatedDate)}>
                        <ClockCircleOutlined />
                        仓库更新 {dayjs(repo.updatedDate).fromNow()}
                      </span>
                    </Tooltip>
                  )}
                  {repo.createdAt && (
                    <Tooltip title={`收录到本平台的时间：${dayjs(repo.createdAt).format('YYYY-MM-DD')}`}>
                      <span className={styles.repoStats} style={{ color: '#b0b0b0' }}>
                        收录于 {dayjs(repo.createdAt).fromNow()}
                      </span>
                    </Tooltip>
                  )}
                  {repo.topics && Array.isArray(repo.topics) && repo.topics.slice(0, 3).map((topic: string) => (
                    <Tag
                      key={topic}
                      style={{ background: '#ddf4ff', color: '#0969da', border: 'none', borderRadius: 12, fontSize: 11, padding: '2px 8px' }}
                    >
                      {topic}
                    </Tag>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleToggleFavorite(repo.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: `1px solid ${isFavorited ? '#ff4d4f' : '#e8e8e8'}`,
                  background: isFavorited ? '#fff1f0' : '#fff',
                  color: isFavorited ? '#ff4d4f' : '#8c8c8c',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {isFavorited ? <HeartFilled /> : <HeartOutlined />}
                {isFavorited ? '已收藏' : '收藏'}
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
          <div key={n} className={styles.repoCard} style={{ padding: 18 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
    ) : (
      <div className={styles.listContainer}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={styles.listItem}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    );

  const currentCategoryLabel = (() => {
    if (!category) return '全部项目';
    for (const block of REPO_CATEGORIES) {
      const child = block.children?.find((c) => c.id === category);
      if (child) return `${block.emoji} ${child.label}`;
    }
    return '全部项目';
  })();

  const currentLang = LANGUAGES.find((l) => l.value === language);
  const currentLanguageLabel = currentLang ? currentLang.label : '';

  return (
    <PageContainer loading={false}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ===== 左侧边栏 ===== */}
          <aside className={styles.sidebar}>
            {/* 分类：按资源清单 6 大板块 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>分类</div>
              <div className={styles.topicList}>
                <button
                  className={`${styles.topicItem} ${!category ? styles.topicItemActive : ''}`}
                  onClick={() => handleCategorySelect(undefined)}
                >
                  <span className={styles.topicEmoji}>📂</span>
                  <span className={styles.topicLabel}>全部项目</span>
                  <span className={styles.topicCount}>{counts.total.toLocaleString()}</span>
                  {!category && <span className={styles.topicDot} />}
                </button>
                {REPO_CATEGORIES.map((block) => (
                  <div key={block.id} className={styles.categoryBlock}>
                    <div className={styles.categoryBlockTitle}>
                      <span className={styles.topicEmoji}>{block.emoji}</span>
                      <span className={styles.categoryBlockLabel}>{block.label}</span>
                    </div>
                    {block.children?.map((child) => {
                      const n = counts.categoryCounts[child.id] ?? 0;
                      return (
                        <button
                          key={child.id}
                          className={`${styles.topicItem} ${styles.topicItemSub} ${category === child.id ? styles.topicItemActive : ''}`}
                          onClick={() => handleCategorySelect(child.id)}
                        >
                          <span className={styles.topicLabel}>{child.label}</span>
                          <span className={styles.topicCount}>{n.toLocaleString()}</span>
                          {category === child.id && <span className={styles.topicDot} />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 编程语言 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>编程语言</div>
              <div className={styles.topicList}>
                {LANGUAGES.map((lang) => {
                  const n = lang.id === 'all' ? counts.total : (counts.languageCounts[lang.value ?? ''] ?? 0);
                  return (
                    <button
                      key={lang.id}
                      className={`${styles.topicItem} ${language === lang.value ? styles.topicItemActive : ''}`}
                      onClick={() => handleLanguageSelect(lang.value)}
                    >
                      <span className={styles.topicEmoji}>{lang.emoji}</span>
                      <span className={styles.topicLabel}>{lang.label}</span>
                      <span className={styles.topicCount}>{n.toLocaleString()}</span>
                      {language === lang.value && <span className={styles.topicDot} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 排序方式 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>排序方式</div>
              <div className={styles.sortList}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.sortItem} ${sort === opt.value ? styles.sortItemActive : ''}`}
                    onClick={() => handleSortChange(opt.value)}
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
                <div className={styles.statsLabel}>个开源项目</div>
                <div className={styles.statsDesc}>具身智能 · 机器人 · AI 前沿</div>
              </div>
            </div>
          </aside>

          {/* ===== 主内容区 ===== */}
          <main className={styles.main}>
            {/* 工具栏 */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <h1 className={styles.pageTitle}>{currentCategoryLabel}</h1>
              </div>
              <div className={styles.toolbarRight}>
                <Input.Search
                  placeholder="搜索项目名称、描述..."
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={handleSearch}
                  allowClear
                />
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  size="middle"
                >
                  <Radio.Button value="card" title="卡片视图">
                    <AppstoreOutlined />
                  </Radio.Button>
                  <Radio.Button value="list" title="列表视图">
                    <UnorderedListOutlined />
                  </Radio.Button>
                </Radio.Group>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className={styles.submitBtn}
                  style={{ background: '#238636', borderColor: '#238636' }}
                  onClick={() => {
                    if (!isAuthenticated) {
                      message.warning('请先登录后再提交项目');
                      return;
                    }
                    setSubmitModalOpen(true);
                  }}
                >
                  提交项目
                </Button>
              </div>
            </div>

            {/* 结果计数 */}
            {!loading && repos.length > 0 && (
              <div className={styles.resultInfo}>
                共找到 <strong>{total.toLocaleString()}</strong> 个项目
                {category && <> · {currentCategoryLabel}</>}
                {language && <> · {LANGUAGES.find((l) => l.value === language)?.label}</>}
              </div>
            )}

            {/* 内容 */}
            {loading && repos.length === 0 ? (
              renderSkeleton()
            ) : repos.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: '#8b949e', fontSize: 15 }}>暂无 GitHub 项目</span>}
                style={{ padding: '80px 0' }}
              />
            ) : viewMode === 'card' ? (
              <div className={styles.cardGrid}>
                {repos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
              </div>
            ) : (
              renderListView()
            )}

            {/* 分页 */}
            {repos.length > 0 && (
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

      {/* 提交弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GithubOutlined style={{ fontSize: 18 }} />
            <span>提交 GitHub 项目</span>
          </div>
        }
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false);
          setGithubUrl('');
          setRepoPreview(null);
          submitForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <div className={styles.submitModal}>
          <div className={styles.submitUrlInput}>
            <Input
              placeholder="粘贴GitHub仓库URL，如：https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              size="large"
              prefix={<LinkOutlined style={{ color: '#8b949e' }} />}
              style={{ flex: 1 }}
            />
            <Button type="primary" onClick={fetchGitHubRepoInfo} loading={fetchingRepo} size="large" style={{ borderRadius: 8 }}>
              解析
            </Button>
          </div>
        </div>

        {repoPreview && (
          <Form form={submitForm} layout="vertical" onFinish={handleSubmitRepo}>
            <Card className={styles.previewCard}>
              <div className={styles.previewContent}>
                <GithubOutlined style={{ fontSize: 24, color: '#24292f', marginTop: 4 }} />
                <div className={styles.previewInfo}>
                  <div className={styles.previewTitle}>{repoPreview.fullName}</div>
                  <div className={styles.previewDescription}>{repoPreview.description || '暂无描述'}</div>
                  <div className={styles.previewMeta}>
                    {repoPreview.language && <Tag className={styles.languageTag}>{repoPreview.language}</Tag>}
                    <span className={styles.repoStats}>
                      <StarOutlined style={{ color: '#e3b341' }} />
                      {formatNumber(repoPreview.starsCount || 0)}
                    </span>
                    <span className={styles.repoStats}>
                      <ForkOutlined />
                      {formatNumber(repoPreview.forksCount || 0)}
                    </span>
                  </div>
                  {repoPreview.topics && repoPreview.topics.length > 0 && (
                    <div className={styles.previewTopics}>
                      {repoPreview.topics.slice(0, 5).map((topic: string) => (
                        <Tag key={topic} className={styles.topicTag}>{topic}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Form.Item name="description" label="补充描述（可选）">
              <Input.TextArea placeholder="可以补充项目描述或推荐理由..." rows={3} showCount maxLength={500} />
            </Form.Item>

            <Form.Item 
              name="category" 
              label="项目分类（可选）" 
              tooltip={'选择分类后，项目会出现在对应的分类页面中。如果不选择，项目将显示在"全部项目"中。'}
            >
              <Select 
                placeholder="选择项目分类（可选）" 
                allowClear
                style={{ width: '100%' }}
              >
                {REPO_CATEGORIES.map((block) => (
                  <Select.OptGroup key={block.id} label={`${block.emoji} ${block.label}`}>
                    {(block.children || []).map((c) => (
                      <Select.Option key={c.id} value={c.id}>
                        {c.id} {c.label}
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                ))}
              </Select>
            </Form.Item>

            <div className={styles.formActions}>
              <Button onClick={() => { setSubmitModalOpen(false); setGithubUrl(''); setRepoPreview(null); submitForm.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#238636', borderColor: '#238636' }}>
                提交项目
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </PageContainer>
  );
}
