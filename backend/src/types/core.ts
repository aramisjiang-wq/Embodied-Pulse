/**
 * 核心类型定义
 * 用于消除核心模块中的 any 类型
 */

import { Prisma } from '../../node_modules/.prisma/client-user';

// 视频相关类型
export interface VideoWhereInput {
  platform?: string;
  uploaderId?: string;
  tags?: { has: string };
  OR?: Array<{
    title?: { contains: string };
    description?: { contains: string };
  }>;
}

export interface VideoOrderByInput {
  publishedDate?: 'asc' | 'desc';
  viewCount?: 'asc' | 'desc';
  playCount?: 'asc' | 'desc';
  likeCount?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
}

export interface VideoCreateInput {
  platform: string;
  videoId: string;
  bvid?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  duration?: number;
  uploader?: string;
  uploaderId?: string;
  publishedDate?: Date;
  playCount?: number;
  likeCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  tags?: string;
  metadata?: string;
}

// Bilibili API 响应类型
export interface BilibiliVideoItem {
  aid: number;
  bvid: string;
  title: string;
  description: string;
  pic: string;
  duration: number;
  owner: {
    mid: number;
    name: string;
    face: string;
  };
  pubdate: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
  tag: string;
}

export interface BilibiliVideoDetail {
  aid: number;
  bvid: string;
  title: string;
  pic: string;
  desc: string;
  duration: number;
  owner: {
    mid: number;
    name: string;
    face: string;
  };
  pubdate: number;
  stat: {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
  };
  tag: string;
}

export interface BilibiliUploaderResponse {
  data: {
    list: {
      vlist: BilibiliVideoItem[];
      pn: number;
      ps: number;
      count: number;
    };
  };
}

// 用户相关类型
export interface UserUpdateData {
  username?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  level?: number;
  points?: number;
  isVip?: boolean;
  isActive?: boolean;
  lastLoginAt?: Date;
  tags?: string;
}

export interface UserCreateData {
  id?: string;
  userNumber: string;
  username: string;
  email?: string;
  passwordHash?: string;
  avatarUrl?: string;
  bio?: string;
  githubId?: string;
  level?: number;
  points?: number;
  isVip?: boolean;
  isActive?: boolean;
  tags?: string;
}

// 错误处理类型
export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ServiceError };

// 分页类型
export interface PaginationParams {
  skip?: number;
  take?: number;
  page?: number;
  size?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// 订阅相关类型
export interface SubscriptionMatchResult {
  matched: boolean;
  reason?: string;
}

// 数据源类型
export interface DataSourceConfig {
  name: string;
  displayName: string;
  apiBaseUrl: string;
  enabled: boolean;
  tags?: string[];
  config: Record<string, unknown>;
}

export interface DataSourceLog {
  dataSourceId: string;
  type: 'sync' | 'health_check' | 'manual';
  status: 'success' | 'failed' | 'partial';
  requestUrl?: string;
  requestMethod?: string;
  requestBody?: string;
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  duration?: number;
  syncedCount?: number;
  errorCount?: number;
}

// 内容类型枚举
export type ContentType = 'paper' | 'video' | 'repo' | 'huggingface' | 'job';

// 用户行为类型
export type ActionType = 'view' | 'like' | 'share' | 'comment' | 'favorite';

// Prisma WhereInput 类型别名
export type PrismaVideoWhereInput = Prisma.VideoWhereInput;
export type PrismaUserWhereInput = Prisma.UserWhereInput;
export type PrismaPaperWhereInput = Prisma.PaperWhereInput;
export type PrismaGithubRepoWhereInput = Prisma.GithubRepoWhereInput;
