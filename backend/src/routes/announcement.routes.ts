/**
 * 公告路由
 */

import { Router } from 'express';
import {
  getAnnouncementList,
  getActiveAnnouncementList,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} from '../controllers/announcement.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 公开API
router.get('/', getAnnouncementList);
router.get('/active', getActiveAnnouncementList);

// 管理端API（需要认证和管理员权限）
router.post('/', authenticate, requireAdmin, createAnnouncementHandler);
router.put('/:id', authenticate, requireAdmin, updateAnnouncementHandler);
router.delete('/:id', authenticate, requireAdmin, deleteAnnouncementHandler);

export default router;
