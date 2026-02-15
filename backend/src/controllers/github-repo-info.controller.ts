/**
 * GitHub仓库信息控制器
 * 用于管理端自动识别仓库信息
 */

import { Request, Response } from 'express';
import {
  getGitHubRepoFromUrl,
  validateGitHubRepo,
  parseGitHubUrl,
} from '../services/github-repo-info.service';
import { sendSuccess, sendError } from '../utils/response';

/**
 * 从URL获取GitHub仓库信息
 */
export const getGitHubRepoInfo = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return sendError(res, 1001, '请提供有效的GitHub仓库URL', 400);
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return sendError(res, 1002, '无效的GitHub仓库URL格式', 400);
    }

    const repoInfo = await getGitHubRepoFromUrl(url);

    sendSuccess(res, repoInfo);
  } catch (error: any) {
    if (error.message === '仓库不存在') {
      sendError(res, 1003, '仓库不存在', 404);
    } else if (error.message === 'API访问受限，请检查GitHub Token配置') {
      sendError(res, 1004, 'API访问受限，请检查GitHub Token配置', 403);
    } else {
      sendError(res, 1005, error.message || '获取仓库信息失败', 500);
    }
  }
};

/**
 * 验证GitHub仓库是否存在
 */
export const validateGitHubRepoUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return sendError(res, 1001, '请提供有效的GitHub仓库URL', 400);
    }

    const isValid = await validateGitHubRepo(url);

    sendSuccess(res, { valid: isValid });
  } catch (error: any) {
    sendError(res, 1006, error.message || '验证失败', 500);
  }
};
