/**
 * 管理员认证服务
 * 处理管理员相关的认证和查询逻辑
 */

import { hashPassword, verifyPassword } from '../utils/password';
import { logger } from '../utils/logger';
import { generateAdminNumber } from '../utils/user-number';
import adminPrisma from '../config/database.admin';

export interface CreateAdminData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

/**
 * 通过ID获取管理员
 */
export async function getAdminById(adminId: string): Promise<any | null> {
  try {
    logger.info(`getAdminById called with adminId: ${adminId}`);
    
    // 验证adminId格式，防止SQL注入
    if (!adminId || typeof adminId !== 'string' || adminId.includes("'") || adminId.includes('"') || adminId.includes(';')) {
      logger.error('Invalid adminId format, potential SQL injection attempt');
      return null;
    }

    // 先尝试使用 include permissions
    logger.info(`Trying to get admin with permissions: ${adminId}`);
    const admin = await adminPrisma.admins.findUnique({
      where: { id: adminId },
      include: {
        permissions: true,
      },
    });
    
    if (admin) {
      logger.info(`Admin found with permissions: ${admin.id}`);
      return admin;
    }
    
    logger.info(`Admin not found with permissions: ${adminId}`);
    return null;
  } catch (error: any) {
    logger.error('Get admin by ID error:', {
      error: error.message,
      code: error.code,
      adminId,
    });
    
    // 如果Prisma查询失败（任何错误），都尝试使用raw SQL fallback
    logger.warn('Prisma查询失败，尝试使用raw SQL查询...');
    try {
      // 验证adminId格式，防止SQL注入
      if (!adminId || typeof adminId !== 'string' || adminId.includes("'") || adminId.includes('"') || adminId.includes(';')) {
        logger.error('Invalid adminId format, potential SQL injection attempt');
        throw new Error('INVALID_ADMIN_ID_FORMAT');
      }
      
      // 使用$queryRawUnsafe（SQLite不支持?占位符，需要先验证输入防止SQL注入）
      // 已经在上面的if语句中验证了adminId格式
      const result = await adminPrisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM admins WHERE id = '${adminId.replace(/'/g, "''")}' LIMIT 1`
      );
      
      if (result && result.length > 0) {
        const adminData = result[0];
        logger.info(`Raw SQL query successful: found admin ${adminData.id}`);
        // 手动构建Admin对象
        const admin = {
          id: adminData.id,
          adminNumber: adminData.admin_number || null,
          username: adminData.username,
          email: adminData.email,
          passwordHash: adminData.password_hash,
          avatarUrl: adminData.avatar_url || null,
          role: adminData.role || 'admin',
          isActive: adminData.is_active === 1 || adminData.is_active === true,
          lastLoginAt: adminData.last_login_at ? new Date(adminData.last_login_at) : null,
          tags: adminData.tags || null,
          createdAt: new Date(adminData.created_at),
          updatedAt: new Date(adminData.updated_at),
          permissions: [],
        } as any;
        return admin;
      }
      
      logger.warn(`Raw SQL查询未找到管理员: adminId=${adminId}`);
      return null;
    } catch (fallbackError: any) {
      logger.error('Raw SQL query also failed:', {
        error: fallbackError.message,
        code: fallbackError.code,
      });
      // 如果raw SQL也失败，返回null而不是抛出错误
      // 这样可以让调用者处理（比如返回"用户不存在"）
      return null;
    }
  }
}

/**
 * 通过邮箱获取管理员
 */
export async function getAdminByEmail(email: string): Promise<any | null> {
  try {
    logger.debug(`Getting admin by email: ${email}`);
    const admin = await adminPrisma.admins.findUnique({
      where: { email },
      include: {
        permissions: true,
      },
    });
    logger.debug(`Admin query result: ${admin ? `found (id: ${admin.id})` : 'not found'}`);
    return admin;
  } catch (error: any) {
    logger.error('Get admin by email error (Prisma):', {
      error: error.message,
      code: error.code,
      meta: error.meta,
      email,
    });
    
    // 如果Prisma查询失败（任何错误），都尝试使用raw SQL fallback
    logger.warn('Prisma查询失败，尝试使用raw SQL查询...');
    try {
      // 验证email格式，防止SQL注入
      if (!email || typeof email !== 'string' || email.includes("'") || email.includes('"') || email.includes(';')) {
        logger.error('Invalid email format, potential SQL injection attempt');
        throw new Error('INVALID_EMAIL_FORMAT');
      }
      
      // 使用$queryRawUnsafe（SQLite不支持?占位符，需要先验证输入防止SQL注入）
      // 已经在上面的if语句中验证了email格式
      const result = await adminPrisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM admins WHERE email = '${email.replace(/'/g, "''")}' LIMIT 1`
      );
      
      if (result && result.length > 0) {
        const adminData = result[0];
        logger.info(`Raw SQL query successful: found admin ${adminData.id}`);
        // 手动构建Admin对象
        const admin = {
          id: adminData.id,
          adminNumber: adminData.admin_number || null,
          username: adminData.username,
          email: adminData.email,
          passwordHash: adminData.password_hash,
          avatarUrl: adminData.avatar_url || null,
          role: adminData.role || 'admin',
          isActive: adminData.is_active === 1 || adminData.is_active === true,
          lastLoginAt: adminData.last_login_at ? new Date(adminData.last_login_at) : null,
          tags: adminData.tags || null,
          createdAt: new Date(adminData.created_at),
          updatedAt: new Date(adminData.updated_at),
          permissions: [],
        } as any;
        return admin;
      }
      
      logger.warn(`Raw SQL查询未找到管理员: email=${email}`);
      return null;
    } catch (fallbackError: any) {
      logger.error('Raw SQL query also failed:', {
        error: fallbackError.message,
        code: fallbackError.code,
        meta: fallbackError.meta,
      });
      // 如果raw SQL也失败，返回null而不是抛出错误
      // 这样可以让调用者处理（比如返回"用户不存在"）
      return null;
    }
  }
}

/**
 * 验证管理员登录
 */
export async function authenticateAdmin(email: string, password: string): Promise<any> {
  try {
    // 记录登录尝试（不记录密码）
    logger.info(`Admin login attempt: email=${email}`);
    
    // 获取管理员
    const admin = await getAdminByEmail(email);
    if (!admin) {
      logger.warn(`Admin not found: email=${email}`);
      throw new Error('INVALID_CREDENTIALS');
    }

    logger.debug(`Admin found: id=${admin.id}, username=${admin.username}, isActive=${admin.is_active}`);

    // 验证密码
    logger.debug(`Verifying password for admin: id=${admin.id}, hasPasswordHash=${!!admin.password_hash}`);
    if (!admin.password_hash) {
      logger.error(`Admin has no password hash: email=${email}, id=${admin.id}`);
      throw new Error('INVALID_CREDENTIALS');
    }
    const isValid = await verifyPassword(password, admin.password_hash);
    logger.debug(`Password verification result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    if (!isValid) {
      logger.warn(`Password mismatch for admin: email=${email}, id=${admin.id}`);
      throw new Error('INVALID_CREDENTIALS');
    }

    // 检查管理员是否被禁用
    if (!admin.is_active) {
      logger.warn(`Admin account banned: email=${email}, id=${admin.id}`);
      throw new Error('ADMIN_BANNED');
    }

    // 更新最近登录时间
    try {
      if (adminPrisma.admins) {
        await adminPrisma.admins.update({
          where: { id: admin.id },
          data: { last_login_at: new Date().toISOString() } as any,
        });
      } else {
        // 如果Prisma Client不存在，使用SQL更新
        await adminPrisma.$executeRawUnsafe(
          `UPDATE admins SET last_login_at = ? WHERE id = ?`,
          new Date().toISOString(),
          admin.id
        );
      }
    } catch (updateError: any) {
      logger.warn('Failed to update admin lastLoginAt:', updateError);
      // 不抛出错误，登录仍然成功
    }

    logger.info(`Admin authenticated: ${admin.id} (${admin.username})`);
    return admin;
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS' || error.message === 'ADMIN_BANNED') {
      throw error;
    }
    logger.error('Authenticate admin error:', error);
    throw new Error('AUTHENTICATION_FAILED');
  }
}

/**
 * 创建管理员
 */
export async function createAdmin(data: CreateAdminData): Promise<any> {
  try {
    // 检查邮箱是否已存在
    const existing = await getAdminByEmail(data.email);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    // 哈希密码
    const passwordHash = await hashPassword(data.password);

    // 生成管理员编号
    const adminNumber = await generateAdminNumber();

    // 创建管理员
    const admin = await adminPrisma.admins.create({
      data: {
        admin_number: adminNumber,
        username: data.username,
        email: data.email,
        password_hash: passwordHash,
        role: data.role || 'admin',
      } as any,
    });

    logger.info(`Admin created: ${admin.id} (${admin.username})`);
    return admin;
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      throw error;
    }
    logger.error('Create admin error:', error);
    throw new Error('ADMIN_CREATION_FAILED');
  }
}
