/**
 * 文件上传中间件
 * 使用multer处理图片上传
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { logger } from '../utils/logger';

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads', 'banners');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `banner-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// 文件过滤器：只允许图片
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件（JPEG、PNG、GIF、WebP）'));
  }
};

// 配置multer
export const uploadBanner = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// 获取上传文件的URL
export function getBannerImageUrl(filename: string): string {
  // 返回相对路径，前端可以通过API访问
  return `/api/v1/uploads/banners/${filename}`;
}

// 获取上传文件的完整路径
export function getBannerImagePath(filename: string): string {
  return path.join(uploadDir, filename);
}
