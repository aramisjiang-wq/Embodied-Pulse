/**
 * 首页 - 信息流
 * YouTube风格的信息流展示
 */

'use client';

import { useState, useEffect } from 'react';
import { Layout, Segmented, Row, Col, Spin, Button, Carousel, Tag, Space, Skeleton, Empty, App } from 'antd';
import { AppstoreOutlined, FileTextOutlined, PlayCircleOutlined, GithubOutlined, RobotOutlined, TeamOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { feedApi } from '@/lib/api/feed';
import { FeedItem } from '@/lib/api/types';
import FeedCard from '@/components/FeedCard';
import { useAuthStore } from '@/store/authStore';
import ShareModal from '@/components/ShareModal';
import { communityApi } from '@/lib/api/community';
import { bannerApi } from '@/lib/api/banner';
import { statsApi, ContentStats } from '@/lib/api/stats';
import { announcementApi } from '@/lib/api/announcement';
import { homeModuleApi } from '@/lib/api/home-module';
import { Announcement, HomeModule } from '@/lib/api/types';
import HomeSidebar from '@/components/HomeSidebar';
import { Alert, Card } from 'antd';

const { Content } = Layout;

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('recommend');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareContext, setShareContext] = useState<{ type: string; id: string } | null>(null);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, Set<string>>>({});
  const [banners, setBanners] = useState<{ title: string; description?: string; imageUrl?: string; linkUrl?: string }[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [topModules, setTopModules] = useState<HomeModule[]>([]);
  const [middleModules, setMiddleModules] = useState<HomeModule[]>([]);
  const { message } = App.useApp();

  useEffect(() => {
    loadFeed(currentTab, 1);
  }, [currentTab]);

  useEffect(() => {
    loadBanners();
    loadContentStats();
    loadAnnouncements();
    loadHomeModules();
  }, []);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoritesMap({});
    }
  }, [user]);

  const loadFeed = async (tab: string, pageNum: number) => {
    setLoading(true);
    try {
      const data = await feedApi.getFeed({
        page: pageNum,
        size: 20,
        tab: tab as any,
      });

      if (pageNum === 1) {
        setFeedItems(data.items);
      } else {
        setFeedItems(prev => [...prev, ...data.items]);
      }

      setPage(pageNum);
      setHasMore(data.pagination.hasNext);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setCurrentTab(key);
    setPage(1);
  };

  const handleLoadMore = () => {
    loadFeed(currentTab, page + 1);
  };

  const handleShare = (item: FeedItem) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const routeMap: Record<string, string> = {
      paper: `/papers/${item.id}`,
      video: `/videos/${item.id}`,
      repo: `/repos/${item.id}`,
      huggingface: `/huggingface/${item.id}`,
      job: `/jobs/${item.id}`,
    };
    const title = (item.data as any)?.title || (item.data as any)?.fullName || '内容';
    setShareTitle(title);
    setShareUrl(`${baseUrl}${routeMap[item.type] || '/'}`);
    setShareContext({ type: item.type, id: item.id });
    setShareOpen(true);
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200 });
      const map: Record<string, Set<string>> = {};
      (data.items || []).forEach((fav: any) => {
        if (!map[fav.contentType]) {
          map[fav.contentType] = new Set();
        }
        map[fav.contentType].add(fav.contentId);
      });
      setFavoritesMap(map);
    } catch (error: any) {
      message.error(error.message || '收藏加载失败');
    }
  };

  const loadBanners = async () => {
    try {
      const data = await bannerApi.getActiveBanners();
      if (data && data.length > 0) {
        setBanners(
          data.map((item) => ({
            title: item.title,
            imageUrl: item.imageUrl,
            linkUrl: item.linkUrl || '/',
          }))
        );
        return;
      }
    } catch (error) {
      // fallback below
    }
    setBanners([
      {
        title: '具身智能精选内容',
        description: '论文+视频+模型+代码一站式发现',
      },
      {
        title: 'HuggingFace模型专区',
        description: '快速找到你需要的基础模型与工具',
      },
      {
        title: '市集讨论与实践分享',
        description: '和同伴一起交流、沉淀经验',
      },
    ]);
  };

  const loadContentStats = async () => {
    try {
      const stats = await statsApi.getContentStats();
      setContentStats(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await announcementApi.getActiveAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Load announcements error:', error);
    }
  };

  const loadHomeModules = async () => {
    try {
      const [top, middle] = await Promise.all([
        homeModuleApi.getHomeModules({ position: 'top' }),
        homeModuleApi.getHomeModules({ position: 'middle' }),
      ]);
      setTopModules(top);
      setMiddleModules(middle);
    } catch (error) {
      console.error('Load home modules error:', error);
    }
  };

  const isFavorited = (item: FeedItem) => {
    return favoritesMap[item.type]?.has(item.id) || false;
  };

  const handleToggleFavorite = (item: FeedItem) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = isFavorited(item);
    const action = already
      ? communityApi.deleteFavorite(item.type, item.id)
      : communityApi.createFavorite({ contentType: item.type, contentId: item.id });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  // Tab配置（推荐放第一，最新放第二，显示数量）
  const getTabLabel = (value: string, label: string) => {
    if (!contentStats) return label;
    
    const countMap: Record<string, number> = {
      paper: contentStats.papers,
      video: contentStats.videos,
      code: contentStats.repos,
      huggingface: contentStats.huggingface,
      job: contentStats.jobs,
    };
    
    const count = countMap[value];
    if (count === undefined) return label; // recommend/latest不显示数量
    if (count === 0) return null; // 无数据时返回null，后续会过滤
    
    return `${label}(${count})`;
  };

  const tabOptions = [
    { value: 'recommend', label: '推荐', icon: <FireOutlined />, color: '#ff4d4f' },
    { value: 'latest', label: '最新', icon: <ClockCircleOutlined />, color: '#52c41a' },
    { value: 'paper', label: getTabLabel('paper', '论文'), icon: <FileTextOutlined />, color: '#1890ff' },
    { value: 'video', label: getTabLabel('video', '视频'), icon: <PlayCircleOutlined />, color: '#f5222d' },
    { value: 'code', label: getTabLabel('code', '代码'), icon: <GithubOutlined />, color: '#722ed1' },
    { value: 'huggingface', label: getTabLabel('huggingface', '模型'), icon: <RobotOutlined />, color: '#13c2c2' },
    { value: 'job', label: getTabLabel('job', '求职'), icon: <TeamOutlined />, color: '#fa8c16' },
  ].filter(option => option.label !== null); // 过滤掉无数据的Tab

  return (
    <div style={{ background: 'linear-gradient(180deg, #f0f2f5 0%, #fafafa 100%)', minHeight: '100vh' }}>
      <Content style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Hero区域 - 重新设计，更有视觉冲击力 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: 16, 
          marginBottom: 24,
          padding: '48px 40px',
          boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 背景装饰 */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 300,
            height: 300,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          
          <Row gutter={32} align="middle" style={{ position: 'relative', zIndex: 1 }}>
            <Col span={24}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ 
                  fontSize: 42, 
                  fontWeight: 800, 
                  margin: 0, 
                  color: '#fff',
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  letterSpacing: '-0.5px'
                }}>
                  🚀 具身智能一站式学习平台
                </h1>
                <p style={{ 
                  fontSize: 18, 
                  color: 'rgba(255,255,255,0.9)', 
                  marginTop: 12, 
                  marginBottom: 0,
                  fontWeight: 500
                }}>
                  论文 · 代码 · 模型 · 教程 · 市集 · 求职
                </p>
              </div>
              
              {contentStats && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  padding: '20px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    fontSize: 15,
                    color: '#fff',
                    fontWeight: 600
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}>
                      📄
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{contentStats.papers}</div>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>篇论文</div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    fontSize: 15,
                    color: '#fff',
                    fontWeight: 600
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}>
                      💻
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{contentStats.repos}</div>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>个GitHub项目</div>
                    </div>
                  </div>
                  
                  {contentStats.videos > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      fontSize: 15,
                      color: '#fff',
                      fontWeight: 600
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        🎬
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{contentStats.videos}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>个视频</div>
                      </div>
                    </div>
                  )}
                  
                  {contentStats.huggingface > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      fontSize: 15,
                      color: '#fff',
                      fontWeight: 600
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        🤖
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{contentStats.huggingface}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>个模型</div>
                      </div>
                    </div>
                  )}
                  
                  {contentStats.jobs > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      fontSize: 15,
                      color: '#fff',
                      fontWeight: 600
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        💼
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{contentStats.jobs}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>个岗位</div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{
                    marginLeft: 'auto',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#52c41a',
                      animation: 'pulse 2s infinite'
                    }} />
                    实时更新
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </div>

        {/* Tab筛选栏 - 重新设计，更现代 */}
        <div style={{ 
          background: '#fff', 
          padding: '20px 24px', 
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            fontSize: 15,
            fontWeight: 600,
            color: '#262626',
            marginBottom: 12
          }}>
            <AppstoreOutlined style={{ color: '#1890ff' }} />
            <span>内容分类</span>
          </div>
          
          {/* Tab按钮组 - 强制单行展示，显示数量 */}
          <div style={{ 
            display: 'flex', 
            gap: 10,
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: 4,
            scrollbarWidth: 'thin',
          }}
          className="tab-buttons-container"
          >
            {tabOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleTabChange(option.value)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  fontSize: 14,
                  fontWeight: currentTab === option.value ? 600 : 400,
                  borderRadius: 24,
                  cursor: 'pointer',
                  border: currentTab === option.value ? `2px solid ${option.color}` : '2px solid transparent',
                  background: currentTab === option.value 
                    ? `${option.color}15` 
                    : '#f5f7fa',
                  color: currentTab === option.value ? option.color : '#595959',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (currentTab !== option.value) {
                    e.currentTarget.style.background = `${option.color}10`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${option.color}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTab !== option.value) {
                    e.currentTarget.style.background = '#f5f7fa';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <span style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区 + 侧边栏 */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 20,
        }}
        className="home-main-layout"
        >
          {/* 左侧：主内容流 */}
          <div>
            {/* 中部运营模块 */}
            {middleModules.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {middleModules.map((module) => {
                  try {
                    const config = module.content ? JSON.parse(module.content) : {};
                    if (module.moduleType === 'promotion' || module.moduleType === 'custom') {
                      return (
                        <Card
                          key={module.id}
                          title={module.title}
                          style={{ marginBottom: 12, borderRadius: 12 }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: config.html || config.content || '' }} />
                        </Card>
                      );
                    }
                    return null;
                  } catch (e) {
                    return null;
                  }
                })}
              </div>
            )}

            <div style={{ 
              background: '#fff', 
              padding: 24, 
              borderRadius: 16,
              minHeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.04)'
            }}>
          {loading && feedItems.length === 0 ? (
            // 骨架屏
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <Col xs={24} sm={12} md={8} lg={6} key={n}>
                  <Skeleton.Image active style={{ width: '100%', height: 200 }} />
                  <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 16 }} />
                </Col>
              ))}
            </Row>
          ) : (
            <>
              <Row gutter={[20, 20]}>
                {feedItems.map((item, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={`${item.type}-${item.id}`}>
                    <div
                      style={{
                        animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`,
                        height: '100%'
                      }}
                    >
                      <FeedCard
                        item={item}
                        onShare={handleShare}
                        isFavorited={isFavorited(item)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </div>
                  </Col>
                ))}
              </Row>

              {feedItems.length === 0 && !loading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '80px 20px',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
                  borderRadius: 16,
                  border: '2px dashed #d9d9d9'
                }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#262626', marginBottom: 8 }}>
                    暂无内容
                  </div>
                  <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 24 }}>
                    换个分类试试，或者稍后再来查看
                  </div>
                  <Space>
                    <Button 
                      type="primary" 
                      onClick={() => handleTabChange('recommend')}
                      style={{
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        border: 'none'
                      }}
                    >
                      查看推荐内容
                    </Button>
                    <Button 
                      onClick={() => handleTabChange('latest')}
                      style={{ borderRadius: 20 }}
                    >
                      查看最新内容
                    </Button>
                  </Space>
                </div>
              )}

              {hasMore && feedItems.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <Button 
                    size="large"
                    onClick={handleLoadMore} 
                    loading={loading}
                    type="primary"
                    style={{ 
                      borderRadius: 24,
                      padding: '0 40px',
                      height: 48,
                      fontSize: 15,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                    }}
                  >
                    {loading ? '加载中...' : '加载更多内容'}
                  </Button>
                </div>
              )}
            </>
              )}
            </div>
          </div>

          {/* 右侧：侧边栏 */}
          <HomeSidebar className="home-sidebar" />
        </div>
      </Content>

      <ShareModal
        open={shareOpen}
        title={shareTitle}
        url={shareUrl}
        onPublish={async (content) => {
          if (!shareContext) {
            throw new Error('分享上下文缺失');
          }
          await communityApi.createPost({
            contentType: shareContext.type,
            contentId: shareContext.id,
            title: `分享：${shareTitle}`,
            content,
          });
        }}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
