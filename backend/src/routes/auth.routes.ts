/**
 * 认证路由
 * 处理用户注册、登录、Token刷新等
 */

import { Router } from 'express';
import {
  register,
  login,
  adminLogin,
  refreshToken,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateEmail, validateUsername, validatePassword, sanitizeRequestBody } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    邮箱注册
 * @access  Public
 */
router.post('/register', authRateLimiter, sanitizeRequestBody, validateEmail, validateUsername, validatePassword, register);

/**
 * @route   POST /auth/login
 * @desc    用户端邮箱登录
 * @access  Public
 */
router.post('/login', authRateLimiter, sanitizeRequestBody, validateEmail, login);

/**
 * @route   POST /auth/admin/login
 * @desc    管理端管理员登录
 * @access  Public
 */
router.post('/admin/login', authRateLimiter, sanitizeRequestBody, validateUsername, adminLogin);

/**
 * @route   POST /auth/refresh
 * @desc    刷新Access Token
 * @access  Public (需要Refresh Token)
 */
router.post('/refresh', sanitizeRequestBody, refreshToken);

/**
 * @route   GET /auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
