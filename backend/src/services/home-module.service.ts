/**
 * 首页运营模块服务
 */

import { HomeModule } from '../../node_modules/.prisma/client-user';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

export interface GetHomeModulesParams {
  position?: string;
  isActive?: boolean;
  skipTimeFilter?: boolean; // 是否跳过定时过滤（管理端使用）
}

/**
 * 获取首页模块配置
 * 支持定时下线：自动过滤不在时间范围内的模块
 * @param skipTimeFilter 如果为true，跳过定时过滤（管理端查看所有模块时使用）
 */
export async function getHomeModules(params: GetHomeModulesParams = {}): Promise<HomeModule[]> {
  try {
    const where: any = {};
    
    // HomeModule模型中没有position字段，忽略该参数
    // if (params.position) {
    //   where.position = params.position;
    // }
    
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const modules = await prisma.homeModule.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 如果skipTimeFilter为true（管理端查看所有模块），不过滤定时下线的模块
    if (params.skipTimeFilter) {
      return modules;
    }

    // 过滤定时下线的模块（用户端使用）
    const now = new Date();
    return modules.filter((module) => {
      try {
        const config = module.config ? JSON.parse(module.config) : {};
        
        // 检查开始时间
        if (config.startDate) {
          const startDate = new Date(config.startDate);
          if (now < startDate) return false; // 未到开始时间
        }
        
        // 检查结束时间
        if (config.endDate) {
          const endDate = new Date(config.endDate);
          if (now > endDate) return false; // 已过结束时间
        }
        
        return true;
      } catch (e) {
        // 解析失败，不过滤
        return true;
      }
    });
  } catch (error: any) {
    logger.error('Get home modules error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
    });
    // 如果是表不存在或其他数据库错误，返回空数组
    if (error.message?.includes('does not exist') || 
        error.code === 'P2021' || 
        error.code === 'P2001' ||
        error.message?.includes('no such table')) {
      logger.warn('HomeModule table may not exist yet, returning empty array');
      return [];
    }
    throw new Error('HOME_MODULES_FETCH_FAILED');
  }
}

/**
 * 创建首页模块
 */
export async function createHomeModule(data: Omit<HomeModule, 'id' | 'createdAt' | 'updatedAt'>): Promise<HomeModule> {
  try {
    // 只保留数据库模型中存在的字段
    const createData: any = {
      name: data.name,
      title: data.title,
      description: data.description,
      config: data.config,
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order !== undefined ? data.order : 0,
    };

    logger.info('Creating home module:', createData);

    return await prisma.homeModule.create({ data: createData });
  } catch (error: any) {
    logger.error('Create home module error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
      data,
    });
    
    // 提供更详细的错误信息
    if (error.code === 'P2002') {
      throw new Error('HOME_MODULE_NAME_EXISTS: 模块标识已存在，请使用其他标识');
    } else {
      throw new Error(`HOME_MODULE_CREATION_FAILED: ${error.message || '未知错误'}`);
    }
  }
}

/**
 * 更新首页模块
 */
export async function updateHomeModule(id: string, data: Partial<HomeModule>): Promise<HomeModule> {
  try {
    // 只保留数据库模型中存在的字段
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.order !== undefined) updateData.order = data.order;

    logger.info('Updating home module:', { id, updateData });

    return await prisma.homeModule.update({
      where: { id },
      data: updateData,
    });
  } catch (error: any) {
    logger.error('Update home module error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
      id,
      data,
    });
    
    // 提供更详细的错误信息
    if (error.code === 'P2025') {
      throw new Error('HOME_MODULE_NOT_FOUND: 模块不存在');
    } else if (error.code === 'P2002') {
      throw new Error('HOME_MODULE_NAME_EXISTS: 模块标识已存在');
    } else {
      throw new Error(`HOME_MODULE_UPDATE_FAILED: ${error.message || '未知错误'}`);
    }
  }
}

/**
 * 删除首页模块
 */
export async function deleteHomeModule(id: string): Promise<void> {
  try {
    await prisma.homeModule.delete({ where: { id } });
  } catch (error) {
    logger.error('Delete home module error:', error);
    throw new Error('HOME_MODULE_DELETION_FAILED');
  }
}
