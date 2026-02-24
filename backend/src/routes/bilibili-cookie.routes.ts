/**
 * Bilibili Cookie管理路由
 */

import { Router } from 'express';
import {
  getCookieStatus,
  checkCookies,
  getHealthSummary,
  addCookie,
  removeCookie,
  toggleCookieStatus,
  resetCookieErrorCount,
  getCookieStats,
  getSettings,
  updateSettings,
  rotateCookie,
  checkSingleCookie,
} from '../controllers/bilibili-cookie.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/bilibili-cookies/status
 * @desc    获取Cookie状态
 * @access  Admin
 */
router.get('/status', getCookieStatus);

/**
 * @route   GET /api/admin/bilibili-cookies/check
 * @desc    检查所有Cookie的健康状态
 * @access  Admin
 */
router.get('/check', checkCookies);

/**
 * @route   GET /api/admin/bilibili-cookies/health
 * @desc    获取Cookie健康摘要
 * @access  Admin
 */
router.get('/health', getHealthSummary);

/**
 * @route   GET /api/admin/bilibili-cookies/stats
 * @desc    获取Cookie使用统计
 * @access  Admin
 */
router.get('/stats', getCookieStats);

/**
 * @route   GET /api/admin/bilibili-cookies/settings
 * @desc    获取Cookie设置
 * @access  Admin
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/admin/bilibili-cookies/settings
 * @desc    更新Cookie设置
 * @access  Admin
 */
router.put('/settings', updateSettings);

/**
 * @route   POST /api/admin/bilibili-cookies/rotate
 * @desc    手动轮换Cookie
 * @access  Admin
 */
router.post('/rotate', rotateCookie);

/**
 * @route   POST /api/admin/bilibili-cookies
 * @desc    添加Cookie
 * @access  Admin
 */
router.post('/', addCookie);

/**
 * @route   GET /api/admin/bilibili-cookies/:id/check
 * @desc    检查单个Cookie健康状态
 * @access  Admin
 */
router.get('/:id/check', checkSingleCookie);

/**
 * @route   DELETE /api/admin/bilibili-cookies/:id
 * @desc    删除Cookie
 * @access  Admin
 */
router.delete('/:id', removeCookie);

/**
 * @route   PUT /api/admin/bilibili-cookies/:id/toggle
 * @desc    切换Cookie状态
 * @access  Admin
 */
router.put('/:id/toggle', toggleCookieStatus);

/**
 * @route   PUT /api/admin/bilibili-cookies/:id/reset
 * @desc    重置Cookie错误计数
 * @access  Admin
 */
router.put('/:id/reset', resetCookieErrorCount);

export default router;
