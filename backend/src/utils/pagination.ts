/**
 * 分页工具函数
 */

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginationResult {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 解析分页参数
 */
export function parsePaginationParams(params: PaginationParams): { skip: number; take: number; page: number; size: number } {
  const page = Math.max(1, Number(params.page) || 1);
  const size = Math.min(100, Math.max(1, Number(params.size) || 20));
  const skip = (page - 1) * size;
  const take = size;

  return { skip, take, page, size };
}

/**
 * 构建分页响应
 */
export function buildPaginationResponse(page: number, size: number, total: number): PaginationResult {
  const totalPages = Math.ceil(total / size);
  return {
    page,
    size,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
