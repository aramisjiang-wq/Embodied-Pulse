/**
 * 新闻搜索关键词管理路由
 */

import { Router } from 'express';
import {
  getAllKeywordsHandler,
  getKeywordByIdHandler,
  createKeywordHandler,
  createKeywordsHandler,
  updateKeywordHandler,
  deleteKeywordHandler,
  deleteKeywordsHandler,
  getKeywordNewsHandler,
  getKeywordNewsCountHandler,
  syncLatestNewsHandler,
  searchNewsByKeywordsHandler,
  searchNewsByAllKeywordsHandler,
} from '../controllers/news-search-keyword.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 所有路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /admin/news-search-keywords
 * @desc    获取所有新闻搜索关键词
 * @access  Private (Admin)
 */
router.get('/', getAllKeywordsHandler);

/**
 * @route   POST /admin/news-search-keywords/sync-latest
 * @desc    一键拉取近24小时内最新关键词相关新闻
 * @access  Private (Admin)
 */
router.post('/sync-latest', syncLatestNewsHandler);

/**
 * @route   POST /admin/news-search-keywords/search
 * @desc    根据关键词搜索并抓取新闻
 * @access  Private (Admin)
 */
router.post('/search', searchNewsByKeywordsHandler);

/**
 * @route   GET /admin/news-search-keywords/search-all
 * @desc    根据所有启用的关键词搜索并抓取新闻
 * @access  Private (Admin)
 */
router.get('/search-all', searchNewsByAllKeywordsHandler);

/**
 * @route   POST /admin/news-search-keywords
 * @desc    创建关键词
 * @access  Private (Admin)
 */
router.post('/', createKeywordHandler);

/**
 * @route   POST /admin/news-search-keywords/batch
 * @desc    批量创建关键词
 * @access  Private (Admin)
 */
router.post('/batch', createKeywordsHandler);

/**
 * @route   DELETE /admin/news-search-keywords/batch
 * @desc    批量删除关键词
 * @access  Private (Admin)
 */
router.delete('/batch', deleteKeywordsHandler);

/**
 * @route   GET /admin/news-search-keywords/:id/news
 * @desc    获取关键词相关的新闻
 * @access  Private (Admin)
 */
router.get('/:id/news', getKeywordNewsHandler);

/**
 * @route   GET /admin/news-search-keywords/:id/news/count
 * @desc    获取关键词相关的新闻数量
 * @access  Private (Admin)
 */
router.get('/:id/news/count', getKeywordNewsCountHandler);

/**
 * @route   GET /admin/news-search-keywords/:id
 * @desc    根据ID获取关键词
 * @access  Private (Admin)
 */
router.get('/:id', getKeywordByIdHandler);

/**
 * @route   PUT /admin/news-search-keywords/:id
 * @desc    更新关键词
 * @access  Private (Admin)
 */
router.put('/:id', updateKeywordHandler);

/**
 * @route   DELETE /admin/news-search-keywords/:id
 * @desc    删除关键词
 * @access  Private (Admin)
 */
router.delete('/:id', deleteKeywordHandler);

export default router;
