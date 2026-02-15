/**
 * Hugging Face 模型管理路由（管理员专用）
 */

import { Router } from 'express';
import {
  getAllHuggingFaceModelsHandler,
  getHuggingFaceModelByIdHandler,
  createHuggingFaceModelHandler,
  updateHuggingFaceModelHandler,
  deleteHuggingFaceModelHandler,
  deleteHuggingFaceModelsHandler,
} from '../controllers/admin-huggingface.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAllHuggingFaceModelsHandler);
router.get('/:modelId', getHuggingFaceModelByIdHandler);
router.post('/', createHuggingFaceModelHandler);
router.put('/:modelId', updateHuggingFaceModelHandler);
router.delete('/:modelId', deleteHuggingFaceModelHandler);
router.delete('/', deleteHuggingFaceModelsHandler);

export default router;