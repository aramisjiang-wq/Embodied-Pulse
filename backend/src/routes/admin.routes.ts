/**
 * 管理端路由
 */

import { Router } from 'express';
import {
  getUserEndUsersHandler,
  getAdmins,
  banUser,
  getStats,
  createContent,
  updateContent,
  deleteContent,
  updateAdminPermissionsHandler,
  updateUserTagsHandler,
  updateAdminTagsHandler,
  createAdminHandler,
  updateUserVipHandler,
  getUserActionLogsHandler,
  syncHuggingFacePapersByDateHandler,
  syncRecentHuggingFacePapersHandler,
  syncNewsHandler,
  cleanNewsHandler,
  getSyncStatsHandler,
  getNewsListHandler,
} from '../controllers/admin.controller';
import { getCurrentAdmin } from '../controllers/auth.controller';
import {
  deletePostHandler,
  restorePostHandler,
  pinPostHandler,
  featurePostHandler,
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
import {
  syncNews,
  cleanNews,
} from '../controllers/news.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有管理端路由都需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 管理员信息
router.get('/me', getCurrentAdmin);

// 用户端用户管理
router.get('/users', getUserEndUsersHandler);
router.post('/users/:userId/ban', banUser);
router.put('/users/:userId/tags', updateUserTagsHandler);
router.put('/users/:userId/vip', updateUserVipHandler);
router.get('/users/:userId/action-logs', getUserActionLogsHandler);

// 管理员配置
router.get('/admins', getAdmins);
router.post('/admins', createAdminHandler);
router.put('/admins/:adminId/permissions', updateAdminPermissionsHandler);
router.put('/admins/:adminId/tags', updateAdminTagsHandler);

// 市集管理
router.delete('/posts/:postId', deletePostHandler);
router.post('/posts/:postId/restore', restorePostHandler);
router.post('/posts/:postId/pin', pinPostHandler);
router.post('/posts/:postId/feature', featurePostHandler);

// 数据统计
router.get('/stats', getStats);

// 内容管理(通用)
router.get('/content/news', getNewsListHandler);
router.post('/content/:type', createContent);
router.put('/content/:type/:id', updateContent);
router.delete('/content/:type/:id', deleteContent);

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

// 新闻同步
router.post('/sync/news', syncNewsHandler);
router.post('/clean/news', cleanNewsHandler);
router.get('/sync/news/stats', getSyncStatsHandler);

export default router;
