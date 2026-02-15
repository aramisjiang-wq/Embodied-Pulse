/**
 * 排行榜路由
 */

import { Router } from 'express';
import {
  getHotPosts,
  getActiveUsers,
  getHotPapers,
  getHotVideos,
  getHotRepos,
  getOverallRanking,
} from '../controllers/ranking.controller';

const router = Router();

router.get('/overall', getOverallRanking);
router.get('/posts', getHotPosts);
router.get('/users', getActiveUsers);
router.get('/papers', getHotPapers);
router.get('/videos', getHotVideos);
router.get('/repos', getHotRepos);

export default router;
