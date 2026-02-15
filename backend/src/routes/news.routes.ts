/**
 * 新闻路由
 * 包含新闻列表、详情、搜索、热门、相关新闻等API
 */

import { Router } from 'express';
import {
  getNewsList,
  getNewsDetail,
  searchNewsHandler,
  getHotNewsHandler,
  getRelatedNewsHandler,
} from '../controllers/news.controller';

const router = Router();

/**
 * @route   GET /news
 * @desc    获取新闻列表（用户端）
 * @access  Public
 */
router.get('/', getNewsList);

/**
 * @route   GET /news/search
 * @desc    搜索新闻（用户端）
 * @access  Public
 */
router.get('/search', searchNewsHandler);

/**
 * @route   GET /news/hot
 * @desc    获取热门新闻（用户端）
 * @access  Public
 */
router.get('/hot', getHotNewsHandler);

/**
 * @route   GET /news/:id
 * @desc    获取新闻详情（用户端）
 * @access  Public
 */
router.get('/:id', getNewsDetail);

/**
 * @route   GET /news/:id/related
 * @desc    获取相关新闻（用户端）
 * @access  Public
 */
router.get('/:id/related', getRelatedNewsHandler);

export default router;