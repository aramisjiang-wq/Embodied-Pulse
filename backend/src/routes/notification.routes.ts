/**
 * 通知路由
 */

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  triggerGitHubRepoUpdateCheck,
  cleanupOldNotificationsHandler,
} from '../controllers/notification.controller';

const router = express.Router();

// 所有通知路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    获取用户通知列表
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    获取未读通知数量
 * @access  Private
 */
router.get('/unread-count', getUnreadNotificationsCount);

/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    标记通知为已读
 * @access  Private
 */
router.put('/:notificationId/read', markNotificationAsRead);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    标记所有通知为已读
 * @access  Private
 */
router.put('/read-all', markAllNotificationsAsRead);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    删除通知
 * @access  Private
 */
router.delete('/:notificationId', deleteNotificationById);

/**
 * @route   POST /api/v1/notifications/trigger-github-check
 * @desc    手动触发GitHub项目更新检查（管理员功能）
 * @access  Admin
 */
router.post('/trigger-github-check', requireAdmin, triggerGitHubRepoUpdateCheck);

/**
 * @route   DELETE /api/v1/notifications/cleanup
 * @desc    清理旧通知（管理员功能）
 * @access  Admin
 */
router.delete('/cleanup', requireAdmin, cleanupOldNotificationsHandler);

export default router;
