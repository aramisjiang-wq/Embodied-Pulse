import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '404777086@qq.com',
    pass: process.env.SMTP_PASS || 'njyrjpkjmorbbgei',
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Embodied Pulse" <${process.env.SMTP_USER || '404777086@qq.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Send email error:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateResetToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1890ff;">Embodied Pulse - 邮箱验证</h2>
      <p>您好！</p>
      <p>您的验证码是：</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">验证码有效期为 10 分钟，请尽快使用。</p>
      <p style="color: #999; font-size: 12px;">如果您没有请求此验证码，请忽略此邮件。</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Embodied Pulse - 邮箱验证码',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1890ff;">Embodied Pulse - 密码重置</h2>
      <p>您好！</p>
      <p>您收到这封邮件是因为您请求重置密码。</p>
      <p>请点击下方按钮重置您的密码：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}?token=${resetToken}" 
           style="background: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
          重置密码
        </a>
      </div>
      <p style="color: #666;">或者复制以下链接到浏览器：</p>
      <p style="word-break: break-all; color: #1890ff;">${resetUrl}?token=${resetToken}</p>
      <p style="color: #666;">链接有效期为 1 小时。</p>
      <p style="color: #999; font-size: 12px;">如果您没有请求重置密码，请忽略此邮件。</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Embodied Pulse - 密码重置',
    html,
  });
}
