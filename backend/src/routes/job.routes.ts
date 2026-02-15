/**
 * 岗位路由
 */

import { Router } from 'express';
import { 
  getJobList, 
  getJob, 
  createJobPost,
  updateJobPost,
  deleteJobPost,
  getJobSeekingPostList,
  createJobSeekingPostHandler,
  deleteJobSeekingPostHandler,
  getMyPostsHandler
} from '../controllers/job.controller';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware';
import { validatePagination, validateKeyword, validateId, validateContent, sanitizeRequestBody } from '../middleware/validation.middleware';

const router = Router();

// 公开路由
router.get('/', validatePagination, validateKeyword, optionalAuthenticate, getJobList);
router.get('/:jobId', validateId, optionalAuthenticate, getJob);

// 求职信息路由
router.get('/job-seeking-posts', validatePagination, optionalAuthenticate, getJobSeekingPostList);

// 需要认证的路由
router.post('/', authenticate, sanitizeRequestBody, validateContent, createJobPost);
router.put('/:jobId', authenticate, validateId, sanitizeRequestBody, validateContent, updateJobPost);
router.delete('/:jobId', authenticate, validateId, deleteJobPost);
router.post('/job-seeking-posts', authenticate, sanitizeRequestBody, validateContent, createJobSeekingPostHandler);
router.delete('/job-seeking-posts/:postId', authenticate, validateId, deleteJobSeekingPostHandler);
router.get('/my-posts', authenticate, getMyPostsHandler);

export default router;
