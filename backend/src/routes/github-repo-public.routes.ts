/**
 * GitHub仓库信息路由（公开访问）
 * 用于用户端获取GitHub仓库信息
 */

import { Router } from 'express';
import {
  getGitHubRepoInfo,
  validateGitHubRepoUrl,
} from '../controllers/github-repo-info.controller';

const router = Router();

// 公开访问，无需认证
router.get('/info', getGitHubRepoInfo);
router.get('/validate', validateGitHubRepoUrl);

export default router;
