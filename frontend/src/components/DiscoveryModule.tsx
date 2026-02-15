/**
 * 发现模块组件
 * 展示所有资源（GitHub, HuggingFace, Bilibili, 市集），支持最热/最新排序
 */

'use client';

import { useState, useEffect, memo } from 'react';
import { Card, Segmented, Button, Space, Tag, Empty, Spin, Pagination } from 'antd';
import { ThunderboltOutlined, RocketOutlined, GithubOutlined, RobotOutlined, PlayCircleOutlined, CommentOutlined, CompassOutlined, FileTextOutlined, UserOutlined, ShareAltOutlined, StarOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { feedApi } from '@/lib/api/feed';
import { discoveryApi } from '@/lib/api/discovery';
import { FeedItem, FeedItemType } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { Post } from '@/lib/api/types';
import { cleanText } from '@/lib/utils/htmlUtils';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import DiscoverySkeleton from './DiscoverySkeleton';

dayjs.extend(relativeTime);

interface DiscoveryModuleProps {
  onShare?: (item: FeedItem) => void;
  onToggleFavorite?: (item: FeedItem) => void;
  isFavorited?: (item: FeedItem) => boolean;
}

type FeedTab = 'recommend' | 'latest' | 'code' | 'huggingface' | 'video';

interface DiscoveryItem {
  id: string;
  type: FeedItemType;
  createdAt?: string;
  publishedDate?: string;
  title?: string;
  name?: string;
  fullName?: string;
  description?: string;
  abstract?: string;
  arxivId?: string;
  pdfUrl?: string;
  htmlUrl?: string;
  videoId?: string;
  platform?: string;
  hfId?: string;
  url?: string;
  applyUrl?: string;
  citationCount?: number;
  uploader?: string;
  playCount?: number;
  duration?: number;
  starsCount?: number;
  language?: string;
  downloads?: number;
  task?: string;
  company?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  viewCount?: number;
}

const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  return (error as { code?: string }).code;
};

const toDiscoveryItems = (items: unknown): DiscoveryItem[] => (
  Array.isArray(items) ? (items as DiscoveryItem[]) : []
);

const commonWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'their', 'our', 'we', 'you', 'your', 'i', 'my', 'me', 'he', 'him', 'she', 'her', 'they', 'them', 'his', 'hers', 'ours', 'yours', 'theirs', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'while', 'any', 'being', 'doing', 'having', 'make', 'made', 'take', 'get', 'got', 'got', 'getting', 'go', 'goes', 'went', 'gone', 'going', 'come', 'comes', 'came', 'coming', 'see', 'sees', 'saw', 'seen', 'seeing', 'know', 'knows', 'knew', 'known', 'knowing', 'think', 'thinks', 'thought', 'thinking', 'want', 'wants', 'wanted', 'wanting', 'use', 'uses', 'used', 'using', 'find', 'finds', 'found', 'finding', 'give', 'gives', 'gave', 'given', 'giving', 'tell', 'tells', 'told', 'telling', 'ask', 'asks', 'asked', 'asking', 'work', 'works', 'worked', 'working', 'seem', 'seems', 'seemed', 'seeming', 'feel', 'feels', 'felt', 'feeling', 'try', 'tries', 'tried', 'trying', 'leave', 'leaves', 'left', 'leaving', 'call', 'calls', 'called', 'calling', 'need', 'needs', 'needed', 'needing', 'become', 'becomes', 'became', 'becoming', 'put', 'puts', 'putting', 'mean', 'means', 'meant', 'meaning', 'keep', 'keeps', 'kept', 'keeping', 'let', 'lets', 'letting', 'begin', 'begins', 'began', 'begun', 'beginning', 'show', 'shows', 'showed', 'shown', 'showing', 'hear', 'hears', 'heard', 'hearing', 'play', 'plays', 'played', 'playing', 'run', 'runs', 'ran', 'running', 'move', 'moves', 'moved', 'moving', 'live', 'lives', 'lived', 'living', 'believe', 'believes', 'believed', 'believing', 'hold', 'holds', 'held', 'holding', 'bring', 'brings', 'brought', 'bringing', 'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote', 'written', 'writing', 'provide', 'provides', 'provided', 'providing', 'sit', 'sits', 'sat', 'sitting', 'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost', 'losing', 'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting', 'include', 'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing', 'set', 'sets', 'set', 'setting', 'learn', 'learns', 'learned', 'learning', 'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading', 'understand', 'understands', 'understood', 'understanding', 'watch', 'watches', 'watched', 'watching', 'follow', 'follows', 'followed', 'following', 'stop', 'stops', 'stopped', 'stopping', 'create', 'creates', 'created', 'creating', 'speak', 'speaks', 'spoke', 'spoken', 'speaking', 'read', 'reads', 'read', 'reading', 'allow', 'allows', 'allowed', 'allowing', 'add', 'adds', 'added', 'adding', 'spend', 'spends', 'spent', 'spending', 'grow', 'grows', 'grew', 'grown', 'growing', 'open', 'opens', 'opened', 'opening', 'walk', 'walks', 'walked', 'walking', 'win', 'wins', 'won', 'winning', 'offer', 'offers', 'offered', 'offering', 'remember', 'remembers', 'remembered', 'remembering', 'love', 'loves', 'loved', 'loving', 'consider', 'considers', 'considered', 'considering', 'appear', 'appears', 'appeared', 'appearing', 'buy', 'buys', 'bought', 'buying', 'wait', 'waits', 'waited', 'waiting', 'serve', 'serves', 'served', 'serving', 'die', 'dies', 'died', 'dying', 'send', 'sends', 'sent', 'sending', 'expect', 'expects', 'expected', 'expecting', 'build', 'builds', 'built', 'building', 'stay', 'stays', 'stayed', 'staying', 'fall', 'falls', 'fell', 'fallen', 'falling', 'cut', 'cuts', 'cut', 'cutting', 'reach', 'reaches', 'reached', 'reaching', 'kill', 'kills', 'killed', 'killing', 'remain', 'remains', 'remained', 'remaining', 'suggest', 'suggests', 'suggested', 'suggesting', 'raise', 'raises', 'raised', 'raising', 'pass', 'passes', 'passed', 'passing', 'sell', 'sells', 'sold', 'selling', 'require', 'requires', 'required', 'requiring', 'report', 'reports', 'reported', 'reporting', 'decide', 'decides', 'decided', 'deciding', 'pull'
]);

function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  if (!text) return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
  
  return sortedWords;
}

export default memo(function DiscoveryModule({ 
  onShare, 
  onToggleFavorite, 
  isFavorited 
}: DiscoveryModuleProps) {
  const [loading, setLoading] = useState(false);
  const [feedItems, setFeedItems] = useState<DiscoveryItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [contentType, setContentType] = useState<'all' | 'github' | 'huggingface' | 'video' | 'paper' | 'community' | 'news'>('all');
  const [sortType, setSortType] = useState<'hot' | 'latest'>('latest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  useEffect(() => {
    loadContent();
  }, [contentType, sortType, page]);

  const loadContent = async () => {
    setLoading(true);
    try {
      if (contentType === 'community') {
        // 加载市集帖子
        const data = await communityApi.getPosts({
          page: page,
          size: pageSize,
          sort: sortType === 'hot' ? 'hot' : 'latest',
        });
        setCommunityPosts(Array.isArray(data.items) ? data.items : []);
        setTotal(data.pagination?.total || 0);
      } else {
        // 加载其他资源
        if (contentType === 'paper' || contentType === 'news' || contentType === 'all' || contentType === 'github' || contentType === 'huggingface' || contentType === 'video') {
          // 使用 discoveryApi 加载
          try {
            const data = await discoveryApi.getDiscovery({
              contentType: contentType,
              sortType: sortType,
              page: page,
              size: pageSize,
            });
            setFeedItems(Array.isArray(data.items) ? data.items : []);
            setTotal(data.pagination?.total || 0);
          } catch (discoveryError: unknown) {
            console.error('Discovery API error:', discoveryError);
            // 如果 discoveryApi 失败，尝试降级到 feedApi（仅对非 paper 和 news 类型）
            if (contentType !== 'paper' && contentType !== 'news') {
              const tabMap: Record<string, FeedTab> = {
                all: sortType === 'hot' ? 'recommend' : 'latest',
                github: 'code',
                huggingface: 'huggingface',
                video: 'video',
              };
              
              const data = await feedApi.getFeed({
                page: page,
                size: pageSize,
                tab: tabMap[contentType] || 'recommend',
              });
              setFeedItems(toDiscoveryItems(data.items));
              setTotal(data.pagination?.total || 0);
            } else {
              // paper 类型只能使用 discoveryApi，失败则设置空数据
              setFeedItems([]);
              setTotal(0);
            }
          }
        } else {
          // 其他类型使用 feedApi
          const tabMap: Record<string, FeedTab> = {
            all: sortType === 'hot' ? 'recommend' : 'latest',
            github: 'code',
            huggingface: 'huggingface',
            video: 'video',
          };
          
          const data = await feedApi.getFeed({
            page: page,
            size: pageSize,
            tab: tabMap[contentType] || 'recommend',
          });
          setFeedItems(toDiscoveryItems(data.items));
          setTotal(data.pagination?.total || 0);
        }
      }
    } catch (error: unknown) {
      console.error('Load content error:', error);
      // 处理所有错误情况，设置空数据避免页面崩溃
      setFeedItems([]);
      setCommunityPosts([]);
      setTotal(0);
      // 网络错误不显示错误消息，其他错误显示
      const errorCode = getErrorCode(error);
      if (errorCode !== 'CONNECTION_REFUSED' && errorCode !== 'TIMEOUT' && errorCode !== 'NETWORK_ERROR') {
        // 可以在这里添加错误提示，但为了避免干扰用户体验，暂时不显示
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Card
      title={
        <Space>
          <CompassOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>发现</span>
        </Space>
      }
      extra={
        <Space>
          <Segmented
            value={sortType}
            onChange={(value) => setSortType(value as 'hot' | 'latest')}
            options={[
              { label: <Space><RocketOutlined style={{ color: '#1890ff' }} />最新</Space>, value: 'latest' },
            ]}
            size="small"
          />
        </Space>
      }
      style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: '100%' }}
    >
      {/* 资源类型切换 */}
      <div style={{ marginBottom: 24 }} className="tab-buttons-container">
        <Space size="middle" wrap>
          <Tag
            color={contentType === 'all' ? 'blue' : 'default'}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('all')}
          >
            全部
          </Tag>
          <Tag
            color={contentType === 'paper' ? 'blue' : 'default'}
            icon={<FileTextOutlined />}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('paper')}
          >
            论文
          </Tag>
          <Tag
            color={contentType === 'github' ? 'blue' : 'default'}
            icon={<GithubOutlined />}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('github')}
          >
            GitHub
          </Tag>
          <Tag
            color={contentType === 'huggingface' ? 'blue' : 'default'}
            icon={<RobotOutlined />}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('huggingface')}
          >
            HuggingFace
          </Tag>
          <Tag
            color={contentType === 'video' ? 'blue' : 'default'}
            icon={<PlayCircleOutlined />}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('video')}
          >
            视频
          </Tag>
          <Tag
            color={contentType === 'news' ? 'blue' : 'default'}
            icon={<FileTextOutlined />}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('news')}
          >
            新闻
          </Tag>
          <Tag
            color={contentType === 'community' ? 'blue' : 'default'}
            icon={<CommentOutlined />}
            style={{ 
              padding: '4px 16px', 
              fontSize: 14, 
              cursor: 'pointer',
              borderRadius: 20
            }}
            onClick={() => setContentType('community')}
          >
            市集
          </Tag>
        </Space>
      </div>

      {/* 内容展示 */}
      {loading && feedItems.length === 0 && communityPosts.length === 0 ? (
        <DiscoverySkeleton />
      ) : (
        <>
          {contentType === 'community' ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {Array.isArray(communityPosts) && communityPosts.length > 0 ? communityPosts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12 }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                          {post.title || post.content}
                        </div>
                        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                          {post.content && post.title ? post.content.substring(0, 100) + '...' : ''}
                        </div>
                        <Space size="large" style={{ fontSize: 12, color: '#8c8c8c' }}>
                          <span>{post.user?.username || '匿名'}</span>
                          <span>{dayjs(post.createdAt).fromNow()}</span>
                          {post.viewCount && post.viewCount > 0 && <span>👁️ {post.viewCount}</span>}
                          {post.likeCount && post.likeCount > 0 && <span>👍 {post.likeCount}</span>}
                          {post.commentCount && post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
                        </Space>
                      </div>
                    </div>
                  </Card>
                </Link>
              )) : null}
            </Space>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.isArray(feedItems) && feedItems.length > 0 ? feedItems.map((item, index) => {
                // 转换数据格式以匹配FeedCard的期望格式
                const getDateString = (date: unknown): string | null => {
                  if (!date) return null;
                  if (date instanceof Date) return date.toISOString();
                  if (typeof date === 'string') return date;
                  return null;
                };
                
                const feedItem: FeedItem = {
                  id: item.id,
                  type: item.type,
                  data: item as unknown as FeedItem['data'],
                  createdAt: getDateString(item.publishedDate) || getDateString(item.createdAt) || new Date().toISOString(),
                };
                
                // 列表布局渲染
                return (
                  <Card
                    key={`${item.type}-${item.id}`}
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: '1px solid #f0f0f0',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* 左侧图标 */}
                      <div style={{ 
                        fontSize: 32,
                        lineHeight: 1,
                        flexShrink: 0,
                        color: item.type === 'paper' ? '#1890ff' : 
                             item.type === 'video' ? '#00a1d6' :
                             item.type === 'repo' ? '#722ed1' :
                             item.type === 'huggingface' ? '#13c2c2' :
                             item.type === 'job' ? '#fa8c16' : '#8c8c8c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
        {item.type === 'paper' ? '📄' :
         item.type === 'video' ? <PlayCircleOutlined style={{ fontSize: 32, color: '#00a1d6' }} /> :
                         item.type === 'repo' ? <GithubOutlined style={{ fontSize: 32, color: '#1890ff' }} /> :
                         item.type === 'huggingface' ? <img src="/huggingface-icon.svg" alt="HuggingFace" style={{ width: '32px', height: '32px' }} /> :
                         item.type === 'job' ? '💼' : '📌'}
                      </div>
                      
                      {/* 中间内容区域 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {(() => {
                          // 构建外部链接
                          let externalUrl = '#';
                          if (item.type === 'paper' && item.arxivId) {
                            externalUrl = `https://arxiv.org/abs/${item.arxivId}`;
                          } else if (item.type === 'paper' && item.pdfUrl) {
                            externalUrl = item.pdfUrl;
                          } else if (item.type === 'repo' && item.htmlUrl) {
                            externalUrl = item.htmlUrl;
                          } else if (item.type === 'repo' && item.fullName) {
                            externalUrl = `https://github.com/${item.fullName}`;
                          } else if (item.type === 'video' && item.platform === 'bilibili' && item.videoId) {
                            externalUrl = `https://www.bilibili.com/video/${item.videoId}`;
                          } else if (item.type === 'video' && item.platform === 'youtube' && item.videoId) {
                            externalUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
                          } else if (item.type === 'huggingface' && item.fullName) {
                            externalUrl = `https://huggingface.co/${item.fullName}`;
                          } else if (item.type === 'huggingface' && item.hfId) {
                            externalUrl = `https://huggingface.co/${item.hfId}`;
                          } else if (item.type === 'news' && item.url) {
                            externalUrl = item.url;
                          } else if (item.type === 'job' && item.applyUrl) {
                            externalUrl = item.applyUrl;
                          }
                          
                          return (
                            <a href={externalUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <h3 style={{
                              fontSize: 16,
                              fontWeight: 600,
                              margin: 0,
                              color: '#262626',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: item.type === 'paper' ? 3 : 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1,
                            }}>
                                {cleanText(item.title || item.fullName || item.name || '无标题')}
                              </h3>
                              {item.type === 'paper' && (
                                <Button
                                  type="text"
                                  size="small"
                                  icon={expandedItems.has(`${item.type}-${item.id}`) ? <UpOutlined /> : <DownOutlined />}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newExpanded = new Set(expandedItems);
                                    if (newExpanded.has(`${item.type}-${item.id}`)) {
                                      newExpanded.delete(`${item.type}-${item.id}`);
                                    } else {
                                      newExpanded.add(`${item.type}-${item.id}`);
                                    }
                                    setExpandedItems(newExpanded);
                                  }}
                                  style={{ padding: 0, height: 'auto', minWidth: 'auto' }}
                                />
                              )}
                              </div>
                            </a>
                          );
                        })()}
                        
                        {/* 描述/摘要 */}
                        {expandedItems.has(`${item.type}-${item.id}`) && (item.description || item.abstract) && (
                          <p style={{
                            fontSize: 14,
                            color: '#595959',
                            margin: '0 0 12px 0',
                            lineHeight: 1.6,
                          }}>
                            {cleanText(item.description || item.abstract || '')}
                          </p>
                        )}
                        
                        {/* 关键词标签（仅论文） */}
                        {item.type === 'paper' && (
                          <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
                            {extractKeywords(cleanText(item.title + ' ' + (item.abstract || '')), 4).map((keyword, index) => (
                              <Tag key={index} color="blue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                {keyword}
                              </Tag>
                            ))}
                          </Space>
                        )}
                        
                        {/* 元信息 */}
                        <Space size="middle" wrap style={{ fontSize: 13, color: '#8c8c8c' }}>
                          {item.type === 'paper' && (
                            <>
                              {item.citationCount !== undefined && item.citationCount > 0 && (
                                <span>📚 {item.citationCount} 引用</span>
                              )}
                              {item.publishedDate && <span>📅 {dayjs(item.publishedDate).format('YYYY-MM-DD')}</span>}
                            </>
                          )}
                          {item.type === 'video' && (
                            <>
                              {item.uploader && <span>👤 {item.uploader}</span>}
                              {item.playCount !== undefined && <span>👁️ {item.playCount.toLocaleString()}</span>}
                              {item.duration && <span>⏱️ {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}</span>}
                              {item.publishedDate && <span>📅 {dayjs(item.publishedDate).format('YYYY-MM-DD')}</span>}
                            </>
                          )}
                          {item.type === 'repo' && (
                            <>
                              {item.starsCount !== undefined && <span>⭐ {item.starsCount.toLocaleString()}</span>}
                              {item.language && <span>💻 {item.language}</span>}
                              {item.publishedDate && (
                                <span>📅 {dayjs(item.publishedDate).format('YYYY-MM-DD')}</span>
                              )}
                            </>
                          )}
                          {item.type === 'huggingface' && (
                            <>
                              {item.downloads !== undefined && <span>⬇️ {item.downloads.toLocaleString()}</span>}
                              {item.task && <Tag color="purple">{item.task}</Tag>}
                              {item.publishedDate && (
                                <span>📅 {dayjs(item.publishedDate).format('YYYY-MM-DD')}</span>
                              )}
                            </>
                          )}
                          {item.type === 'job' && (
                            <>
                              {item.company && <span>🏢 {item.company}</span>}
                              {item.location && <span>📍 {item.location}</span>}
                              {item.salaryMin && item.salaryMax && (
                                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                                  💰 {item.salaryMin}-{item.salaryMax}K
                                </span>
                              )}
                              {item.publishedDate && (
                                <span>📅 {dayjs(item.publishedDate).format('YYYY-MM-DD')}</span>
                              )}
                            </>
                          )}
                          {item.type !== 'video' && item.type !== 'paper' && item.type !== 'repo' && item.type !== 'huggingface' && item.type !== 'job' && (
                            item.viewCount && item.viewCount > 0 && <span>👁️ {item.viewCount}</span>
                          )}
                        </Space>
                      </div>
                      
                      {/* 右侧操作按钮 */}
                      <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          type="text"
                          icon={isFavorited && isFavorited(feedItem) ? <StarOutlined style={{ color: '#fadb14' }} /> : <StarOutlined />}
                          onClick={() => onToggleFavorite?.(feedItem)}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<ShareAltOutlined />}
                          onClick={() => onShare?.(feedItem)}
                        />
                      </div>
                    </div>
                  </Card>
                );
              }) : null}
            </div>
          )}

          {(feedItems.length === 0 && communityPosts.length === 0) && !loading && (
            <Empty
              description="暂无内容"
              style={{ padding: '40px 0' }}
            />
          )}

          {total > 0 && (
            <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 条`}
                style={{ display: 'inline-block' }}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
});
