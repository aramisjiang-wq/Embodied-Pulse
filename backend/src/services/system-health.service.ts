import { PrismaClient } from '../../node_modules/.prisma/client-admin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ADMIN_DATABASE_URL || 'file:./prisma/dev-admin.db',
    },
  },
});

export interface SystemHealthItem {
  id: string;
  component: string;
  status: string;
  responseTime?: number;
  errorMessage?: string;
  metadata?: string;
  checkedAt: Date;
}

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export class SystemHealthService {
  static async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        component: 'database',
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        component: 'database',
        status: 'down',
        responseTime: Date.now() - start,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async checkRedis(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const { RedisService } = await import('./redis.service');
      const isHealthy = await RedisService.ping();
      return {
        component: 'redis',
        status: isHealthy ? 'healthy' : 'down',
        responseTime: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        component: 'redis',
        status: 'down',
        responseTime: Date.now() - start,
        errorMessage: error instanceof Error ? error.message : 'Redis not configured',
      };
    }
  }

  static async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      const { stdout } = await execAsync('df -h / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      const usedPercent = parseInt(parts[4]?.replace('%', '') || '0');
      
      return {
        component: 'disk',
        status: usedPercent > 90 ? 'degraded' : 'healthy',
        metadata: {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usedPercent,
        },
      };
    } catch (error: unknown) {
      return {
        component: 'disk',
        status: 'down',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async checkMemory(): Promise<HealthCheckResult> {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
      
      return {
        component: 'memory',
        status: usagePercent > 85 ? 'degraded' : 'healthy',
        metadata: {
          heapUsedMB,
          heapTotalMB,
          usagePercent,
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
        },
      };
    } catch (error: unknown) {
      return {
        component: 'memory',
        status: 'down',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async runAllChecks(): Promise<HealthCheckResult[]> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);
    
    await this.saveHealthChecks(checks);
    
    return checks;
  }

  static async saveHealthChecks(checks: HealthCheckResult[]): Promise<void> {
    for (const check of checks) {
      await prisma.system_health.create({
        data: {
          component: check.component,
          status: check.status,
          response_time: check.responseTime,
          error_message: check.errorMessage,
          metadata: check.metadata ? JSON.stringify(check.metadata) : null,
        },
      });
    }
  }

  static async getHealthHistory(params: {
    component?: string;
    hours?: number;
    limit?: number;
  }): Promise<SystemHealthItem[]> {
    const { component, hours = 24, limit = 100 } = params;
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const where: any = {
      checked_at: { gte: since },
    };
    if (component) where.component = component;

    const items = await prisma.system_health.findMany({
      where,
      orderBy: { checked_at: 'desc' },
      take: limit,
    });

    return items.map(item => ({
      id: item.id,
      component: item.component,
      status: item.status,
      responseTime: item.response_time || undefined,
      errorMessage: item.error_message || undefined,
      metadata: item.metadata || undefined,
      checkedAt: item.checked_at,
    }));
  }

  static async getLatestHealth(): Promise<Record<string, SystemHealthItem>> {
    const components = ['database', 'redis', 'disk', 'memory'];
    const result: Record<string, SystemHealthItem> = {};

    for (const component of components) {
      const latest = await prisma.system_health.findFirst({
        where: { component },
        orderBy: { checked_at: 'desc' },
      });
      
      if (latest) {
        result[component] = {
          id: latest.id,
          component: latest.component,
          status: latest.status,
          responseTime: latest.response_time || undefined,
          errorMessage: latest.error_message || undefined,
          metadata: latest.metadata || undefined,
          checkedAt: latest.checked_at,
        };
      }
    }

    return result;
  }
}
