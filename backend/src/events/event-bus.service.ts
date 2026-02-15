/**
 * 事件总线服务
 * 提供事件的发布和订阅功能
 */

import { EventEmitter } from 'events';
import { Event, EventType } from './event.types';
import { logger } from '../utils/logger';

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish<T extends Event>(event: T): boolean {
    try {
      logger.debug(`Publishing event: ${event.type}`, {
        eventId: event.id,
        timestamp: event.timestamp,
      });

      this.emit(event.type, event);
      return true;
    } catch (error) {
      logger.error(`Failed to publish event ${event.type}:`, error);
      return false;
    }
  }

  subscribe<T extends Event>(
    eventType: EventType,
    handler: (event: T) => void | Promise<void>
  ): () => void {
    const wrappedHandler = async (event: T) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}:`, error);
      }
    };

    this.on(eventType, wrappedHandler);

    return () => {
      this.off(eventType, wrappedHandler);
    };
  }

  subscribeOnce<T extends Event>(
    eventType: EventType,
    handler: (event: T) => void | Promise<void>
  ): () => void {
    const wrappedHandler = async (event: T) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}:`, error);
      }
    };

    this.once(eventType, wrappedHandler);

    return () => {
      this.off(eventType, wrappedHandler);
    };
  }

  async publishAsync<T extends Event>(event: T): Promise<boolean> {
    return new Promise((resolve) => {
      const success = this.publish(event);
      resolve(success);
    });
  }

  getListenerCount(eventType: EventType): number {
    return this.listenerCount(eventType);
  }

  // @ts-ignore
  removeAllListeners(eventType?: EventType | symbol | string): void {
    if (eventType) {
      super.removeAllListeners(eventType);
    } else {
      super.removeAllListeners();
    }
  }
}

export const eventBus = EventBus.getInstance();
