/**
 * 帖子路由
 */

import { Router } from 'express';
import { createPostHandler, getPostsHandler, getPostHandler, getMyPostsHandler, likePostHandler, updatePostHandler, deletePostHandler } from '../controllers/post.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/my', authenticate, getMyPostsHandler);
router.post('/', authenticate, createPostHandler);
router.get('/', optionalAuthenticate, getPostsHandler);
router.get('/:postId', optionalAuthenticate, getPostHandler);
router.put('/:postId', authenticate, updatePostHandler);
router.delete('/:postId', authenticate, deletePostHandler);
router.post('/:postId/like', authenticate, likePostHandler);

export default router;
