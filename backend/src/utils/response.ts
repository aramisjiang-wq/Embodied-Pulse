import { Response } from 'express';
import { ApiResponse } from '../types/api';

// 处理BigInt和Date序列化问题
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  
  return obj;
};

export const sendSuccess = <T>(res: Response, data: T, message = 'success'): void => {
  const response: ApiResponse<T> = {
    code: 0,
    message,
    data: serializeBigInt(data) as T,
    timestamp: Date.now(),
  };
  res.json(response);
};

export const sendError = (
  res: Response,
  code: string | number,
  message: string,
  statusCode = 400
): void => {
  // 如果code是数字，使用它；如果是字符串，尝试转换为数字，否则使用statusCode
  const errorCode = typeof code === 'number' ? code : (parseInt(code) || statusCode);
  // 确保statusCode是数字
  const finalStatusCode = typeof statusCode === 'number' ? statusCode : 400;
  const response: ApiResponse = {
    code: errorCode,
    message,
    data: null,
    timestamp: Date.now(),
  };
  res.status(finalStatusCode).json(response);
};
