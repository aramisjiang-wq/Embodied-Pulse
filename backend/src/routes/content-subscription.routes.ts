/**
 * 内容订阅路由
 */

import { Router } from 'express';
import {
  createContentSubscriptionHandler,
  deleteContentSubscriptionHandler,
  getContentSubscriptionsHandler,
  checkContentSubscriptionHandler,
  updateContentSubscriptionHandler,
} from '../controllers/content-subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 创建内容订阅
router.post('/', createContentSubscriptionHandler);

// 获取用户的内容订阅列表
router.get('/', getContentSubscriptionsHandler);

// 检查是否已订阅某个内容
router.get('/check/:contentType/:contentId', checkContentSubscriptionHandler);

// 更新内容订阅
router.put('/:id', updateContentSubscriptionHandler);

// 删除内容订阅
router.delete('/:contentType/:contentId', deleteContentSubscriptionHandler);

export default router;
