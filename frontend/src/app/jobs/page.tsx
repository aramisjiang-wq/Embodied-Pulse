'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Form,
  Upload,
  Avatar,
  Typography,
  Pagination,
  Skeleton,
  App,
  Tooltip,
  Space,
  Radio,
} from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ClockCircleFilled,
} from '@ant-design/icons';
import { jobApi } from '@/lib/api/job';
import { Job, JobSeekingPost } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { getDateStyle, formatFreshDate } from '@/lib/utils/dateUtils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { TextArea } = Input;
const { Text } = Typography;

type TabType = 'recruitment' | 'jobseeking';
type ViewType = 'card' | 'list';
type SortType = 'latest' | 'hot' | 'salary';

const TAB_ITEMS = [
  { id: 'recruitment', label: '招聘信息', emoji: '🏢' },
  { id: 'jobseeking', label: '求职信息', emoji: '👤' },
] as const;

const LOCATIONS = [
  { id: 'all', label: '全部地区', value: undefined as string | undefined, emoji: '🌏' },
  { id: 'beijing', label: '北京', value: '北京', emoji: '🏙️' },
  { id: 'shanghai', label: '上海', value: '上海', emoji: '🌆' },
  { id: 'shenzhen', label: '深圳', value: '深圳', emoji: '🌃' },
  { id: 'hangzhou', label: '杭州', value: '杭州', emoji: '🌁' },
  { id: 'guangzhou', label: '广州', value: '广州', emoji: '🌉' },
  { id: 'chengdu', label: '成都', value: '成都', emoji: '🏔️' },
  { id: 'remote', label: '远程', value: '远程', emoji: '💻' },
];

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '最热门' },
  { value: 'salary', label: '薪资最高' },
];

export default function JobsPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSeekingPosts, setJobSeekingPosts] = useState<JobSeekingPost[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('recruitment');
  const [viewType, setViewType] = useState<ViewType>('card');
  const [sort, setSort] = useState<SortType>('latest');
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishType, setPublishType] = useState<'recruitment' | 'jobseeking'>('recruitment');
  const [publishForm] = Form.useForm();
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myPostsModalVisible, setMyPostsModalVisible] = useState(false);

  const toggleExpand = (jobId: string) => {
    setExpandedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  useEffect(() => {
    if (activeTab === 'recruitment') {
      loadJobs(1);
    } else {
      loadJobSeekingPosts(1);
    }
  }, [activeTab, sort, location]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const loadJobs = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await jobApi.getJobs({
        page: pageNum,
        size: pageSize,
        sort,
        location,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        setJobs([]);
        setTotal(0);
        return;
      }

      setJobs(data.items);
      setPage(pageNum);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Load jobs error:', error);
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadJobSeekingPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await jobApi.getJobSeekingPosts({
        page: pageNum,
        size: pageSize,
        sort,
        location,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        setJobSeekingPosts([]);
        setTotal(0);
        return;
      }

      setJobSeekingPosts(data.items as unknown as JobSeekingPost[]);
      setPage(pageNum);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Load job seeking posts error:', error);
      setJobSeekingPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
    if (activeTab === 'recruitment') {
      loadJobs(1);
    } else {
      loadJobSeekingPosts(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (activeTab === 'recruitment') {
      loadJobs(newPage);
    } else {
      loadJobSeekingPosts(newPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'job' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Load favorites error:', error);
    }
  };

  const handleToggleFavorite = (jobId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(jobId);
    const action = already
      ? communityApi.deleteFavorite('job', jobId)
      : communityApi.createFavorite({ contentType: 'job', contentId: jobId });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const handlePublish = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setPublishType(activeTab === 'recruitment' ? 'recruitment' : 'jobseeking');
    setPublishModalVisible(true);
  };

  const handlePublishSubmit = async (values: any) => {
    try {
      if (publishType === 'recruitment') {
        await jobApi.createJob(values);
      } else {
        await jobApi.createJobSeekingPost(values);
      }
      message.success('发布成功！');
      setPublishModalVisible(false);
      publishForm.resetFields();
      if (activeTab === 'recruitment') {
        loadJobs(1);
      } else {
        loadJobSeekingPosts(1);
      }
    } catch (error: any) {
      message.error(error.message || '发布失败');
    }
  };

  const handleLoadMyPosts = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    try {
      const data = await jobApi.getMyPosts();
      setMyPosts(data.items);
      setMyPostsModalVisible(true);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    }
  };

  const handleDeletePost = async (postId: string, type: 'recruitment' | 'jobseeking') => {
    try {
      if (type === 'recruitment') {
        await jobApi.deleteJob(postId);
      } else {
        await jobApi.deleteJobSeekingPost(postId);
      }
      message.success('删除成功');
      setMyPosts(myPosts.filter((post: any) => post.id !== postId));
      if (activeTab === 'recruitment') {
        loadJobs(1);
      } else {
        loadJobSeekingPosts(1);
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file: any) => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('只能上传PDF格式的简历');
      }
      return isPDF || Upload.LIST_IGNORE;
    },
    onChange: (info: any) => {
      if (info.file.status === 'done') {
        publishForm.setFieldsValue({ resume: info.file });
      }
    },
  };

  const renderJobCard = (job: Job) => {
    const isFav = favoriteIds.has(job.id);
    const expired = job.isExpired;
    const isExpanded = expandedJobIds.has(job.id);
    const applyUrl = job.applyUrl ?? (job as unknown as Record<string, unknown>).apply_url as string | undefined;
    const hasDesc = !!(job.description || job.requirements);
    const descForCard = (job.description || job.requirements || '').replace(/\n*申请链接:.*$/i, '').trim();
    const dateStyle = getDateStyle(job.createdAt);
    const dateLabel = job.createdAt ? formatFreshDate(job.createdAt, 'MM-DD') || dayjs(job.createdAt).fromNow() : '';

    const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a')) return;
      if (applyUrl && !expired) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = `/jobs/${job.id}`;
      }
    };

    return (
      <div
        key={job.id}
        role="link"
        tabIndex={0}
        className={styles.jobCard}
        style={{ opacity: expired ? 0.7 : 1, cursor: 'pointer' }}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(e as unknown as React.MouseEvent); }}
      >
        <div className={styles.jobCardBody}>
          {/* 标题行：标题 + 有效性 + 收藏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: expired ? '#8c8c8c' : '#1a1a1a', lineHeight: 1.35, flex: 1, minWidth: 0 }}>
              {job.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              {expired ? (
                <Tooltip title="发布满 30 天自动过期，或发布方已关闭岗位">
                  <span style={{ fontSize: 10, padding: '1px 5px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 4, color: '#ff4d4f', whiteSpace: 'nowrap' }}>
                    <ClockCircleFilled style={{ fontSize: 9, marginRight: 2 }} />已过期
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="发布后 30 天内有效，可正常投递">
                  <span style={{ fontSize: 10, padding: '1px 5px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, color: '#52c41a', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    招聘中
                  </span>
                </Tooltip>
              )}
              <button
                onClick={() => handleToggleFavorite(job.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 6px',
                  borderRadius: 4, border: `1px solid ${isFav ? '#faad14' : '#e8e8e8'}`,
                  background: isFav ? '#fffbe6' : '#fff', color: isFav ? '#faad14' : '#bfbfbf',
                  cursor: 'pointer', fontSize: 10, transition: 'all 0.15s',
                }}
              >
                {isFav ? <StarFilled style={{ fontSize: 10 }} /> : <StarOutlined style={{ fontSize: 10 }} />}
              </button>
            </div>
          </div>

          {/* 薪资 + 公司/地点/经验 一行 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            {(job.salaryMin || job.salaryMax) && (
              <span style={{ fontSize: 13, fontWeight: 700, color: expired ? '#aaa' : '#007AFF' }}>
                {job.salaryMin && job.salaryMax ? `${job.salaryMin}–${job.salaryMax}K` : `${job.salaryMin || job.salaryMax}K`}
              </span>
            )}
            {job.company && <span style={{ fontSize: 11, color: '#595959' }}><TeamOutlined style={{ fontSize: 10, marginRight: 2 }} />{job.company}</span>}
            {job.location && <span style={{ fontSize: 11, color: '#595959' }}><EnvironmentOutlined style={{ fontSize: 10, marginRight: 2 }} />{job.location}</span>}
            {job.experience && <span style={{ fontSize: 10, color: '#8c8c8c' }}>{job.experience}</span>}
          </div>

          {/* 岗位描述摘要（首段或首行，无申请链接文案） */}
          {descForCard && (
            <div style={{ marginBottom: 2 }} onClick={e => e.stopPropagation()}>
              <div style={{
                fontSize: 11, color: '#595959', lineHeight: 1.5,
                maxHeight: isExpanded ? 'none' : '2.25em',
                overflow: isExpanded ? 'visible' : 'hidden',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {descForCard}
              </div>
              {descForCard.length > 60 && (
                <button
                  onClick={() => toggleExpand(job.id)}
                  style={{ fontSize: 10, color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginTop: 1 }}
                >
                  {isExpanded ? '收起 ▲' : '展开 ▼'}
                </button>
              )}
            </div>
          )}

          {isExpanded && job.benefits && (
            <div style={{ fontSize: 10, color: '#52c41a', marginBottom: 2, padding: '2px 6px', background: '#f6ffed', borderRadius: 4 }}>
              🎁 {job.benefits}
            </div>
          )}

          {/* 底部：日期（规范）+ 投递提示 */}
          <div style={{ paddingTop: 4, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f5f5f5' }}>
            {job.createdAt && (
              <Tooltip title={dayjs(job.createdAt).format('YYYY-MM-DD HH:mm')}>
                <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, ...dateStyle }}>
                  <ClockCircleOutlined style={{ fontSize: 10 }} />
                  {dateLabel}
                </span>
              </Tooltip>
            )}
            {applyUrl && !expired && (
              <span style={{ fontSize: 10, color: '#007AFF', fontWeight: 600 }}>点击卡片投递 →</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderJobListItem = (job: Job) => {
    const isFav = favoriteIds.has(job.id);
    const expired = job.isExpired;
    const isExpanded = expandedJobIds.has(job.id);
    const applyUrl = job.applyUrl ?? (job as unknown as Record<string, unknown>).apply_url as string | undefined;
    const descForCard = (job.description || job.requirements || '').replace(/\n*申请链接:.*$/i, '').trim();
    const dateStyle = getDateStyle(job.createdAt);
    const dateLabel = job.createdAt ? formatFreshDate(job.createdAt, 'MM-DD') || dayjs(job.createdAt).fromNow() : '';

    const handleRowClick = () => {
      if (applyUrl && !expired) window.open(applyUrl, '_blank', 'noopener,noreferrer');
      else window.location.href = `/jobs/${job.id}`;
    };

    return (
      <div
        key={job.id}
        role="link"
        tabIndex={0}
        className={styles.listItem}
        style={{ opacity: expired ? 0.7 : 1, cursor: 'pointer' }}
        onClick={handleRowClick}
        onKeyDown={(e) => { if (e.key === 'Enter') handleRowClick(); }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: expired ? '#8c8c8c' : '#1a1a1a' }}>
                {job.title}
              </span>
              {expired ? (
                <Tooltip title="发布满 30 天自动过期，或发布方已关闭岗位">
                  <span style={{ fontSize: 10, padding: '1px 5px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 4, color: '#ff4d4f' }}>
                    <ClockCircleFilled style={{ fontSize: 9, marginRight: 2 }} />已过期
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="发布后 30 天内有效，可正常投递">
                  <span style={{ fontSize: 10, padding: '1px 5px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, color: '#52c41a', fontWeight: 600 }}>招聘中</span>
                </Tooltip>
              )}
              {(job.salaryMin || job.salaryMax) && (
                <span style={{ fontSize: 13, fontWeight: 700, color: expired ? '#8c8c8c' : '#007AFF' }}>
                  {job.salaryMin && job.salaryMax ? `${job.salaryMin}–${job.salaryMax}K` : `${job.salaryMin || job.salaryMax}K`}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 2 }}>
              {job.company && <span style={{ fontSize: 11, color: '#595959' }}><TeamOutlined style={{ fontSize: 10, marginRight: 2 }} />{job.company}</span>}
              {job.location && <span style={{ fontSize: 11, color: '#595959' }}><EnvironmentOutlined style={{ fontSize: 10, marginRight: 2 }} />{job.location}</span>}
              {job.experience && <span style={{ fontSize: 10, color: '#8c8c8c' }}>{job.experience}</span>}
              {job.createdAt && (
                <Tooltip title={dayjs(job.createdAt).format('YYYY-MM-DD HH:mm')}>
                  <span style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 2, ...dateStyle }}>
                    <ClockCircleOutlined style={{ fontSize: 10 }} />{dateLabel}
                  </span>
                </Tooltip>
              )}
            </div>
            {descForCard && (
              <div onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 11, color: '#8c8c8c', maxHeight: isExpanded ? 'none' : '1.8em', overflow: 'hidden', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {descForCard}
                </div>
                {descForCard.length > 50 && (
                  <button onClick={() => toggleExpand(job.id)} style={{ fontSize: 10, color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {isExpanded ? '收起 ▲' : '展开 ▼'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleToggleFavorite(job.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 8px',
                borderRadius: 4, border: `1px solid ${isFav ? '#faad14' : '#e8e8e8'}`,
                background: isFav ? '#fffbe6' : '#fff', color: isFav ? '#faad14' : '#8c8c8c',
                cursor: 'pointer', fontSize: 10,
              }}
            >
              {isFav ? <StarFilled style={{ fontSize: 10 }} /> : <StarOutlined style={{ fontSize: 10 }} />}
              {isFav ? '已收藏' : '收藏'}
            </button>
            {applyUrl && !expired && <span style={{ fontSize: 10, color: '#007AFF', fontWeight: 600 }}>点击投递 →</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderJobSeekingCard = (post: JobSeekingPost) => {
    const expired = post.isExpired;
    return (
      <div key={post.id} className={styles.jobCard} style={{ opacity: expired ? 0.6 : 1 }}>
        <div className={styles.jobCardBody}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size={40} src={post.avatarUrl} icon={<UserOutlined />} style={{ background: '#007AFF', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: expired ? '#8c8c8c' : '#1a1a1a' }}>{post.name || '求职者'}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>{post.targetPosition || '期望职位'}</div>
              </div>
            </div>
            {expired && (
              <span style={{ fontSize: 11, padding: '2px 7px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 4, color: '#ff4d4f', display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <ClockCircleFilled style={{ fontSize: 10 }} />已过期
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            {post.expectedLocation && (
              <span style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 3 }}>
                <EnvironmentOutlined style={{ fontSize: 11 }} />{post.expectedLocation}
              </span>
            )}
            {post.expectedSalary && (
              <span style={{ fontSize: 13, fontWeight: 600, color: expired ? '#8c8c8c' : '#007AFF' }}>{post.expectedSalary}</span>
            )}
          </div>

          {post.skills && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {post.skills.split(',').slice(0, 4).map((skill: string) => (
                <span key={skill} style={{ fontSize: 11, padding: '2px 8px', background: '#f5f5f5', borderRadius: 4, color: '#595959' }}>
                  {skill.trim()}
                </span>
              ))}
            </div>
          )}

          {post.introduction && (
            <Text style={{ fontSize: 13, color: '#8c8c8c', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
              {post.introduction}
            </Text>
          )}
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={styles.listItem}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
  );

  const currentItems = activeTab === 'recruitment' ? jobs : jobSeekingPosts;
  const currentLocationLabel = LOCATIONS.find((l) => l.value === location)?.label;

  return (
    <PageContainer loading={false}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ===== 左侧边栏 ===== */}
          <aside className={styles.sidebar}>
            {/* 信息类型 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>信息类型</div>
              <div className={styles.topicList}>
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`${styles.topicItem} ${activeTab === tab.id ? styles.topicItemActive : ''}`}
                    onClick={() => { setActiveTab(tab.id as TabType); setPage(1); }}
                  >
                    <span className={styles.topicEmoji}>{tab.emoji}</span>
                    <span className={styles.topicLabel}>{tab.label}</span>
                    {activeTab === tab.id && <span className={styles.topicDot} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 工作地点 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>工作地点</div>
              <div className={styles.topicList}>
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    className={`${styles.topicItem} ${location === loc.value && !customLocationInput ? styles.topicItemActive : ''}`}
                    onClick={() => { setLocation(loc.value); setCustomLocationInput(''); setPage(1); }}
                  >
                    <span className={styles.topicEmoji}>{loc.emoji}</span>
                    <span className={styles.topicLabel}>{loc.label}</span>
                    {location === loc.value && !customLocationInput && <span className={styles.topicDot} />}
                  </button>
                ))}
              </div>
              {/* 自定义地点搜索 */}
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Input
                  size="small"
                  placeholder="其他城市..."
                  value={customLocationInput}
                  onChange={e => setCustomLocationInput(e.target.value)}
                  onPressEnter={() => {
                    if (customLocationInput.trim()) {
                      setLocation(customLocationInput.trim());
                      setPage(1);
                    }
                  }}
                  style={{ flex: 1, fontSize: 12, borderRadius: 6 }}
                  allowClear
                  onClear={() => { setCustomLocationInput(''); setLocation(undefined); setPage(1); }}
                />
                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#007AFF', borderColor: '#007AFF', borderRadius: 6, fontSize: 12 }}
                  onClick={() => {
                    if (customLocationInput.trim()) {
                      setLocation(customLocationInput.trim());
                      setPage(1);
                    }
                  }}
                >搜</Button>
              </div>
              {customLocationInput && location === customLocationInput.trim() && (
                <div style={{ fontSize: 11, color: '#007AFF', marginTop: 4 }}>
                  当前筛选：{location}
                </div>
              )}
            </div>

            {/* 排序方式 */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>排序方式</div>
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
                <div className={styles.statsLabel}>{activeTab === 'recruitment' ? '条招聘信息' : '条求职信息'}</div>
                <div className={styles.statsDesc}>具身智能 · 机器人行业</div>
              </div>
            </div>

            {/* 招聘状态规则说明（仅招聘信息 Tab 显示） */}
            {activeTab === 'recruitment' && (
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionTitle}>状态说明</div>
                <div className={styles.statusRules}>
                  <p className={styles.statusRulesItem}>
                    <span className={styles.statusRulesLabel}>招聘中</span>
                    <span>发布后 30 天内有效，可正常投递。</span>
                  </p>
                  <p className={styles.statusRulesItem}>
                    <span className={styles.statusRulesLabel}>已过期</span>
                    <span>发布满 30 天后系统自动标记为已过期；发布方也可主动关闭岗位（关闭后不再展示）。</span>
                  </p>
                </div>
              </div>
            )}
          </aside>

          {/* ===== 主内容区 ===== */}
          <main className={styles.main}>
            {/* 工具栏 */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <h1 className={styles.pageTitle}>
                  {activeTab === 'recruitment' ? '招聘信息' : '求职信息'}
                  {currentLocationLabel && currentLocationLabel !== '全部地区' && (
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#8c8c8c', marginLeft: 8 }}>
                      · {currentLocationLabel}
                    </span>
                  )}
                </h1>
              </div>
              <div className={styles.toolbarRight}>
                <Input.Search
                  placeholder={activeTab === 'recruitment' ? '搜索职位、公司...' : '搜索求职者、技能...'}
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={handleSearch}
                  allowClear
                />
                {activeTab === 'recruitment' && (
                  <Radio.Group value={viewType} onChange={(e) => setViewType(e.target.value)} size="middle">
                    <Radio.Button value="card" title="卡片视图"><AppstoreOutlined /></Radio.Button>
                    <Radio.Button value="list" title="列表视图"><UnorderedListOutlined /></Radio.Button>
                  </Radio.Group>
                )}
                <Button onClick={handleLoadMyPosts} style={{ borderRadius: 8, height: 36, fontSize: 13 }}>
                  我的发布
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handlePublish}
                  style={{ borderRadius: 8, height: 36, fontSize: 13, background: '#007AFF', borderColor: '#007AFF' }}
                >
                  发布信息
                </Button>
              </div>
            </div>

            {/* 结果计数 */}
            {!loading && currentItems.length > 0 && (
              <div className={styles.resultInfo}>
                共找到 <strong>{total.toLocaleString()}</strong>{' '}
                {activeTab === 'recruitment' ? '条招聘信息' : '条求职信息'}
              </div>
            )}

            {/* 内容 */}
            {loading && currentItems.length === 0 ? (
              renderSkeleton()
            ) : currentItems.length === 0 ? (
              <div style={{ padding: '80px 0', textAlign: 'center', color: '#8c8c8c', fontSize: 15, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10 }}>
                {keyword ? '暂无匹配结果' : activeTab === 'recruitment' ? '暂无招聘信息' : '暂无求职信息'}
              </div>
            ) : activeTab === 'recruitment' ? (
              viewType === 'card' ? (
                <div className={styles.cardGrid}>
                  {jobs.map((job) => renderJobCard(job))}
                </div>
              ) : (
                <div className={styles.listContainer}>
                  {jobs.map((job) => renderJobListItem(job))}
                </div>
              )
            ) : (
              <div className={styles.cardGrid}>
                {jobSeekingPosts.map((post) => renderJobSeekingCard(post))}
              </div>
            )}

            {/* 分页 */}
            {currentItems.length > 0 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showTotal={(t, range) => `第 ${range[0]}–${range[1]} 条，共 ${t} 条`}
                  showSizeChanger={false}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 发布弹窗 */}
      <Modal
        title={publishType === 'recruitment' ? '发布招聘信息' : '发布求职信息'}
        open={publishModalVisible}
        onCancel={() => { setPublishModalVisible(false); publishForm.resetFields(); }}
        onOk={() => publishForm.submit()}
        width={600}
        styles={{ body: { padding: 24 } }}
      >
        <Form form={publishForm} layout="vertical" onFinish={handlePublishSubmit}>
          {publishType === 'recruitment' ? (
            <>
              <Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
                <Input placeholder="如：高级前端工程师" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="company" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
                <Input placeholder="请输入公司名称" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="location" label="工作地点">
                <Input placeholder="如：北京" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item label="薪资范围（K）">
                <Space>
                  <Form.Item name="salaryMin" noStyle>
                    <Input type="number" min={0} placeholder="最低" style={{ width: 100, height: 40 }} />
                  </Form.Item>
                  <span>-</span>
                  <Form.Item name="salaryMax" noStyle>
                    <Input type="number" min={0} placeholder="最高" style={{ width: 100, height: 40 }} />
                  </Form.Item>
                </Space>
              </Form.Item>
              <Form.Item name="description" label="职位描述">
                <TextArea rows={3} placeholder="请输入职位描述" />
              </Form.Item>
              <Form.Item name="tags" label="技能标签">
                <Input placeholder="多个标签用逗号分隔，如：React,TypeScript" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="applyUrl" label="申请链接">
                <Input placeholder="请输入申请链接" style={{ height: 40 }} />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="targetPosition" label="期望职位" rules={[{ required: true, message: '请输入期望职位' }]}>
                <Input placeholder="如：前端工程师" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="expectedLocation" label="期望工作地点">
                <Input placeholder="如：北京" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="expectedSalary" label="期望薪资">
                <Input placeholder="如：20-30K" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="skills" label="技能标签">
                <Input placeholder="多个技能用逗号分隔，如：React,TypeScript" style={{ height: 40 }} />
              </Form.Item>
              <Form.Item name="introduction" label="自我介绍">
                <TextArea rows={3} placeholder="请输入自我介绍" />
              </Form.Item>
              <Form.Item name="resume" label="简历">
                <Upload.Dragger {...uploadProps}>
                  <p style={{ padding: '12px 20px', color: '#8c8c8c' }}>点击或拖拽上传简历（PDF格式）</p>
                </Upload.Dragger>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 我的发布弹窗 */}
      <Modal
        title="我的发布"
        open={myPostsModalVisible}
        onCancel={() => setMyPostsModalVisible(false)}
        footer={null}
        width={640}
        styles={{ body: { padding: 24 } }}
      >
        {myPosts.length > 0 ? (
          myPosts.map((post: any) => {
            const expired = post.isExpired;
            return (
              <div
                key={post.id}
                style={{ padding: '14px 18px', marginBottom: 10, background: '#fafafa', border: `1px solid ${expired ? '#ffccc7' : '#f0f0f0'}`, borderRadius: 8, opacity: expired ? 0.8 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: expired ? '#8c8c8c' : '#1a1a1a' }}>{post.title || post.targetPosition}</span>
                      {expired && (
                        <span style={{ fontSize: 11, padding: '1px 6px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 4, color: '#ff4d4f', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <ClockCircleFilled style={{ fontSize: 10 }} />已过期
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, fontWeight: 600, ...getDateStyle(post.createdAt) }}>
                      {formatFreshDate(post.createdAt, 'YYYY-MM-DD')}
                      {post.expiresAt && (
                        <span style={{ marginLeft: 8 }}>
                          · 有效期至 {dayjs(post.expiresAt).format('YYYY-MM-DD')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    danger
                    size="small"
                    onClick={() => handleDeletePost(post.id, post.type || 'recruitment')}
                    style={{ borderRadius: 6, height: 32, flexShrink: 0 }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#bfbfbf', fontSize: 15 }}>
            暂无发布记录
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
