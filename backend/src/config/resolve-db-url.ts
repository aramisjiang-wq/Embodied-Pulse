/**
 * 数据库连接 URL 解析（用户库/管理库共用）
 *
 * 策略：
 * - 生产环境：必须通过环境变量指定 URL（绝对路径或 postgresql://），不解析相对路径，避免 __dirname 在 dist 下指向错误。
 * - 开发环境：未设置 env 时，将默认相对路径解析为「可预测的绝对路径」，避免因启动目录（项目根 vs backend）连错库。
 * - 已设置 env：一律原样使用，不解析（上线用绝对路径或远程 URL，本地也可覆盖）。
 */

import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

/**
 * 解析默认 SQLite 文件 URL（仅用于开发且未设置 env 时）
 * 始终优先使用基于 __dirname 的路径（backend 目录），保证用户端注册/登录与管理端「用户管理」看到同一用户库，不受启动目录影响。
 */
function resolveDefaultSqliteUrl(
  defaultRelativePath: string,
  envName: string,
  __dirnameOfCaller: string
): string {
  const fileName = defaultRelativePath.replace(/^file:\.?\//, '').replace(/^\.\//, '');
  const candidateFromDirname = path.resolve(__dirnameOfCaller, '../..', fileName);
  const candidateFromCwd = path.join(process.cwd(), fileName);

  if (fs.existsSync(candidateFromDirname)) {
    const url = `file:${path.resolve(candidateFromDirname)}`;
    logger.info(`[${envName}] Default DB resolved (backend dir): ${url}`);
    return url;
  }
  if (fs.existsSync(candidateFromCwd)) {
    const url = `file:${path.resolve(candidateFromCwd)}`;
    logger.info(`[${envName}] Default DB resolved (cwd fallback): ${url}`);
    return url;
  }
  // 文件尚不存在时用 dirname 方案，保证与 backend 目录一致
  const url = `file:${candidateFromDirname}`;
  logger.warn(`[${envName}] Default DB file not found, will use: ${url}`);
  return url;
}

export interface ResolveDbUrlOptions {
  /** 环境变量名，如 USER_DATABASE_URL */
  envKey: string;
  /** 未设置 env 时的默认值，如 file:./prisma/dev-user.db */
  defaultUrl: string;
  /** 调用方 __dirname，用于解析默认路径（传 config 目录的 __dirname） */
  dirnameOfCaller: string;
}

/**
 * 将相对路径的 file: URL 转为基于 backend 目录的绝对路径
 * 避免「从项目根启动后端」与「从 backend 跑脚本」连到不同文件，导致管理端用户列表与注册库不一致
 */
function ensureAbsoluteFileUrl(
  url: string,
  envName: string,
  dirnameOfCaller: string
): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('file:')) return trimmed;
  const pathPart = trimmed.replace(/^file:/, '');
  // 已是绝对路径（Unix /xxx 或 Windows C:\xxx）
  if (pathPart.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(pathPart)) return trimmed;
  const fileName = pathPart.replace(/^\.\//, '');
  const absolutePath = path.resolve(dirnameOfCaller, '../..', fileName);
  const resolved = `file:${absolutePath}`;
  logger.info(`[${envName}] 相对路径已解析为绝对路径: ${resolved}`);
  return resolved;
}

/**
 * 返回最终用于 Prisma 的 database URL
 * - 生产且未设置 env：抛错，要求必须配置
 * - 开发且未设置 env：解析默认相对路径为绝对路径
 * - 已设置 env：若为相对 file: URL，也解析为绝对路径，保证与 backend 目录一致
 */
export function resolveDbUrl(options: ResolveDbUrlOptions): string {
  const { envKey, defaultUrl, dirnameOfCaller } = options;
  const envValue = process.env[envKey];
  const isProduction = process.env.NODE_ENV === 'production';

  if (envValue && envValue.trim() !== '') {
    const url = envValue.trim();
    // 环境变量里写了相对路径时，统一解析为基于 backend 的绝对路径，避免连错库
    if (url.startsWith('file:') && !url.startsWith('file:/') && !/^file:[a-zA-Z]:[\\/]/.test(url)) {
      return ensureAbsoluteFileUrl(url, envKey, dirnameOfCaller);
    }
    return url;
  }

  if (isProduction) {
    logger.error(`${envKey} is required in production. Set it to an absolute path (e.g. file:/var/data/user.db) or a DB URL (e.g. postgresql://...).`);
    throw new Error(`${envKey} must be set when NODE_ENV=production`);
  }

  if (!defaultUrl.startsWith('file:') || defaultUrl.startsWith('file:/')) {
    return defaultUrl;
  }

  return resolveDefaultSqliteUrl(defaultUrl, envKey, dirnameOfCaller);
}

/**
 * 多环境变量优先的解析（如 database.ts 使用 DATABASE_URL || USER_DATABASE_URL）
 * 生产环境至少需设置其中一个；开发环境未设置时解析默认路径。
 */
export function resolveDbUrlMulti(options: {
  envKeys: string[];
  defaultUrl: string;
  dirnameOfCaller: string;
}): string {
  const { envKeys, defaultUrl, dirnameOfCaller } = options;
  const isProduction = process.env.NODE_ENV === 'production';
  const firstSet = envKeys.find((k) => process.env[k]?.trim());
  if (firstSet && process.env[firstSet]) {
    const url = process.env[firstSet]!.trim();
    if (url.startsWith('file:') && !url.startsWith('file:/') && !/^file:[a-zA-Z]:[\\/]/.test(url)) {
      return ensureAbsoluteFileUrl(url, firstSet, dirnameOfCaller);
    }
    return url;
  }
  if (isProduction) {
    logger.error(`One of [${envKeys.join(', ')}] is required in production. Use an absolute path or DB URL.`);
    throw new Error(`One of [${envKeys.join(', ')}] must be set when NODE_ENV=production`);
  }
  if (!defaultUrl.startsWith('file:') || defaultUrl.startsWith('file:/')) {
    return defaultUrl;
  }
  return resolveDefaultSqliteUrl(defaultUrl, envKeys[0], dirnameOfCaller);
}
