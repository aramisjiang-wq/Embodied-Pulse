/**
 * 任务服务
 * 每日任务系统
 */

import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';
import { updateUserPoints } from './user.service';

const prisma = userPrisma;

export interface DailyTask {
  id: string;
  name: string;
  points: number;
  status: 'pending' | 'completed' | 'in_progress';
  progress: {
    current: number;
    target: number;
  };
}

/**
 * 获取每日任务列表
 */
export async function getDailyTasks(userId: string): Promise<{
  tasks: DailyTask[];
  totalPoints: number;
  completedCount: number;
  totalCount: number;
  bonusPoints: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取今日用户行为
    const actions = await prisma.userAction.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    // 获取今日积分记录
    const pointRecords = await prisma.pointRecord.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    // 定义任务
    const viewCount = actions.filter(a => a.actionType === 'view').length;
    const favoriteCount = actions.filter(a => a.actionType === 'favorite').length;
    const commentCount = pointRecords.filter(r => r.actionType === 'create_comment').length;
    const shareCount = pointRecords.filter(r => r.actionType === 'create_post').length;
    const signInCount = pointRecords.filter(r => r.actionType === 'sign_in').length;

    const tasks: DailyTask[] = [
      {
        id: 'sign_in',
        name: '每日签到',
        points: 5,
        status: signInCount > 0 ? 'completed' : 'pending',
        progress: { current: signInCount, target: 1 },
      },
      {
        id: 'view_content',
        name: '浏览5篇内容',
        points: 10,
        status: viewCount >= 5 ? 'completed' : viewCount > 0 ? 'in_progress' : 'pending',
        progress: { current: Math.min(viewCount, 5), target: 5 },
      },
      {
        id: 'favorite_content',
        name: '收藏1篇内容',
        points: 10,
        status: favoriteCount >= 1 ? 'completed' : 'pending',
        progress: { current: Math.min(favoriteCount, 1), target: 1 },
      },
      {
        id: 'create_comment',
        name: '发表1条评论',
        points: 20,
        status: commentCount >= 1 ? 'completed' : 'pending',
        progress: { current: Math.min(commentCount, 1), target: 1 },
      },
      {
        id: 'share_content',
        name: '分享1次内容',
        points: 30,
        status: shareCount >= 1 ? 'completed' : 'pending',
        progress: { current: Math.min(shareCount, 1), target: 1 },
      },
    ];

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const totalPoints = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0);
    const bonusPoints = completedCount === tasks.length ? 20 : 0;

    return {
      tasks,
      totalPoints,
      completedCount,
      totalCount: tasks.length,
      bonusPoints,
    };
  } catch (error) {
    logger.error('Get daily tasks error:', error);
    throw new Error('TASKS_FETCH_FAILED');
  }
}

/**
 * 签到
 */
export async function signIn(userId: string): Promise<{ points: number }> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查今天是否已签到
    const existingSignIn = await prisma.pointRecord.findFirst({
      where: {
        userId,
        actionType: 'sign_in',
        createdAt: { gte: today },
      },
    });

    if (existingSignIn) {
      throw new Error('ALREADY_SIGNED_IN');
    }

    // 签到奖励积分
    const points = 5;
    await updateUserPoints(userId, points, 'sign_in', '每日签到');

    logger.info(`User signed in: ${userId}`);
    return { points };
  } catch (error: any) {
    if (error.message === 'ALREADY_SIGNED_IN') {
      throw error;
    }
    logger.error('Sign in error:', error);
    throw new Error('SIGN_IN_FAILED');
  }
}
