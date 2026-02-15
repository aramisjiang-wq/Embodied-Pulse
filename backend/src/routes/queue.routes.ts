/**
 * 队列管理路由
 * 提供队列管理的API端点
 */

import { Router } from 'express';
import {
  getQueueStatsHandler,
  getAllQueueStatsHandler,
  cleanQueueHandler,
  cleanAllQueuesHandler,
  pauseQueueHandler,
  resumeQueueHandler,
  retryFailedJobsHandler,
} from '../controllers/queue.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有队列管理路由都需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /queues/stats/:queueName
 * @desc    获取指定队列的统计信息
 * @access  Admin
 */
router.get('/stats/:queueName', getQueueStatsHandler);

/**
 * @route   GET /queues/stats
 * @desc    获取所有队列的统计信息
 * @access  Admin
 */
router.get('/stats', getAllQueueStatsHandler);

/**
 * @route   POST /queues/clean/:queueName
 * @desc    清理指定队列
 * @access  Admin
 */
router.post('/clean/:queueName', cleanQueueHandler);

/**
 * @route   POST /queues/clean
 * @desc    清理所有队列
 * @access  Admin
 */
router.post('/clean', cleanAllQueuesHandler);

/**
 * @route   POST /queues/pause/:queueName
 * @desc    暂停指定队列
 * @access  Admin
 */
router.post('/pause/:queueName', pauseQueueHandler);

/**
 * @route   POST /queues/resume/:queueName
 * @desc    恢复指定队列
 * @access  Admin
 */
router.post('/resume/:queueName', resumeQueueHandler);

/**
 * @route   POST /queues/retry/:queueName
 * @desc    重试指定队列的失败任务
 * @access  Admin
 */
router.post('/retry/:queueName', retryFailedJobsHandler);

export default router;
