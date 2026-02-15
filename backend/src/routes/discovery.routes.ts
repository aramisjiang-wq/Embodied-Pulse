/**
 * 发现路由
 */

import { Router } from 'express';
import { getDiscovery } from '../controllers/discovery.controller';

const router = Router();

// 公开API
router.get('/', getDiscovery);

export default router;
