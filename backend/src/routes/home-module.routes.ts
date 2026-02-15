/**
 * 首页运营模块路由
 */

import { Router } from 'express';
import {
  getHomeModulesHandler,
  getAllHomeModulesHandler,
  createHomeModuleHandler,
  updateHomeModuleHandler,
  deleteHomeModuleHandler,
} from '../controllers/home-module.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 公开API（获取活跃模块）
router.get('/', getHomeModulesHandler);

// 管理端API（需要认证和管理员权限）
router.get('/all', authenticate, requireAdmin, getAllHomeModulesHandler);
router.post('/', authenticate, requireAdmin, createHomeModuleHandler);
router.put('/:id', authenticate, requireAdmin, updateHomeModuleHandler);
router.delete('/:id', authenticate, requireAdmin, deleteHomeModuleHandler);

export default router;
