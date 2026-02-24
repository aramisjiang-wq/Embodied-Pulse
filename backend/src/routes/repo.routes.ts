/**
 * GitHub仓库路由
 */

import { Router } from 'express';
import { getRepoList, getRepo, getRepoCountsController, createRepo as createRepoController } from '../controllers/repo.controller';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuthenticate, getRepoList);
router.get('/counts', getRepoCountsController);
router.get('/:repoId', optionalAuthenticate, getRepo);
router.post('/', authenticate, createRepoController);

export default router;
