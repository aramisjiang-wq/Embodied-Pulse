/**
 * 订阅路由
 */

import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 需要认证的路由
router.use(authenticate);

// 创建订阅
router.post('/', subscriptionController.createSubscription);

// 获取用户的所有订阅
router.get('/', subscriptionController.getUserSubscriptions);

// 更新订阅
router.put('/:id', subscriptionController.updateSubscription);

// 删除订阅
router.delete('/:id', subscriptionController.deleteSubscription);

// 手动触发订阅同步
router.post('/:id/sync', subscriptionController.syncSubscription);

// 获取单个订阅的匹配内容
router.get('/:id/content', subscriptionController.getSubscriptionContentById);

// 获取订阅内容（根据用户订阅筛选）
router.get('/content', subscriptionController.getSubscribedContent);

export default router;
