/**
 * 首页运营模块控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  getHomeModules,
  createHomeModule,
  updateHomeModule,
  deleteHomeModule,
} from '../services/home-module.service';
import { sendSuccess } from '../utils/response';

/**
 * 获取首页模块配置（公开）
 */
export async function getHomeModulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const modules = await getHomeModules({
      isActive: true,
    });
    sendSuccess(res, modules);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取所有首页模块（管理端）
 * 管理端需要看到所有模块，包括已过期和禁用的
 */
export async function getAllHomeModulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // skipTimeFilter: true 表示跳过定时过滤，返回所有模块（包括已过期的）
    const modules = await getHomeModules({ skipTimeFilter: true });
    sendSuccess(res, modules);
  } catch (error) {
    next(error);
  }
}

/**
 * 创建首页模块（管理端）
 */
export async function createHomeModuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const module = await createHomeModule(req.body);
    sendSuccess(res, module, '模块创建成功');
  } catch (error: any) {
    // 将错误转换为AppError格式，确保错误信息正确传递
    const appError: any = error;
    appError.statusCode = appError.statusCode || 500;
    if (error.message?.includes('HOME_MODULE_NAME_EXISTS')) {
      appError.statusCode = 400;
    }
    next(appError);
  }
}

/**
 * 更新首页模块（管理端）
 */
export async function updateHomeModuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const module = await updateHomeModule(id, req.body);
    sendSuccess(res, module, '模块更新成功');
  } catch (error: any) {
    // 将错误转换为AppError格式，确保错误信息正确传递
    const appError: any = error;
    appError.statusCode = appError.statusCode || 500;
    if (error.message?.includes('HOME_MODULE_NOT_FOUND')) {
      appError.statusCode = 404;
    } else if (error.message?.includes('HOME_MODULE_NAME_EXISTS')) {
      appError.statusCode = 400;
    }
    next(appError);
  }
}

/**
 * 删除首页模块（管理端）
 */
export async function deleteHomeModuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await deleteHomeModule(id);
    sendSuccess(res, null, '模块删除成功');
  } catch (error) {
    next(error);
  }
}
