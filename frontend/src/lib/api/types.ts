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
  isActive?: boolean;
  role?: 'user' | 'admin' | 'super_admin';
  tags?: string;
  followersCount?: number;
  followingCount?: number;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  token: string;
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
  repoId: number;
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
  createdDate?: string; // 数据库字段名为 createdDate
  updatedDate?: string;
}

// Hugging Face 模型相关类型
export interface HuggingFaceModel {
  id: string;
  fullName: string;
  description?: string;
  task?: string;
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

// 首页运营模块类型
export interface HomeModule {
  id: string;
  name: string;
  title: string;
  description?: string;
  config?: string; // JSON格式配置
  content?: string; // 兼容旧字段名
  moduleType?: 'banner' | 'announcement' | 'promotion' | 'custom';
  position?: 'top' | 'middle' | 'bottom' | 'sidebar';
  sortOrder?: number;
  order?: number; // 兼容字段名
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 岗位相关类型
export interface Job {
  id: string;
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
  tags?: string[];
  status: 'open' | 'closed';
  viewCount: number;
  favoriteCount: number;
  applyCount: number;
  applyUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 新闻相关类型
export interface News {
  id: string;
  platform: string;
  title: string;
  url: string;
  description?: string;
  score?: string;
  publishedDate?: string;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  tags?: string[];
}

// 信息流内容类型
export type FeedItemType = 'paper' | 'video' | 'repo' | 'job' | 'huggingface' | 'news';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  data: Paper | Video | GithubRepo | Job | HuggingFaceModel | News;
  createdAt: string;
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
