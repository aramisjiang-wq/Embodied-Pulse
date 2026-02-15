/**
 * Bilibili UP主管理路由
 */

import { Router } from 'express';
import {
  addUploader,
  getUploaders,
  syncUploader,
  deleteUploader,
  toggleUploaderStatus,
  updateUploaderTags,
  updateUploaderInfo,
  refreshUploaderInfo,
} from '../controllers/bilibili-uploader.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   POST /admin/bilibili-uploaders
 * @desc    添加UP主（从链接自动提取）
 * @access  Admin
 */
router.post('/', addUploader);

/**
 * @route   GET /admin/bilibili-uploaders
 * @desc    获取UP主列表
 * @access  Admin
 */
router.get('/', getUploaders);

/**
 * @route   POST /admin/bilibili-uploaders/:mid/sync
 * @desc    同步UP主视频
 * @access  Admin
 */
router.post('/:mid/sync', syncUploader);

/**
 * @route   DELETE /admin/bilibili-uploaders/:id
 * @desc    删除UP主
 * @access  Admin
 */
router.delete('/:id', deleteUploader);

/**
 * @route   PUT /admin/bilibili-uploaders/:id/toggle
 * @desc    切换UP主状态
 * @access  Admin
 */
router.put('/:id/toggle', toggleUploaderStatus);

/**
 * @route   PUT /admin/bilibili-uploaders/:id/tags
 * @desc    更新UP主标签
 * @access  Admin
 */
router.put('/:id/tags', updateUploaderTags);

/**
 * @route   PUT /admin/bilibili-uploaders/:id/info
 * @desc    更新UP主信息
 * @access  Admin
 */
router.put('/:id/info', updateUploaderInfo);

/**
 * @route   POST /admin/bilibili-uploaders/:id/refresh
 * @desc    刷新UP主信息（从API重新获取）
 * @access  Admin
 */
router.post('/:id/refresh', refreshUploaderInfo);

export default router;
