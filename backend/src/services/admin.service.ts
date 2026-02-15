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
import { createNews, updateNews, deleteNews } from './news-admin.service';
import userPrisma from '../config/database.user';
import adminPrisma from '../config/database.admin';

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
            githubId: true,
            passwordHash: true,
            level: true,
            points: true,
            isVip: true,
            isActive: true,
            lastLoginAt: true,
            tags: true,
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
              githubId: true,
              passwordHash: true,
              level: true,
              points: true,
              isVip: true,
              isActive: true,
              lastLoginAt: true,
              tags: true,
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
        logger.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }

    // 处理用户数据，添加注册方式信息和role字段
    const usersWithRegisterType = users.map(user => {
      // 安全地解析 tags JSON
      // tags字段可能存储标签数组或GitHub数据对象
      let tags: string[] = [];
      let githubData: any = null;
      
      if (user.tags) {
        try {
          if (typeof user.tags === 'string') {
            const parsed = JSON.parse(user.tags);
            // 判断是数组（标签）还是对象（GitHub数据）
            if (Array.isArray(parsed)) {
              tags = parsed;
            } else if (typeof parsed === 'object' && parsed !== null) {
              // 如果是对象，检查是否是GitHub数据（有githubData特征字段）
              if (parsed.followers !== undefined || parsed.publicRepos !== undefined || parsed.htmlUrl) {
                githubData = parsed;
              } else {
                // 可能是其他格式的对象，尝试作为标签处理
                tags = [];
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
        role: 'user', // 用户数据库中的用户都是普通用户
        registerType: user.githubId 
          ? (user.passwordHash ? 'github_and_email' : 'github') 
          : (user.passwordHash ? 'email' : 'unknown'),
        hasPassword: !!user.passwordHash,
        hasGithub: !!user.githubId,
        tags,
        githubData, // GitHub额外数据
        // 确保所有字段都有默认值
        userNumber: user.userNumber || '',
        username: user.username || '',
        email: user.email || null,
        avatarUrl: user.avatarUrl || null,
        level: user.level || 1,
        points: user.points || 0,
        isVip: user.isVip || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
      };
    });

    return { users: usersWithRegisterType, total };
  } catch (error: any) {
    logger.error('Get user end users error:', {
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
        admin_id: adminId,
        module: p.module,
        can_view: p.canView,
        can_create: p.canCreate,
        can_update: p.canUpdate,
        can_delete: p.canDelete,
      })),
    } as any);

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
export async function updateUserVip(userId: string, isVip: boolean): Promise<void> {
  try {
    await userPrisma.user.update({
      where: { id: userId },
      data: { isVip },
    });
    logger.info(`User VIP status updated: ${userId}, isVip=${isVip}`);
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
 * 获取数据统计（增强版 - 包含趋势和详细维度）
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
      // 最近同步的内容（用于展示）
      recentItems: {
        repos: await userPrisma.githubRepo.findMany({
          orderBy: { updatedDate: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            fullName: true,
            starsCount: true,
            language: true,
            viewCount: true,
            description: true,
            updatedDate: true,
          },
        }).catch(() => []),
        papers: await userPrisma.paper.findMany({
          orderBy: { publishedDate: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            citationCount: true,
            publishedDate: true,
            viewCount: true,
          },
        }).catch(() => []),
        videos: await userPrisma.video.findMany({
          orderBy: { publishedDate: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            playCount: true,
            publishedDate: true,
            viewCount: true,
          },
        }).catch(() => []),
      },
    };
  } catch (error) {
    logger.error('Get statistics error:', error);
    throw new Error('STATISTICS_FETCH_FAILED');
  }
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
  // 新闻管理
  news: {
    create: createNews,
    update: updateNews,
    delete: deleteNews,
  },
};
