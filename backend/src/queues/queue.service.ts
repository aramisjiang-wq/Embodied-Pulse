/**
 * 消息队列服务
 * 使用Bull实现基于Redis的消息队列
 */

import Queue from 'bull';
import type { Job, JobOptions } from 'bull';
import { logger } from '../utils/logger';
import { initRedis } from '../services/redis.service';

interface QueueConfig {
  defaultJobOptions?: JobOptions;
  limiter?: {
    max: number;
    duration: number;
  };
}

const queues: Map<string, any> = new Map();

export function getQueue<T = any>(name: string, config?: QueueConfig): any {
  if (!queues.has(name)) {
    const queue = new Queue<T>(name, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...config?.defaultJobOptions,
      },
      limiter: config?.limiter,
    });

    queue.on('error', (error) => {
      logger.error(`Queue ${name} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} waiting in queue ${name}`);
    });

    queue.on('active', (job, jobPromise) => {
      logger.debug(`Job ${job.id} active in queue ${name}`);
    });

    queue.on('completed', (job, result) => {
      logger.debug(`Job ${job.id} completed in queue ${name}`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed in queue ${name}:`, err);
    });

    queues.set(name, queue);
    logger.info(`Queue ${name} initialized`);
  }

  return queues.get(name)!;
}

export async function closeAllQueues(): Promise<void> {
  logger.info('Closing all queues...');
  
  const closePromises = Array.from(queues.values()).map(queue => queue.close());
  await Promise.all(closePromises);
  
  queues.clear();
  logger.info('All queues closed');
}

export async function getQueueStats(queueName: string): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getQueue(queueName);
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

export async function getAllQueueStats(): Promise<Record<string, any>> {
  const stats: Record<string, any> = {};
  
  for (const [name, queue] of queues.entries()) {
    stats[name] = await getQueueStats(name);
  }
  
  return stats;
}

export async function cleanQueue(queueName: string, grace: number = 5000): Promise<void> {
  const queue = getQueue(queueName);
  await queue.clean(grace, 'completed');
  await queue.clean(grace, 'failed');
  await queue.clean(grace, 'waiting');
  logger.info(`Queue ${queueName} cleaned`);
}

export async function cleanAllQueues(grace: number = 5000): Promise<void> {
  logger.info('Cleaning all queues...');
  
  for (const name of queues.keys()) {
    await cleanQueue(name, grace);
  }
  
  logger.info('All queues cleaned');
}

export async function pauseQueue(queueName: string): Promise<void> {
  const queue = getQueue(queueName);
  await queue.pause();
  logger.info(`Queue ${queueName} paused`);
}

export async function resumeQueue(queueName: string): Promise<void> {
  const queue = getQueue(queueName);
  await queue.resume();
  logger.info(`Queue ${queueName} resumed`);
}

export async function retryFailedJobs(queueName: string): Promise<number> {
  const queue = getQueue(queueName);
  const failedJobs = await queue.getFailed();
  
  let retried = 0;
  for (const job of failedJobs) {
    await job.retry();
    retried++;
  }
  
  logger.info(`Retried ${retried} failed jobs in queue ${queueName}`);
  return retried;
}
