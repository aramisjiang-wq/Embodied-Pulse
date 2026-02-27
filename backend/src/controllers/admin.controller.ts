/**
 * 管理端控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getUserEndUsers, getAdminUsers, getUsersStats, toggleUserBan, getStatistics, adminContentService, updateAdminPermissions, updateUserTags, updateAdminTags, updateUserVip, updateUserProfile, getUserActionLogs, getUserProfile, getAdminJobsList, getAdminJobSeekingPostsList, exportUsersToExcel } from '../services/admin.service';
import { getAdminAuditLogs } from '../services/admin-audit.service';
import { parsePaginationParams, buildPaginationResponse } from '../utils/pagination';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { syncHuggingFacePapersByDate, syncRecentHuggingFacePapers } from '../services/sync/huggingface-papers.sync';

/**
 * 获取用户端用户列表
 */
export async function getUserEndUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { keyword, level, status, registerType } = req.query;

    const { users, total } = await getUserEndUsers(
      skip,
      take,
      keyword as string,
      level ? parseInt(level as string) : undefined,
      status as string,
      registerType as string
    );

    const items = Array.isArray(users) ? users : [];
    const totalCount = typeof total === 'number' ? total : 0;
    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, totalCount),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取用户端用户统计（注册用户页顶部卡片）
 */
export async function getUsersStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getUsersStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取管理员列表
 */
export async function getAdmins(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { keyword, role } = req.query;

    const { admins, total } = await getAdminUsers(
      skip,
      take,
      keyword as string,
      role as string
    );

    sendSuccess(res, {
      items: admins,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新管理员权限
 */
export async function updateAdminPermissionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return sendError(res, 1001, '权限数据格式错误', 400);
    }

    await updateAdminPermissions(adminId, permissions);
    sendSuccess(res, { message: '权限更新成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 禁用/解禁用户
 */
export async function banUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { action } = req.body;

    if (!action || !['ban', 'unban'].includes(action)) {
      return sendError(res, 1001, 'action必须是ban或unban', 400);
    }

    await toggleUserBan(userId, action);
    sendSuccess(res, { message: `${action === 'ban' ? '禁用' : '解禁'}成功` });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新用户标签
 */
export async function updateUserTagsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return sendError(res, 1001, 'tags必须是数组', 400);
    }

    await updateUserTags(userId, tags);
    sendSuccess(res, { message: '标签更新成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新用户VIP状态
 */
export async function updateUserVipHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { isVip, vipPermissions } = req.body;

    if (typeof isVip !== 'boolean') {
      return sendError(res, 1001, 'isVip必须是布尔值', 400);
    }

    if (vipPermissions !== undefined && !Array.isArray(vipPermissions)) {
      return sendError(res, 1001, 'vipPermissions必须是数组', 400);
    }

    await updateUserVip(userId, isVip, vipPermissions);
    sendSuccess(res, { message: 'VIP状态更新成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取用户行为日志
 */
export async function getUserActionLogsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await getUserActionLogs(userId, Number(limit), Number(offset));
    sendSuccess(res, result);
  } catch (error: any) {
    logger.error('获取用户行为日志失败:', error);
    sendError(res, 5009, error.message || '获取失败', 500);
  }
}

/**
 * 获取用户画像
 */
export async function getUserProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 1001, '用户ID不能为空', 400);
    }

    const profile = await getUserProfile(id);
    sendSuccess(res, profile);
  } catch (error: any) {
    logger.error('获取用户画像失败:', error);
    if (error.message === 'USER_NOT_FOUND') {
      return sendError(res, 1005, '用户不存在', 404);
    }
    sendError(res, 5009, error.message || '获取失败', 500);
  }
}

/**
 * 更新用户身份与组织名称（管理端）
 */
export async function updateUserProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { identityType, organizationName, region } = req.body;

    if (!userId) {
      return sendError(res, 1001, '用户ID不能为空', 400);
    }

    await updateUserProfile(userId, { identityType, organizationName, region });
    sendSuccess(res, { message: '更新成功' });
  } catch (error: any) {
    if (error.message === 'USER_PROFILE_UPDATE_FAILED') {
      return sendError(res, 500, '更新失败', 500);
    }
    next(error);
  }
}

/**
 * 更新管理员标签
 */
export async function updateAdminTagsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminId } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return sendError(res, 1001, 'tags必须是数组', 400);
    }

    await updateAdminTags(adminId, tags);
    sendSuccess(res, { message: '标签更新成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建管理员
 */
export async function createAdminHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, role } = req.body;
    
    logger.info('Create admin request received:', { username, email, role });

    // 验证必填字段
    if (!username || !email || !password) {
      return sendError(res, 1001, '用户名、邮箱和密码为必填项', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 1001, '邮箱格式不正确', 400);
    }

    // 验证密码长度
    if (password.length < 6) {
      return sendError(res, 1001, '密码长度至少6位', 400);
    }

    // 导入创建管理员服务
    const { createAdmin } = await import('../services/admin-auth.service');
    
    // 创建管理员
    const admin = await createAdmin({
      username,
      email,
      password,
      role: role || 'admin',
    });

    logger.info(`Admin created: ${admin.id} (${admin.username})`);
    const responseData = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      adminNumber: admin.admin_number,
      createdAt: admin.created_at,
    };
    logger.info('Sending response data:', responseData);
    sendSuccess(res, responseData);
  } catch (error: any) {
    logger.error('Create admin error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    if (error.message === 'EMAIL_EXISTS') {
      return sendError(res, 1002, '该邮箱已被使用', 400);
    }
    next(error);
  }
}

/**
 * 获取数据统计
 */
export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

/**
 * 管理端岗位列表（与用户端同源，支持状态筛选）
 */
export async function getAdminJobsListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const status = (req.query.status as 'open' | 'closed' | 'all') || 'all';
    const keyword = req.query.keyword as string | undefined;

    const { items, total } = await getAdminJobsList({ skip, take, status, keyword });

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 管理端求职者列表
 */
export async function getAdminJobSeekingPostsListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const keyword = req.query.keyword as string | undefined;

    const { items, total } = await getAdminJobSeekingPostsList({ skip, take, keyword });

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建内容(通用)
 */
export async function createContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = req.params;
    const data = req.body;

    let result;
    switch (type) {
      case 'papers':
        result = await adminContentService.paper.create(data);
        break;
      case 'videos':
        result = await adminContentService.video.create(data);
        break;
      case 'repos':
        result = await adminContentService.repo.create(data);
        break;
      case 'jobs':
        result = await adminContentService.job.create(data);
        break;
      case 'banners':
        result = await adminContentService.banner.create(data);
        break;
      case 'huggingface':
        result = await adminContentService.huggingface.create(data);
        break;
      default:
        return sendError(res, 1001, '不支持的内容类型', 400);
    }

    sendSuccess(res, result);
  } catch (error: any) {
    // 如果是已知的错误，传递详细错误信息
    if (error.message && (error.message.startsWith('REPO_') || error.message.startsWith('REPOS_'))) {
      const errorCode = error.message.includes('CONFLICT') ? 1002 : 1001;
      const errorMessage = error.message.includes(':') 
        ? error.message.split(':')[1].trim() 
        : error.message;
      return sendError(res, errorCode, errorMessage, 400);
    }
    next(error);
  }
}

/**
 * 更新内容(通用)
 */
export async function updateContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, id } = req.params;
    const data = req.body;

    let result;
    switch (type) {
      case 'papers':
        result = await adminContentService.paper.update(id, data);
        break;
      case 'videos':
        result = await adminContentService.video.update(id, data);
        break;
      case 'repos':
        result = await adminContentService.repo.update(id, data);
        break;
      case 'jobs':
        result = await adminContentService.job.update(id, data);
        break;
      case 'banners':
        result = await adminContentService.banner.update(id, data);
        break;
      case 'huggingface':
        result = await adminContentService.huggingface.update(id, data);
        break;
      default:
        return sendError(res, 1001, '不支持的内容类型', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * 删除内容(通用)
 */
export async function deleteContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, id } = req.params;

    switch (type) {
      case 'papers':
        await adminContentService.paper.delete(id);
        break;
      case 'videos':
        await adminContentService.video.delete(id);
        break;
      case 'repos':
        await adminContentService.repo.delete(id);
        break;
      case 'jobs':
        await adminContentService.job.delete(id);
        break;
      case 'banners':
        await adminContentService.banner.delete(id);
        break;
      case 'huggingface':
        await adminContentService.huggingface.delete(id);
        break;
      default:
        return sendError(res, 1001, '不支持的内容类型', 400);
    }

    sendSuccess(res, { message: '删除成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 手动触发HuggingFace论文同步（指定日期）
 */
export async function syncHuggingFacePapersByDateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.params;
    const { maxResults } = req.query;

    const result = await syncHuggingFacePapersByDate(
      date,
      maxResults ? parseInt(maxResults as string) : 50
    );

    if (result.success) {
      sendSuccess(res, {
        message: 'HuggingFace论文同步完成',
        synced: result.synced,
        errors: result.errors,
        total: result.total,
      });
    } else {
      const errorMessage = 'message' in (result as any) ? (result as any).message : '同步失败';
      sendError(res, 1001, errorMessage, 500);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 手动触发HuggingFace论文同步（最近N天）
 */
export async function syncRecentHuggingFacePapersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = req.query;
    const { maxResults } = req.query;

    const result = await syncRecentHuggingFacePapers(
      days ? parseInt(days as string) : 7,
      maxResults ? parseInt(maxResults as string) : 50
    );

    if (result.success) {
      sendSuccess(res, {
        message: 'HuggingFace论文批量同步完成',
        synced: result.synced,
        errors: result.errors,
        total: result.total,
        details: result.details,
      });
    } else {
      sendError(res, 1001, (result as any).message || '同步失败', 500);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 获取同步统计（管理员）
 */
export async function getSyncStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = {
      lastSyncTime: new Date().toISOString(),
      totalItems: 0,
    };

    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

/**
 * 导出用户数据为Excel
 */
export async function exportUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { keyword, registerType, status, level, isVip, pointsMin, pointsMax, dateStart, dateEnd, tags } = req.query;

    const buffer = await exportUsersToExcel({
      keyword: keyword as string,
      registerType: registerType as string,
      status: status as string,
      level: level as string,
      isVip: isVip as string,
      pointsMin: pointsMin ? Number(pointsMin) : undefined,
      pointsMax: pointsMax ? Number(pointsMax) : undefined,
      dateStart: dateStart as string,
      dateEnd: dateEnd as string,
      tags: tags ? (tags as string).split(',') : undefined,
    });

    const filename = `用户数据_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    logger.error('Export users error:', error);
    next(error);
  }
}

/**
 * 管理端新闻列表
 */
export async function getAdminDailyNewsListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { dailyNewsService } = await import('../services/daily-news.service');
    
    const result = await dailyNewsService.findAll({
      page,
      size,
    });

    sendSuccess(res, {
      items: result.items,
      pagination: buildPaginationResponse(page, size, result.total),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建新闻
 */
export async function createDailyNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { dailyNewsService } = await import('../services/daily-news.service');
    const news = await dailyNewsService.create(req.body);
    sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
}

/**
 * 更新新闻
 */
export async function updateDailyNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { dailyNewsService } = await import('../services/daily-news.service');
    const news = await dailyNewsService.update(id, req.body);
    sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
}

/**
 * 删除新闻
 */
export async function deleteDailyNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { dailyNewsService } = await import('../services/daily-news.service');
    await dailyNewsService.delete(id);
    sendSuccess(res, { message: '删除成功' });
  } catch (error) {
    next(error);
  }
}

/**
 * 切换新闻置顶状态
 */
export async function toggleDailyNewsPinHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { dailyNewsService } = await import('../services/daily-news.service');
    const news = await dailyNewsService.togglePin(id);
    sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
}

/**
 * 通用内容置顶切换
 */
export async function toggleContentPinHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, id } = req.params;
    const { pinService } = await import('../services/pin.service');
    const result = await pinService.togglePin(type, id);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.message === 'Unknown content type') {
      return sendError(res, 1001, '不支持的内容类型', 400);
    }
    if (error.message === 'Content not found') {
      return sendError(res, 1005, '内容不存在', 404);
    }
    next(error);
  }
}

/**
 * 搜索分类候选项目
 */
export async function searchRepoSuggestionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.params;
    const minStars = parseInt(req.query.minStars as string) || 100;
    const maxResults = parseInt(req.query.maxResults as string) || 20;

    const { searchReposByCategory } = await import('../services/repo-category-search.service');
    const suggestions = await searchReposByCategory(category, minStars, maxResults);
    
    sendSuccess(res, {
      category,
      count: suggestions.length,
      items: suggestions,
    });
  } catch (error: any) {
    if (error.message.includes('未知的分类ID')) {
      return sendError(res, 1001, error.message, 400);
    }
    next(error);
  }
}

/**
 * 获取所有分类的候选统计
 */
export async function getRepoSuggestionStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const minStars = parseInt(req.query.minStars as string) || 100;
    
    const { getCategorySuggestionStats, CATEGORY_SEARCH_KEYWORDS } = await import('../services/repo-category-search.service');
    const stats = await getCategorySuggestionStats(minStars);
    
    const categories = Object.entries(CATEGORY_SEARCH_KEYWORDS).map(([id, config]) => ({
      id,
      description: config.description,
      suggestionCount: stats[id] || 0,
    }));
    
    sendSuccess(res, {
      categories,
      totalSuggestions: Object.values(stats).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 批量添加仓库
 */
export async function addReposBatchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { repos } = req.body;
    
    if (!Array.isArray(repos) || repos.length === 0) {
      return sendError(res, 1001, '请提供要添加的仓库列表', 400);
    }

    const { addReposToCategory } = await import('../services/repo-category-search.service');
    const result = await addReposToCategory(repos);
    
    sendSuccess(res, {
      message: `成功添加 ${result.success} 个仓库`,
      success: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取管理员审计日志
 */
export async function getAdminAuditLogsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { adminId } = req.params;
    const { skip, take, page, size } = parsePaginationParams(req.query);

    if (!adminId) {
      return sendError(res, 1001, '管理员ID不能为空', 400);
    }

    const { items, total } = await getAdminAuditLogs({
      adminId,
      page,
      size,
    });

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error: any) {
    logger.error('获取管理员审计日志失败:', error);
    sendError(res, 5009, error.message || '获取失败', 500);
  }
}
