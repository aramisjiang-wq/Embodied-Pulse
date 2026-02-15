/**
 * 重置管理员密码
 */

import bcrypt from 'bcryptjs';
import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';
import { hashPassword, verifyPassword } from '../utils/password';

const email = 'admin@embodiedpulse.com';
const password = 'admin123';

async function resetAdminPassword() {
  try {
    logger.info(`Resetting password for admin: ${email}`);
    
    // 生成新的密码哈希
    const passwordHash = await hashPassword(password);
    logger.info('Generated new password hash');
    
    // 更新数据库（使用参数化查询）
    const escapedEmail = email.replace(/'/g, "''");
    const escapedHash = passwordHash.replace(/'/g, "''");
    const result = await adminPrisma.$executeRawUnsafe(
      `UPDATE admins SET password_hash = '${escapedHash}' WHERE email = '${escapedEmail}'`
    );
    
    logger.info(`Updated ${result} admin record(s)`);
    
    // 验证密码
    const admin = await adminPrisma.$queryRawUnsafe<any[]>(
      `SELECT password_hash FROM admins WHERE email = '${escapedEmail}' LIMIT 1`
    );
    
    if (admin && admin.length > 0) {
      const isValid = await verifyPassword(password, admin[0].password_hash);
      logger.info(`Password verification: ${isValid ? '✅ Success' : '❌ Failed'}`);
      
      if (isValid) {
        console.log('✅ 密码重置成功！');
        console.log(`   邮箱: ${email}`);
        console.log(`   密码: ${password}`);
      } else {
        console.log('❌ 密码验证失败');
        process.exit(1);
      }
    } else {
      console.log('❌ 未找到管理员账号');
      process.exit(1);
    }
    
    await adminPrisma.$disconnect();
  } catch (error: any) {
    logger.error('Reset password error:', error);
    console.error('❌ 密码重置失败:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
