/**
 * 订阅更新检查路由
 */

import { Router } from 'express';
import {
  checkAllUpdatesHandler,
  checkUserUpdatesHandler,
} from '../controllers/subscription-update.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 检查所有订阅更新（管理员专用）
router.post('/check-all', authenticate, checkAllUpdatesHandler);

// 检查指定用户的订阅更新（用户端）
router.post('/check-user', authenticate, checkUserUpdatesHandler);

export default router;
