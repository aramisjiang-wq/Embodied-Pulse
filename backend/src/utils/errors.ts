/**
 * 自定义错误类
 */

export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

/**
 * 常用错误
 */
export const ErrorCodes = {
  // 认证相关
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '未授权', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: '无权限', status: 403 },
  TOKEN_EXPIRED: { code: 'TOKEN_EXPIRED', message: 'Token已过期', status: 401 },
  
  // 资源相关
  NOT_FOUND: { code: 'NOT_FOUND', message: '资源不存在', status: 404 },
  ALREADY_EXISTS: { code: 'ALREADY_EXISTS', message: '资源已存在', status: 409 },
  
  // 输入相关
  INVALID_INPUT: { code: 'INVALID_INPUT', message: '输入参数无效', status: 400 },
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误', status: 401 },
  
  // 服务器相关
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: '服务器内部错误', status: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', message: '数据库错误', status: 500 },
};
