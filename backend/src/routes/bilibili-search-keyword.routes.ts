/**
 * Bilibili搜索关键词管理路由
 */

import { Router } from 'express';
import {
  getKeywordsHandler,
  getKeywordHandler,
  createKeywordHandler,
  updateKeywordHandler,
  deleteKeywordHandler,
  getActiveKeywordsStringHandler,
  batchCreateKeywordsHandler,
  getKeywordStatsHandler,
  getKeywordVideosHandler,
} from '../controllers/bilibili-search-keyword.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有路由需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 获取关键词列表
router.get('/', getKeywordsHandler);

// 获取关键词统计数据
router.get('/stats', getKeywordStatsHandler);

// 获取启用的关键词字符串（用于视频搜索）- 必须在 /:id 之前，否则 "active" 会被当作 id
router.get('/active/string', getActiveKeywordsStringHandler);

// 获取单个关键词
router.get('/:id', getKeywordHandler);

// 获取关键词相关视频
router.get('/:id/videos', getKeywordVideosHandler);

// 创建关键词
router.post('/', createKeywordHandler);

// 更新关键词
router.put('/:id', updateKeywordHandler);

// 删除关键词
router.delete('/:id', deleteKeywordHandler);

// 批量创建关键词（用于初始化）
router.post('/batch', batchCreateKeywordsHandler);

export default router;
