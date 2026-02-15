// API 响应类型定义

export interface ApiResponse<T = any> {
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

export interface ErrorResponse {
  code: string;
  message: string;
  stack?: string;
}
