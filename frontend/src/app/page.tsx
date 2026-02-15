/**
 * 首页 - 重构版本
 * 聚焦：发现 + 订阅
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { Row, Col, Carousel, Spin, App, Space } from 'antd';
import { FileTextOutlined, PlayCircleOutlined, GithubOutlined, RobotOutlined, TeamOutlined, RiseOutlined, ReadOutlined, BarChartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { statsApi, ContentStats } from '@/lib/api/stats';
import { announcementApi } from '@/lib/api/announcement';
import { homeModuleApi } from '@/lib/api/home-module';
import { bannerApi } from '@/lib/api/banner';
import { Announcement, HomeModule, Banner } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import DynamicComponents from '@/lib/dynamicComponents';
import { Alert, Card, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { FeedItem } from '@/lib/api/types';

const ShareModal = DynamicComponents.ShareModal;
const DiscoveryModule = DynamicComponents.DiscoveryModule;
const SubscriptionModule = DynamicComponents.SubscriptionModule;

export default function HomePage() {
  const { user, hydrated } = useAuthStore();
  const { message } = App.useApp();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareContext, setShareContext] = useState<{ type: string; id: string } | null>(null);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, Set<string>>>({});
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [topModules, setTopModules] = useState<HomeModule[]>([]);
  const [bottomModules, setBottomModules] = useState<HomeModule[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // 并行加载所有数据，提升加载速度
    setLoading(true);
    Promise.all([
      loadContentStats(),
      loadAnnouncements(),
      loadHomeModules(),
      loadBanners(),
    ]).catch(error => {
      console.error('页面数据加载失败:', error);
    }).finally(() => {
      setLoading(false);
      setInitialLoadComplete(true);
    });
  }, []);

  // 预加载关键资源
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const preloadResources = () => {
      const links = [
        { rel: 'prefetch', href: '/papers' },
        { rel: 'prefetch', href: '/videos' },
        { rel: 'prefetch', href: '/repos' },
        { rel: 'prefetch', href: '/jobs' },
        { rel: 'prefetch', href: '/community' },
        { rel: 'dns-prefetch', href: '//arxiv.org' },
        { rel: 'dns-prefetch', href: '//github.com' },
        { rel: 'dns-prefetch', href: '//huggingface.co' },
        { rel: 'dns-prefetch', href: '//www.bilibili.com' },
      ];
      
      links.forEach(link => {
        const linkEl = document.createElement('link');
        linkEl.rel = link.rel;
        linkEl.href = link.href;
        document.head.appendChild(linkEl);
      });
    };
    
    preloadResources();
  }, []);

  useEffect(() => {
    if (hydrated && user) {
      loadFavorites();
    } else if (hydrated && !user) {
      setFavoritesMap({});
    }
  }, [hydrated, user]);

  const loadContentStats = async () => {
    try {
      const stats = await statsApi.getContentStats();
      setContentStats(stats);
    } catch (error: any) {
      console.error('Load content stats error:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await announcementApi.getActiveAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Load announcements error:', error);
      // 网络错误不显示错误消息，保持空数组
      if (error.code !== 'CONNECTION_REFUSED' && error.code !== 'TIMEOUT' && error.code !== 'NETWORK_ERROR') {
        message.error(error.message || '加载公告失败');
      }
      setAnnouncements([]);
    }
  };

  const handleCloseModule = (moduleId: string) => {
    if (typeof window === 'undefined') return;
    const closedModules = JSON.parse(localStorage.getItem('closedHomeModules') || '[]');
    if (!closedModules.includes(moduleId)) {
      closedModules.push(moduleId);
      localStorage.setItem('closedHomeModules', JSON.stringify(closedModules));
      message.success('已关闭');
      loadHomeModules();
    }
  };

  const loadHomeModules = async () => {
    try {
      const allModules = await homeModuleApi.getHomeModules();
      const modules = Array.isArray(allModules) ? allModules : [];
      
      const now = new Date();
      const closedModules = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('closedHomeModules') || '[]')
        : [];
      
      // 根据config中的position分类，并过滤定时下线和用户关闭的模块
      const top: HomeModule[] = [];
      const bottom: HomeModule[] = [];
      
      modules.forEach((module) => {
        // 检查是否启用
        if (!module.isActive) return;
        
        // 检查用户是否手动关闭
        if (closedModules.includes(module.id)) return;
        
        try {
          const config = module.config ? JSON.parse(module.config) : {};
          const position = config.position || 'top';
          
        // 检查定时范围（如果config中有startDate和endDate）
        if (config.startDate) {
          const startDate = new Date(config.startDate);
          if (now < startDate) return; // 未到开始时间
        }
        if (config.endDate) {
          const endDate = new Date(config.endDate);
          if (now > endDate) return; // 已过结束时间
        }
          
          if (position === 'top') {
            top.push(module);
          } else if (position === 'bottom') {
            bottom.push(module);
          }
        } catch (e) {
          // 解析失败，默认放到top
          top.push(module);
        }
      });
      
      setTopModules(top);
      setBottomModules(bottom);
    } catch (error: any) {
      console.error('Load home modules error:', error);
      // 网络错误不显示错误消息，保持空数组
      if (error.code !== 'CONNECTION_REFUSED' && error.code !== 'TIMEOUT' && error.code !== 'NETWORK_ERROR') {
        message.error(error.message || '加载首页模块失败');
      }
      setTopModules([]);
      setBottomModules([]);
    }
  };

  const loadBanners = async () => {
    try {
      const activeBanners = await bannerApi.getActiveBanners();
      // 按sortOrder排序
      const sortedBanners = (Array.isArray(activeBanners) ? activeBanners : []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setBanners(sortedBanners);
    } catch (error: any) {
      console.error('Load banners error:', error);
      // 如果后端未运行，保持空数组，会显示默认Banner
      if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        setBanners([]);
      } else {
        // 显示错误消息给用户
        message.error(error.message || '加载轮播图失败');
        setBanners([]);
      }
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 1000 });
      const map: Record<string, Set<string>> = {};
      data.items.forEach((fav: any) => {
        if (!map[fav.contentType]) {
          map[fav.contentType] = new Set();
        }
        map[fav.contentType].add(fav.contentId);
      });
      setFavoritesMap(map);
    } catch (error) {
      console.error('Load favorites error:', error);
    }
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
    const url = `${baseUrl}${routeMap[item.type] || ''}`;
    const title = (item.data as any)?.title || (item.data as any)?.fullName || (item.data as any)?.name || '内容';
    setShareTitle(title);
    setShareUrl(url);
    setShareContext({ type: item.type, id: item.id });
    setShareOpen(true);
  };

  const handleToggleFavorite = async (item: FeedItem) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const isFavorited = favoritesMap[item.type]?.has(item.id);
    try {
      if (isFavorited) {
        await communityApi.deleteFavorite(item.type, item.id);
        setFavoritesMap(prev => {
          const newMap = { ...prev };
          if (newMap[item.type]) {
            newMap[item.type].delete(item.id);
          }
          return newMap;
        });
        message.success('已取消收藏');
      } else {
        await communityApi.createFavorite({ contentType: item.type, contentId: item.id });
        setFavoritesMap(prev => {
          const newMap = { ...prev };
          if (!newMap[item.type]) {
            newMap[item.type] = new Set();
          }
          newMap[item.type].add(item.id);
          return newMap;
        });
        message.success('已收藏');
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const isFavorited = (item: FeedItem) => {
    return favoritesMap[item.type]?.has(item.id) || false;
  };

  // 如果正在加载且是首次加载，显示加载状态
  if (loading && !initialLoadComplete) {
    return (
      <div style={{ 
        background: 'linear-gradient(180deg, #f0f2f5 0%, #fafafa 100%)', 
        minHeight: 'calc(100vh - 64px)', 
        width: '100%',
        padding: 0,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(180deg, #f0f2f5 0%, #fafafa 100%)', 
      minHeight: 'calc(100vh - 64px)', 
      width: '100%',
      padding: 0,
      margin: 0
    }}>
      <div style={{ 
        padding: '20px', 
        maxWidth: 1400, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }} className="container">
        {/* Banner轮播图区域 */}
        {banners.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <Carousel
              autoplay
              autoplaySpeed={5000}
              dots={{ className: 'custom-dots' }}
              effect="fade"
              fade={true}
              infinite={true}
              pauseOnHover={true}
              pauseOnDotsHover={true}
              waitForAnimate={true}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              {banners.map((banner) => {
                const BannerContent = (
                  <div
                    style={{
                      backgroundImage: `url(${banner.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '300px',
                      borderRadius: 16,
                      position: 'relative',
                      cursor: banner.linkUrl ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {(banner.title || banner.description) && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)',
                          padding: '40px 50px 30px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ maxWidth: 800, margin: '0 auto' }}>
                          {banner.title && (
                            <h1 style={{ 
                              fontSize: 42, 
                              fontWeight: 800, 
                              margin: 0, 
                              color: '#fff',
                              textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.3)',
                              marginBottom: banner.description ? 16 : 0,
                              lineHeight: 1.2
                            }}>
                              {banner.title}
                            </h1>
                          )}
                          {banner.description && (
                            <div style={{ 
                              fontSize: 18, 
                              color: '#fff', 
                              fontWeight: 400,
                              marginTop: 12,
                              lineHeight: 1.6,
                              textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.3)',
                            }}>
                              {banner.description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );

                const isExternalLink = banner.linkUrl?.startsWith('http://') || banner.linkUrl?.startsWith('https://');
                
                return (
                  <div key={banner.id}>
                    {banner.linkUrl ? (
                      isExternalLink ? (
                        <a 
                          href={banner.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'block' }}
                        >
                          {BannerContent}
                        </a>
                      ) : (
                        <div
                          onClick={() => {
                            window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
                          }}
                          style={{ display: 'block', cursor: 'pointer' }}
                        >
                          {BannerContent}
                        </div>
                      )
                    ) : (
                      BannerContent
                    )}
                  </div>
                );
              })}
            </Carousel>
          </div>
        ) : (
          <div style={{ 
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: 16, 
            marginBottom: 24,
            padding: '60px 50px',
            minHeight: '300px',
            boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center'
          }}>
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
            
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <h1 style={{ 
                fontSize: 42, 
                fontWeight: 800, 
                margin: 0, 
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                marginBottom: 20,
                lineHeight: 1.2
              }}>
                🚀 具身智能一站式学习平台
              </h1>
              
              {contentStats && (
                <Space size="large" style={{ fontSize: 16, color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                  <span>
                    <FileTextOutlined style={{ marginRight: 6, fontSize: 18 }} />
                    {contentStats.papers}篇论文
                  </span>
                  <span>
                    <GithubOutlined style={{ marginRight: 6, fontSize: 18 }} />
                    {contentStats.repos}个GitHub项目
                  </span>
                  {contentStats.videos > 0 && (
                    <span>
                      <PlayCircleOutlined style={{ marginRight: 6, fontSize: 18 }} />
                      {contentStats.videos}个视频
                    </span>
                  )}
                  {contentStats.huggingface > 0 && (
                    <span>
                      <RobotOutlined style={{ marginRight: 6, fontSize: 18 }} />
                      {contentStats.huggingface}个模型
                    </span>
                  )}
                  {contentStats.jobs > 0 && (
                    <span>
                      <TeamOutlined style={{ marginRight: 6, fontSize: 18 }} />
                      {contentStats.jobs}个岗位
                    </span>
                  )}
                </Space>
              )}
            </div>
          </div>
        )}

        {/* 顶部运营模块 */}
        {topModules.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {topModules.map((module) => {
              try {
                const config = (module as any).config ? JSON.parse((module as any).config) : {};
                const moduleType = config.moduleType || 'banner';
                
                // Banner类型
                if (moduleType === 'banner' && config.imageUrl) {
                  return (
                    <Card
                      key={module.id}
                      style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' }}
                      styles={{ body: { padding: 0 } }}
                    >
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          background: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          border: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (typeof window === 'undefined') return;
                          const closedModules = JSON.parse(localStorage.getItem('closedHomeModules') || '[]');
                          if (!closedModules.includes(module.id)) {
                            closedModules.push(module.id);
                            localStorage.setItem('closedHomeModules', JSON.stringify(closedModules));
                            message.success('已关闭，刷新页面后生效');
                            loadHomeModules();
                          }
                        }}
                      />
                      <a href={config.linkUrl || '#'} target={config.linkUrl?.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                        <img
                          src={config.imageUrl}
                          alt={module.title || 'Banner'}
                          style={{ width: '100%', display: 'block' }}
                        />
                      </a>
                    </Card>
                  );
                }
                
                // 公告类型
                if (moduleType === 'announcement') {
                  return (
                    <Alert
                      key={module.id}
                      message={
                        config.linkUrl ? (
                          <a href={config.linkUrl} target={config.linkUrl.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                            <strong>{module.title || config.title}</strong>
                          </a>
                        ) : (
                          <strong>{module.title || config.title}</strong>
                        )
                      }
                      description={config.content || (module as any).description}
                      type={config.type || 'info'}
                      showIcon
                      closable
                      onClose={() => {
                        if (typeof window === 'undefined') return;
                        const closedModules = JSON.parse(localStorage.getItem('closedHomeModules') || '[]');
                        if (!closedModules.includes(module.id)) {
                          closedModules.push(module.id);
                          localStorage.setItem('closedHomeModules', JSON.stringify(closedModules));
                          loadHomeModules();
                        }
                      }}
                      style={{ marginBottom: 8, borderRadius: 8 }}
                    />
                  );
                }
                
                return null;
              } catch (e) {
                return null;
              }
            })}
          </div>
        )}

        {/* 公告栏 */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {announcements.map((announcement) => (
              <Alert
                key={announcement.id}
                message={
                  announcement.linkUrl ? (
                    <a href={announcement.linkUrl} target={announcement.linkUrl.startsWith('http') ? '_blank' : '_self'}>
                      <strong>{announcement.title}</strong>
                    </a>
                  ) : (
                    <strong>{announcement.title}</strong>
                  )
                }
                description={announcement.content}
                type={announcement.type}
                showIcon
                closable
                style={{ marginBottom: 8, borderRadius: 8 }}
              />
            ))}
          </div>
        )}

        {/* 核心区域：发现 + 订阅 */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {/* 左侧：发现模块 */}
          <Col xs={24} lg={16} style={{ width: '100%' }}>
            <DiscoveryModule
              onShare={handleShare}
              onToggleFavorite={handleToggleFavorite}
              isFavorited={isFavorited}
            />
          </Col>

          {/* 右侧：订阅模块 */}
          <Col xs={24} lg={8} style={{ width: '100%' }}>
            <div style={{ position: 'sticky', top: 80, width: '100%' }}>
              <SubscriptionModule limit={5} />
            </div>
          </Col>
        </Row>

        {/* 底部运营模块 */}
        {bottomModules.length > 0 && (
          <div style={{ marginTop: 48 }}>
            {bottomModules.map((module) => {
                try {
                  const config = (module as any).config ? JSON.parse((module as any).config) : {};
                  const moduleType = config.moduleType || 'custom';
                  
                  // 推广类型模块
                  if (moduleType === 'promotion') {
                    const gradient = config.gradient || config.backgroundColor || '#f0f9ff';
                    const textColor = config.textColor || '#333';
                    
                    return (
                      <Card
                        key={module.id}
                        title={module.title}
                        style={{ 
                          marginBottom: 24, 
                          borderRadius: 12,
                          background: gradient,
                          border: 'none',
                          position: 'relative'
                        }}
                        styles={{
                          header: { 
                            background: 'transparent',
                            color: textColor,
                            borderBottom: `1px solid ${textColor === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                          },
                          body: { color: textColor }
                        }}
                        extra={
                          <Button
                            type="text"
                            icon={<CloseOutlined />}
                            style={{ color: textColor }}
                            onClick={() => handleCloseModule(module.id)}
                          />
                        }
                      >
                        <div style={{ fontSize: 15, lineHeight: 1.8, color: textColor, marginBottom: 16 }}>
                          {(module as any).description || config.content || ''}
                          {config.linkUrl && (
                            <div style={{ marginTop: 16 }}>
                              <a 
                                href={config.linkUrl} 
                                target={config.linkUrl.startsWith('http') ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                style={{ 
                                  color: textColor === '#fff' ? '#fff' : '#1890ff', 
                                  textDecoration: 'none',
                                  fontWeight: 500
                                }}
                              >
                                {config.buttonText || '了解更多 →'}
                              </a>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  }
                  
                  // 自定义HTML模块
                  if (moduleType === 'custom' && config.html) {
                    return (
                      <Card
                        key={module.id}
                        title={module.title}
                        style={{ marginBottom: 24, borderRadius: 12, position: 'relative' }}
                        extra={
                          <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => handleCloseModule(module.id)}
                          />
                        }
                      >
                        <div dangerouslySetInnerHTML={{ __html: config.html }} />
                      </Card>
                    );
                  }
                  
                  // 默认显示
                  return (
                    <Card
                      key={module.id}
                      title={module.title}
                      style={{ marginBottom: 24, borderRadius: 12, position: 'relative' }}
                      extra={
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => handleCloseModule(module.id)}
                        />
                      }
                    >
                      <div style={{ fontSize: 15, lineHeight: 1.8, color: '#666' }}>
                        {(module as any).description || config.content || '暂无内容'}
                      </div>
                    </Card>
                  );
                } catch (e) {
                  console.error('Parse module config error:', e);
                  return null;
                }
              })}
          </div>
        )}
      </div>

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}
