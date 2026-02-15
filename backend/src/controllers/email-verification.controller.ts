import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import { sendVerificationEmail, generateVerificationCode } from '../services/email.service';

const prisma = userPrisma as any;

export async function sendVerificationCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, type } = req.body;

    if (!email) {
      return sendError(res, 1001, '请输入邮箱地址', 400);
    }

    const validTypes = ['register', 'reset_password'];
    if (!type || !validTypes.includes(type)) {
      return sendError(res, 1001, '无效的验证码类型', 400);
    }

    if (type === 'register') {
      const existingUser = await prisma.user.findFirst({
        where: { email },
      });
      if (existingUser) {
        return sendError(res, 1006, '该邮箱已被注册', 409);
      }
    }

    const existingCode = await prisma.emailVerification.findFirst({
      where: {
        email,
        type,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingCode) {
      const timeDiff = existingCode.expiresAt.getTime() - Date.now();
      const secondsLeft = Math.ceil(timeDiff / 1000);
      return sendError(res, 1007, `验证码已发送，请${secondsLeft}秒后重试`, 429);
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    });

    const emailSent = await sendVerificationEmail(email, code);

    if (!emailSent) {
      logger.error(`Failed to send verification code to ${email}`);
      return sendError(res, 1008, '发送验证码失败，请稍后重试', 500);
    }

    sendSuccess(res, { message: '验证码已发送，请检查您的邮箱' });
  } catch (error) {
    logger.error('Send verification code error:', error);
    next(error);
  }
}

export async function verifyCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
      return sendError(res, 1001, '缺少必要参数', 400);
    }

    const record = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        type,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return sendError(res, 1002, '验证码无效或已过期', 400);
    }

    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    sendSuccess(res, { message: '验证成功', verified: true });
  } catch (error) {
    logger.error('Verify code error:', error);
    next(error);
  }
}
