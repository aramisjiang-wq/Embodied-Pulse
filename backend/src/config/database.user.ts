/**
 * 用户端数据库连接
 * 存储所有用户端注册用户和相关数据
 */

import { PrismaClient as UserPrismaClient } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

// 确保数据库路径正确
let userDbUrl = process.env.USER_DATABASE_URL || 'file:./prisma/dev-user.db';

// 如果使用相对路径，转换为绝对路径
if (userDbUrl.startsWith('file:./') || userDbUrl.startsWith('file:')) {
  const dbPath = userDbUrl.replace('file:', '');
  
  if (fs.existsSync(dbPath)) {
    userDbUrl = `file:${path.resolve(dbPath)}`;
    logger.info(`User database path resolved to: ${path.resolve(dbPath)}`);
  } else {
    logger.error(`User database not found at: ${dbPath}`);
    logger.warn('Will try to use the configured path anyway, Prisma will handle the error');
  }
}

const userPrisma = new UserPrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  datasources: {
    db: {
      url: userDbUrl,
    },
  },
});

// 监听查询日志
userPrisma.$on('query' as never, (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('User DB Query:', e.query);
    logger.debug('User DB Params:', e.params);
    logger.debug('User DB Duration:', `${e.duration}ms`);
  }
});

// 连接数据库（延迟连接，避免阻塞启动）
let connectionPromise: Promise<void> | null = null;

function connectDatabase() {
  if (!connectionPromise) {
    connectionPromise = userPrisma
      .$connect()
      .then(() => {
        logger.info('User database connected successfully');
      })
      .catch((error) => {
        logger.error('User database connection error:', error);
        // 不退出进程，允许重试
        logger.warn('User database connection failed, will retry on next query');
      });
  }
  return connectionPromise;
}

// 延迟连接
setTimeout(() => {
  connectDatabase();
}, 1000);

export function ensureUserDatabaseConnected(): Promise<void> {
  return connectDatabase();
}

export default userPrisma;
