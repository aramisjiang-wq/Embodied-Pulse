/**
 * 测试管理员登录
 */

import adminPrisma from '../config/database.admin';
import { getAdminByEmail, authenticateAdmin } from '../services/admin-auth.service';
import { verifyPassword } from '../utils/password';
import { logger } from '../utils/logger';

async function testAdminLogin() {
  try {
    const email = 'admin@embodiedpulse.com';
    const password = 'admin123';

    console.log('========================================');
    console.log('测试管理员登录');
    console.log('========================================\n');

    // 1. 测试获取管理员
    console.log('1. 测试获取管理员...');
    const admin = await getAdminByEmail(email);
    if (!admin) {
      console.log('❌ 未找到管理员');
      return;
    }
    console.log('✅ 找到管理员:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   用户名: ${admin.username}`);
    console.log(`   邮箱: ${admin.email}`);
    console.log(`   角色: ${admin.role}`);
    console.log(`   状态: ${admin.isActive ? '激活' : '未激活'}`);
    console.log(`   密码Hash: ${admin.passwordHash ? admin.passwordHash.substring(0, 30) + '...' : 'NULL'}`);
    console.log('');

    // 2. 测试密码验证
    console.log('2. 测试密码验证...');
    if (!admin.passwordHash) {
      console.log('❌ 管理员没有密码hash');
      return;
    }
    const isValid = await verifyPassword(password, admin.passwordHash);
    console.log(`密码验证结果: ${isValid ? '✅ 成功' : '❌ 失败'}`);
    console.log('');

    // 3. 测试完整登录流程
    console.log('3. 测试完整登录流程...');
    try {
      const authenticatedAdmin = await authenticateAdmin(email, password);
      console.log('✅ 登录成功:');
      console.log(`   用户名: ${authenticatedAdmin.username}`);
      console.log(`   角色: ${authenticatedAdmin.role}`);
    } catch (error: any) {
      console.log(`❌ 登录失败: ${error.message}`);
    }

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');
  } catch (error: any) {
    console.error('测试失败:', error);
  } finally {
    await adminPrisma.$disconnect();
  }
}

testAdminLogin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
