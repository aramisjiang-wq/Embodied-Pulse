/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */

import { User } from '../../node_modules/.prisma/client-user';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { logger } from '../utils/logger';
import { generateUserNumber } from '../utils/user-number';
import userPrisma from '../config/database.user';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export interface CreateGithubUserData {
  username: string;
  email?: string;
  githubId: string;
  avatarUrl?: string;
  bio?: string;
  githubData?: {
    name?: string;
    company?: string;
    location?: string;
    blog?: string;
    followers?: number;
    following?: number;
    publicRepos?: number;
    htmlUrl?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * 通过ID获取用户
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await userPrisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    throw new Error('USER_FETCH_FAILED');
  }
}

/**
 * 通过邮箱获取用户
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    logger.debug(`Getting user by email: ${email}`);
    const user = await userPrisma.user.findUnique({
      where: { email },
    });
    logger.debug(`User query result: ${user ? `found (id: ${user.id})` : 'not found'}`);
    return user;
  } catch (error: any) {
    logger.error('Get user by email error:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      email,
    });
    throw new Error('USER_FETCH_FAILED');
  }
}

/**
 * 通过用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    return await userPrisma.user.findUnique({
      where: { username },
    });
  } catch (error) {
    logger.error('Get user by username error:', error);
    throw new Error('USER_FETCH_FAILED');
  }
}

/**
 * 通过GitHub ID获取用户
 */
export async function getUserByGithubId(githubId: string): Promise<User | null> {
  try {
    return await userPrisma.user.findUnique({
      where: { githubId },
    });
  } catch (error) {
    logger.error('Get user by GitHub ID error:', error);
    throw new Error('USER_FETCH_FAILED');
  }
}

/**
 * 创建用户(邮箱注册)
 */
export async function createUser(data: CreateUserData): Promise<User> {
  try {
    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      throw new Error('INVALID_USERNAME');
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('INVALID_EMAIL');
    }

    // 验证密码强度
    if (!validatePasswordStrength(data.password)) {
      throw new Error('WEAK_PASSWORD');
    }

    // 检查用户名是否已存在
    const existingUsername = await getUserByUsername(data.username);
    if (existingUsername) {
      throw new Error('USERNAME_EXISTS');
    }

    // 检查邮箱是否已存在
    const existingEmail = await getUserByEmail(data.email);
    if (existingEmail) {
      throw new Error('EMAIL_EXISTS');
    }

    // 哈希密码
    const passwordHash = await hashPassword(data.password);

    // 生成用户编号
    const userNumber = await generateUserNumber();

    // 创建用户
    const user = await userPrisma.user.create({
      data: {
        userNumber,
        username: data.username,
        email: data.email,
        passwordHash,
      },
    });

    logger.info(`User created: ${user.id} (${user.username})`);
    return user;
  } catch (error: any) {
    if (error.message.startsWith('INVALID_') || 
        error.message.includes('EXISTS') || 
        error.message === 'WEAK_PASSWORD') {
      throw error;
    }
    logger.error('Create user error:', error);
    throw new Error('USER_CREATION_FAILED');
  }
}

/**
 * 创建或更新GitHub用户
 */
export async function createOrUpdateGithubUser(data: CreateGithubUserData): Promise<User> {
  try {
    // 检查GitHub用户是否已存在
    const existingUser = await getUserByGithubId(data.githubId);
    
    if (existingUser) {
      // 更新用户信息，包括最近登录时间
      const updatedUser = await userPrisma.user.update({
        where: { id: existingUser.id },
        data: {
          avatarUrl: data.avatarUrl,
          bio: data.bio,
          email: data.email || existingUser.email,
          lastLoginAt: new Date(), // 更新最近登录时间
          // 如果有GitHub额外数据，存储在tags字段中（JSON格式）
          ...(data.githubData && { tags: JSON.stringify(data.githubData) }),
        },
      });
      logger.info(`GitHub user updated: ${updatedUser.id} (${updatedUser.username})`);
      return updatedUser;
    }

    // 确保用户名唯一
    let username = data.username;
    let suffix = 1;
    while (await getUserByUsername(username)) {
      username = `${data.username}${suffix}`;
      suffix++;
    }

    // 生成用户编号
    let userNumber: string;
    try {
      userNumber = await generateUserNumber();
      logger.info(`Generated user number: ${userNumber}`);
    } catch (error: any) {
      logger.error('Failed to generate user number:', error);
      // 使用时间戳作为后备
      const timestamp = Date.now().toString().slice(-6);
      userNumber = `U${timestamp}`;
      logger.warn(`Using fallback user number: ${userNumber}`);
    }

    // 创建新用户
    // 注意：email是可选的，GitHub用户可能没有公开email
    const userData: any = {
      userNumber,
      username,
      githubId: data.githubId,
      lastLoginAt: new Date(), // 设置最近登录时间
    };
    
    // 只有当email存在时才添加
    if (data.email) {
      userData.email = data.email;
    }
    
    // 可选字段
    if (data.avatarUrl) {
      userData.avatarUrl = data.avatarUrl;
    }
    
    if (data.bio) {
      userData.bio = data.bio;
    }
    
    // 如果有GitHub额外数据，存储在tags字段中（JSON格式）
    // 注意：这会覆盖原有的tags，但GitHub用户通常不需要tags
    if (data.githubData) {
      userData.tags = JSON.stringify(data.githubData);
    }

    logger.info('Creating GitHub user with data:', {
      userNumber,
      username,
      hasEmail: !!data.email,
      githubId: data.githubId,
      hasAvatarUrl: !!data.avatarUrl,
      hasBio: !!data.bio,
    });

    const user = await userPrisma.user.create({
      data: userData,
    });

    logger.info(`GitHub user created successfully: ${user.id} (${user.username})`);
    return user;
  } catch (error: any) {
    logger.error('Create/update GitHub user error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
      stack: error.stack,
      data: data, // 记录尝试创建的用户数据
    });
    // 如果是唯一约束冲突（用户名或邮箱已存在），尝试更新
    if (error.code === 'P2002') {
      logger.warn('GitHub user creation conflict, attempting to find existing user');
      try {
        // 尝试通过GitHub ID查找
        const existing = await getUserByGithubId(data.githubId);
        if (existing) {
          return existing;
        }
        // 如果GitHub ID不存在，可能是邮箱冲突，尝试通过邮箱查找
        if (data.email) {
          const byEmail = await getUserByEmail(data.email);
          if (byEmail) {
            // 更新现有用户的GitHub信息
            return await userPrisma.user.update({
              where: { id: byEmail.id },
              data: {
                githubId: data.githubId,
                avatarUrl: data.avatarUrl,
                bio: data.bio,
              },
            });
          }
        }
      } catch (updateError) {
        logger.error('Failed to update existing user:', updateError);
      }
    }
    throw new Error('GITHUB_USER_CREATION_FAILED');
  }
}

/**
 * 验证用户登录
 */
export async function authenticateUser(email: string, password: string): Promise<User> {
  try {
    // 获取用户
    const user = await getUserByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 检查是否有密码(GitHub用户可能没有密码)
    if (!user.passwordHash) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 检查用户是否被禁用
    if (!user.isActive) {
      throw new Error('USER_BANNED');
    }

    // 更新最近登录时间
    await userPrisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User authenticated: ${user.id} (${user.username})`);
    return user;
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS' || error.message === 'USER_BANNED') {
      throw error;
    }
    logger.error('Authenticate user error:', error);
    throw new Error('AUTHENTICATION_FAILED');
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(userId: string, data: UpdateUserData): Promise<User> {
  try {
    // 如果要更新用户名,检查是否已存在
    if (data.username) {
      const existing = await getUserByUsername(data.username);
      if (existing && existing.id !== userId) {
        throw new Error('USERNAME_EXISTS');
      }
    }

    // 如果要更新邮箱,检查是否已存在
    if (data.email) {
      const existing = await getUserByEmail(data.email);
      if (existing && existing.id !== userId) {
        throw new Error('EMAIL_EXISTS');
      }
    }

    const user = await userPrisma.user.update({
      where: { id: userId },
      data,
    });

    logger.info(`User updated: ${user.id} (${user.username})`);
    return user;
  } catch (error: any) {
    if (error.message.includes('EXISTS')) {
      throw error;
    }
    logger.error('Update user error:', error);
    throw new Error('USER_UPDATE_FAILED');
  }
}

/**
 * 更新用户积分
 */
export async function updateUserPoints(userId: string, points: number, actionType: string, description?: string): Promise<void> {
  try {
    const user = await userPrisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const newPoints = user.points + points;
    const newLevel = calculateLevel(newPoints);

    await userPrisma.$transaction([
      // 更新用户积分
      userPrisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: points },
          level: newLevel > user.level ? newLevel : user.level,
        },
      }),
      // 创建积分记录
      userPrisma.pointRecord.create({
        data: {
          user_id: userId,
          points,
          action_type: actionType,
          description,
          balance_after: newPoints,
        } as any,
      }),
    ]);

    logger.info(`User points updated: ${userId}, points: ${points}, action: ${actionType}, new level: ${newLevel}`);
  } catch (error) {
    logger.error('Update user points error:', error);
    throw new Error('POINTS_UPDATE_FAILED');
  }
}

/**
 * 根据积分计算用户等级
 */
function calculateLevel(points: number): number {
  if (points < 500) return Math.floor(points / 100) + 1;
  if (points < 2000) return Math.floor((points - 500) / 300) + 5;
  if (points < 5000) return Math.floor((points - 2000) / 600) + 10;
  return Math.floor((points - 5000) / 1000) + 15;
}
