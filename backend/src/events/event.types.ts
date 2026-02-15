/**
 * 事件定义
 * 定义系统中所有的事件类型
 */

export enum EventType {
  // 用户事件
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_LEVEL_UP = 'user.level_up',
  USER_VIP_ACTIVATED = 'user.vip_activated',

  // 内容事件
  NEWS_CREATED = 'news.created',
  NEWS_UPDATED = 'news.updated',
  NEWS_DELETED = 'news.deleted',
  NEWS_VIEWED = 'news.viewed',
  NEWS_SYNCED = 'news.synced',

  PAPER_CREATED = 'paper.created',
  PAPER_UPDATED = 'paper.updated',
  PAPER_DELETED = 'paper.deleted',
  PAPER_VIEWED = 'paper.viewed',

  VIDEO_CREATED = 'video.created',
  VIDEO_UPDATED = 'video.updated',
  VIDEO_DELETED = 'video.deleted',
  VIDEO_VIEWED = 'video.viewed',

  REPO_CREATED = 'repo.created',
  REPO_UPDATED = 'repo.updated',
  REPO_DELETED = 'repo.deleted',
  REPO_VIEWED = 'repo.viewed',

  // 社区事件
  POST_CREATED = 'post.created',
  POST_UPDATED = 'post.updated',
  POST_DELETED = 'post.deleted',
  POST_LIKED = 'post.liked',
  POST_UNLIKED = 'post.unliked',

  COMMENT_CREATED = 'comment.created',
  COMMENT_UPDATED = 'comment.updated',
  COMMENT_DELETED = 'comment.deleted',
  COMMENT_LIKED = 'comment.liked',

  // 订阅事件
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_DELETED = 'subscription.deleted',
  SUBSCRIPTION_TRIGGERED = 'subscription.triggered',

  // 通知事件
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_DELETED = 'notification.deleted',

  // 同步事件
  SYNC_STARTED = 'sync.started',
  SYNC_COMPLETED = 'sync.completed',
  SYNC_FAILED = 'sync.failed',

  // 系统事件
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_INFO = 'system.info',
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  data: any;
  metadata?: {
    userId?: string;
    requestId?: string;
    source?: string;
  };
}

export interface UserCreatedEvent extends BaseEvent {
  type: EventType.USER_CREATED;
  data: {
    userId: string;
    username: string;
    email?: string;
    registrationType: 'github' | 'email';
  };
}

export interface UserLoginEvent extends BaseEvent {
  type: EventType.USER_LOGIN;
  data: {
    userId: string;
    loginMethod: 'github' | 'email';
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface NewsCreatedEvent extends BaseEvent {
  type: EventType.NEWS_CREATED;
  data: {
    newsId: string;
    title: string;
    category: string;
    tags: string[];
    source: string;
  };
}

export interface NewsViewedEvent extends BaseEvent {
  type: EventType.NEWS_VIEWED;
  data: {
    newsId: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface NewsSyncedEvent extends BaseEvent {
  type: EventType.NEWS_SYNCED;
  data: {
    source: string;
    syncedCount: number;
    failedCount: number;
    duration: number;
  };
}

export interface PostCreatedEvent extends BaseEvent {
  type: EventType.POST_CREATED;
  data: {
    postId: string;
    userId: string;
    contentType: string;
    contentId: string;
  };
}

export interface CommentCreatedEvent extends BaseEvent {
  type: EventType.COMMENT_CREATED;
  data: {
    commentId: string;
    postId: string;
    userId: string;
    content: string;
  };
}

export interface SubscriptionTriggeredEvent extends BaseEvent {
  type: EventType.SUBSCRIPTION_TRIGGERED;
  data: {
    subscriptionId: string;
    userId: string;
    matchedContent: {
      type: string;
      id: string;
      title: string;
    }[];
  };
}

export interface NotificationCreatedEvent extends BaseEvent {
  type: EventType.NOTIFICATION_CREATED;
  data: {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
    content?: string;
  };
}

export interface SyncStartedEvent extends BaseEvent {
  type: EventType.SYNC_STARTED;
  data: {
    syncType: string;
    source?: string;
  };
}

export interface SyncCompletedEvent extends BaseEvent {
  type: EventType.SYNC_COMPLETED;
  data: {
    syncType: string;
    source?: string;
    syncedCount: number;
    duration: number;
  };
}

export interface SyncFailedEvent extends BaseEvent {
  type: EventType.SYNC_FAILED;
  data: {
    syncType: string;
    source?: string;
    error: string;
    duration: number;
  };
}

export interface SystemErrorEvent extends BaseEvent {
  type: EventType.SYSTEM_ERROR;
  data: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    context?: Record<string, any>;
  };
}

export type Event = 
  | UserCreatedEvent
  | UserLoginEvent
  | NewsCreatedEvent
  | NewsViewedEvent
  | NewsSyncedEvent
  | PostCreatedEvent
  | CommentCreatedEvent
  | SubscriptionTriggeredEvent
  | NotificationCreatedEvent
  | SyncStartedEvent
  | SyncCompletedEvent
  | SyncFailedEvent
  | SystemErrorEvent;
