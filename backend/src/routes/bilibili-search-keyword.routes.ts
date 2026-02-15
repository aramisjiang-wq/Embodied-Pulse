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
} from '../controllers/bilibili-search-keyword.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有路由需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

// 获取关键词列表
router.get('/', getKeywordsHandler);

// 获取单个关键词
router.get('/:id', getKeywordHandler);

// 创建关键词
router.post('/', createKeywordHandler);

// 更新关键词
router.put('/:id', updateKeywordHandler);

// 删除关键词
router.delete('/:id', deleteKeywordHandler);

// 获取启用的关键词字符串（用于视频搜索）
router.get('/active/string', getActiveKeywordsStringHandler);

// 批量创建关键词（用于初始化）
router.post('/batch', batchCreateKeywordsHandler);

export default router;
