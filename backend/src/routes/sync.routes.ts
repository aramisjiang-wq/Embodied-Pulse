/**
 * 数据同步路由 (管理员专用)
 */

import { Router } from 'express';
import {
  syncAll,
  syncEmbodiedAI,
  syncArxiv,
  syncGithub,
  syncHuggingFace,
  syncHuggingFacePapers,
  syncBilibili,
  syncYouTube,
  syncJobs,
  syncHotNews,
  syncDailyHotApi,
  sync36kr,
  syncTechNews,
  syncSemanticScholar,
  smartFilterNews,
  syncPapersByKeywordsHandler,
  syncVideosByKeywordsHandler,
} from '../controllers/sync.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有同步路由都需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 同步所有数据
router.post('/all', syncAll);

// 同步具身智能数据
router.post('/embodied-ai', syncEmbodiedAI);

// 同步特定数据源
router.post('/arxiv', syncArxiv);
router.post('/github', syncGithub);
router.post('/huggingface', syncHuggingFace);
router.post('/huggingface/papers', syncHuggingFacePapers);
router.post('/bilibili', syncBilibili);
router.post('/youtube', syncYouTube);
router.post('/jobs', syncJobs);
router.post('/hot-news', syncHotNews);
router.post('/dailyhot-api', syncDailyHotApi);
router.post('/36kr', sync36kr);
router.post('/tech-news', syncTechNews);
router.post('/semantic-scholar', syncSemanticScholar);
router.post('/smart-filter-news', smartFilterNews);

// 根据关键词同步
router.post('/papers-by-keywords', syncPapersByKeywordsHandler);
router.post('/videos-by-keywords', syncVideosByKeywordsHandler);

export default router;
