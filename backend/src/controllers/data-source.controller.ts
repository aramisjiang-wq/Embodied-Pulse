/**
 * 数据源管理控制器
 */

import { Request, Response } from 'express';
import {
  getAllDataSources,
  getDataSourceById,
  updateDataSource,
  toggleDataSource,
  checkDataSourceHealth,
  checkAllDataSourcesHealth,
  getDataSourceLogs,
  initializeDataSources,
} from '../services/data-source.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 初始化数据源（首次使用）
 */
export const initDataSources = async (req: Request, res: Response) => {
  try {
    await initializeDataSources();
    sendSuccess(res, { message: '数据源初始化成功' });
  } catch (error: any) {
    logger.error('初始化数据源失败:', error);
    sendError(res, 5000, error.message || '初始化失败', 500);
  }
};

/**
 * 获取所有数据源
 */
export const getDataSources = async (req: Request, res: Response) => {
  try {
    const sources = await getAllDataSources();
    sendSuccess(res, sources);
  } catch (error: any) {
    logger.error('获取数据源列表失败:', error);
    sendError(res, 5001, error.message || '获取失败', 500);
  }
};

/**
 * 获取单个数据源
 */
export const getDataSource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const source = await getDataSourceById(id);
    sendSuccess(res, source);
  } catch (error: any) {
    logger.error('获取数据源失败:', error);
    if (error.message === 'DATA_SOURCE_NOT_FOUND') {
      sendError(res, 5002, '数据源不存在', 404);
    } else {
      sendError(res, 5003, error.message || '获取失败', 500);
    }
  }
};

/**
 * 更新数据源配置
 */
export const updateDataSourceConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { displayName, apiBaseUrl, apiKey, enabled, tags, config } = req.body;

    const updated = await updateDataSource(id, {
      displayName,
      apiBaseUrl,
      apiKey,
      enabled,
      tags,
      config,
    });

    sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('更新数据源配置失败:', error);
    sendError(res, 5004, error.message || '更新失败', 500);
  }
};

/**
 * 切换数据源启用状态
 */
export const toggleDataSourceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const updated = await toggleDataSource(id, enabled);
    sendSuccess(res, updated);
  } catch (error: any) {
    logger.error('切换数据源状态失败:', error);
    sendError(res, 5005, error.message || '切换失败', 500);
  }
};

/**
 * 检查单个数据源健康状态
 */
export const checkHealth = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await checkDataSourceHealth(id);
    sendSuccess(res, result);
  } catch (error: any) {
    logger.error('健康检查失败:', error);
    sendError(res, 5006, error.message || '检查失败', 500);
  }
};

/**
 * 检查所有数据源健康状态
 */
export const checkAllHealth = async (req: Request, res: Response) => {
  try {
    const results = await checkAllDataSourcesHealth();
    sendSuccess(res, results);
  } catch (error: any) {
    logger.error('批量健康检查失败:', error);
    sendError(res, 5007, error.message || '检查失败', 500);
  }
};

/**
 * 获取数据源日志
 */
export const getLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await getDataSourceLogs(id, Number(limit), Number(offset));
    sendSuccess(res, result);
  } catch (error: any) {
    logger.error('获取数据源日志失败:', error);
    sendError(res, 5008, error.message || '获取失败', 500);
  }
};
