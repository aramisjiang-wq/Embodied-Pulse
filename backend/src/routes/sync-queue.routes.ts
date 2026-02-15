/**
 * Bilibili同步队列路由
 */

import { Router } from 'express';
import { syncAll, getStatus, cancel } from '../controllers/sync-queue.controller';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';

const router = Router();

router.use(adminAuthMiddleware);

router.post('/sync-all', syncAll);
router.get('/status', getStatus);
router.post('/cancel', cancel);

export default router;