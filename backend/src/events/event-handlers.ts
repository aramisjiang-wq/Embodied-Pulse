/**
 * 事件处理器
 * 处理各种业务事件
 */

import { eventBus } from './event-bus.service';
import {
  EventType,
  UserCreatedEvent,
  UserLoginEvent,
  NewsCreatedEvent,
  NewsViewedEvent,
  NewsSyncedEvent,
  PostCreatedEvent,
  CommentCreatedEvent,
  SubscriptionTriggeredEvent,
  NotificationCreatedEvent,
  SyncStartedEvent,
  SyncCompletedEvent,
  SyncFailedEvent,
  SystemErrorEvent,
} from './event.types';
import { logger } from '../utils/logger';
import { createNotification } from '../services/notification.service';
import { incrementNewsSyncCounter, observeNewsSyncDuration, incrementErrorCounter } from '../services/metrics.service';

export function initializeEventHandlers(): void {
  logger.info('Initializing event handlers...');

  setupUserEventHandlers();
  setupNewsEventHandlers();
  setupCommunityEventHandlers();
  setupSubscriptionEventHandlers();
  setupSyncEventHandlers();
  setupSystemEventHandlers();

  logger.info('Event handlers initialized');
}

function setupUserEventHandlers(): void {
  eventBus.subscribe<UserCreatedEvent>(EventType.USER_CREATED, async (event) => {
    logger.info(`User created: ${event.data.userId}`);
    
    await createNotification({
      userId: event.data.userId,
      type: 'system',
      title: '欢迎加入Embodied Pulse',
      content: '感谢您注册Embodied Pulse，开始探索具身智能的世界吧！',
    });
  });

  eventBus.subscribe<UserLoginEvent>(EventType.USER_LOGIN, async (event) => {
    logger.info(`User logged in: ${event.data.userId}`);
  });
}

function setupNewsEventHandlers(): void {
  eventBus.subscribe<NewsCreatedEvent>(EventType.NEWS_CREATED, async (event) => {
    logger.info(`News created: ${event.data.newsId}`);
    
    await createNotification({
      userId: 'system',
      type: 'paper_new',
      title: '新新闻发布',
      content: event.data.title,
      metadata: {
        newsId: event.data.newsId,
        category: event.data.category,
      },
    });
  });

  eventBus.subscribe<NewsViewedEvent>(EventType.NEWS_VIEWED, async (event) => {
    if (event.data.userId) {
      logger.debug(`News viewed: ${event.data.newsId} by user ${event.data.userId}`);
    }
  });

  eventBus.subscribe<NewsSyncedEvent>(EventType.NEWS_SYNCED, async (event) => {
    logger.info(`News synced: ${event.data.source} - ${event.data.syncedCount} items`);
    
    incrementNewsSyncCounter(
      event.data.source,
      event.data.failedCount > 0 ? 'partial' : 'success'
    );
    
    observeNewsSyncDuration(event.data.source, event.data.duration);
  });
}

function setupCommunityEventHandlers(): void {
  eventBus.subscribe<PostCreatedEvent>(EventType.POST_CREATED, async (event) => {
    logger.info(`Post created: ${event.data.postId} by user ${event.data.userId}`);
  });

  eventBus.subscribe<CommentCreatedEvent>(EventType.COMMENT_CREATED, async (event) => {
    logger.info(`Comment created: ${event.data.commentId} on post ${event.data.postId}`);
  });
}

function setupSubscriptionEventHandlers(): void {
  eventBus.subscribe<SubscriptionTriggeredEvent>(EventType.SUBSCRIPTION_TRIGGERED, async (event) => {
    logger.info(`Subscription triggered: ${event.data.subscriptionId} - ${event.data.matchedContent.length} matches`);
    
    await createNotification({
      userId: event.data.userId,
      type: 'system',
      title: '订阅更新',
      content: `您的订阅有 ${event.data.matchedContent.length} 条新内容`,
      metadata: {
        subscriptionId: event.data.subscriptionId,
        matchedContent: event.data.matchedContent,
      },
    });
  });
}

function setupSyncEventHandlers(): void {
  eventBus.subscribe<SyncStartedEvent>(EventType.SYNC_STARTED, async (event) => {
    logger.info(`Sync started: ${event.data.syncType}`);
  });

  eventBus.subscribe<SyncCompletedEvent>(EventType.SYNC_COMPLETED, async (event) => {
    logger.info(`Sync completed: ${event.data.syncType} - ${event.data.syncedCount} items`);
  });

  eventBus.subscribe<SyncFailedEvent>(EventType.SYNC_FAILED, async (event) => {
    logger.error(`Sync failed: ${event.data.syncType} - ${event.data.error}`);
    
    await createNotification({
      userId: 'admin',
      type: 'system',
      title: '同步失败',
      content: `${event.data.syncType} 同步失败: ${event.data.error}`,
      metadata: {
        syncType: event.data.syncType,
        source: event.data.source,
        error: event.data.error,
      },
    });
  });
}

function setupSystemEventHandlers(): void {
  eventBus.subscribe<SystemErrorEvent>(EventType.SYSTEM_ERROR, async (event) => {
    logger.error(`System error: ${event.data.errorType}`, {
      errorMessage: event.data.errorMessage,
      stackTrace: event.data.stackTrace,
      context: event.data.context,
    });
    
    incrementErrorCounter(event.data.errorType, 'critical');
    
    await createNotification({
      userId: 'admin',
      type: 'system',
      title: '系统错误',
      content: event.data.errorMessage,
      metadata: {
        errorType: event.data.errorType,
        context: event.data.context,
      },
    });
  });
}

export function shutdownEventHandlers(): void {
  logger.info('Shutting down event handlers...');
  eventBus.removeAllListeners();
  logger.info('Event handlers shut down');
}
