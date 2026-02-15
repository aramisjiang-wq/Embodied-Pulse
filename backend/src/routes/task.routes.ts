/**
 * 任务路由
 */

import { Router } from 'express';
import { getDailyTasksHandler, signInHandler } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/daily', authenticate, getDailyTasksHandler);
router.post('/sign-in', authenticate, signInHandler);

export default router;
