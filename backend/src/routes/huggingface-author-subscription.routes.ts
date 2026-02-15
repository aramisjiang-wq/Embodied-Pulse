/**
 * HuggingFace作者订阅路由
 */

import { Router } from 'express';
import {
  getAuthorSubscriptions,
  addAuthorSubscriptionHandler,
  removeAuthorSubscriptionHandler,
  syncAuthorModelsHandler,
  toggleSubscriptionStatusHandler,
  updateSubscriptionTagsHandler,
} from '../controllers/huggingface-author-subscription.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAuthorSubscriptions);
router.post('/', addAuthorSubscriptionHandler);
router.delete('/:id', removeAuthorSubscriptionHandler);
router.post('/:id/sync', syncAuthorModelsHandler);
router.patch('/:id/toggle', toggleSubscriptionStatusHandler);
router.put('/:id/tags', updateSubscriptionTagsHandler);

export default router;
