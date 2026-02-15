/**
 * GitHub仓库信息路由
 */

import { Router } from 'express';
import {
  getGitHubRepoInfo,
  validateGitHubRepoUrl,
} from '../controllers/github-repo-info.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/info', getGitHubRepoInfo);
router.get('/validate', validateGitHubRepoUrl);

export default router;
