import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';

interface WebSocketMessage {
  type: 'notification' | 'ping' | 'pong' | 'auth';
  id?: string;
  notificationType?: string;
  title?: string;
  content?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
  token?: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private userConnections: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      ws.isAlive = true;

      const url = request.url || '';
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const token = urlParams.get('token');

      if (token) {
        this.authenticateConnection(ws, token);
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.removeConnection(ws.userId, ws);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        if (ws.userId) {
          this.removeConnection(ws.userId, ws);
        }
      });
    });

    this.startHeartbeat();

    logger.info('WebSocket server initialized on /ws');
  }

  private authenticateConnection(ws: AuthenticatedWebSocket, token: string): void {
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        ws.userId = decoded.userId;
        this.addConnection(decoded.userId, ws);
        logger.info(`WebSocket authenticated for user: ${decoded.userId}`);
      }
    } catch (error) {
      logger.warn('WebSocket authentication failed:', error);
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'auth':
        if (message.token) {
          this.authenticateConnection(ws, message.token);
        }
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  private addConnection(userId: string, ws: AuthenticatedWebSocket): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(ws);
    logger.debug(`User ${userId} connected. Total connections: ${this.userConnections.get(userId)!.size}`);
  }

  private removeConnection(userId: string, ws: AuthenticatedWebSocket): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    logger.debug(`User ${userId} disconnected`);
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    if (this.wss) {
      this.wss.on('close', () => {
        clearInterval(interval);
      });
    }
  }

  sendToUser(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    content?: string;
    metadata?: any;
    createdAt: string;
  }): boolean {
    const connections = this.userConnections.get(userId);
    if (!connections || connections.size === 0) {
      logger.debug(`No active connection for user ${userId}`);
      return false;
    }

    const message: WebSocketMessage = {
      type: 'notification',
      id: notification.id,
      notificationType: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.metadata,
      createdAt: notification.createdAt,
    };

    const messageStr = JSON.stringify(message);
    let sent = 0;

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        sent++;
      }
    });

    logger.info(`Notification sent to user ${userId} (${sent} connections)`);
    return sent > 0;
  }

  broadcastToAll(notification: {
    id: string;
    type: string;
    title: string;
    content?: string;
    metadata?: any;
    createdAt: string;
  }): void {
    if (!this.wss) return;

    const message: WebSocketMessage = {
      type: 'notification',
      id: notification.id,
      notificationType: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.metadata,
      createdAt: notification.createdAt,
    };

    const messageStr = JSON.stringify(message);
    let sent = 0;

    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        sent++;
      }
    });

    logger.info(`Broadcast notification to ${sent} connections`);
  }

  getConnectedUserCount(): number {
    return this.userConnections.size;
  }

  getTotalConnectionCount(): number {
    let total = 0;
    this.userConnections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }

  close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.userConnections.clear();
      logger.info('WebSocket server closed');
    }
  }
}

export const websocketService = new WebSocketService();
