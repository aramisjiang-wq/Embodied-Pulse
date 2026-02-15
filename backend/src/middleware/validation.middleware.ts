import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

const MAX_PAGE_SIZE = 100;
const MAX_KEYWORD_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/gi,
  /(--|\#|\/\*|\*\/)/g,
  /(\bOR\b|\bAND\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
  /UNION\s+SELECT/gi,
];

function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .trim();
}

function detectXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const { page, size } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendError(res, 1001, '页码必须是大于0的整数', 400);
    }
    req.query.page = String(pageNum);
  }

  if (size !== undefined) {
    const sizeNum = parseInt(size as string, 10);
    if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > MAX_PAGE_SIZE) {
      return sendError(res, 1001, `每页数量必须是1-${MAX_PAGE_SIZE}之间的整数`, 400);
    }
    req.query.size = String(sizeNum);
  }

  next();
}

export function validateKeyword(req: Request, res: Response, next: NextFunction) {
  const { keyword, q, search } = req.query;
  const keywordValue = (keyword || q || search) as string;

  if (keywordValue) {
    if (keywordValue.length > MAX_KEYWORD_LENGTH) {
      return sendError(res, 1001, `关键词长度不能超过${MAX_KEYWORD_LENGTH}个字符`, 400);
    }

    if (detectXSS(keywordValue)) {
      logger.warn(`Potential XSS detected in keyword: ${keywordValue.substring(0, 50)}...`);
      return sendError(res, 1001, '搜索关键词包含非法字符', 400);
    }

    if (detectSQLInjection(keywordValue)) {
      logger.warn(`Potential SQL injection detected in keyword: ${keywordValue.substring(0, 50)}...`);
      return sendError(res, 1001, '搜索关键词包含非法字符', 400);
    }

    req.query.keyword = sanitizeString(keywordValue);
  }

  next();
}

export function validateContent(req: Request, res: Response, next: NextFunction) {
  const { content, description, abstract, title } = req.body;

  const fieldsToValidate = [
    { name: 'content', value: content },
    { name: 'description', value: description },
    { name: 'abstract', value: abstract },
    { name: 'title', value: title },
  ];

  for (const field of fieldsToValidate) {
    if (field.value && typeof field.value === 'string') {
      if (field.value.length > MAX_CONTENT_LENGTH) {
        return sendError(res, 1001, `${field.name}长度不能超过${MAX_CONTENT_LENGTH}个字符`, 400);
      }

      if (detectXSS(field.value)) {
        logger.warn(`Potential XSS detected in ${field.name}`);
        return sendError(res, 1001, `${field.name}包含非法字符`, 400);
      }
    }
  }

  next();
}

export function validateId(req: Request, res: Response, next: NextFunction) {
  const { id, paperId, videoId, repoId, jobId, postId, userId } = req.params;

  const ids = [id, paperId, videoId, repoId, jobId, postId, userId].filter(Boolean);

  for (const idValue of ids) {
    if (idValue && !/^[a-zA-Z0-9_-]+$/.test(idValue)) {
      return sendError(res, 1001, '无效的ID格式', 400);
    }
  }

  next();
}

export function validateEmail(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 1001, '邮箱格式不正确', 400);
    }
    req.body.email = email.toLowerCase().trim();
  }

  next();
}

export function validateUsername(req: Request, res: Response, next: NextFunction) {
  const { username } = req.body;

  if (username) {
    if (typeof username !== 'string') {
      return sendError(res, 1001, '用户名必须是字符串', 400);
    }
    if (username.length < 3 || username.length > 20) {
      return sendError(res, 1001, '用户名长度必须在3-20个字符之间', 400);
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return sendError(res, 1001, '用户名只能包含字母、数字、下划线和中文', 400);
    }
    req.body.username = username.trim();
  }

  next();
}

export function validatePassword(req: Request, res: Response, next: NextFunction) {
  const { password } = req.body;

  if (password) {
    if (typeof password !== 'string') {
      return sendError(res, 1001, '密码必须是字符串', 400);
    }
    if (password.length < 8 || password.length > 32) {
      return sendError(res, 1001, '密码长度必须在8-32个字符之间', 400);
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return sendError(res, 1001, '密码必须包含至少一个字母和一个数字', 400);
    }
  }

  next();
}

export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }

  next();
}
