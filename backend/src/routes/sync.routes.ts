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
  syncSemanticScholar,
  syncPapersByKeywordsHandler,
  syncVideosByKeywordsHandler,
  syncArxivCategoriesHandler,
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
router.post('/semantic-scholar', syncSemanticScholar);

// 全量拉取 ArXiv 分类论文
router.post('/arxiv-categories', syncArxivCategoriesHandler);

// 根据关键词同步
router.post('/papers-by-keywords', syncPapersByKeywordsHandler);
router.post('/videos-by-keywords', syncVideosByKeywordsHandler);

export default router;
