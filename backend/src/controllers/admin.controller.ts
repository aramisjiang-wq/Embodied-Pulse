/**
 * 管理端控制器
 */

import { Request, Response, NextFunction } from 'express';
import { getUserEndUsers, getAdminUsers, toggleUserBan, getStatistics, adminContentService, updateAdminPermissions, updateUserTags, updateAdminTags, updateUserVip, getUserActionLogs } from '../services/admin.service';
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

    sendSuccess(res, {
      items: users,
      pagination: buildPaginationResponse(page, size, total),
    });
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
    const { isVip } = req.body;

    if (typeof isVip !== 'boolean') {
      return sendError(res, 1001, 'isVip必须是布尔值', 400);
    }

    await updateUserVip(userId, isVip);
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
    sendSuccess(res, {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      adminNumber: admin.adminNumber,
      createdAt: admin.createdAt,
    });
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return sendError(res, 1002, '该邮箱已被使用', 400);
    }
    logger.error('Create admin error:', error);
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
      case 'news':
        result = await adminContentService.news.create(data);
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
      case 'news':
        result = await adminContentService.news.update(id, data);
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
      case 'news':
        await adminContentService.news.delete(id);
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
 * 同步新闻（管理员）
 */
export async function syncNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { source } = req.query;

    let result;
    switch (source) {
      case '36kr':
        const { syncFrom36Kr } = await import('../services/news-sync.service');
        result = await syncFrom36Kr();
        break;
      default:
        return sendError(res, 1001, '不支持的数据源', 400);
    }

    sendSuccess(res, {
      message: '同步完成',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 清理旧新闻（管理员）
 */
export async function cleanNewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = req.query;
    const { cleanOldNews } = await import('../services/news-sync.service');
    
    const count = await cleanOldNews(days ? parseInt(days as string) : 30);

    sendSuccess(res, {
      message: '清理完成',
      deleted: count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取新闻同步统计（管理员）
 */
export async function getSyncStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { getSyncStats } = await import('../services/news-sync.service');
    
    const stats = await getSyncStats();

    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

export async function getNewsListHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { skip, take, page, size } = parsePaginationParams(req.query);
    const { platform, keyword } = req.query;

    const { getNewsList } = await import('../services/news-admin.service');
    
    const { items, total } = await getNewsList({
      skip,
      take,
      platform: platform as string,
      keyword: keyword as string,
    });

    sendSuccess(res, {
      items,
      pagination: buildPaginationResponse(page, size, total),
    });
  } catch (error) {
    next(error);
  }
}
