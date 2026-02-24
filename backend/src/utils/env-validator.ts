/**
 * 环境变量验证
 * 确保生产环境必需的配置项已设置
 */

import { logger } from './logger';

interface RequiredEnvVar {
  name: string;
  description: string;
  sensitive?: boolean;
}

const REQUIRED_IN_PRODUCTION: RequiredEnvVar[] = [
  { name: 'JWT_SECRET', description: 'JWT 访问令牌签名密钥', sensitive: true },
  { name: 'JWT_REFRESH_SECRET', description: 'JWT 刷新令牌签名密钥', sensitive: true },
  { name: 'DATABASE_URL', description: '用户数据库连接字符串', sensitive: true },
  { name: 'ADMIN_DATABASE_URL', description: '管理数据库连接字符串', sensitive: true },
  { name: 'CORS_ORIGINS', description: '允许的跨域来源列表' },
];

const RECOMMENDED_IN_PRODUCTION: RequiredEnvVar[] = [
  { name: 'REDIS_URL', description: 'Redis 连接字符串', sensitive: true },
  { name: 'RATE_LIMIT_MAX', description: '请求速率限制最大值' },
  { name: 'RATE_LIMIT_WINDOW_MS', description: '请求速率限制时间窗口' },
];

export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    for (const envVar of REQUIRED_IN_PRODUCTION) {
      const value = process.env[envVar.name];
      if (!value) {
        errors.push(`缺少必需的环境变量: ${envVar.name} (${envVar.description})`);
      } else if (envVar.name.includes('SECRET') && value.length < 32) {
        warnings.push(`${envVar.name} 长度小于推荐的 32 字符`);
      } else if (envVar.name.includes('SECRET') && (value.includes('secret') || value.includes('password') || value.includes('123456'))) {
        warnings.push(`${envVar.name} 包含弱密钥模式，请使用更强的密钥`);
      }
    }

    for (const envVar of RECOMMENDED_IN_PRODUCTION) {
      const value = process.env[envVar.name];
      if (!value) {
        warnings.push(`建议设置环境变量: ${envVar.name} (${envVar.description})`);
      }
    }
  }

  if (errors.length > 0) {
    logger.error('环境变量验证失败:');
    errors.forEach(err => logger.error(`  - ${err}`));
  }

  if (warnings.length > 0) {
    logger.warn('环境变量警告:');
    warnings.forEach(warn => logger.warn(`  - ${warn}`));
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  const value = process.env[name];
  if (!value && defaultValue === undefined && process.env.NODE_ENV === 'production') {
    logger.warn(`环境变量 ${name} 未设置且无默认值`);
  }
  return value ?? defaultValue;
}

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`必需的环境变量 ${name} 未设置`);
  }
  return value;
}
