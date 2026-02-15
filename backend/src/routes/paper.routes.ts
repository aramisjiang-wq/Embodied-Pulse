/**
 * 论文路由
 */

import { Router } from 'express';
import { getPaperList, getPaper } from '../controllers/paper.controller';
import {
  enrichPaper,
  enrichBatch,
  enrichPapersNeedingUpdate,
  getEnrichmentStatus,
  getDataQualityMetrics,
} from '../controllers/paper-enrichment.controller';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware';
import { validatePagination, validateKeyword, validateId } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /papers
 * @desc    获取论文列表
 * @access  Public (登录可获得个性化推荐)
 */
router.get('/', validatePagination, validateKeyword, optionalAuthenticate, getPaperList);

/**
 * @route   GET /papers/:paperId
 * @desc    获取论文详情
 * @access  Public
 */
router.get('/:paperId', validateId, optionalAuthenticate, getPaper);

/**
 * @route   POST /papers/enrich/:arxivId
 * @desc    增强单个论文
 * @access  Private (需要管理员权限)
 */
router.post('/enrich/:arxivId', authenticate, enrichPaper);

/**
 * @route   POST /papers/enrich/batch
 * @desc    批量增强论文
 * @access  Private (需要管理员权限)
 */
router.post('/enrich/batch', authenticate, enrichBatch);

/**
 * @route   POST /papers/enrich/pending
 * @desc    增强需要更新的论文
 * @access  Private (需要管理员权限)
 */
router.post('/enrich/pending', authenticate, enrichPapersNeedingUpdate);

/**
 * @route   GET /papers/enrichment/status/:arxivId
 * @desc    获取论文增强状态
 * @access  Public
 */
router.get('/enrichment/status/:arxivId', getEnrichmentStatus);

/**
 * @route   GET /papers/enrichment/metrics
 * @desc    获取数据质量指标
 * @access  Private (需要管理员权限)
 */
router.get('/enrichment/metrics', authenticate, getDataQualityMetrics);

export default router;
