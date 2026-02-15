/**
 * 监控路由
 * 提供Prometheus指标和健康检查端点
 */

import { Router } from 'express';
import { getMetrics, getHealth, getReady } from '../controllers/metrics.controller';

const router = Router();

/**
 * @route   GET /metrics
 * @desc    Prometheus指标端点
 * @access  Public
 */
router.get('/metrics', getMetrics);

/**
 * @route   GET /health
 * @desc    健康检查端点
 * @access  Public
 */
router.get('/health', getHealth);

/**
 * @route   GET /ready
 * @desc    就绪检查端点
 * @access  Public
 */
router.get('/ready', getReady);

export default router;
