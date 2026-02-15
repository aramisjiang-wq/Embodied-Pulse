/**
 * Hugging Face 模型路由
 */

import { Router } from 'express';
import { getHuggingFaceList, getHuggingFaceDetail } from '../controllers/huggingface.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getHuggingFaceList);
router.get('/:modelId', optionalAuthenticate, getHuggingFaceDetail);

export default router;
