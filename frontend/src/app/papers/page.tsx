'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Input, Tag, Empty, Pagination, Tooltip, Skeleton, App, Radio } from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { paperApi } from '@/lib/api/paper';
import { Paper } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getDateStyle, formatFreshDate } from '@/lib/utils/dateUtils';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

dayjs.extend(relativeTime);

// 排序选项
const SORT_OPTIONS = [
  { value: 'latest', label: '最新发布' },
  { value: 'citation', label: '引用量' },
  { value: 'hot', label: '最热门' },
] as const;

type SortType = 'latest' | 'hot' | 'citation';

export default function PapersPage() {
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<SortType>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const loadPapers = useCallback(async (pageNum: number, keyword: string, currentSort: SortType) => {
    setLoading(true);
    try {
      const data = await paperApi.getPapers({
        page: pageNum,
        size: pageSize,
        sort: currentSort,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        setPapers([]);
        setTotal(0);
        return;
      }

      setPapers(data.items);
      setTotal(data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
        message.error('网络连接失败，请检查网络或稍后重试');
      } else {
        message.error(err.message || '加载论文失败');
      }
      setPapers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize, message]);

  useEffect(() => {
    loadPapers(page, activeKeyword, sort);
  }, [page, sort, activeKeyword]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const handleSearch = () => {
    setActiveKeyword(searchInput);
    setPage(1);
  };

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'paper' });
      const ids = new Set(((data.items || []) as { contentId: string }[]).map((fav) => fav.contentId));
      setFavoriteIds(ids);
    } catch {
      // silent
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
        message.success(already ? '已取消收藏' : '收藏成功');
        loadFavorites();
      })
      .catch((error: { message?: string }) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const formatCitationCount = (count: number) => {
    if (!count) return null;
    if (count >= 10000) return (count / 10000).toFixed(1) + '万';
    return count.toString();
  };

  // 列表模式论文项 - 显示摘要，信息密度高
  const PaperListItem = ({ paper }: { paper: Paper }) => {
    const isFavorite = favoriteIds.has(paper.id);
    const formattedDate = formatFreshDate(paper.publishedDate);
    const dateStyle = getDateStyle(paper.publishedDate);
    const authors = Array.isArray(paper.authors) ? paper.authors : [];
    const citationStr = formatCitationCount(paper.citationCount);

    return (
      <div className={styles.listItem}>
        <div className={styles.listItemMain}>
          {/* 标题 */}
          <Link href={`/papers/${paper.id}`} className={styles.listTitle}>
            {paper.title}
          </Link>

          {/* 作者 */}
          {authors.length > 0 && (
            <div className={styles.listAuthors}>
              {authors.slice(0, 4).join(', ')}
              {authors.length > 4 && <span className={styles.etAl}> 等 {authors.length} 人</span>}
            </div>
          )}

          {/* 摘要 - 研究者判断论文价值的核心 */}
          {paper.abstract && (
            <p className={styles.listAbstract}>{paper.abstract}</p>
          )}

          {/* 元数据行 */}
          <div className={styles.listMeta}>
            <div className={styles.listMetaLeft}>
              {paper.venue && (
                <span className={styles.venueBadge}>{paper.venue}</span>
              )}
              {paper.arxivId && (
                <span className={styles.arxivBadge}>arXiv · {paper.arxivId}</span>
              )}
              {formattedDate && (
                <span className={styles.metaItem} style={dateStyle}>
                  <CalendarOutlined style={{ marginRight: 3 }} />
                  {formattedDate}
                </span>
              )}
              {citationStr && (
                <Tooltip title="引用次数">
                  <span className={styles.metaItem}>
                    <span className={styles.citationIcon}>引</span>
                    {citationStr}
                  </span>
                </Tooltip>
              )}
              {paper.viewCount > 0 && (
                <Tooltip title="浏览次数">
                  <span className={styles.metaItem}>
                    <EyeOutlined style={{ marginRight: 3 }} />
                    {paper.viewCount}
                  </span>
                </Tooltip>
              )}
            </div>
            <div className={styles.listActions}>
              {paper.pdfUrl && (
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadOutlined /> PDF
                </a>
              )}
              <button
                className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
                onClick={() => handleToggleFavorite(paper.id)}
                title={isFavorite ? '取消收藏' : '收藏'}
              >
                {isFavorite ? <StarFilled /> : <StarOutlined />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 卡片模式 - 保留但简化
  const PaperCard = ({ paper }: { paper: Paper }) => {
    const isFavorite = favoriteIds.has(paper.id);
    const formattedDate = formatFreshDate(paper.publishedDate);
    const dateStyle = getDateStyle(paper.publishedDate);
    const authors = Array.isArray(paper.authors) ? paper.authors : [];
    const citationStr = formatCitationCount(paper.citationCount);

    return (
      <div className={styles.paperCard}>
        <div className={styles.cardBody}>
          <Link href={`/papers/${paper.id}`} className={styles.cardTitle}>
            {paper.title}
          </Link>
          {authors.length > 0 && (
            <div className={styles.cardAuthors}>
              {authors.slice(0, 3).join(', ')}
              {authors.length > 3 && ` 等`}
            </div>
          )}
          {paper.abstract && (
            <p className={styles.cardAbstract}>{paper.abstract}</p>
          )}
          <div className={styles.cardFooter}>
            <div className={styles.cardTags}>
              {paper.venue && <span className={styles.venueBadge}>{paper.venue}</span>}
              {citationStr && <span className={styles.metaItem}><span className={styles.citationIcon}>引</span>{citationStr}</span>}
              {formattedDate && <span className={styles.metaItem} style={dateStyle}>{formattedDate}</span>}
            </div>
            <div className={styles.listActions}>
              {paper.pdfUrl && (
                <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                  <DownloadOutlined /> PDF
                </a>
              )}
              <button
                className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
                onClick={() => handleToggleFavorite(paper.id)}
              >
                {isFavorite ? <StarFilled /> : <StarOutlined />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className={styles.listContainer}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={styles.listItem} style={{ padding: '20px 24px' }}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ))}
    </div>
  );

  return (
    <PageContainer loading={false} maxWidth="1360px">
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ===== 左侧边栏 ===== */}
          <aside className={styles.sidebar}>
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

            {/* 统计信息 */}
            <div className={styles.sidebarSection}>
              <div className={styles.statsCard}>
                <div className={styles.statsNumber}>{total.toLocaleString()}</div>
                <div className={styles.statsLabel}>篇收录论文</div>
                <div className={styles.statsDesc}>具身智能 · 机器人 · AI 前沿</div>
              </div>
            </div>
          </aside>

          {/* ===== 主内容区（用 div 避免与 PageContainer 的 main 嵌套）===== */}
          <div className={styles.main} role="region" aria-label="论文列表">
            {/* 顶部工具栏 */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <h1 className={styles.pageTitle}>学术论文</h1>
                {activeKeyword && (
                  <Tag
                    closable
                    onClose={() => { setActiveKeyword(''); setSearchInput(''); }}
                    style={{ marginLeft: 8 }}
                  >
                    搜索: {searchInput || activeKeyword}
                  </Tag>
                )}
              </div>
              <div className={styles.toolbarRight}>
                <Input.Search
                  placeholder="搜索标题、作者、关键词..."
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={handleSearch}
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#999' }} />}
                />
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  size="middle"
                  className={styles.viewToggle}
                >
                  <Radio.Button value="list" title="列表视图">
                    <UnorderedListOutlined />
                  </Radio.Button>
                  <Radio.Button value="card" title="卡片视图">
                    <AppstoreOutlined />
                  </Radio.Button>
                </Radio.Group>
              </div>
            </div>

            {/* 结果计数 */}
            {!loading && papers.length > 0 && (
              <div className={styles.resultInfo}>
                共找到 <strong>{total.toLocaleString()}</strong> 篇论文
              </div>
            )}

            {/* 内容区 */}
            {loading && papers.length === 0 ? (
              renderSkeleton()
            ) : papers.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无匹配的论文"
                style={{ padding: '80px 0' }}
              />
            ) : viewMode === 'list' ? (
              <div className={styles.listContainer}>
                {papers.map((paper) => (
                  <PaperListItem key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {papers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            )}

            {/* 分页 */}
            {papers.length > 0 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showTotal={(t, range) => `第 ${range[0]}–${range[1]} 篇，共 ${t} 篇`}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
