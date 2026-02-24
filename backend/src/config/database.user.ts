/**
 * 用户端数据库连接（与管理端 admin 库独立；与「管理端 - 用户管理」界面读写的为同一库）
 * - 环境变量：USER_DATABASE_URL（上线必须配置，见 resolve-db-url.ts）
 * - 默认（仅开发）：file:./prisma/dev-user.db，按 resolve-db-url 解析为 backend 目录下同一路径，保证从任意目录启动时用户端与管理端查阅同一用户库
 * - 用途：用户端注册/登录、User 表及业务数据；管理端用户列表/编辑也读此库
 */

import { PrismaClient as UserPrismaClient } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import { resolveDbUrl } from './resolve-db-url';

const userDbUrl = resolveDbUrl({
  envKey: 'USER_DATABASE_URL',
  defaultUrl: 'file:./prisma/dev-user.db',
  dirnameOfCaller: __dirname,
});

// 启动时打印当前使用的用户库路径，便于排查「管理端用户列表看不到已注册用户」问题
if (process.env.NODE_ENV !== 'production') {
  logger.info(`[用户库] 当前连接: ${userDbUrl.replace(/^file:/, '')}`);
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
