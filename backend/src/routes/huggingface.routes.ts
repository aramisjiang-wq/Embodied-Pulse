/**
 * Hugging Face 模型路由
 */

import { Router } from 'express';
import {
  getHuggingFaceList,
  getHuggingFaceDetail,
  getHuggingFaceInfoFromUrl,
  submitHuggingFaceModel,
  getTaskTypeStats,
  getAuthorStats,
} from '../controllers/huggingface.controller';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getHuggingFaceList);
// 注意：需在 /:modelId 路由之前注册，防止被通配符拦截
router.get('/info/from-url', getHuggingFaceInfoFromUrl);
router.get('/stats/task-types', getTaskTypeStats);
router.get('/author/:author/stats', optionalAuthenticate, getAuthorStats);
router.post('/', authenticate, submitHuggingFaceModel);
router.get('/:modelId', optionalAuthenticate, getHuggingFaceDetail);

export default router;
