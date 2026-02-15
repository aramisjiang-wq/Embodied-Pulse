/**
 * Prometheus指标中间件
 * 收集HTTP请求指标
 */

import { Request, Response, NextFunction } from 'express';
import {
  incrementHttpRequestCounter,
  observeHttpRequestDuration,
} from '../services/metrics.service';

const startTimestamps = new WeakMap<Request, number>();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTimestamp = Date.now();
  startTimestamps.set(req, startTimestamp);

  res.on('finish', () => {
    const duration = (Date.now() - startTimestamp) / 1000; // 转换为秒

    incrementHttpRequestCounter(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    );

    observeHttpRequestDuration(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
  });

  next();
}
