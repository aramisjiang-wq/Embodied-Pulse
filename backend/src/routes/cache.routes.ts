/**
 * 缓存管理路由
 * 提供缓存管理和监控的API端点
 */

import { Router } from 'express';
import {
  getCacheStatus,
  getCacheMetricsHandler,
  clearCache,
  clearUserCache,
  healthCheck,
  warmUpCache,
} from '../controllers/cache.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有缓存管理路由都需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /cache/status
 * @desc    获取缓存状态
 * @access  Admin
 */
router.get('/status', getCacheStatus);

/**
 * @route   GET /cache/metrics
 * @desc    获取缓存指标
 * @access  Admin
 */
router.get('/metrics', getCacheMetricsHandler);

/**
 * @route   GET /cache/health
 * @desc    缓存健康检查
 * @access  Admin
 */
router.get('/health', healthCheck);

/**
 * @route   POST /cache/clear/:type
 * @desc    清理指定类型的缓存
 * @access  Admin
 */
router.post('/clear/:type', clearCache);

/**
 * @route   POST /cache/clear/user/:userId
 * @desc    清理指定用户的缓存
 * @access  Admin
 */
router.post('/clear/user/:userId', clearUserCache);

/**
 * @route   POST /cache/warmup
 * @desc    预热缓存
 * @access  Admin
 */
router.post('/warmup', warmUpCache);

export default router;
