import { PrismaClient } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import { resolveDbUrlMulti } from './resolve-db-url';

const dbUrl = resolveDbUrlMulti({
  envKeys: ['DATABASE_URL', 'USER_DATABASE_URL'],
  defaultUrl: 'file:./prisma/dev-user.db',
  dirnameOfCaller: __dirname,
});

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  errorFormat: 'minimal',
});

// 监听查询日志
prisma.$on('query' as never, (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Query:', e.query);
    logger.debug('Params:', e.params);
    logger.debug('Duration:', `${e.duration}ms`);
  }
});

// 连接数据库
prisma
  .$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error) => {
    logger.error('Database connection error:', error);
    process.exit(1);
  });

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, gracefully shutting down...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default prisma;
