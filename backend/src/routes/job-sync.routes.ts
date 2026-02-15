/**
 * 招聘信息同步路由
 */

import { Router } from 'express';
import {
  syncJobsHandler,
  getSyncStatusHandler,
  startScheduleHandler,
} from '../controllers/job-sync.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/sync', syncJobsHandler);
router.get('/status', getSyncStatusHandler);
router.post('/schedule/start', startScheduleHandler);

export default router;
