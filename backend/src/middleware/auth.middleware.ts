/**
 * 认证中间件
 * 验证JWT Token并设置req.user
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { getUserById } from '../services/user.service';
import { getAdminById } from '../services/admin-auth.service';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

interface AuthUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  isActive: boolean;
  isVip?: boolean;
}

interface AuthRequest extends Request {
  user?: AuthUser;
  isAdmin?: boolean;
}

function isAdminPath(path: string): boolean {
  return path.startsWith('/api/admin/') || path.startsWith('/api/v1/admin/');
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

async function findAdminById(adminId: string): Promise<AuthUser | null> {
  try {
    const admin = await getAdminById(adminId);
    if (!admin) return null;
    
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      avatarUrl: admin.avatar_url,
      role: admin.role || 'admin',
      isActive: admin.is_active === 1 || admin.is_active === true,
    };
  } catch (error) {
    logger.error(`Failed to find admin by ID: ${adminId}`, error);
    return null;
  }
}

async function findUserById(userId: string): Promise<AuthUser | null> {
  try {
    const user = await getUserById(userId);
    if (!user) return null;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role ?? undefined,
      isActive: user.isActive,
      isVip: user.isVip ?? false,
    };
  } catch (error) {
    logger.error(`Failed to find user by ID: ${userId}`, error);
    return null;
  }
}

async function resolveUser(payload: TokenPayload, requestPath: string): Promise<{ user: AuthUser | null; isAdmin: boolean }> {
  const isRequestAdminPath = isAdminPath(requestPath);
  
  if (isRequestAdminPath) {
    const admin = await findAdminById(payload.userId);
    if (admin) {
      return { user: admin, isAdmin: true };
    }
    return { user: null, isAdmin: false };
  }
  
  const user = await findUserById(payload.userId);
  if (user) {
    return { user, isAdmin: false };
  }
  
  if (payload.role === 'admin' || payload.role === 'super_admin') {
    const admin = await findAdminById(payload.userId);
    if (admin) {
      return { user: admin, isAdmin: true };
    }
  }
  
  return { user: null, isAdmin: false };
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendError(res, 1002, '未提供Token', 401);
    }

    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      return sendError(res, 1003, 'Token类型错误', 401);
    }

    const { user, isAdmin } = await resolveUser(payload, req.originalUrl || req.path);
    
    if (!user) {
      return sendError(res, 1005, '用户不存在', 404);
    }

    if (!user.isActive) {
      return sendError(res, 1004, '账号已被禁用', 403);
    }

    (req as AuthRequest).user = user;
    (req as AuthRequest).isAdmin = isAdmin;
    
    logger.debug(`Auth success: userId=${user.id}, isAdmin=${isAdmin}`);
    next();
  } catch (error: any) {
    if (error.message === 'TOKEN_EXPIRED') {
      return sendError(res, 1003, 'Token已过期', 401);
    }
    if (error.message === 'INVALID_TOKEN') {
      return sendError(res, 1003, 'Token无效', 401);
    }
    logger.error('Authentication error:', error);
    return sendError(res, 1003, '认证失败', 401);
  }
}

export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      return next();
    }

    const { user, isAdmin } = await resolveUser(payload, req.path);
    
    if (user && user.isActive) {
      (req as AuthRequest).user = user;
      (req as AuthRequest).isAdmin = isAdmin;
    }

    next();
  } catch (error) {
    next();
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    return sendError(res, 1002, '未登录', 401);
  }

  if (!authReq.isAdmin) {
    logger.warn(`Admin access denied: user ${authReq.user.id} is not an admin`);
    return sendError(res, 1006, '无权限访问', 403);
  }

  if (authReq.user.role && authReq.user.role !== 'admin' && authReq.user.role !== 'super_admin') {
    logger.warn(`Admin access denied: user ${authReq.user.id} has invalid role: ${authReq.user.role}`);
    return sendError(res, 1006, '无权限访问', 403);
  }

  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    return sendError(res, 1002, '未登录', 401);
  }

  if (authReq.user.role !== 'super_admin') {
    logger.warn(`Super admin access denied: user ${authReq.user.id} role=${authReq.user.role}`);
    return sendError(res, 1006, '需要超级管理员权限', 403);
  }

  next();
}
