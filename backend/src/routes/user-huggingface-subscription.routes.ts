/**
 * 用户端HuggingFace订阅路由
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMySubscriptions,
  subscribeHuggingFacePapers,
  unsubscribeHuggingFacePapers,
  subscribeHuggingFaceAuthor,
  unsubscribeHuggingFaceAuthor,
} from '../controllers/user-huggingface-subscription.controller';

const router = Router();

router.get('/my', authenticate, getMySubscriptions);
router.post('/papers', authenticate, subscribeHuggingFacePapers);
router.delete('/papers', authenticate, unsubscribeHuggingFacePapers);
router.post('/author', authenticate, subscribeHuggingFaceAuthor);
router.delete('/author/:subscriptionId', authenticate, unsubscribeHuggingFaceAuthor);

export default router;
