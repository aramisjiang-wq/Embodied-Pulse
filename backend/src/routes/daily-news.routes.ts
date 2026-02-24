/**
 * 每日新闻路由（用户端）
 */

import { Router } from 'express';
import {
  getDailyNewsList,
  getDailyNewsById,
  getPinnedDailyNews,
} from '../controllers/daily-news.controller';

const router = Router();

router.get('/', getDailyNewsList);
router.get('/pinned', getPinnedDailyNews);
router.get('/:id', getDailyNewsById);

export default router;
