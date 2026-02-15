/**
 * 新闻同步任务队列
 * 处理新闻同步的异步任务
 */

import { getQueue } from './queue.service';
import type { Job } from 'bull';
import { logger } from '../utils/logger';
import { syncFrom36Kr } from '../services/news-sync.service';
import { eventBus } from '../events/event-bus.service';
import { EventType, SyncStartedEvent, SyncCompletedEvent, SyncFailedEvent } from '../events/event.types';

export interface NewsSyncJobData {
  source: string;
  force?: boolean;
}

export const newsSyncQueue = getQueue<NewsSyncJobData>('news-sync', {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
  limiter: {
    max: 5,
    duration: 60000,
  },
});

export async function addNewsSyncJob(data: NewsSyncJobData): Promise<void> {
  await newsSyncQueue.add('sync-news', data, {
    jobId: `news-sync-${data.source}-${Date.now()}`,
    priority: 5,
  });
  logger.info(`News sync job added for source: ${data.source}`);
}

export async function processNewsSyncJob(job: Job<NewsSyncJobData>): Promise<void> {
  const { source, force } = job.data;
  const startTime = Date.now();

  logger.info(`Processing news sync job for source: ${source}`);

  const syncStartedEvent: SyncStartedEvent = {
    id: `event-${Date.now()}`,
    type: EventType.SYNC_STARTED,
    timestamp: new Date(),
    data: {
      syncType: 'news',
      source,
    },
  };
  eventBus.publish(syncStartedEvent);

  try {
    const result = await syncFrom36Kr();
    const duration = (Date.now() - startTime) / 1000;

    const syncCompletedEvent: SyncCompletedEvent = {
      id: `event-${Date.now()}`,
      type: EventType.SYNC_COMPLETED,
      timestamp: new Date(),
      data: {
        syncType: 'news',
        source,
        syncedCount: result.synced,
        duration,
      },
    };
    eventBus.publish(syncCompletedEvent);

    logger.info(`News sync completed for source: ${source}, synced: ${result.synced}`);
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const syncFailedEvent: SyncFailedEvent = {
      id: `event-${Date.now()}`,
      type: EventType.SYNC_FAILED,
      timestamp: new Date(),
      data: {
        syncType: 'news',
        source,
        error: errorMessage,
        duration,
      },
    };
    eventBus.publish(syncFailedEvent);

    logger.error(`News sync failed for source: ${source}`, error);
    throw error;
  }
}

newsSyncQueue.process('sync-news', 3, processNewsSyncJob);
