/**
 * Prometheus指标收集服务
 * 提供应用性能监控指标
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

// 默认指标（CPU、内存等）
collectDefaultMetrics({ register });

// HTTP请求计数器
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP请求持续时间直方图
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// 数据库查询计数器
export const dbQueryCounter = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
  registers: [register],
});

// 数据库查询持续时间直方图
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Redis操作计数器
export const redisOperationCounter = new Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// Redis操作持续时间直方图
export const redisOperationDuration = new Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register],
});

// 外部API调用计数器
export const externalApiCallCounter = new Counter({
  name: 'external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['service', 'endpoint', 'status'],
  registers: [register],
});

// 外部API调用持续时间直方图
export const externalApiCallDuration = new Histogram({
  name: 'external_api_call_duration_seconds',
  help: 'Duration of external API calls in seconds',
  labelNames: ['service', 'endpoint'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// 新闻同步计数器
export const newsSyncCounter = new Counter({
  name: 'news_sync_total',
  help: 'Total number of news sync operations',
  labelNames: ['source', 'status'],
  registers: [register],
});

// 新闻同步持续时间直方图
export const newsSyncDuration = new Histogram({
  name: 'news_sync_duration_seconds',
  help: 'Duration of news sync operations in seconds',
  labelNames: ['source'],
  buckets: [10, 30, 60, 120, 300, 600],
  registers: [register],
});

// 用户活跃度仪表盘
export const activeUsersGauge = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [register],
});

// 数据库连接池仪表盘
export const dbConnectionPoolGauge = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['database'],
  registers: [register],
});

// Redis缓存命中率仪表盘
export const redisCacheHitRateGauge = new Gauge({
  name: 'redis_cache_hit_rate',
  help: 'Redis cache hit rate percentage',
  registers: [register],
});

// 新闻总数仪表盘
export const totalNewsGauge = new Gauge({
  name: 'total_news_count',
  help: 'Total number of news articles',
  registers: [register],
});

// 论文总数仪表盘
export const totalPapersGauge = new Gauge({
  name: 'total_papers_count',
  help: 'Total number of papers',
  registers: [register],
});

// 视频总数仪表盘
export const totalVideosGauge = new Gauge({
  name: 'total_videos_count',
  help: 'Total number of videos',
  registers: [register],
});

// GitHub仓库总数仪表盘
export const totalReposGauge = new Gauge({
  name: 'total_repos_count',
  help: 'Total number of GitHub repositories',
  registers: [register],
});

// 错误计数器
export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

// 定时任务执行计数器
export const scheduledTaskCounter = new Counter({
  name: 'scheduled_task_executions_total',
  help: 'Total number of scheduled task executions',
  labelNames: ['task', 'status'],
  registers: [register],
});

// 定时任务执行持续时间直方图
export const scheduledTaskDuration = new Histogram({
  name: 'scheduled_task_duration_seconds',
  help: 'Duration of scheduled task executions in seconds',
  labelNames: ['task'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register],
});

export function incrementHttpRequestCounter(method: string, route: string, statusCode: number): void {
  httpRequestCounter.inc({ method, route, status_code: statusCode.toString() });
}

export function observeHttpRequestDuration(method: string, route: string, statusCode: number, duration: number): void {
  httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
}

export function incrementDbQueryCounter(operation: string, table: string): void {
  dbQueryCounter.inc({ operation, table });
}

export function observeDbQueryDuration(operation: string, table: string, duration: number): void {
  dbQueryDuration.observe({ operation, table }, duration);
}

export function incrementRedisOperationCounter(operation: string, status: string): void {
  redisOperationCounter.inc({ operation, status });
}

export function observeRedisOperationDuration(operation: string, duration: number): void {
  redisOperationDuration.observe({ operation }, duration);
}

export function incrementExternalApiCallCounter(service: string, endpoint: string, status: string): void {
  externalApiCallCounter.inc({ service, endpoint, status });
}

export function observeExternalApiCallDuration(service: string, endpoint: string, duration: number): void {
  externalApiCallDuration.observe({ service, endpoint }, duration);
}

export function incrementNewsSyncCounter(source: string, status: string): void {
  newsSyncCounter.inc({ source, status });
}

export function observeNewsSyncDuration(source: string, duration: number): void {
  newsSyncDuration.observe({ source }, duration);
}

export function setActiveUsers(count: number): void {
  activeUsersGauge.set(count);
}

export function setDbConnectionPoolSize(database: string, size: number): void {
  dbConnectionPoolGauge.set({ database }, size);
}

export function setRedisCacheHitRate(rate: number): void {
  redisCacheHitRateGauge.set(rate);
}

export function setTotalNewsCount(count: number): void {
  totalNewsGauge.set(count);
}

export function setTotalPapersCount(count: number): void {
  totalPapersGauge.set(count);
}

export function setTotalVideosCount(count: number): void {
  totalVideosGauge.set(count);
}

export function setTotalReposCount(count: number): void {
  totalReposGauge.set(count);
}

export function incrementErrorCounter(type: string, severity: string): void {
  errorCounter.inc({ type, severity });
}

export function incrementScheduledTaskCounter(task: string, status: string): void {
  scheduledTaskCounter.inc({ task, status });
}

export function observeScheduledTaskDuration(task: string, duration: number): void {
  scheduledTaskDuration.observe({ task }, duration);
}

export { register };
