import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      code: 4029,
      message: '请求过于频繁，请稍后再试',
      data: null,
    });
  },
  skip: (req) => {
    if (isDevelopment) {
      return true;
    }
    return req.path === '/health' || req.path.startsWith('/api/metrics');
  },
});

export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: isDevelopment ? 100 : parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      code: 4029,
      message: '登录尝试过多，请15分钟后再试',
      data: null,
    });
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      code: 4029,
      message: 'API请求过于频繁，请稍后再试',
      data: null,
    });
  },
});
