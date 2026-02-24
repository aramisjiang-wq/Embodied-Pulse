import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import routes from './routes';
import { initializeDataSources } from './services/data-source.service';
import { startCronJobs } from './services/sync/cron';
import { BilibiliCookieManager } from './services/bilibili-cookie-manager.service';
import { BilibiliHealthService } from './services/bilibili-health.service';
import { initJobSyncScheduler } from './scripts/init-job-sync';
import { startSubscriptionUpdateCheck } from './services/scheduler.service';
import { startAllHuggingFaceSchedulers } from './services/huggingface-scheduler.service';
import { initRedis } from './services/redis.service';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { initializeEventHandlers, shutdownEventHandlers } from './events/event-handlers';
import { closeAllQueues } from './queues/queue.service';
import { rateLimiter } from './middleware/rate-limiter.middleware';
import { registerStartupTask, runStartupTasks } from './utils/startup-manager';
import { validateEnvironment } from './utils/env-validator';
import { websocketService } from './services/websocket.service';

dotenv.config();

const envValidation = validateEnvironment();
if (!envValidation.valid) {
  logger.error('环境变量验证失败，请检查配置后重试');
  process.exit(1);
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

logger.info(`[DEBUG] LOG_LEVEL: ${process.env.LOG_LEVEL}`);
logger.info(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const getCorsOrigins = (): string[] => {
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  if (isDevelopment) {
    return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
  }
  logger.warn('CORS_ORIGINS not set in production, using restrictive defaults');
  return [];
};

const corsOrigins = getCorsOrigins();
logger.info(`CORS origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'none configured'}`);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'authorization', 'content-type', 'x-requested-with'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const helmetConfig = isDevelopment
  ? {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      hsts: false,
      noSniff: true,
      xssFilter: true,
    }
  : {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-origin' as const },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
    };

app.use(helmet(helmetConfig));
app.use(morgan('combined'));
app.use(metricsMiddleware);

app.use(rateLimiter);

// 静态文件服务 - 提供上传的图片访问
app.use('/api/v1/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 路由
app.use('/api/v1', routes);
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
server.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  websocketService.initialize(server);

  registerStartupTask({
    name: 'bilibili-cookie-manager',
    handler: () => {
      BilibiliCookieManager.initialize();
    },
  });

  registerStartupTask({
    name: 'data-sources',
    handler: async () => {
      await initializeDataSources();
    },
    retries: 2,
  });

  registerStartupTask({
    name: 'redis',
    handler: async () => {
      await initRedis();
    },
    retries: 3,
  });

  registerStartupTask({
    name: 'event-handlers',
    handler: () => {
      initializeEventHandlers();
    },
    dependencies: ['redis'],
  });

  registerStartupTask({
    name: 'cron-jobs',
    handler: () => {
      startCronJobs();
    },
    dependencies: ['redis'],
  });

  registerStartupTask({
    name: 'job-sync-scheduler',
    handler: () => {
      initJobSyncScheduler();
    },
  });

  registerStartupTask({
    name: 'subscription-update-check',
    handler: () => {
      startSubscriptionUpdateCheck();
    },
  });

  registerStartupTask({
    name: 'huggingface-schedulers',
    handler: () => {
      startAllHuggingFaceSchedulers();
    },
  });

  registerStartupTask({
    name: 'bilibili-health-check',
    handler: () => {
      BilibiliHealthService.startHealthCheck(24 * 60 * 60 * 1000);
    },
  });

  await runStartupTasks();
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  websocketService.close();
  shutdownEventHandlers();
  await closeAllQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  websocketService.close();
  shutdownEventHandlers();
  await closeAllQueues();
  process.exit(0);
});

export default app;
