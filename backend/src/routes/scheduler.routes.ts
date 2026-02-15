/**
 * 定时任务路由
 */

import { Router } from 'express';
import {
  start,
  stop,
  getStatus,
  startSubscriptionCheck,
  stopSubscriptionCheck,
  getSubscriptionCheckStatus,
} from '../controllers/scheduler.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/start', start);
router.post('/stop', stop);
router.get('/status', getStatus);

router.post('/subscription-check/start', startSubscriptionCheck);
router.post('/subscription-check/stop', stopSubscriptionCheck);
router.get('/subscription-check/status', getSubscriptionCheckStatus);

export default router;