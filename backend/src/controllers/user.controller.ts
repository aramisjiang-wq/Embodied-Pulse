/**
 * 用户个人资料控制器
 */

import { Request, Response } from 'express';
import userPrisma from '../config/database.user';
import { ApiError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { calculateLevel } from '../services/user.service';
import bcrypt from 'bcryptjs';

const prisma = userPrisma;

/**
 * 获取公开用户资料
 */
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        location: true,
        skills: true,
        interests: true,
        level: true,
        points: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在');
    }

    sendSuccess(res, user, '获取成功');
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error.statusCode, error.message, error.statusCode);
    } else {
      sendError(res, 500, '获取失败', 500);
    }
  }
};

/**
 * 获取个人资料
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        location: true,
        skills: true,
        interests: true,
        level: true,
        points: true,
        isVip: true,
        identityType: true,
        organizationName: true,
        region: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在');
    }

    sendSuccess(res, user, '获取成功');
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error.statusCode, error.message, error.statusCode);
    } else {
      sendError(res, 500, '获取失败', 500);
    }
  }
};

/**
 * 更新个人资料
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      username, email, bio, avatarUrl, githubUrl, linkedinUrl, twitterUrl, websiteUrl,
      location, skills, interests, identityType, organizationName, region,
    } = req.body;

    // 验证数据
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (location !== undefined) updateData.location = location;
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    if (identityType !== undefined) updateData.identityType = identityType || null;
    if (organizationName !== undefined) updateData.organizationName = organizationName || null;
    if (region !== undefined) updateData.region = region || null;

    // 填写组织名称后（高校/企业场景），奖励 300 积分，达到 L3 要求
    // 等级由积分自动计算
    if (organizationName && String(organizationName).trim()) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true, organizationName: true },
      });
      
      // 只有首次填写组织名称时才奖励积分
      if (currentUser && !currentUser.organizationName) {
        const newPoints = (currentUser.points || 0) + 300;
        updateData.points = newPoints;
        
        // 计算新等级
        updateData.level = calculateLevel(newPoints);
        
        // 创建积分记录
        await prisma.pointRecord.create({
          data: {
            userId,
            points: 300,
            actionType: 'profile_complete',
            description: '完善资料奖励：填写组织名称',
          },
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        location: true,
        skills: true,
        interests: true,
        level: true,
        points: true,
        isVip: true,
        identityType: true,
        organizationName: true,
        region: true,
        createdAt: true,
      },
    });

    sendSuccess(res, user, '更新成功');
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error.statusCode, error.message, error.statusCode);
    } else {
      sendError(res, 500, '更新失败', 500);
    }
  }
};

/**
 * 获取积分记录
 */
export const getPointRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const records = await prisma.pointRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    sendSuccess(res, records, '获取成功');
  } catch (error) {
    sendError(res, 500, '获取失败', 500);
  }
};

/**
 * 修改密码
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, 'INVALID_INPUT', '旧密码和新密码不能为空');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'INVALID_PASSWORD', '新密码长度至少为6位');
    }

    // 获取当前用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(400, 'INVALID_OPERATION', '该账号无法修改密码');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(400, 'INVALID_PASSWORD', '旧密码错误');
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    sendSuccess(res, null, '密码修改成功');
  } catch (error) {
    if (error instanceof ApiError) {
      sendError(res, error.statusCode, error.message, error.statusCode);
    } else {
      sendError(res, 500, '密码修改失败', 500);
    }
  }
};
