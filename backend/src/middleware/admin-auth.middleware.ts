/**
 * 管理员认证中间件
 * 验证管理员JWT Token并设置req.admin
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { getAdminById } from '../services/admin-auth.service';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * 管理员认证中间件
 * 验证Token并设置req.admin
 */
export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    logger.info(`[Admin Auth] Request: ${req.method} ${req.path}`, {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20) + '...',
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`[Admin Auth] Missing or invalid auth header: ${req.method} ${req.path}`);
      return sendError(res, 1002, '未提供Token', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    logger.info(`[Admin Auth] Verifying token...`);
    const payload = verifyToken(token);
    
    logger.info(`[Admin Auth] Token payload:`, {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      type: payload.type,
    });
    
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      logger.warn(`[Admin Auth] Permission denied: role=${payload.role}, expected=admin or super_admin`);
      return sendError(res, 1003, '权限不足', 403);
    }

    const admin = await getAdminById(payload.userId);
    if (!admin) {
      logger.error(`[Admin Auth] Admin not found: userId=${payload.userId}`);
      return sendError(res, 1005, '管理员不存在', 404);
    }

    logger.info(`[Admin Auth] Admin authenticated: userId=${admin.id}, username=${admin.username}, role=${admin.role}`);

    if (!admin.isActive) {
      logger.warn(`[Admin Auth] Admin ${admin.id} is inactive`);
      return sendError(res, 1004, '账号已被禁用', 403);
    }

    (req as any).admin = admin;
    
    next();
  } catch (error: any) {
    if (error.message === 'TOKEN_EXPIRED') {
      logger.warn(`[Admin Auth] Token expired`);
      return sendError(res, 1003, 'Token已过期', 401);
    }
    if (error.message === 'INVALID_TOKEN') {
      logger.warn(`[Admin Auth] Invalid token`);
      return sendError(res, 1003, 'Token无效', 401);
    }
    logger.error('[Admin Auth] Authentication middleware error:', error);
    return sendError(res, 1003, '认证失败', 401);
  }
}