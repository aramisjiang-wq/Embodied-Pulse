/**
 * 文件上传路由
 */

import { Router } from 'express';
import { uploadBannerImage } from '../controllers/upload.controller';
import { uploadBanner } from '../middleware/upload.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Banner图片上传（需要管理员权限）
router.post(
  '/banner',
  authenticate,
  requireAdmin,
  uploadBanner.single('image'),
  uploadBannerImage
);

export default router;
