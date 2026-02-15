/**
 * 用户端HuggingFace订阅服务
 * 支持订阅HuggingFace Papers和作者
 */

import userPrisma from '../config/database.user';
import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';

export interface UserHuggingFaceSubscription {
  id: string;
  userId: string;
  subscriptionType: 'papers' | 'author';
  author?: string;
  authorUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscriptionResult {
  success: boolean;
  message?: string;
  data?: any;
}

export async function getUserSubscriptions(userId: string): Promise<{
  papers: boolean;
  authors: Array<{
    id: string;
    author: string;
    authorUrl: string;
    isActive: boolean;
    createdAt: Date;
  }>;
}> {
  try {
    const papersSubscription = await userPrisma.$queryRawUnsafe<Array<{
      id: string;
    }>>(
      `SELECT id FROM user_huggingface_subscriptions 
       WHERE user_id = ? AND subscription_type = 'papers' AND is_active = 1`,
      userId
    );

    const authorSubscriptions = await userPrisma.$queryRawUnsafe<Array<{
      id: string;
      author: string;
      author_url: string;
      is_active: number;
      created_at: string;
    }>>(
      `SELECT id, author, author_url, is_active, created_at 
       FROM user_huggingface_subscriptions 
       WHERE user_id = ? AND subscription_type = 'author'
       ORDER BY created_at DESC`,
      userId
    );

    return {
      papers: papersSubscription.length > 0,
      authors: authorSubscriptions.map((sub: any) => ({
        id: sub.id,
        author: sub.author,
        authorUrl: sub.author_url,
        isActive: Boolean(sub.is_active),
        createdAt: new Date(sub.created_at),
      })),
    };
  } catch (error: any) {
    logger.error('获取用户HuggingFace订阅失败:', error);
    return {
      papers: false,
      authors: [],
    };
  }
}

export async function subscribePapers(userId: string): Promise<UserSubscriptionResult> {
  try {
    const existing = await userPrisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM user_huggingface_subscriptions 
       WHERE user_id = ? AND subscription_type = 'papers'`,
      userId
    );

    if (existing.length > 0) {
      await userPrisma.$executeRawUnsafe(
        `UPDATE user_huggingface_subscriptions 
         SET is_active = 1, updated_at = ?
         WHERE user_id = ? AND subscription_type = 'papers'`,
        new Date().toISOString(),
        userId
      );
      return { success: true, message: '已订阅HuggingFace每日论文' };
    }

    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();

    await userPrisma.$executeRawUnsafe(
      `INSERT INTO user_huggingface_subscriptions 
       (id, user_id, subscription_type, is_active, created_at, updated_at)
       VALUES (?, ?, 'papers', 1, ?, ?)`,
      id,
      userId,
      now,
      now
    );

    logger.info(`用户 ${userId} 订阅了HuggingFace每日论文`);
    return { success: true, message: '订阅成功！每日将收到最新论文推送' };
  } catch (error: any) {
    logger.error('订阅HuggingFace Papers失败:', error);
    return { success: false, message: '订阅失败，请稍后重试' };
  }
}

export async function unsubscribePapers(userId: string): Promise<UserSubscriptionResult> {
  try {
    await userPrisma.$executeRawUnsafe(
      `UPDATE user_huggingface_subscriptions 
       SET is_active = 0, updated_at = ?
       WHERE user_id = ? AND subscription_type = 'papers'`,
      new Date().toISOString(),
      userId
    );

    logger.info(`用户 ${userId} 取消订阅HuggingFace每日论文`);
    return { success: true, message: '已取消订阅' };
  } catch (error: any) {
    logger.error('取消订阅HuggingFace Papers失败:', error);
    return { success: false, message: '取消订阅失败' };
  }
}

export async function subscribeAuthor(userId: string, author: string, authorUrl?: string): Promise<UserSubscriptionResult> {
  try {
    if (!author || !author.trim()) {
      return { success: false, message: '请输入有效的作者名称' };
    }

    const normalizedAuthor = author.trim().replace(/^@/, '');
    const url = authorUrl || `https://huggingface.co/${normalizedAuthor}`;

    const existing = await userPrisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM user_huggingface_subscriptions 
       WHERE user_id = ? AND subscription_type = 'author' AND author = ?`,
      userId,
      normalizedAuthor
    );

    if (existing.length > 0) {
      await userPrisma.$executeRawUnsafe(
        `UPDATE user_huggingface_subscriptions 
         SET is_active = 1, author_url = ?, updated_at = ?
         WHERE user_id = ? AND subscription_type = 'author' AND author = ?`,
        url,
        new Date().toISOString(),
        userId,
        normalizedAuthor
      );
      return { success: true, message: `已订阅 ${normalizedAuthor}` };
    }

    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();

    await userPrisma.$executeRawUnsafe(
      `INSERT INTO user_huggingface_subscriptions 
       (id, user_id, subscription_type, author, author_url, is_active, created_at, updated_at)
       VALUES (?, ?, 'author', ?, ?, 1, ?, ?)`,
      id,
      userId,
      normalizedAuthor,
      url,
      now,
      now
    );

    logger.info(`用户 ${userId} 订阅了HuggingFace作者: ${normalizedAuthor}`);
    return { success: true, message: `成功订阅 ${normalizedAuthor}！该作者发布新模型时将收到通知` };
  } catch (error: any) {
    logger.error('订阅HuggingFace作者失败:', error);
    return { success: false, message: '订阅失败，请稍后重试' };
  }
}

export async function unsubscribeAuthor(userId: string, subscriptionId: string): Promise<UserSubscriptionResult> {
  try {
    await userPrisma.$executeRawUnsafe(
      `DELETE FROM user_huggingface_subscriptions 
       WHERE id = ? AND user_id = ?`,
      subscriptionId,
      userId
    );

    logger.info(`用户 ${userId} 取消订阅作者: ${subscriptionId}`);
    return { success: true, message: '已取消订阅' };
  } catch (error: any) {
    logger.error('取消订阅作者失败:', error);
    return { success: false, message: '取消订阅失败' };
  }
}

export async function getSubscribedPapersUsers(): Promise<Array<{ userId: string }>> {
  try {
    const users = await userPrisma.$queryRawUnsafe<Array<{ user_id: string }>>(
      `SELECT user_id FROM user_huggingface_subscriptions 
       WHERE subscription_type = 'papers' AND is_active = 1`
    );
    return users.map((u: any) => ({ userId: u.user_id }));
  } catch (error: any) {
    logger.error('获取订阅Papers的用户列表失败:', error);
    return [];
  }
}

export async function getSubscribedAuthorUsers(author: string): Promise<Array<{ userId: string }>> {
  try {
    const users = await userPrisma.$queryRawUnsafe<Array<{ user_id: string }>>(
      `SELECT user_id FROM user_huggingface_subscriptions 
       WHERE subscription_type = 'author' AND author = ? AND is_active = 1`,
      author
    );
    return users.map((u: any) => ({ userId: u.user_id }));
  } catch (error: any) {
    logger.error('获取订阅作者的用户列表失败:', error);
    return [];
  }
}
