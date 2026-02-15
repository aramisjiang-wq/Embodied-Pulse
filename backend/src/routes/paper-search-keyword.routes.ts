/**
 * 论文搜索关键词管理路由
 */

import { Router } from 'express';
import {
  getKeywordsHandler,
  getKeywordHandler,
  createKeywordHandler,
  updateKeywordHandler,
  deleteKeywordHandler,
  getActiveKeywordsHandler,
  getActiveAdminKeywordsHandler,
  getActiveUserKeywordsHandler,
  batchCreateKeywordsHandler,
  getKeywordPapersHandler,
  getKeywordPapersCountHandler,
} from '../controllers/paper-search-keyword.controller';
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

// 获取所有启用的关键词（用于同步）
router.get('/active', getActiveKeywordsHandler);

// 获取所有启用的管理员关键词（用于同步）
router.get('/active/admin', getActiveAdminKeywordsHandler);

// 获取所有启用的用户订阅关键词（用于同步）
router.get('/active/user', getActiveUserKeywordsHandler);

// 批量创建关键词（用于初始化）
router.post('/batch', batchCreateKeywordsHandler);

// 获取关键词相关的论文
router.get('/:id/papers', getKeywordPapersHandler);

// 获取关键词相关的论文数量
router.get('/:id/papers/count', getKeywordPapersCountHandler);

export default router;
