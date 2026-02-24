/**
 * JWT工具函数
 * 负责Token的生成、验证和刷新
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from './logger';

const getJwtSecret = (secretName: string): string => {
  const secret = process.env[secretName];
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`${secretName} environment variable is not set in production!`);
      throw new Error(`${secretName} must be set in production environment`);
    }
    logger.warn(`${secretName} not set, using development default. DO NOT use in production!`);
    const devSecret = 'dev-' + secretName.toLowerCase() + '-' + crypto.createHash('sha256').update(secretName + '-embodied-pulse-2026').digest('hex').slice(0, 32);
    return devSecret;
  }
  if (secret.length < 32) {
    logger.warn(`${secretName} is shorter than recommended 32 characters`);
  }
  if (secret.includes('secret') || secret.includes('password') || secret.includes('123456')) {
    logger.warn(`${secretName} contains weak patterns, please use a stronger secret`);
  }
  return secret;
};

const JWT_SECRET: string = getJwtSecret('JWT_SECRET');
const JWT_REFRESH_SECRET: string = getJwtSecret('JWT_REFRESH_SECRET');
// 长久登录：access 30 天，refresh 365 天；可通过环境变量覆盖
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '30d';
const REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN || '365d';

export interface TokenPayload {
  userId: string;
  username: string;
  role?: string;
  type: 'access' | 'refresh';
}

/**
 * 生成访问Token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN as string | number,
      issuer: 'embodied-pulse',
      audience: 'embodied-pulse-users',
    } as jwt.SignOptions
  );
}

/**
 * 生成刷新Token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN as string | number,
      issuer: 'embodied-pulse',
      audience: 'embodied-pulse-users',
    } as jwt.SignOptions
  );
}

/**
 * 验证Token
 */
export function verifyToken(token: string, expectedType?: 'access' | 'refresh'): TokenPayload {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (!decoded) {
      throw new Error('INVALID_TOKEN');
    }
    const tokenType = decoded.type || 'access';
    const secret = tokenType === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
    if (expectedType && tokenType !== expectedType) {
      throw new Error('TOKEN_TYPE_MISMATCH');
    }
    const payload = jwt.verify(token, secret, {
      issuer: 'embodied-pulse',
      audience: 'embodied-pulse-users',
    }) as TokenPayload;
    return payload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    }
    if (error.message === 'TOKEN_TYPE_MISMATCH') {
      throw error;
    }
    logger.error('Token verification error:', error);
    throw new Error('TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * 解码Token (不验证)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    logger.error('Token decode error:', error);
    return null;
  }
}
