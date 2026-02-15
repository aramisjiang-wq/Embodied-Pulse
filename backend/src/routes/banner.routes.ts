/**
 * Banner路由
 */

import { Router } from 'express';
import { getActiveBannerList, getBannerList } from '../controllers/banner.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getBannerList);
router.get('/active', optionalAuthenticate, getActiveBannerList);

export default router;
