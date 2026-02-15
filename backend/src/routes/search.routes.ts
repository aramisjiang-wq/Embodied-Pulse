/**
 * 搜索路由
 */

import { Router } from 'express';
import { search } from '../controllers/search.controller';
import { validatePagination, validateKeyword } from '../middleware/validation.middleware';

const router = Router();

// 搜索路由（无需认证）
router.get('/', validatePagination, validateKeyword, search);

export default router;
