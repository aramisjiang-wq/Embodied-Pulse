'use client';

import { useEffect, useRef, useCallback } from 'react';

export type NotificationType = 
  | 'subscription_update'
  | 'new_content'
  | 'comment_reply'
  | 'like'
  | 'favorite'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export interface WebSocketOptions {
  onNotification?: (notification: Notification) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  showMessage?: (type: 'success' | 'info' | 'warning' | 'error', content: string) => void;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const {
    onNotification,
    onConnected,
    onDisconnected,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    showMessage,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        isConnectedRef.current = true;
        onConnected?.();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as Record<string, unknown>;
          if (payload.type === 'notification') {
            const notification: Notification = {
              id: (payload.id as string) || `notif_${Date.now()}`,
              type: (payload.notificationType as NotificationType) || 'system',
              title: (payload.title as string) || '通知',
              content: (payload.content as string) || '',
              data: (payload.data as Record<string, unknown>) || undefined,
              createdAt: (payload.createdAt as string) || new Date().toISOString(),
              read: false,
            };

            onNotification?.(notification);

            const notificationMessage = getNotificationMessage(notification);
            if (notificationMessage && showMessage) {
              showMessage(notificationMessage.type, notificationMessage.content);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        isConnectedRef.current = false;
        onDisconnected?.();

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      onError?.(error as Error);
    }
  }, [onNotification, onConnected, onDisconnected, onError, autoReconnect, reconnectInterval, showMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && isConnectedRef.current) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    send,
    disconnect,
  };
}

function getNotificationMessage(notification: Notification): { type: 'success' | 'info' | 'warning' | 'error', content: string } | null {
  switch (notification.type) {
    case 'subscription_update':
      return {
        type: 'success',
        content: `订阅更新：${notification.content}`,
      };
    case 'new_content':
      return {
        type: 'info',
        content: `新内容：${notification.content}`,
      };
    case 'comment_reply':
      return {
        type: 'info',
        content: `评论回复：${notification.content}`,
      };
    case 'like':
      return {
        type: 'success',
        content: `收到点赞：${notification.content}`,
      };
    case 'favorite':
      return {
        type: 'success',
        content: `被收藏：${notification.content}`,
      };
    case 'system':
      return {
        type: 'warning',
        content: `系统通知：${notification.content}`,
      };
    default:
      return null;
  }
}
