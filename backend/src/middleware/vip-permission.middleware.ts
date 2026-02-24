/**
 * VIP权限中间件
 * 验证用户是否为VIP
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

interface VipUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  isActive: boolean;
  isVip: boolean;
}

interface VipAuthRequest extends Request {
  user?: VipUser;
}

export function checkVipPermission(_permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as VipAuthRequest;
      
      if (!authReq.user) {
        return sendError(res, 1002, '未登录', 401);
      }

      if (!authReq.user.isActive) {
        return sendError(res, 1004, '账号已被禁用', 403);
      }

      if (!authReq.user.isVip) {
        logger.warn(`VIP access denied: user ${authReq.user.id} is not VIP`);
        return sendError(res, 1003, '需要VIP权限', 403);
      }

      logger.debug(`VIP access granted: user ${authReq.user.id}`);
      next();
    } catch (error) {
      logger.error('VIP permission check error:', error);
      return sendError(res, 1003, '权限验证失败', 500);
    }
  };
}

export async function requireVip(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as VipAuthRequest;
    
    if (!authReq.user) {
      return sendError(res, 1002, '未登录', 401);
    }

    if (!authReq.user.isActive) {
      return sendError(res, 1004, '账号已被禁用', 403);
    }

    if (!authReq.user.isVip) {
      logger.warn(`VIP access denied: user ${authReq.user.id} is not VIP`);
      return sendError(res, 1003, '需要VIP权限', 403);
    }

    next();
  } catch (error) {
    logger.error('VIP check error:', error);
    return sendError(res, 1003, '权限验证失败', 500);
  }
}

export { VipUser, VipAuthRequest };
