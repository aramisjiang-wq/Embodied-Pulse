import prisma from '../config/database';
import { logger } from './logger';

interface QueryStats {
  query: string;
  duration: number;
  timestamp: number;
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private queryStats: QueryStats[] = [];
  private maxStatsSize = 1000;
  private slowQueryThreshold = 100; // ms

  private constructor() {}

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  async executeQuery<T>(
    queryFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      if (duration > this.slowQueryThreshold) {
        logger.warn(`[Slow Query] ${context || 'Unknown'}: ${duration}ms`);
      }

      this.recordQuery(context || 'Unknown', duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[Query Error] ${context || 'Unknown'}: ${duration}ms`, error);
      throw error;
    }
  }

  private recordQuery(query: string, duration: number): void {
    this.queryStats.push({
      query,
      duration,
      timestamp: Date.now(),
    });

    if (this.queryStats.length > this.maxStatsSize) {
      this.queryStats.shift();
    }
  }

  getStats(): {
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    recentQueries: QueryStats[];
  } {
    if (this.queryStats.length === 0) {
      return {
        totalQueries: 0,
        avgDuration: 0,
        slowQueries: 0,
        recentQueries: [],
      };
    }

    const totalDuration = this.queryStats.reduce((sum, stat) => sum + stat.duration, 0);
    const slowQueries = this.queryStats.filter(
      (stat) => stat.duration > this.slowQueryThreshold
    ).length;

    return {
      totalQueries: this.queryStats.length,
      avgDuration: Math.round(totalDuration / this.queryStats.length),
      slowQueries,
      recentQueries: this.queryStats.slice(-10),
    };
  }

  clearStats(): void {
    this.queryStats = [];
  }

  async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  async getPoolInfo(): Promise<Record<string, unknown> | null> {
    try {
      const result = await prisma.$queryRaw`SELECT name, value FROM pragma_cache_size`;
      return result as Record<string, unknown>;
    } catch (error) {
      logger.error('Failed to get pool info:', error);
      return null;
    }
  }
}

export const dbPool = DatabaseConnectionPool.getInstance();
export default dbPool;
