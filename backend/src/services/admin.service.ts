/**
 * 管理端服务
 * 处理内容管理、用户管理、数据统计等
 */

import { logger } from '../utils/logger';
import { createPaper, updatePaper, deletePaper } from './paper.service';
import { createVideo, updateVideo, deleteVideo } from './video.service';
import { createRepo, updateRepo, deleteRepo } from './repo.service';
import { createJob, updateJob, deleteJob } from './job.service';
import { createBanner, updateBanner, deleteBanner } from './banner.service';
import { createHuggingFaceModel, updateHuggingFaceModel, deleteHuggingFaceModel } from './huggingface.service';
import userPrisma from '../config/database.user';
import adminPrisma from '../config/database.admin';
import ExcelJS from 'exceljs';

/**
 * 获取用户端用户列表(管理端)
 * 只返回role='user'的普通用户
 */
export async function getUserEndUsers(skip: number, take: number, keyword?: string, level?: number, status?: string, registerType?: string): Promise<{ users: any[]; total: number }> {
  try {
    const where: any = {
      // 用户数据库的User模型没有role字段，所有用户都是普通用户
    };

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { userNumber: { contains: keyword } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'banned') {
      where.isActive = false;
    }

    // 按注册方式筛选
    if (registerType) {
      if (registerType === 'github') {
        where.githubId = { not: null };
        where.passwordHash = null;
      } else if (registerType === 'email') {
        where.passwordHash = { not: null };
        where.githubId = null;
      } else if (registerType === 'github_and_email') {
        where.githubId = { not: null };
        where.passwordHash = { not: null };
      }
    }

    let users: any[] = [];
    let total = 0;

    try {
      // 先尝试使用完整的 select（包含 userNumber）
      const result = await Promise.all([
        userPrisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            userNumber: true,
            username: true,
            email: true,
            avatarUrl: true,
            bio: true,
            githubId: true,
            githubUrl: true,
            linkedinUrl: true,
            twitterUrl: true,
            websiteUrl: true,
            location: true,
            skills: true,
            interests: true,
            passwordHash: true,
            level: true,
            points: true,
            isVip: true,
            isActive: true,
            lastLoginAt: true,
            tags: true,
            role: true,
            identityType: true,
            organizationName: true,
            region: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        userPrisma.user.count({ where }),
      ]);
      users = result[0];
      total = result[1];
    } catch (selectError: any) {
      // 如果包含 userNumber 的查询失败，尝试不使用 userNumber
      logger.warn('Query with userNumber failed, trying without userNumber:', selectError.message);
      try {
        const result = await Promise.all([
          userPrisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              bio: true,
              githubId: true,
              githubUrl: true,
              linkedinUrl: true,
              twitterUrl: true,
              websiteUrl: true,
              location: true,
              skills: true,
              interests: true,
              passwordHash: true,
              level: true,
              points: true,
              isVip: true,
              isActive: true,
              lastLoginAt: true,
              tags: true,
              role: true,
              identityType: true,
              organizationName: true,
              region: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          userPrisma.user.count({ where }),
        ]);
        users = result[0];
        total = result[1];
        // 为每个用户添加空的 userNumber
        users = users.map(u => ({ ...u, userNumber: null }));
      } catch (fallbackError: any) {
        // 再尝试最小 select（不含 identityType/organizationName/region，兼容未迁移的旧库）
        logger.warn('Fallback query failed, trying minimal select:', fallbackError.message);
        try {
          const result = await Promise.all([
            userPrisma.user.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip,
              take,
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                bio: true,
                githubId: true,
                githubUrl: true,
                linkedinUrl: true,
                twitterUrl: true,
                websiteUrl: true,
                location: true,
                skills: true,
                interests: true,
                passwordHash: true,
                level: true,
                points: true,
                isVip: true,
                isActive: true,
                lastLoginAt: true,
                tags: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            userPrisma.user.count({ where }),
          ]);
          users = result[0];
          total = result[1];
          users = users.map(u => ({
            ...u,
            userNumber: null,
            identityType: null,
            organizationName: null,
            region: null,
          }));
        } catch (minimalError: any) {
          logger.error('Minimal user list query failed:', minimalError);
          throw minimalError;
        }
      }
    }

    // 处理用户数据，添加注册方式信息和role字段
    const usersWithRegisterType = users.map(user => {
      // 安全地解析 tags JSON
      // tags字段可能存储标签数组、GitHub数据对象或包含VIP权限的对象
      let tags: string[] = [];
      let githubData: any = null;
      let vipPermissions: string[] = [];
      
      if (user.tags) {
        try {
          if (typeof user.tags === 'string') {
            const parsed = JSON.parse(user.tags);
            // 判断是数组（标签）还是对象
            if (Array.isArray(parsed)) {
              tags = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
              // 如果是对象，检查是否是GitHub数据（有githubData特征字段）
              if (parsed.followers !== undefined || parsed.publicRepos !== undefined || parsed.htmlUrl) {
                githubData = parsed;
              } else {
                // 可能是包含tags和vipPermissions的对象
                if (parsed.tags && Array.isArray(parsed.tags)) {
                  tags = parsed.tags;
                }
                if (parsed.vipPermissions && Array.isArray(parsed.vipPermissions)) {
                  vipPermissions = parsed.vipPermissions;
                }
              }
            }
          } else if (Array.isArray(user.tags)) {
            tags = user.tags;
          }
        } catch (parseError: any) {
          logger.warn(`Failed to parse tags for user ${user.id}:`, parseError.message);
          tags = [];
        }
      }

return {
        ...user,
        role: user.role || 'user', // 用户数据库中的用户都是普通用户
        registerType: user.githubId
          ? (user.passwordHash ? 'github_and_email' : 'github')
          : (user.passwordHash ? 'email' : 'unknown'),
        hasPassword: !!user.passwordHash,
        hasGithub: !!user.githubId,
        tags,
        vipPermissions, // VIP权限配置
        githubData, // GitHub额外数据
        // 确保所有字段都有默认值（avatar 供前端 Avatar 组件使用）
        userNumber: user.userNumber || '',
        username: user.username || '',
        email: user.email || null,
        avatarUrl: user.avatarUrl || null,
        avatar: user.avatarUrl || null,
        bio: user.bio || null,
        githubUrl: user.githubUrl || null,
        linkedinUrl: user.linkedinUrl || null,
        twitterUrl: user.twitterUrl || null,
        websiteUrl: user.websiteUrl || null,
        location: user.location || null,
        skills: user.skills || null,
        interests: user.interests || null,
        level: user.level || 1,
        points: user.points || 0,
        isVip: user.isVip || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
        lastLoginAt: user.lastLoginAt || null,
        identityType: user.identityType || null,
        organizationName: user.organizationName || null,
        region: user.region || null,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
      };
    });

    return { users: usersWithRegisterType, total };
  } catch (error: any) {
    logger.error('Get user end users error (管理端用户列表查询失败，当前返回空列表):', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    // 返回空结果而不是抛出错误，避免前端崩溃
    return { users: [], total: 0 };
  }
}

/**
 * 获取管理员列表(管理端)
 * 只返回role='admin'或'super_admin'的管理员
 */
export async function getAdminUsers(skip: number, take: number, keyword?: string, role?: string): Promise<{ admins: any[]; total: number }> {
  try {
    const where: any = {};

    // SQLite中，如果指定了role，直接使用等于查询
    if (role) {
      where.role = role;
    }
    // 如果不指定role，查询所有管理员（admins表中的所有记录都是管理员）

    if (keyword) {
      // SQLite使用contains（Prisma会转换为LIKE查询）
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }

    let admins: any[] = [];
    let total = 0;

    // 如果where为空对象，使用undefined来查询所有记录
    const whereClause = Object.keys(where).length > 0 ? where : undefined;
    // 添加调试日志
    logger.debug('getAdminUsers query params:', { skip, take, keyword, role, where: JSON.stringify(where), whereClause });

    try {
      // 先尝试使用完整的 select（包含 permissions）
      const result = await Promise.all([
        adminPrisma.admins.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          skip,
          take,
          select: {
            id: true,
            admin_number: true,
            username: true,
            email: true,
            avatar_url: true,
            role: true,
            is_active: true,
            last_login_at: true,
            tags: true,
            created_at: true,
            updated_at: true,
            permissions: {
              select: {
                id: true,
                module: true,
                can_view: true,
                can_create: true,
                can_update: true,
                can_delete: true,
              },
            },
          },
        }),
        adminPrisma.admins.count({ where: whereClause }),
      ]);
      admins = result[0];
      total = result[1];
    } catch (selectError: any) {
      // 如果包含 permissions 的查询失败，尝试不使用 permissions
      logger.warn('Query with permissions failed, trying without permissions:', selectError.message);
      try {
        const result = await Promise.all([
          adminPrisma.admins.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
            skip,
            take,
            select: {
              id: true,
              admin_number: true,
              username: true,
              email: true,
              avatar_url: true,
              role: true,
              is_active: true,
              last_login_at: true,
              tags: true,
              created_at: true,
              updated_at: true,
            },
          }),
          adminPrisma.admins.count({ where: whereClause }),
        ]);
        admins = result[0];
        total = result[1];
        // 为每个管理员添加空 permissions 数组
        admins = admins.map(a => ({ ...a, permissions: [] }));
      } catch (fallbackError: any) {
        logger.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }

    // 处理管理员数据，安全地解析tags字段
    const adminsWithTags = admins.map(admin => {
      // 安全地解析 tags JSON
      let tags: string[] = [];
      if (admin.tags) {
        try {
          if (typeof admin.tags === 'string') {
            tags = JSON.parse(admin.tags);
            // 确保解析结果是数组
            if (!Array.isArray(tags)) {
              tags = [];
            }
          } else if (Array.isArray(admin.tags)) {
            tags = admin.tags;
          }
        } catch (parseError: any) {
          logger.warn(`Failed to parse tags for admin ${admin.id}:`, parseError.message);
          tags = [];
        }
      }

      return {
        ...admin,
        tags,
        // 将snake_case字段转换为camelCase，方便前端使用
        adminNumber: admin.admin_number || null,
        avatarUrl: admin.avatar_url || null,
        isActive: admin.is_active !== undefined ? admin.is_active : true,
        lastLoginAt: admin.last_login_at || null,
        createdAt: admin.created_at || new Date(),
        updatedAt: admin.updated_at || new Date(),
        // 转换permissions字段
        permissions: (admin.permissions || []).map((p: any) => ({
          id: p.id,
          module: p.module,
          canView: p.can_view,
          canCreate: p.can_create,
          canUpdate: p.can_update,
          canDelete: p.can_delete,
        })),
      };
    });

    return { admins: adminsWithTags, total };
  } catch (error: any) {
    logger.error('Get admin users error:', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    // 返回空结果而不是抛出错误，避免前端崩溃
    return { admins: [], total: 0 };
  }
}

/**
 * 创建或更新管理员权限
 */
export async function updateAdminPermissions(adminId: string, permissions: Array<{
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}>): Promise<void> {
  try {
    // 先删除该管理员的所有权限
    await adminPrisma.admin_permissions.deleteMany({
      where: { admin_id: adminId },
    });

    // 创建新权限
    await adminPrisma.admin_permissions.createMany({
      data: permissions.map(p => ({
        id: `${adminId}_${p.module}`,
        admin_id: adminId,
        module: p.module,
        can_view: p.canView,
        can_create: p.canCreate,
        can_update: p.canUpdate,
        can_delete: p.canDelete,
        updated_at: new Date(),
      })),
    });

    logger.info(`Admin permissions updated: ${adminId}`);
  } catch (error) {
    logger.error('Update admin permissions error:', error);
    throw new Error('ADMIN_PERMISSIONS_UPDATE_FAILED');
  }
}

/**
 * 禁用/解禁用户
 */
export async function toggleUserBan(userId: string, action: 'ban' | 'unban'): Promise<void> {
  try {
    await userPrisma.user.update({
      where: { id: userId },
      data: { isActive: action === 'unban' },
    });
    logger.info(`User ${action}: ${userId}`);
  } catch (error) {
    logger.error('Toggle user ban error:', error);
    throw new Error('USER_BAN_TOGGLE_FAILED');
  }
}

/**
 * 更新用户VIP状态
 */
export async function updateUserVip(userId: string, isVip: boolean, vipPermissions?: string[]): Promise<void> {
  try {
    // 获取当前用户的tags，保留原有的标签
    const user = await userPrisma.user.findUnique({
      where: { id: userId },
      select: { tags: true },
    });

    let tagsData: any = { tags: [] };
    if (user?.tags) {
      try {
        const parsed = typeof user.tags === 'string' ? JSON.parse(user.tags) : user.tags;
        if (Array.isArray(parsed)) {
          // 如果是数组，说明是旧格式的标签
          tagsData = { tags: parsed };
        } else if (typeof parsed === 'object' && parsed !== null) {
          // 如果是对象，保留所有字段
          tagsData = parsed;
          // 确保tags字段存在
          if (!tagsData.tags) {
            tagsData.tags = [];
          }
        }
      } catch (e) {
        // 解析失败，使用空数组
        tagsData = { tags: [] };
      }
    }

    // 更新VIP权限
    if (isVip && vipPermissions) {
      tagsData.vipPermissions = vipPermissions;
    } else if (!isVip) {
      delete tagsData.vipPermissions;
    }

    await userPrisma.user.update({
      where: { id: userId },
      data: { 
        isVip,
        tags: JSON.stringify(tagsData),
      },
    });
    logger.info(`User VIP status updated: ${userId}, isVip=${isVip}, vipPermissions=${JSON.stringify(vipPermissions)}`);
  } catch (error) {
    logger.error('Update user VIP error:', error);
    throw new Error('USER_VIP_UPDATE_FAILED');
  }
}

/**
 * 更新用户标签
 */
export async function updateUserTags(userId: string, tags: string[]): Promise<void> {
  try {
    await userPrisma.user.update({
      where: { id: userId },
      data: { tags: JSON.stringify(tags) },
    });
    logger.info(`User tags updated: ${userId}, tags: ${tags.join(',')}`);
  } catch (error) {
    logger.error('Update user tags error:', error);
    throw new Error('USER_TAGS_UPDATE_FAILED');
  }
}

/**
 * 更新用户身份与组织名称（管理端）
 */
export async function updateUserProfile(userId: string, data: { identityType?: string | null; organizationName?: string | null; region?: string | null }): Promise<void> {
  try {
    const updateData: { identityType?: string | null; organizationName?: string | null; region?: string | null } = {};
    if (data.identityType !== undefined) updateData.identityType = data.identityType || null;
    if (data.organizationName !== undefined) updateData.organizationName = data.organizationName || null;
    if (data.region !== undefined) updateData.region = data.region || null;
    await userPrisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    logger.info(`User profile updated: ${userId}, identityType=${data.identityType}, organizationName=${data.organizationName}, region=${data.region}`);
  } catch (error) {
    logger.error('Update user profile error:', error);
    throw new Error('USER_PROFILE_UPDATE_FAILED');
  }
}

/**
 * 更新管理员标签
 */
export async function updateAdminTags(adminId: string, tags: string[]): Promise<void> {
  try {
    await adminPrisma.admins.update({
      where: { id: adminId },
      data: { tags: JSON.stringify(tags) },
    });
    logger.info(`Admin tags updated: ${adminId}, tags: ${tags.join(',')}`);
  } catch (error) {
    logger.error('Update admin tags error:', error);
    throw new Error('ADMIN_TAGS_UPDATE_FAILED');
  }
}

/**
 * 获取用户行为日志
 */
export async function getUserActionLogs(userId: string, limit: number = 100, offset: number = 0): Promise<{ logs: any[]; total: number }> {
  try {
    const [logs, total] = await Promise.all([
      userPrisma.userAction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      userPrisma.userAction.count({
        where: { userId },
      }),
    ]);

    return {
      logs: logs.map(log => ({
        id: log.id,
        actionType: log.actionType,
        contentType: log.contentType,
        contentId: log.contentId,
        metadata: log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : null,
        createdAt: log.createdAt,
      })),
      total,
    };
  } catch (error) {
    logger.error('获取用户行为日志失败:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * 获取用户画像（详细信息）
 */
export async function getUserProfile(userId: string): Promise<any> {
  try {
    // 获取用户基本信息
    const user = await userPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userNumber: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubId: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        location: true,
        skills: true,
        interests: true,
        passwordHash: true,
        level: true,
        points: true,
        isVip: true,
        isActive: true,
        lastLoginAt: true,
        tags: true,
        role: true,
        identityType: true,
        organizationName: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 解析 tags 字段（可能包含标签、GitHub数据、VIP权限等）
    let tags: string[] = [];
    let githubData: any = null;
    let vipPermissions: string[] = [];
    
    if (user.tags) {
      try {
        if (typeof user.tags === 'string') {
          const parsed = JSON.parse(user.tags);
          if (Array.isArray(parsed)) {
            tags = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            // 检查是否是GitHub数据
            if (parsed.followers !== undefined || parsed.publicRepos !== undefined || parsed.htmlUrl) {
              githubData = parsed;
            } else {
              // 可能是包含tags和vipPermissions的对象
              if (parsed.tags && Array.isArray(parsed.tags)) {
                tags = parsed.tags;
              }
              if (parsed.vipPermissions && Array.isArray(parsed.vipPermissions)) {
                vipPermissions = parsed.vipPermissions;
              }
            }
          }
        } else if (Array.isArray(user.tags)) {
          tags = user.tags;
        }
      } catch (parseError: any) {
        logger.warn(`Failed to parse tags for user ${userId}:`, parseError.message);
        tags = [];
      }
    }

    // 获取用户行为统计
    const [viewCount, likeCount, favoriteCount] = await Promise.all([
      userPrisma.userAction.count({
        where: {
          userId,
          actionType: 'view',
        },
      }),
      userPrisma.userAction.count({
        where: {
          userId,
          actionType: 'like',
        },
      }),
      userPrisma.userAction.count({
        where: {
          userId,
          actionType: 'favorite',
        },
      }),
    ]);

    // 获取内容偏好统计（按内容类型分组）
    const contentActions = await userPrisma.userAction.findMany({
      where: {
        userId,
        actionType: { in: ['view', 'like', 'favorite'] },
      },
      select: {
        contentType: true,
      },
    });

    const contentStats: Record<string, number> = {};
    contentActions.forEach(action => {
      contentStats[action.contentType] = (contentStats[action.contentType] || 0) + 1;
    });

    // 构建返回数据
    return {
      id: user.id,
      userNumber: user.userNumber || '',
      username: user.username || '',
      email: user.email || null,
      avatar: user.avatarUrl || null,
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || null,
      githubId: user.githubId || null,
      githubUrl: user.githubUrl || null,
      linkedinUrl: user.linkedinUrl || null,
      twitterUrl: user.twitterUrl || null,
      websiteUrl: user.websiteUrl || null,
      location: user.location || null,
      skills: user.skills || null,
      interests: user.interests || null,
      level: user.level || 1,
      points: user.points || 0,
      isVip: user.isVip || false,
      isActive: user.isActive !== undefined ? user.isActive : true,
      lastLoginAt: user.lastLoginAt || null,
      identityType: (user as any).identityType || null,
      organizationName: (user as any).organizationName || null,
      region: (user as any).region || null,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
      registerType: user.githubId 
        ? (user.passwordHash ? 'github_and_email' : 'github') 
        : (user.passwordHash ? 'email' : 'unknown'),
      tags,
      vipPermissions,
      githubData,
      actionStats: {
        view: viewCount,
        like: likeCount,
        favorite: favoriteCount,
      },
      contentStats,
    };
  } catch (error: any) {
    logger.error('Get user profile error:', {
      error: error.message,
      userId,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * 获取用户端用户统计（注册用户页顶部卡片用）
 */
export async function getUsersStats(): Promise<{
  total: number;
  active: number;
  vip: number;
  github: number;
  email: number;
  today: number;
  week: number;
  month: number;
}> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      total,
      active,
      vip,
      githubCount,
      emailCount,
      newToday,
      newThisWeek,
      newThisMonth,
    ] = await Promise.all([
      userPrisma.user.count(),
      userPrisma.user.count({ where: { isActive: true } }),
      userPrisma.user.count({ where: { isVip: true } }),
      userPrisma.user.count({ where: { githubId: { not: null } } }),
      userPrisma.user.count({ where: { passwordHash: { not: null } } }),
      userPrisma.user.count({ where: { createdAt: { gte: today } } }),
      userPrisma.user.count({ where: { createdAt: { gte: thisWeekStart } } }),
      userPrisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
    ]);

    return {
      total,
      active,
      vip,
      github: githubCount,
      email: emailCount,
      today: newToday,
      week: newThisWeek,
      month: newThisMonth,
    };
  } catch (error: any) {
    logger.error('Get users stats error:', { error: error.message });
    return {
      total: 0,
      active: 0,
      vip: 0,
      github: 0,
      email: 0,
      today: 0,
      week: 0,
      month: 0,
    };
  }
}

/** 数据看板空结构（用户库未连接或查询失败时返回，避免 500 导致前端一直 loading） */
function getDefaultDashboardStats(): any {
  return {
    users: {
      total: 0,
      newToday: 0,
      newThisWeek: 0,
      newThisMonth: 0,
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0,
      growthRate: 0,
    },
    content: {
      total: 0,
      papers: { total: 0, newToday: 0, newThisWeek: 0 },
      videos: { total: 0, newToday: 0, newThisWeek: 0 },
      repos: { total: 0, newToday: 0, newThisWeek: 0 },
      jobs: 0,
      huggingface: 0,
      banners: 0,
      distribution: { papers: 0, videos: 0, repos: 0, jobs: 0, huggingface: 0, total: 0 },
    },
    community: {
      posts: { total: 0, newToday: 0, newThisWeek: 0, growthRate: 0 },
      comments: { total: 0, newToday: 0, newThisWeek: 0, growthRate: 0 },
      favorites: { total: 0, newToday: 0, newThisWeek: 0 },
    },
    subscriptions: { active: 0 },
    recentItems: { repos: [], papers: [], videos: [] },
    retention: {
      day1: { rate: 0, users: 0 },
      day7: { rate: 0, users: 0 },
      day30: { rate: 0, users: 0 },
      trend: [],
    },
    traffic: {
      pvToday: 0,
      uvToday: 0,
      pvThisWeek: 0,
      uvThisWeek: 0,
      topPages: [],
    },
    contentQuality: {
      avgViewCount: 0,
      avgInteractionRate: 0,
      topPapers: [],
      topVideos: [],
      topRepos: [],
    },
  };
}

/**
 * 获取数据统计（增强版 - 包含趋势和详细维度）
 * 数据来源：用户库（USER_DATABASE_URL / dev-user.db），若库为空或未迁移则各项为 0
 */
export async function getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 基础统计
    const [totalUsers, totalPapers, totalVideos, totalRepos, totalJobs, totalHuggingFace, totalBanners, totalPosts, totalComments, totalFavorites, totalSubscriptions] = await Promise.all([
      userPrisma.user.count(),
      userPrisma.paper.count(),
      userPrisma.video.count(),
      userPrisma.githubRepo.count(),
      userPrisma.job.count({ where: { status: 'open' } }),
      userPrisma.huggingFaceModel.count(),
      userPrisma.banner.count(),
      userPrisma.post.count(),
      userPrisma.comment.count(),
      userPrisma.favorite.count(),
      userPrisma.subscription.count({ where: { isActive: true } }),
    ]);

    // 用户增长统计
    const [newUsersToday, newUsersThisWeek, newUsersThisMonth, activeUsersToday, activeUsersThisWeek, activeUsersThisMonth] = await Promise.all([
      userPrisma.user.count({ where: { createdAt: { gte: today } } }),
      userPrisma.user.count({ where: { createdAt: { gte: thisWeekStart } } }),
      userPrisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      userPrisma.user.count({
        where: {
          userActions: {
            some: {
              createdAt: { gte: today },
            },
          },
        },
      }),
      userPrisma.user.count({
        where: {
          userActions: {
            some: {
              createdAt: { gte: sevenDaysAgo },
            },
          },
        },
      }),
      userPrisma.user.count({
        where: {
          userActions: {
            some: {
              createdAt: { gte: thirtyDaysAgo },
            },
          },
        },
      }),
    ]);

    // 内容增长统计
    const [newPapersToday, newPapersThisWeek, newVideosToday, newVideosThisWeek, newReposToday, newReposThisWeek] = await Promise.all([
      userPrisma.paper.count({ where: { createdAt: { gte: today } } }),
      userPrisma.paper.count({ where: { createdAt: { gte: thisWeekStart } } }),
      userPrisma.video.count({ where: { createdAt: { gte: today } } }),
      userPrisma.video.count({ where: { createdAt: { gte: thisWeekStart } } }),
      userPrisma.githubRepo.count({ where: { createdAt: { gte: today } } }),
      userPrisma.githubRepo.count({ where: { createdAt: { gte: thisWeekStart } } }),
    ]);

    // 市集活跃度统计
    const [newPostsToday, newPostsThisWeek, newCommentsToday, newCommentsThisWeek, newFavoritesToday, newFavoritesThisWeek] = await Promise.all([
      userPrisma.post.count({ where: { createdAt: { gte: today } } }),
      userPrisma.post.count({ where: { createdAt: { gte: thisWeekStart } } }),
      userPrisma.comment.count({ where: { createdAt: { gte: today } } }),
      userPrisma.comment.count({ where: { createdAt: { gte: thisWeekStart } } }),
      userPrisma.favorite.count({ where: { createdAt: { gte: today } } }),
      userPrisma.favorite.count({ where: { createdAt: { gte: thisWeekStart } } }),
    ]);

    // 内容类型分布
    const contentDistribution = {
      papers: totalPapers,
      videos: totalVideos,
      repos: totalRepos,
      jobs: totalJobs,
      huggingface: totalHuggingFace,
      total: totalPapers + totalVideos + totalRepos + totalJobs + totalHuggingFace,
    };

    // 计算增长率（本周 vs 上周）
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const [newUsersLastWeek, newPostsLastWeek, newCommentsLastWeek] = await Promise.all([
      userPrisma.user.count({ where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
      userPrisma.post.count({ where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
      userPrisma.comment.count({ where: { createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
    ]);

    const userGrowthRate = newUsersLastWeek > 0 
      ? ((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek * 100).toFixed(1)
      : newUsersThisWeek > 0 ? '100.0' : '0.0';
    const postGrowthRate = newPostsLastWeek > 0
      ? ((newPostsThisWeek - newPostsLastWeek) / newPostsLastWeek * 100).toFixed(1)
      : newPostsThisWeek > 0 ? '100.0' : '0.0';
    const commentGrowthRate = newCommentsLastWeek > 0
      ? ((newCommentsThisWeek - newCommentsLastWeek) / newCommentsLastWeek * 100).toFixed(1)
      : newCommentsThisWeek > 0 ? '100.0' : '0.0';

    // 用户留存分析
    const day1Ago = new Date(today);
    day1Ago.setDate(day1Ago.getDate() - 1);
    const day7Ago = new Date(today);
    day7Ago.setDate(day7Ago.getDate() - 7);
    const day30Ago = new Date(today);
    day30Ago.setDate(day30Ago.getDate() - 30);

    const usersRegisteredYesterday = await userPrisma.user.count({
      where: { createdAt: { gte: day1Ago, lt: today } },
    });
    const usersRegistered7DaysAgo = await userPrisma.user.count({
      where: { createdAt: { gte: day7Ago, lt: new Date(day7Ago.getTime() + 24 * 60 * 60 * 1000) } },
    });
    const usersRegistered30DaysAgo = await userPrisma.user.count({
      where: { createdAt: { gte: day30Ago, lt: new Date(day30Ago.getTime() + 24 * 60 * 60 * 1000) } },
    });

    const retainedDay1 = usersRegisteredYesterday > 0 ? await userPrisma.user.count({
      where: {
        createdAt: { gte: day1Ago, lt: today },
        userActions: { some: { createdAt: { gte: today } } },
      },
    }) : 0;

    const retainedDay7 = usersRegistered7DaysAgo > 0 ? await userPrisma.user.count({
      where: {
        createdAt: { gte: day7Ago, lt: new Date(day7Ago.getTime() + 24 * 60 * 60 * 1000) },
        userActions: { some: { createdAt: { gte: today } } },
      },
    }) : 0;

    const retainedDay30 = usersRegistered30DaysAgo > 0 ? await userPrisma.user.count({
      where: {
        createdAt: { gte: day30Ago, lt: new Date(day30Ago.getTime() + 24 * 60 * 60 * 1000) },
        userActions: { some: { createdAt: { gte: today } } },
      },
    }) : 0;

    const retention = {
      day1: {
        rate: usersRegisteredYesterday > 0 ? parseFloat(((retainedDay1 / usersRegisteredYesterday) * 100).toFixed(1)) : 0,
        users: retainedDay1,
      },
      day7: {
        rate: usersRegistered7DaysAgo > 0 ? parseFloat(((retainedDay7 / usersRegistered7DaysAgo) * 100).toFixed(1)) : 0,
        users: retainedDay7,
      },
      day30: {
        rate: usersRegistered30DaysAgo > 0 ? parseFloat(((retainedDay30 / usersRegistered30DaysAgo) * 100).toFixed(1)) : 0,
        users: retainedDay30,
      },
      trend: [] as Array<{ date: string; rate: number }>,
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const registeredOnDate = await userPrisma.user.count({
        where: { createdAt: { gte: date, lt: nextDate } },
      });
      const retainedNextDay = registeredOnDate > 0 ? await userPrisma.user.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          userActions: { some: { createdAt: { gte: nextDate } } },
        },
      }) : 0;

      retention.trend.push({
        date: date.toISOString().split('T')[0],
        rate: registeredOnDate > 0 ? parseFloat(((retainedNextDay / registeredOnDate) * 100).toFixed(1)) : 0,
      });
    }

    // 流量分析 (基于 UserAction)
    const pvToday = await userPrisma.userAction.count({
      where: { createdAt: { gte: today } },
    });
    const pvThisWeek = await userPrisma.userAction.count({
      where: { createdAt: { gte: thisWeekStart } },
    });
    const uvToday = activeUsersToday;
    const uvThisWeek = activeUsersThisWeek;

    const topPagesRaw = await userPrisma.userAction.groupBy({
      by: ['actionType'],
      where: { createdAt: { gte: today } },
      _count: { actionType: true },
      orderBy: { _count: { actionType: 'desc' } },
      take: 10,
    });
    const topPages = topPagesRaw.map((p: any) => ({
      page: p.actionType,
      views: p._count.actionType,
    }));

    const traffic = {
      pvToday,
      uvToday,
      pvThisWeek,
      uvThisWeek,
      topPages,
    };

    // 内容质量指标
    const [paperViews, videoViews, repoViews, paperCount, videoCount, repoCount] = await Promise.all([
      userPrisma.paper.aggregate({ _sum: { viewCount: true } }),
      userPrisma.video.aggregate({ _sum: { viewCount: true } }),
      userPrisma.githubRepo.aggregate({ _sum: { viewCount: true } }),
      userPrisma.paper.count(),
      userPrisma.video.count(),
      userPrisma.githubRepo.count(),
    ]);

    const totalContentViews = paperCount + videoCount + repoCount;

    const totalViews = (paperViews._sum.viewCount || 0) + (videoViews._sum.viewCount || 0) + (repoViews._sum.viewCount || 0);
    const avgViewCount = totalContentViews > 0 ? parseFloat((totalViews / totalContentViews).toFixed(1)) : 0;

    const totalInteractions = totalFavorites + totalComments;
    const avgInteractionRate = totalContentViews > 0 ? parseFloat(((totalInteractions / totalContentViews) * 100).toFixed(2)) : 0;

    const [topPapers, topVideos, topRepos] = await Promise.all([
      userPrisma.paper.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, title: true, viewCount: true, citationCount: true, createdAt: true },
      }).catch(() => []),
      userPrisma.video.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, title: true, viewCount: true, playCount: true, createdAt: true },
      }).catch(() => []),
      userPrisma.githubRepo.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, name: true, fullName: true, viewCount: true, starsCount: true, createdAt: true },
      }).catch(() => []),
    ]);

    const contentQuality = {
      avgViewCount,
      avgInteractionRate,
      topPapers,
      topVideos,
      topRepos,
    };

    return {
      // 用户数据
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        activeToday: activeUsersToday,
        activeThisWeek: activeUsersThisWeek,
        activeThisMonth: activeUsersThisMonth,
        growthRate: parseFloat(userGrowthRate),
      },
      // 内容数据
      content: {
        total: contentDistribution.total,
        papers: {
          total: totalPapers,
          newToday: newPapersToday,
          newThisWeek: newPapersThisWeek,
        },
        videos: {
          total: totalVideos,
          newToday: newVideosToday,
          newThisWeek: newVideosThisWeek,
        },
        repos: {
          total: totalRepos,
          newToday: newReposToday,
          newThisWeek: newReposThisWeek,
        },
        jobs: totalJobs,
        huggingface: totalHuggingFace,
        banners: totalBanners,
        distribution: contentDistribution,
      },
      // 市集数据
      community: {
        posts: {
          total: totalPosts,
          newToday: newPostsToday,
          newThisWeek: newPostsThisWeek,
          growthRate: parseFloat(postGrowthRate),
        },
        comments: {
          total: totalComments,
          newToday: newCommentsToday,
          newThisWeek: newCommentsThisWeek,
          growthRate: parseFloat(commentGrowthRate),
        },
        favorites: {
          total: totalFavorites,
          newToday: newFavoritesToday,
          newThisWeek: newFavoritesThisWeek,
        },
      },
      // 订阅数据
      subscriptions: {
        active: totalSubscriptions,
      },
      // 用户留存分析
      retention,
      // 流量分析
      traffic,
      // 内容质量指标
      contentQuality,
      // 最近同步的内容（用于展示）
      recentItems: {
        repos: await userPrisma.githubRepo.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            name: true,
            fullName: true,
            starsCount: true,
            language: true,
            viewCount: true,
            description: true,
            updatedDate: true,
            createdAt: true,
          },
        }).catch(() => []),
        papers: await userPrisma.paper.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            title: true,
            citationCount: true,
            publishedDate: true,
            viewCount: true,
            createdAt: true,
          },
        }).catch(() => []),
        videos: await userPrisma.video.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            title: true,
            playCount: true,
            publishedDate: true,
            viewCount: true,
            createdAt: true,
          },
        }).catch(() => []),
      },
    };
  } catch (error) {
    logger.error('Get statistics error (returning empty stats). 请检查用户库是否已连接并执行迁移: USER_DATABASE_URL / dev-user.db', error);
    return getDefaultDashboardStats();
  }
}

/**
 * 管理端岗位列表（从用户库读取，与用户端同源，支持按状态筛选）
 */
export async function getAdminJobsList(params: {
  skip: number;
  take: number;
  status?: 'open' | 'closed' | 'all';
  keyword?: string;
}): Promise<{ items: any[]; total: number }> {
  const where: any = {};
  if (params.status && params.status !== 'all') {
    where.status = params.status;
  }
  if (params.keyword) {
    where.OR = [
      { title: { contains: params.keyword } },
      { company: { contains: params.keyword } },
      { location: { contains: params.keyword } },
    ];
  }
  const [items, total] = await Promise.all([
    userPrisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    }),
    userPrisma.job.count({ where }),
  ]);
  const now = new Date();
  return {
    items: items.map((j: any) => {
      const expiresAt = j.expiresAt ? new Date(j.expiresAt) : null;
      let remainingDays: number | null = null;
      if (expiresAt && expiresAt > now) {
        const diffTime = expiresAt.getTime() - now.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return {
        ...j,
        applyUrl: j.apply_url ?? j.applyUrl,
        isExpired: j.expiresAt ? new Date(j.expiresAt) <= now : false,
        remainingDays,
      };
    }),
    total,
  };
}

/**
 * 管理端求职者列表（从用户库读取）
 * 注意：JobSeeking 模型尚未实现，暂时返回空数据
 */
export async function getAdminJobSeekingPostsList(params: {
  skip: number;
  take: number;
  keyword?: string;
}): Promise<{ items: any[]; total: number }> {
  // TODO: 实现 JobSeeking 模型后启用此功能
  return { items: [], total: 0 };
}

// 导出内容管理函数
export const adminContentService = {
  // 论文管理
  paper: {
    create: createPaper,
    update: updatePaper,
    delete: deletePaper,
  },
  // 视频管理
  video: {
    create: createVideo,
    update: updateVideo,
    delete: deleteVideo,
  },
  // GitHub管理
  repo: {
    create: createRepo,
    update: updateRepo,
    delete: deleteRepo,
  },
  // 岗位管理
  job: {
    create: createJob,
    update: updateJob,
    delete: deleteJob,
  },
  // Hugging Face 管理
  huggingface: {
    create: createHuggingFaceModel,
    update: updateHuggingFaceModel,
    delete: deleteHuggingFaceModel,
  },
  // Banner管理
  banner: {
    create: createBanner,
    update: updateBanner,
    delete: deleteBanner,
  },
};

/**
 * 导出用户数据为Excel
 */
export async function exportUsersToExcel(params: {
  keyword?: string;
  registerType?: string;
  status?: string;
  level?: string;
  isVip?: string;
  pointsMin?: number;
  pointsMax?: number;
  dateStart?: string;
  dateEnd?: string;
  tags?: string[];
}): Promise<Buffer> {
  const where: any = {};

  if (params.keyword) {
    where.OR = [
      { username: { contains: params.keyword } },
      { email: { contains: params.keyword } },
      { userNumber: { contains: params.keyword } },
    ];
  }

  if (params.level) {
    where.level = parseInt(params.level);
  }

  if (params.status === 'active') {
    where.isActive = true;
  } else if (params.status === 'banned') {
    where.isActive = false;
  }

  if (params.registerType) {
    if (params.registerType === 'github') {
      where.githubId = { not: null };
      where.passwordHash = null;
    } else if (params.registerType === 'email') {
      where.passwordHash = { not: null };
      where.githubId = null;
    } else if (params.registerType === 'github_and_email') {
      where.githubId = { not: null };
      where.passwordHash = { not: null };
    }
  }

  if (params.isVip === 'true') {
    where.isVip = true;
  } else if (params.isVip === 'false') {
    where.isVip = false;
  }

  if (params.pointsMin !== undefined) {
    where.points = { ...where.points, gte: params.pointsMin };
  }
  if (params.pointsMax !== undefined) {
    where.points = { ...where.points, lte: params.pointsMax };
  }

  if (params.dateStart) {
    where.createdAt = { ...where.createdAt, gte: new Date(params.dateStart) };
  }
  if (params.dateEnd) {
    const endDate = new Date(params.dateEnd);
    endDate.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: endDate };
  }

  const users = await userPrisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userNumber: true,
      username: true,
      email: true,
      githubId: true,
      passwordHash: true,
      level: true,
      points: true,
      isVip: true,
      isActive: true,
      lastLoginAt: true,
      tags: true,
      identityType: true,
      organizationName: true,
      region: true,
      bio: true,
      location: true,
      githubUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      skills: true,
      interests: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Embodied Pulse Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('用户数据', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: '用户编码', key: 'userNumber', width: 18 },
    { header: '用户名', key: 'username', width: 16 },
    { header: '邮箱', key: 'email', width: 28 },
    { header: '注册方式', key: 'registerType', width: 14 },
    { header: '身份', key: 'identityType', width: 12 },
    { header: '组织名称', key: 'organizationName', width: 20 },
    { header: '地域', key: 'region', width: 14 },
    { header: '等级', key: 'level', width: 8 },
    { header: '积分', key: 'points', width: 10 },
    { header: 'VIP', key: 'isVip', width: 8 },
    { header: '状态', key: 'isActive', width: 10 },
    { header: '标签', key: 'tags', width: 20 },
    { header: '个人简介', key: 'bio', width: 30 },
    { header: '位置', key: 'location', width: 16 },
    { header: '技能', key: 'skills', width: 20 },
    { header: '兴趣', key: 'interests', width: 20 },
    { header: 'GitHub', key: 'githubUrl', width: 30 },
    { header: 'LinkedIn', key: 'linkedinUrl', width: 30 },
    { header: 'Twitter', key: 'twitterUrl', width: 30 },
    { header: '网站', key: 'websiteUrl', width: 30 },
    { header: '注册时间', key: 'createdAt', width: 18 },
    { header: '最近登录', key: 'lastLoginAt', width: 18 },
    { header: '更新时间', key: 'updatedAt', width: 18 },
  ];

  worksheet.getRow(1).font = { bold: true, size: 11 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F4FF' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const identityTypeLabel: Record<string, string> = {
    university: '高校',
    enterprise: '企业',
    personal: '个人爱好',
    other: '其他',
  };

  const regionLabel: Record<string, string> = {
    mainland_china: '中国大陆',
    hongkong_macao_taiwan: '中国港澳台',
    overseas: '海外',
  };

  users.forEach((user: any) => {
    let tags: string[] = [];
    if (user.tags) {
      try {
        const parsed = typeof user.tags === 'string' ? JSON.parse(user.tags) : user.tags;
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else if (typeof parsed === 'object' && parsed.tags) {
          tags = Array.isArray(parsed.tags) ? parsed.tags : [];
        }
      } catch (e) {
        tags = [];
      }
    }

    const registerType = user.githubId
      ? (user.passwordHash ? 'GitHub + 邮箱' : 'GitHub')
      : (user.passwordHash ? '邮箱' : '未知');

    worksheet.addRow({
      userNumber: user.userNumber || '-',
      username: user.username || '-',
      email: user.email || '-',
      registerType,
      identityType: user.identityType ? (identityTypeLabel[user.identityType] || user.identityType) : '-',
      organizationName: user.organizationName || '-',
      region: user.region ? (regionLabel[user.region] || user.region) : '-',
      level: user.level || 1,
      points: user.points || 0,
      isVip: user.isVip ? '是' : '否',
      isActive: user.isActive ? '正常' : '已禁用',
      tags: tags.length > 0 ? tags.join(', ') : '-',
      bio: user.bio || '-',
      location: user.location || '-',
      skills: user.skills || '-',
      interests: user.interests || '-',
      githubUrl: user.githubUrl || '-',
      linkedinUrl: user.linkedinUrl || '-',
      twitterUrl: user.twitterUrl || '-',
      websiteUrl: user.websiteUrl || '-',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-',
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录',
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toLocaleString('zh-CN') : '-',
    });
  });

  worksheet.eachRow((row, rowNum) => {
    if (rowNum > 1) {
      row.alignment = { vertical: 'middle' };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
