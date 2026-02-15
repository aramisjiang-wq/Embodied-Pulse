/**
 * 信息流路由
 */

import { Router } from 'express';
import { getFeedHandler } from '../controllers/feed.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /feed
 * @desc    获取信息流
 * @access  Public (登录可获得个性化推荐)
 * @query   page, size, tab (recommend|paper|video|code|job|latest)
 */
router.get('/', optionalAuthenticate, getFeedHandler);

export default router;
