/**
 * 用户个人资料路由
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getPointRecords,
  changePassword,
  getPublicProfile,
  getSettings,
  updateSettings,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateContent, validatePassword, validateId, sanitizeRequestBody } from '../middleware/validation.middleware';

const router = Router();

// 所有用户路由都需要认证
router.use(authenticate);

// 个人资料
router.get('/profile', getProfile);
router.put('/profile', sanitizeRequestBody, validateContent, updateProfile);

// 积分记录
router.get('/points', getPointRecords);

// 修改密码
router.put('/password', sanitizeRequestBody, validatePassword, changePassword);

// 用户设置
router.get('/settings', getSettings);
router.put('/settings', sanitizeRequestBody, updateSettings);

// 公开路由（需要放在最后，避免匹配到 /profile）
router.get('/:id', validateId, getPublicProfile);

export default router;
