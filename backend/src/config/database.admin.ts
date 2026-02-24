/**
 * 管理端数据库连接（与用户端完全独立，勿混用）
 * - 环境变量：ADMIN_DATABASE_URL（上线必须配置，见 resolve-db-url.ts）
 * - 默认（仅开发）：file:./prisma/dev-admin.db，会解析为绝对路径
 * - 用途：管理员账号、admins 表及权限等，仅管理端登录 /admin 使用
 */

import { PrismaClient as AdminPrismaClient } from '../../node_modules/.prisma/client-admin';
import { logger } from '../utils/logger';
import { resolveDbUrl } from './resolve-db-url';

const adminDbUrl = resolveDbUrl({
  envKey: 'ADMIN_DATABASE_URL',
  defaultUrl: 'file:./prisma/dev-admin.db',
  dirnameOfCaller: __dirname,
});

const adminPrisma = new AdminPrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  datasources: {
    db: {
      url: adminDbUrl,
    },
  },
});

// 监听查询日志
adminPrisma.$on('query' as never, (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Admin DB Query:', e.query);
    logger.debug('Admin DB Params:', e.params);
    logger.debug('Admin DB Duration:', `${e.duration}ms`);
  }
});

// 连接数据库（延迟连接，避免阻塞启动）
let connectionPromise: Promise<void> | null = null;
let isConnected = false;

function connectDatabase() {
  if (!connectionPromise) {
    connectionPromise = adminPrisma
      .$connect()
      .then(() => {
        isConnected = true;
        logger.info('Admin database connected successfully');
      })
      .catch((error) => {
        logger.error('Admin database connection error:', error);
        // 不退出进程，允许使用raw SQL fallback
        logger.warn('Admin database connection failed, will use raw SQL fallback');
      });
  }
  return connectionPromise;
}

// 延迟连接
setTimeout(() => {
  connectDatabase();
}, 1000);

// 导出函数以检查连接状态
export async function ensureAdminDatabaseConnected() {
  if (!isConnected && connectionPromise) {
    await connectionPromise;
  } else if (!connectionPromise) {
    await connectDatabase();
  }
}

export default adminPrisma;
