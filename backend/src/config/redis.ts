import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

// 连接Redis
if (!redisClient.isOpen) {
  redisClient.connect().catch((error) => {
    logger.error('Redis connection error:', error);
  });
}

export default redisClient;
