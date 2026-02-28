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
  validateHuggingFaceLinksController,
  getInvalidLinksController,
  deleteInvalidLinksController,
} from '../controllers/huggingface.controller';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getHuggingFaceList);
// 注意：需在 /:modelId 路由之前注册，防止被通配符拦截
router.get('/info/from-url', getHuggingFaceInfoFromUrl);
router.get('/stats/task-types', getTaskTypeStats);
router.get('/author/:author/stats', optionalAuthenticate, getAuthorStats);
router.post('/', authenticate, submitHuggingFaceModel);
// 链接验证相关路由
router.post('/admin/validate-links', authenticate, validateHuggingFaceLinksController);
router.get('/admin/invalid-links', authenticate, getInvalidLinksController);
router.delete('/admin/invalid-links', authenticate, deleteInvalidLinksController);
router.get('/:modelId', optionalAuthenticate, getHuggingFaceDetail);

export default router;
