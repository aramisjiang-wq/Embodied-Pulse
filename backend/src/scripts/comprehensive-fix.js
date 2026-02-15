/**
 * 综合修复脚本
 * 1. 修复管理员角色
 * 2. 检查数据库连接
 * 3. 测试Bilibili API
 */

const { PrismaClient } = require('@prisma/client');
const { BilibiliAPI } = require('../services/bilibili');

async function comprehensiveFix() {
  console.log('========================================');
  console.log('综合修复脚本');
  console.log('========================================\n');

  // 步骤1：修复管理员角色
  console.log('步骤1：修复管理员角色...');
  try {
    const adminPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.ADMIN_DATABASE_URL || 'file:./prisma/admin.db',
        },
      },
    });

    const admins = await adminPrisma.$queryRaw`
      SELECT id, username, email, role, is_active FROM admins
    `;

    console.log(`找到 ${admins.length} 个管理员`);

    let fixedCount = 0;
    for (const admin of admins) {
      if (!admin.role || admin.role !== 'super_admin') {
        await adminPrisma.$executeRaw`
          UPDATE admins SET role = 'super_admin' WHERE id = ${admin.id}
        `;
        console.log(`✅ 已修复管理员: ${admin.username} (role: ${admin.role || '(空)'} -> super_admin)`);
        fixedCount++;
      }
    }

    console.log(`步骤1完成：共修复 ${fixedCount} 个管理员\n`);
    await adminPrisma.$disconnect();
  } catch (error) {
    console.error('步骤1失败:', error.message);
  }

  // 步骤2：检查数据库连接
  console.log('步骤2：检查数据库连接...');
  try {
    const userPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.USER_DATABASE_URL || 'file:./prisma/user.db',
        },
      },
    });

    const uploaders = await userPrisma.bilibiliUploader.findMany();
    console.log(`✅ 用户数据库连接正常，找到 ${uploaders.length} 个UP主`);

    for (const uploader of uploaders) {
      const videoCount = await userPrisma.video.count({
        where: {
          platform: 'bilibili',
          uploaderId: uploader.mid,
        },
      });
      console.log(`  - ${uploader.name} (${uploader.mid}): videoCount=${uploader.videoCount}, 实际视频数=${videoCount}`);
    }

    console.log('步骤2完成\n');
    await userPrisma.$disconnect();
  } catch (error) {
    console.error('步骤2失败:', error.message);
  }

  // 步骤3：测试Bilibili API
  console.log('步骤3：测试Bilibili API...');
  try {
    const bilibiliAPI = BilibiliAPI.fromEnv({
      timeout: 15000,
      retries: 3,
      retryDelay: 2000,
    });

    // 测试一个UP主
    const mid = 3546800709438203;
    console.log(`测试UP主: ${mid}`);

    const result = await bilibiliAPI.user.getUserVideos(parseInt(mid, 10), 1, 10);
    console.log(`✅ Bilibili API连接正常`);
    console.log(`  响应格式:`, JSON.stringify(result, null, 2));
    console.log(`  视频数量: ${result.list?.vlist?.length || 0}`);
    console.log(`  总视频数: ${result.page?.count || 0}`);

    console.log('步骤3完成\n');
  } catch (error) {
    console.error('步骤3失败:', error.message);
  }

  console.log('========================================');
  console.log('修复完成！');
  console.log('========================================\n');
  console.log('请执行以下操作：');
  console.log('1. 重新登录管理端：http://localhost:3000/admin/login');
  console.log('2. 点击"智能全量同步"按钮');
  console.log('3. 查看后端日志输出');
  console.log('4. 检查UP主视频数量是否正确更新');
}

comprehensiveFix()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('修复失败:', error);
    process.exit(1);
  });
