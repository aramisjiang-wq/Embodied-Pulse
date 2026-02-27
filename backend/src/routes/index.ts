/**
 * 主路由文件
 * 注册所有子路由
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import feedRoutes from './feed.routes';
import paperRoutes from './paper.routes';
import videoRoutes from './video.routes';
import repoRoutes from './repo.routes';
import jobRoutes from './job.routes';
import huggingfaceRoutes from './huggingface.routes';
import postRoutes from './post.routes';
import commentRoutes from './comment.routes';
import favoriteRoutes from './favorite.routes';
import taskRoutes from './task.routes';
import adminRoutes from './admin.routes';
import bannerRoutes from './banner.routes';
import searchRoutes from './search.routes';
import userRoutes from './user.routes';
import publicUserRoutes from './public-user.routes';
import syncRoutes from './sync.routes';
import subscriptionRoutes from './subscription.routes';
import rankingRoutes from './ranking.routes';
import contentSubscriptionRoutes from './content-subscription.routes';
import subscriptionUpdateRoutes from './subscription-update.routes';
import statsRoutes from './stats.routes';
import announcementRoutes from './announcement.routes';
import homeModuleRoutes from './home-module.routes';
import dataSourceRoutes from './data-source.routes';
import bilibiliUploaderRoutes from './bilibili-uploader.routes';
import bilibiliCookieRoutes from './bilibili-cookie.routes';
import syncQueueRoutes from './sync-queue.routes';
import syncAdminRoutes from './sync-admin.routes';
import schedulerRoutes from './scheduler.routes';
import cookieRoutes from './cookie.routes';
import uploadRoutes from './upload.routes';
import imageProxyRoutes from './image-proxy.routes';
import notificationRoutes from './notification.routes';
import dbPoolRoutes from './db-pool.routes';
import communityRoutes from './community.routes';
import communityConfigRoutes from './community-config.routes';
import analyticsRoutes from './analytics.routes';
import seoRoutes from './seo.routes';
import robotsRoutes from './robots.routes';
import cacheRoutes from './cache.routes';
import metricsRoutes from './metrics.routes';
import queueRoutes from './queue.routes';
import discoveryRoutes from './discovery.routes';
import dailyNewsRoutes from './daily-news.routes';
import githubRepoInfoRoutes from './github-repo-info.routes';
import githubRepoInfoPublicRoutes from './github-repo-public.routes';
import huggingfaceApiRoutes from './huggingface-api.routes';
import huggingfaceAuthorSubscriptionRoutes from './huggingface-author-subscription.routes';
import adminHuggingfaceRoutes from './admin-huggingface.routes';
import userHuggingfaceSubscriptionRoutes from './user-huggingface-subscription.routes';
import bilibiliSearchKeywordRoutes from './bilibili-search-keyword.routes';
import paperSearchKeywordRoutes from './paper-search-keyword.routes';
import jobSyncRoutes from './job-sync.routes';
import passwordResetRoutes from './password-reset.routes';
import emailVerificationRoutes from './email-verification.routes';
import systemRoutes from './system.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/password-reset', passwordResetRoutes);
router.use('/email-verification', emailVerificationRoutes);
router.use('/feed', feedRoutes);
router.use('/papers', paperRoutes);
router.use('/videos', videoRoutes);
router.use('/repos', repoRoutes);
router.use('/jobs', jobRoutes);
router.use('/huggingface', huggingfaceRoutes);
router.use('/huggingface-subscriptions', userHuggingfaceSubscriptionRoutes);

// 市集路由
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/tasks', taskRoutes);
router.use('/banners', bannerRoutes);
router.use('/community', communityRoutes);

// 订阅路由
router.use('/subscriptions', subscriptionRoutes);
router.use('/content-subscriptions', contentSubscriptionRoutes);
router.use('/subscription-updates', subscriptionUpdateRoutes);

// 搜索路由
router.use('/search', searchRoutes);

// 用户个人资料路由
router.use('/user', userRoutes);

// 公开用户资料路由
router.use('/users', publicUserRoutes);

// 排行榜路由
router.use('/ranking', rankingRoutes);

// 管理端路由（所有管理端API都在 /admin 下）
router.use('/admin', adminRoutes);
router.use('/admin/community-config', communityConfigRoutes);

// 数据同步路由 (管理员专用，放在 /admin 下）
router.use('/admin/sync', syncRoutes);
router.use('/admin/sync', syncAdminRoutes);

// 数据源管理路由（管理员专用，放在 /admin 下）
router.use('/admin/data-sources', dataSourceRoutes);

// Bilibili UP主管理路由（管理员专用，放在 /admin 下）
router.use('/admin/bilibili-uploaders', bilibiliUploaderRoutes);

// Bilibili Cookie管理路由（管理员专用，放在 /admin 下）
router.use('/admin/bilibili-cookies', bilibiliCookieRoutes);

// Bilibili同步队列路由（管理员专用，放在 /admin 下）
router.use('/admin/sync-queue', syncQueueRoutes);

// 定时任务路由（管理员专用，放在 /admin 下）
router.use('/admin/scheduler', schedulerRoutes);

// Cookie管理路由（管理员专用，放在 /admin 下）
router.use('/admin/cookies', cookieRoutes);

// 文件上传路由
router.use('/upload', uploadRoutes);

// 图片代理路由（用于绕过B站防盗链）
router.use('/proxy', imageProxyRoutes);

// 统计数据路由（公开）
router.use('/stats', statsRoutes);

// 公告路由
router.use('/announcements', announcementRoutes);

// 首页运营模块路由
router.use('/home-modules', homeModuleRoutes);

// 通知路由
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

// SEO路由
router.use('/seo', seoRoutes);
router.use('/robots.txt', robotsRoutes);

// 监控路由（公开）
router.use('/metrics', metricsRoutes);

// 数据库连接池路由（管理员专用，放在 /admin 下）
router.use('/admin/db-pool', dbPoolRoutes);

// 缓存管理路由（管理员专用，放在 /admin 下）
router.use('/admin/cache', cacheRoutes);

// 队列管理路由（管理员专用，放在 /admin 下）
router.use('/admin/queues', queueRoutes);

router.use('/discovery', discoveryRoutes);
router.use('/news', dailyNewsRoutes);

router.use('/admin/github-repo-info', githubRepoInfoRoutes);

// GitHub仓库信息路由（公开访问，用于用户端）
router.use('/github-repo-info', githubRepoInfoPublicRoutes);

// HuggingFace API路由（管理员专用，放在 /admin 下）
router.use('/admin/huggingface-api', huggingfaceApiRoutes);

// HuggingFace作者订阅路由（管理员专用，放在 /admin 下）
router.use('/admin/huggingface-authors', huggingfaceAuthorSubscriptionRoutes);
router.use('/admin/huggingface-models', adminHuggingfaceRoutes);
router.use('/admin/bilibili-search-keywords', bilibiliSearchKeywordRoutes);

// 论文搜索关键词路由（管理员专用，放在 /admin 下）
router.use('/admin/paper-search-keywords', paperSearchKeywordRoutes);

// 招聘信息同步路由（管理员专用，放在 /admin 下）
router.use('/admin/job-sync', jobSyncRoutes);

// 系统管理路由（管理员专用，放在 /admin 下）
router.use('/admin/system', systemRoutes);

export default router;
