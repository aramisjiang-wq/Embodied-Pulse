// API 响应类型定义

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// 用户相关类型
export interface User {
  id: string;
  userNumber?: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  bio?: string;
  githubId?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  location?: string;
  skills?: string;
  interests?: string;
  level: number;
  points: number;
  isVip: boolean;
  vipPermissions?: string[];
  isActive?: boolean;
  role?: 'user' | 'admin' | 'super_admin';
  tags?: string;
  /** 身份：university=高校, enterprise=企业, personal=个人爱好, other=其他 */
  identityType?: string | null;
  /** 组织名称，填写后可从 L1 升级到 L3（高校/企业可填，个人可不填） */
  organizationName?: string | null;
  /** 地域：mainland_china=中国大陆, hongkong_macao_taiwan=中国港澳台, overseas=海外 */
  region?: string | null;
  followersCount?: number;
  followingCount?: number;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// 论文相关类型
export interface Paper {
  id: string;
  arxivId?: string;
  title: string;
  authors: string[];
  abstract?: string;
  pdfUrl?: string;
  publishedDate?: string;
  citationCount: number;
  venue?: string;
  categories: string[];
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  updatedAt?: string;
  thumbnailUrl?: string;
}

// 视频相关类型
export interface Video {
  id: string;
  platform: 'bilibili' | 'youtube';
  videoId: string;
  bvid?: string; // Bilibili视频ID
  title: string;
  description?: string;
  coverUrl?: string;
  duration?: number;
  uploader?: string;
  uploaderId?: string;
  publishedDate?: string;
  playCount: number; // 播放次数
  likeCount: number;
  viewCount: number; // 浏览次数（与playCount可能不同）
  favoriteCount: number;
  tags: string[]; // 后端JSON.stringify存储，前端解析为数组
}

// GitHub项目相关类型
export interface GithubRepo {
  id: string;
  repoId: string; // 改为string类型，支持大数值ID
  fullName: string;
  name: string;
  description?: string;
  owner?: string;
  language?: string;
  starsCount: number;
  forksCount: number;
  issuesCount: number;
  topics: string[]; // 后端JSON.stringify存储，前端解析为数组
  viewCount: number;
  favoriteCount: number;
  htmlUrl?: string;
  createdDate?: string; // GitHub 仓库在 GitHub 上的创建时间
  updatedDate?: string; // GitHub 仓库在 GitHub 上的最后更新时间
  createdAt?: string;  // 该仓库被收录到本平台的时间
  category?: string;  // 资源清单分类 1.1～6.7
}

// Hugging Face 模型相关类型
export interface HuggingFaceModel {
  id: string;
  hfId?: string;
  fullName: string;
  description?: string;
  task?: string;
  contentType?: 'model' | 'dataset' | 'space'; // 模型 | 数据集 | 空间
  license?: string;
  author?: string;
  tags?: string[];
  downloads: number;
  likes: number;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
}

// Banner相关类型
export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 公告相关类型
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 首页运营模块配置类型（存储在 config JSON 中）
export interface HomeModuleConfig {
  moduleType?: 'banner' | 'announcement' | 'promotion' | 'custom';
  position?: 'top' | 'middle' | 'bottom' | 'sidebar';
  startDate?: string;
  endDate?: string;
  // Banner 类型字段
  imageUrl?: string;
  linkUrl?: string;
  // 公告类型字段
  content?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  // 推广类型字段
  buttonText?: string;
  gradient?: string;
  backgroundColor?: string;
  textColor?: string;
  // 自定义类型字段
  html?: string;
  css?: string;
  js?: string;
}

// 首页运营模块类型
export interface HomeModule {
  id: string;
  name: string;
  title: string;
  description?: string;
  config?: string; // JSON格式配置，解析后为 HomeModuleConfig
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 岗位相关类型
export interface Job {
  id: string;
  userId?: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
  education?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  tags?: string | string[];
  status: 'open' | 'closed';
  viewCount: number;
  favoriteCount: number;
  applyCount: number;
  applyUrl?: string;
  expiresAt?: string;
  isExpired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobSeekingPost {
  id: string;
  userId: string;
  name: string;
  targetPosition: string;
  expectedLocation?: string;
  expectedSalary?: string;
  skills?: string;
  introduction?: string;
  avatarUrl?: string;
  viewCount: number;
  favoriteCount: number;
  expiresAt?: string;
  isExpired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 信息流内容类型
export type FeedItemType = 'paper' | 'video' | 'repo' | 'job' | 'huggingface' | 'news';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  data: Paper | Video | GithubRepo | Job | HuggingFaceModel | DailyNews;
  createdAt: string;
}

// 每日新闻类型
export interface DailyNews {
  id: string;
  date: string;
  title: string;
  content: string;
  isPinned: boolean;
  pinnedAt?: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyNewsListResponse {
  items: DailyNews[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface CreateDailyNewsRequest {
  date: string;
  title: string;
  content: string;
  isPinned?: boolean;
}

export interface UpdateDailyNewsRequest {
  date?: string;
  title?: string;
  content?: string;
  isPinned?: boolean;
}

// 帖子相关类型
export interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    level: number;
    points?: number;
  };
  contentType: string;
  contentId?: string;
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isFeatured: boolean;
  isTop: boolean;
  createdAt: string;
}

// 评论相关类型
export interface Comment {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    level: number;
  };
  postId: string;
  parentId?: string;
  content: string;
  likeCount: number;
  createdAt: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Favorite {
  id: string;
  userId: string;
  contentType: 'paper' | 'video' | 'repo' | 'job' | 'huggingface';
  contentId: string;
  createdAt: string;
}

export interface PointRecord {
  id: string;
  userId: string;
  type: string;
  points: number;
  description?: string;
  createdAt: string;
}
