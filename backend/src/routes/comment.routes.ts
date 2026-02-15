/**
 * 评论路由
 */

import { Router } from 'express';
import { createCommentHandler, getCommentsHandler, likeCommentHandler } from '../controllers/comment.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createCommentHandler);
router.get('/post/:postId', optionalAuthenticate, getCommentsHandler);
router.post('/:commentId/like', authenticate, likeCommentHandler);

export default router;
