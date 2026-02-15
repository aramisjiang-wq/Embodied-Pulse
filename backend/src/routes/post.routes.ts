/**
 * 帖子路由
 */

import { Router } from 'express';
import { createPostHandler, getPostsHandler, getPostHandler, getMyPostsHandler, likePostHandler } from '../controllers/post.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticate, getMyPostsHandler);
router.post('/', authenticate, createPostHandler);
router.get('/', optionalAuthenticate, getPostsHandler);
router.get('/:postId', optionalAuthenticate, getPostHandler);
router.post('/:postId/like', authenticate, likePostHandler);

export default router;
