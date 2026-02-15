/**
 * 管理端数据库连接
 * 存储所有管理员账号和权限信息
 */

import { PrismaClient as AdminPrismaClient } from '../../node_modules/.prisma/client-admin';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

// 确保数据库路径正确
let adminDbUrl = process.env.ADMIN_DATABASE_URL || 'file:./prisma/admin.db';

// 如果使用相对路径，转换为绝对路径
if (adminDbUrl.startsWith('file:./') || adminDbUrl.startsWith('file:')) {
  const dbPath = adminDbUrl.replace('file:', '');
  // 从 src/config/ 目录，需要回到项目根目录，然后到 prisma/admin.db
  const absolutePath = path.resolve(__dirname, '..', '..', 'prisma', 'admin.db');
  
  if (fs.existsSync(absolutePath)) {
    adminDbUrl = `file:${absolutePath}`;
    logger.info(`Admin database path resolved to: ${absolutePath}`);
  } else {
    // 尝试相对路径解析
    const relativePath = path.resolve(__dirname, '..', dbPath);
    if (fs.existsSync(relativePath)) {
      adminDbUrl = `file:${relativePath}`;
      logger.info(`Admin database path resolved to: ${relativePath}`);
    } else {
      logger.error(`Admin database not found at: ${absolutePath} or ${relativePath}`);
    }
  }
}

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
