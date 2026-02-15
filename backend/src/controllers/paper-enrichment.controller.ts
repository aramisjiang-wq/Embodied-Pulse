import { Request, Response } from 'express';
import { createPaperEnrichmentService } from '../services/paper-enrichment.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 增强单个论文
 */
export const enrichPaper = async (req: Request, res: Response) => {
  try {
    const { arxivId } = req.params;
    
    if (!arxivId) {
      return sendError(res, 6001, '缺少arxivId参数', 400);
    }

    const enrichmentService = createPaperEnrichmentService();
    const result = await enrichmentService.enrichPaper(arxivId);

    if (result.success) {
      sendSuccess(res, result);
    } else {
      sendError(res, 6002, result.error || '增强失败', 500);
    }
  } catch (error: any) {
    logger.error('增强论文失败:', error);
    sendError(res, 6003, error.message || '增强失败', 500);
  }
};

/**
 * 批量增强论文
 */
export const enrichBatch = async (req: Request, res: Response) => {
  try {
    const { arxivIds } = req.body;
    
    if (!arxivIds || !Array.isArray(arxivIds) || arxivIds.length === 0) {
      return sendError(res, 6004, '缺少arxivIds数组参数', 400);
    }

    if (arxivIds.length > 100) {
      return sendError(res, 6005, '单次最多处理100篇论文', 400);
    }

    const enrichmentService = createPaperEnrichmentService();
    const results = await enrichmentService.enrichBatch(arxivIds);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    sendSuccess(res, {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
        successRate: results.length > 0 ? (successCount / results.length) * 100 : 0,
      },
    });
  } catch (error: any) {
    logger.error('批量增强论文失败:', error);
    sendError(res, 6006, error.message || '批量增强失败', 500);
  }
};

/**
 * 增强需要更新的论文
 */
export const enrichPapersNeedingUpdate = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysSinceLastUpdate = Number(days);

    if (isNaN(daysSinceLastUpdate) || daysSinceLastUpdate < 1) {
      return sendError(res, 6007, 'days参数必须是大于0的数字', 400);
    }

    const enrichmentService = createPaperEnrichmentService();
    const results = await enrichmentService.enrichPapersNeedingUpdate(daysSinceLastUpdate);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    sendSuccess(res, {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
        successRate: results.length > 0 ? (successCount / results.length) * 100 : 0,
      },
    });
  } catch (error: any) {
    logger.error('增强需要更新的论文失败:', error);
    sendError(res, 6008, error.message || '增强失败', 500);
  }
};

/**
 * 获取论文增强状态
 */
export const getEnrichmentStatus = async (req: Request, res: Response) => {
  try {
    const { arxivId } = req.params;
    
    if (!arxivId) {
      return sendError(res, 6009, '缺少arxivId参数', 400);
    }

    const enrichmentService = createPaperEnrichmentService();
    const status = await enrichmentService.getEnrichmentStatus(arxivId);

    if (!status) {
      return sendError(res, 6010, '论文不存在', 404);
    }

    sendSuccess(res, status);
  } catch (error: any) {
    logger.error('获取增强状态失败:', error);
    sendError(res, 6011, error.message || '获取状态失败', 500);
  }
};

/**
 * 获取数据质量指标
 */
export const getDataQualityMetrics = async (req: Request, res: Response) => {
  try {
    const enrichmentService = createPaperEnrichmentService();
    const metrics = await enrichmentService.getDataQualityMetrics();

    sendSuccess(res, metrics);
  } catch (error: any) {
    logger.error('获取数据质量指标失败:', error);
    sendError(res, 6012, error.message || '获取指标失败', 500);
  }
};
