/**
 * 统计数据路由（公开API）
 */

import { Router } from 'express';
import { getContentStats } from '../controllers/stats.controller';

const router = Router();

// 公开API，不需要认证
router.get('/content', getContentStats);

export default router;
