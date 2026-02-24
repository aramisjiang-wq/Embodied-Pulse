/**
 * 首页 - 重构版本
 * 聚焦：发现 + 订阅
 * 使用 PageContainer 和 CSS Modules 统一样式
 */

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { Row, Col, Carousel, Spin, App, Space } from 'antd';
import { FileTextOutlined, PlayCircleOutlined, GithubOutlined, TeamOutlined } from '@ant-design/icons';

const HuggingFaceLogo = ({ size = 18 }: { size?: number }) => (
  <img 
    src="/huggingface-icon.svg" 
    alt="HuggingFace" 
    style={{ width: size, height: size, marginRight: 6, verticalAlign: 'middle' }} 
  />
);
import { statsApi, ContentStats } from '@/lib/api/stats';
import { announcementApi } from '@/lib/api/announcement';
import { homeModuleApi } from '@/lib/api/home-module';
import { bannerApi } from '@/lib/api/banner';
import { Announcement, HomeModule, Banner } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { DynamicComponents } from '@/lib/dynamicComponents';
import { Alert, Card, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { FeedItem } from '@/lib/api/types';
import PageContainer from '@/components/PageContainer';
import ProfileCompleteModal from '@/components/ProfileCompleteModal';
import styles from './page.module.css';

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

  const loadContentStats = useCallback(async () => {
    try {
      const stats = await statsApi.getContentStats();
      setContentStats(stats);
    } catch (error: any) {
      console.error('Load content stats error:', error);
      setContentStats(null);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await announcementApi.getActiveAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Load announcements error:', error);
      if (error.code !== 'CONNECTION_REFUSED' && error.code !== 'TIMEOUT' && error.code !== 'NETWORK_ERROR') {
        message.error(error.message || '加载公告失败');
      }
      setAnnouncements([]);
    }
  }, [message]);

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

  const loadHomeModules = useCallback(async () => {
    try {
      const allModules = await homeModuleApi.getHomeModules();
      const modules = Array.isArray(allModules) ? allModules : [];
      
      const closedModules = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('closedHomeModules') || '[]')
        : [];
      
      const top: HomeModule[] = [];
      const bottom: HomeModule[] = [];
      
      modules.forEach((module) => {
        if (!module.isActive) return;
        
        if (closedModules.includes(module.id)) return;
        
        try {
          const config = module.config ? JSON.parse(module.config) : {};
          const position = config.position || 'top';
          
          if (position === 'top') {
            top.push(module);
          } else if (position === 'bottom') {
            bottom.push(module);
          }
        } catch (e) {
          top.push(module);
        }
      });
      
      setTopModules(top);
      setBottomModules(bottom);
    } catch (error: any) {
      console.error('Load home modules error:', error);
      if (error.code !== 'CONNECTION_REFUSED' && error.code !== 'TIMEOUT' && error.code !== 'NETWORK_ERROR') {
        message.error(error.message || '加载首页模块失败');
      }
      setTopModules([]);
      setBottomModules([]);
    }
  }, [message]);

  const loadBanners = useCallback(async () => {
    try {
      const activeBanners = await bannerApi.getActiveBanners();
      const sortedBanners = (Array.isArray(activeBanners) ? activeBanners : []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setBanners(sortedBanners);
    } catch (error: any) {
      console.error('Load banners error:', error);
      if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        setBanners([]);
      } else {
        message.error(error.message || '加载轮播图失败');
        setBanners([]);
      }
    }
  }, [message]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 1000 });
      const map: Record<string, Set<string>> = {};
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((fav: any) => {
          if (!map[fav.contentType]) {
            map[fav.contentType] = new Set();
          }
          map[fav.contentType].add(fav.contentId);
        });
      }
      setFavoritesMap(map);
    } catch (error) {
      console.error('Load favorites error:', error);
      setFavoritesMap({});
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  }, [loadContentStats, loadAnnouncements, loadHomeModules, loadBanners]);

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
    if (typeof window === 'undefined') return;
    if (!hydrated) return;
    
    if (user && user.id) {
      loadFavorites();
    } else {
      setFavoritesMap({});
    }
  }, [hydrated, user, loadFavorites]);

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

  const renderBannerItem = (banner: Banner) => {
    const BannerContent = (
      <div
        className={styles.bannerItem}
        style={{
          backgroundImage: `url(${banner.imageUrl})`,
        }}
      >
        {(banner.title || banner.description) && (
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerContent}>
              {banner.title && (
                <h1 className={styles.bannerTitle}>{banner.title}</h1>
              )}
              {banner.description && (
                <div className={styles.bannerDescription}>{banner.description}</div>
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
  };

  const renderDefaultBanner = () => (
    <div className={styles.defaultBanner}>
      <div className={styles.defaultBannerGlow} />
      <div className={styles.defaultBannerContent}>
        <h1 className={styles.defaultBannerTitle}>
          🚀 具身智能一站式学习平台
        </h1>
        {contentStats && (
          <Space size="large" className={styles.statsSpace}>
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
                <HuggingFaceLogo size={18} />
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
  );

  const renderTopModules = () => {
    if (topModules.length === 0) return null;
    
    return (
      <div className={styles.moduleSection}>
        {topModules.map((module) => {
          try {
            const config = (module as any).config ? JSON.parse((module as any).config) : {};
            const moduleType = config.moduleType || 'banner';
            
            if (moduleType === 'banner' && config.imageUrl) {
              return (
                <Card
                  key={module.id}
                  className={styles.moduleCard}
                >
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    className={styles.closeButton}
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
                      className={styles.moduleImage}
                    />
                  </a>
                </Card>
              );
            }
            
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
                  className={styles.announcementAlert}
                />
              );
            }
            
            return null;
          } catch (e) {
            return null;
          }
        })}
      </div>
    );
  };

  const renderAnnouncements = () => {
    if (announcements.length === 0) return null;
    
    return (
      <div className={styles.moduleSection}>
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
            className={styles.announcementAlert}
          />
        ))}
      </div>
    );
  };

  const renderBottomModules = () => {
    if (bottomModules.length === 0) return null;
    
    return (
      <div className={styles.bottomModules}>
        {bottomModules.map((module) => {
          try {
            const config = (module as any).config ? JSON.parse((module as any).config) : {};
            const moduleType = config.moduleType || 'custom';
            
            if (moduleType === 'promotion') {
              const gradient = config.gradient || config.backgroundColor || '#f0f9ff';
              const textColor = config.textColor || '#333';
              const isDark = textColor === '#fff';
              
              return (
                <Card
                  key={module.id}
                  title={module.title}
                  className={styles.promotionCard}
                  style={{ 
                    background: gradient,
                  }}
                  styles={{
                    header: { 
                      background: 'transparent',
                      color: textColor,
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
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
                  <div className={styles.promotionContent} style={{ color: textColor }}>
                    {(module as any).description || config.content || ''}
                    {config.linkUrl && (
                      <div style={{ marginTop: 16 }}>
                        <a 
                          href={config.linkUrl} 
                          target={config.linkUrl.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          className={`${styles.promotionLink} ${isDark ? styles.promotionLinkDark : styles.promotionLinkLight}`}
                        >
                          {config.buttonText || '了解更多 →'}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              );
            }
            
            if (moduleType === 'custom' && config.html) {
              return (
                <Card
                  key={module.id}
                  title={module.title}
                  className={styles.customCard}
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
            
            return (
              <Card
                key={module.id}
                title={module.title}
                className={styles.customCard}
                extra={
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => handleCloseModule(module.id)}
                  />
                }
              >
                <div className={styles.defaultCardContent}>
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
    );
  };

  return (
    <PageContainer 
      loading={loading && !initialLoadComplete}
      showSidebar={false}
      maxWidth="1400px"
      contentClassName={styles.homeWrapper}
    >
      <div className={styles.container}>
        {banners.length > 0 ? (
          <div className={styles.bannerSection}>
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
              className={styles.bannerCarousel}
            >
              {banners.map(renderBannerItem)}
            </Carousel>
          </div>
        ) : (
          renderDefaultBanner()
        )}

        {renderTopModules()}
        {renderAnnouncements()}

        <Row gutter={[24, 24]} className={styles.mainContent}>
          <Col xs={24} lg={16} className={styles.discoveryCol}>
            <DynamicComponents.DiscoveryModule
              onShare={handleShare}
              onToggleFavorite={handleToggleFavorite}
              isFavorited={isFavorited}
            />
          </Col>

          <Col xs={24} lg={8} className={styles.subscriptionCol}>
            <div className={styles.subscriptionWrapper}>
              <DynamicComponents.SubscriptionModule limit={5} />
            </div>
          </Col>
        </Row>

        {renderBottomModules()}
      </div>

      <Suspense fallback={null}>
        <DynamicComponents.ShareModal
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

      {hydrated && user && <ProfileCompleteModal />}
    </PageContainer>
  );
}
