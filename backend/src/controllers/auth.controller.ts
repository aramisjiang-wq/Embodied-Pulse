/**
 * 认证控制器
 * 处理用户认证相关的HTTP请求
 */

import { Request, Response, NextFunction } from 'express';
import { 
  createUser, 
  authenticateUser,
  getUserById,
} from '../services/user.service';
import { authenticateAdmin } from '../services/admin-auth.service';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

/**
 * 邮箱注册
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, verificationCode } = req.body;

    // 验证必填字段
    if (!username || !email || !password || !verificationCode) {
      return sendError(res, 1001, '缺少必填字段', 400);
    }

    // 验证邮箱验证码
    const verificationRecord = await userPrisma.emailVerification.findFirst({
      where: {
        email,
        code: verificationCode,
        type: 'register',
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationRecord) {
      return sendError(res, 1002, '验证码无效或已过期', 400);
    }

    // 标记验证码已使用
    await userPrisma.emailVerification.update({
      where: { id: verificationRecord.id },
      data: { used: true },
    });

    // 创建用户
    const user = await createUser({ username, email, password });

    // 生成Token
    const userRole = (user as any).role || 'user';
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: userRole,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: userRole,
    });

    // 返回响应
    sendSuccess(res, {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: userRole,
        level: user.level,
        points: user.points,
        isVip: user.isVip,
      },
    });
  } catch (error: any) {
    if (error.message === 'INVALID_USERNAME') {
      return sendError(res, 1001, '用户名格式不正确(3-20个字符,只能包含字母、数字、下划线)', 400);
    }
    if (error.message === 'INVALID_EMAIL') {
      return sendError(res, 1001, '邮箱格式不正确', 400);
    }
    if (error.message === 'WEAK_PASSWORD') {
      return sendError(res, 1001, '密码强度不足(8-32个字符,至少包含一个字母和一个数字)', 400);
    }
    if (error.message === 'USERNAME_EXISTS') {
      return sendError(res, 1006, '用户名已存在', 409);
    }
    if (error.message === 'EMAIL_EXISTS') {
      return sendError(res, 1006, '邮箱已被注册', 409);
    }
    next(error);
  }
}

/**
 * 邮箱登录
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return sendError(res, 1001, '缺少必填字段', 400);
    }

    // 验证用户
    const user = await authenticateUser(email, password);

    // 生成Token
    const userRole = (user as any).role || 'user';
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: userRole,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: userRole,
    });

    // 返回响应
    sendSuccess(res, {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: (user as any).role || 'user',
        level: user.level,
        points: user.points,
        isVip: user.isVip,
      },
    });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return sendError(res, 1002, '邮箱或密码错误', 401);
    }
    if (error.message === 'USER_BANNED') {
      return sendError(res, 1004, '账号已被禁用', 403);
    }
    next(error);
  }
}

/**
 * 管理员登录
 */
export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // 记录请求信息（不记录密码）
    logger.info(`Admin login request: email=${email || 'missing'}, passwordLength=${password ? password.length : 0}`);

    // 验证必填字段
    if (!email || !password) {
      logger.warn(`Admin login missing fields: email=${!!email}, password=${!!password}`);
      return sendError(res, 1001, '缺少必填字段', 400);
    }

    // 验证管理员
    const admin = await authenticateAdmin(email, password);
    
    logger.info(`[Admin Login] Admin authenticated: id=${admin.id}, username=${admin.username}, role=${admin.role}`);

    // 生成Token
    const accessToken = generateAccessToken({
      userId: admin.id,
      username: admin.username,
      role: admin.role,
    });
    
    logger.info(`[Admin Login] Access token generated`, {
      userId: admin.id,
      username: admin.username,
      role: admin.role,
    });
    
    const refreshToken = generateRefreshToken({
      userId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    // 返回响应
    sendSuccess(res, {
      token: accessToken,
      refreshToken,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        avatarUrl: admin.avatarUrl,
        role: admin.role,
        isVip: false,
        level: 0,
        points: 0,
      },
    });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return sendError(res, 1002, '邮箱或密码错误', 401);
    }
    if (error.message === 'ADMIN_BANNED') {
      return sendError(res, 1004, '账号已被禁用', 403);
    }
    next(error);
  }
}

/**
 * 刷新Token
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    // 从Authorization header获取refresh token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return sendError(res, 1002, '缺少Token', 401);
    }

    // 验证refresh token
    const payload = verifyToken(token);
    if (payload.type !== 'refresh') {
      return sendError(res, 1003, 'Token类型错误', 401);
    }

    // 生成新的Token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    });
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    });

    sendSuccess(res, {
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    if (error.message === 'TOKEN_EXPIRED') {
      return sendError(res, 1003, 'Refresh Token已过期', 401);
    }
    if (error.message === 'INVALID_TOKEN') {
      return sendError(res, 1003, 'Refresh Token无效', 401);
    }
    next(error);
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    // 检查是否是管理员
    const isAdmin = (req as any).isAdmin;
    
    if (isAdmin) {
      // 如果是管理员，从管理端数据库获取信息
      const { getAdminById } = await import('../services/admin-auth.service');
      const admin = await getAdminById(userId);
      if (!admin) {
        return sendError(res, 1005, '管理员不存在', 404);
      }

      sendSuccess(res, {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        avatarUrl: admin.avatarUrl,
        role: admin.role || 'admin',
        isVip: false,
        level: 0,
        points: 0,
      });
    } else {
      // 如果是普通用户，从用户端数据库获取信息
      const user = await getUserById(userId);
      if (!user) {
        return sendError(res, 1005, '用户不存在', 404);
      }

      sendSuccess(res, {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        level: user.level,
        points: user.points,
        isVip: user.isVip,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 获取当前管理员信息（管理端专用）
 */
export async function getCurrentAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 1002, '未登录', 401);
    }

    const { getAdminById } = await import('../services/admin-auth.service');
    const admin = await getAdminById(userId);
    if (!admin) {
      return sendError(res, 1005, '管理员不存在', 404);
    }

    sendSuccess(res, {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      avatarUrl: admin.avatarUrl,
      role: admin.role || 'admin',
      isVip: false,
      level: 0,
      points: 0,
    });
  } catch (error) {
    next(error);
  }
}
