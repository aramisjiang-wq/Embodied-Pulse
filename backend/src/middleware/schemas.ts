/**
 * 常用 Zod 验证 Schemas
 */

import { z } from './zod-validation.middleware';

export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'ID格式无效');

export const paginationSchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  size: z.string().optional().transform(v => (v ? Math.min(parseInt(v, 10), 100) : 20)),
});

export const emailSchema = z.string().email('邮箱格式不正确').toLowerCase().trim();

export const usernameSchema = z
  .string()
  .min(3, '用户名至少3个字符')
  .max(20, '用户名最多20个字符')
  .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文');

export const passwordSchema = z
  .string()
  .min(8, '密码至少8个字符')
  .max(32, '密码最多32个字符')
  .regex(/^(?=.*[A-Za-z])(?=.*\d)/, '密码必须包含至少一个字母和一个数字');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密码不能为空'),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const adminLoginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, '密码不能为空'),
});

export const keywordSchema = z
  .string()
  .max(200, '关键词最多200个字符')
  .optional();

export const idParamSchema = z.object({
  id: idSchema,
});

export const paperIdParamSchema = z.object({
  paperId: idSchema,
});

export const videoIdParamSchema = z.object({
  videoId: idSchema,
});

export const repoIdParamSchema = z.object({
  repoId: idSchema,
});

export const jobIdParamSchema = z.object({
  jobId: idSchema,
});

export const postIdParamSchema = z.object({
  postId: idSchema,
});

export const userIdParamSchema = z.object({
  userId: idSchema,
});
