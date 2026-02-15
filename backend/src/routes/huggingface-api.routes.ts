/**
 * HuggingFace API 路由
 */

import { Router } from 'express';
import {
  getHuggingFaceModels,
  getHuggingFaceModelsByAuthor,
  getHuggingFaceModelInfo,
  getHuggingFaceModelFromUrl,
  testHuggingFaceConnection,
  subscribeHuggingFaceAuthor,
} from '../controllers/huggingface-api.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/models', getHuggingFaceModels);
router.get('/models/author/:author', getHuggingFaceModelsByAuthor);
router.post('/models/author/:author/subscribe', subscribeHuggingFaceAuthor);
router.get('/models/info/:modelId', getHuggingFaceModelInfo);
router.get('/models/from-url', getHuggingFaceModelFromUrl);
router.get('/test-connection', testHuggingFaceConnection);

export default router;
