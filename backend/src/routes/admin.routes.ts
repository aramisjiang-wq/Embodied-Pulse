/**
 * 管理端路由
 */

import { Router } from 'express';
import {
  getUserEndUsersHandler,
  getUsersStatsHandler,
  getAdmins,
  banUser,
  getStats,
  createContent,
  updateContent,
  deleteContent,
  getAdminJobsListHandler,
  getAdminJobSeekingPostsListHandler,
  updateAdminPermissionsHandler,
  updateUserTagsHandler,
  updateAdminTagsHandler,
  createAdminHandler,
  updateUserVipHandler,
  getUserActionLogsHandler,
  getUserProfileHandler,
  updateUserProfileHandler,
  syncHuggingFacePapersByDateHandler,
  syncRecentHuggingFacePapersHandler,
  getSyncStatsHandler,
  exportUsersHandler,
  getAdminDailyNewsListHandler,
  createDailyNewsHandler,
  updateDailyNewsHandler,
  deleteDailyNewsHandler,
  toggleDailyNewsPinHandler,
  toggleContentPinHandler,
  searchRepoSuggestionsHandler,
  getRepoSuggestionStatsHandler,
  addReposBatchHandler,
  getAdminAuditLogsHandler,
} from '../controllers/admin.controller';
import { getCurrentAdmin } from '../controllers/auth.controller';
import {
  deletePostHandler,
  restorePostHandler,
  pinPostHandler,
  featurePostHandler,
  getAdminPostsListHandler,
  getCommunityStatsHandler,
} from '../controllers/post-admin.controller';
import {
  getAllSubscriptions,
  toggleSubscriptionsBatch,
  getSubscriptionHistory,
  getSubscriptionTrends,
  getSubscriptionStats,
  triggerSubscriptionSync,
  getDataFlowMonitor,
} from '../controllers/admin-subscription.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有管理端路由都需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 管理员信息
router.get('/me', getCurrentAdmin);

// 用户端用户管理（/users/stats 必须在 /users/:id 之前注册）
router.get('/users/stats', getUsersStatsHandler);
router.get('/users/export', exportUsersHandler);
router.get('/users', getUserEndUsersHandler);
router.get('/users/:id/profile', getUserProfileHandler);
router.put('/users/:userId/profile', updateUserProfileHandler);
router.post('/users/:userId/ban', banUser);

// 管理员管理
router.get('/admins', getAdmins);
router.post('/admins', createAdminHandler);
router.put('/admins/:adminId/permissions', updateAdminPermissionsHandler);
router.get('/admins/:adminId/audit-logs', getAdminAuditLogsHandler);

// 用户标签管理
router.post('/users/:userId/tags', updateUserTagsHandler);
router.post('/admins/:adminId/tags', updateAdminTagsHandler);

// VIP管理
router.put('/users/:userId/vip', updateUserVipHandler);

// 用户行为日志
router.get('/users/:userId/action-logs', getUserActionLogsHandler);

// 市集管理（列表与统计必须在带 :postId 的路由之前）
router.get('/posts', getAdminPostsListHandler);
router.get('/community/stats', getCommunityStatsHandler);
router.delete('/posts/:postId', deletePostHandler);
router.post('/posts/:postId/restore', restorePostHandler);
router.post('/posts/:postId/pin', pinPostHandler);
router.post('/posts/:postId/feature', featurePostHandler);

// 数据统计
router.get('/stats', getStats);

// 内容管理(通用) — 列表接口需在 :type 路由前注册
router.get('/content/jobs', getAdminJobsListHandler);
router.get('/content/job-seeking-posts', getAdminJobSeekingPostsListHandler);
router.get('/content/news', getAdminDailyNewsListHandler);
router.post('/content/news', createDailyNewsHandler);
router.put('/content/news/:id', updateDailyNewsHandler);
router.delete('/content/news/:id', deleteDailyNewsHandler);
router.put('/content/news/:id/pin', toggleDailyNewsPinHandler);
router.post('/content/:type', createContent);
router.put('/content/:type/:id', updateContent);
router.delete('/content/:type/:id', deleteContent);
router.put('/content/:type/:id/pin', toggleContentPinHandler);

// 订阅管理
router.get('/subscriptions', getAllSubscriptions);
router.post('/subscriptions/toggle-batch', toggleSubscriptionsBatch);
router.get('/subscriptions/stats', getSubscriptionStats);
router.get('/subscriptions/monitor', getDataFlowMonitor);
router.get('/subscriptions/:id/history', getSubscriptionHistory);
router.get('/subscriptions/:id/trends', getSubscriptionTrends);
router.post('/subscriptions/:id/sync', triggerSubscriptionSync);

// HuggingFace论文同步
router.post('/sync/huggingface-papers/date/:date', syncHuggingFacePapersByDateHandler);
router.post('/sync/huggingface-papers/recent', syncRecentHuggingFacePapersHandler);

// 同步统计
router.get('/sync/stats', getSyncStatsHandler);

// GitHub仓库分类补充
router.get('/repos/suggestions/stats', getRepoSuggestionStatsHandler);
router.get('/repos/suggestions/:category', searchRepoSuggestionsHandler);
router.post('/repos/batch', addReposBatchHandler);

export default router;
