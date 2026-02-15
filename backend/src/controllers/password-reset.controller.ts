import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail, generateResetToken } from '../services/email.service';

const prisma = userPrisma as any;

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 1001, '请输入邮箱地址', 400);
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return sendSuccess(res, { message: '如果该邮箱已注册，您将收到重置密码的邮件' });
    }

    const existingReset = await prisma.passwordReset.findFirst({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingReset) {
      return sendSuccess(res, { message: '重置邮件已发送，请检查您的邮箱' });
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
    const emailSent = await sendPasswordResetEmail(email, token, resetUrl);

    if (!emailSent) {
      logger.error(`Failed to send password reset email to ${email}`);
    }

    sendSuccess(res, { message: '如果该邮箱已注册，您将收到重置密码的邮件' });
  } catch (error) {
    logger.error('Request password reset error:', error);
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 1001, '缺少必要参数', 400);
    }

    if (newPassword.length < 8 || newPassword.length > 32) {
      return sendError(res, 1001, '密码长度需在8-32个字符之间', 400);
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return sendError(res, 1001, '密码需包含至少一个字母和一个数字', 400);
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      return sendError(res, 1002, '重置链接无效或已过期', 400);
    }

    const user = await prisma.user.findFirst({
      where: { email: resetRecord.email },
    });

    if (!user) {
      return sendError(res, 1002, '用户不存在', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    logger.info(`Password reset successful for user ${user.id}`);

    sendSuccess(res, { message: '密码重置成功，请使用新密码登录' });
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
}

export async function validateResetToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;

    if (!token) {
      return sendError(res, 1001, '缺少重置令牌', 400);
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      return sendError(res, 1002, '重置链接无效或已过期', 400);
    }

    sendSuccess(res, { valid: true, email: resetRecord.email.replace(/(.{2}).*(@.*)/, '$1***$2') });
  } catch (error) {
    logger.error('Validate reset token error:', error);
    next(error);
  }
}
