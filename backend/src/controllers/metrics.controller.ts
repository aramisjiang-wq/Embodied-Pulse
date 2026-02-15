/**
 * 监控指标控制器
 * 提供Prometheus指标端点
 */

import { Request, Response } from 'express';
import { register } from '../services/metrics.service';

export async function getMetrics(req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end('Failed to collect metrics');
  }
}

export async function getHealth(req: Request, res: Response): Promise<void> {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
}

export async function getReady(req: Request, res: Response): Promise<void> {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}
