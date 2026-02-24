/**
 * 修复用户积分和等级不一致问题
 * 
 * 问题：用户显示L3但积分只有20，数据不一致
 * 原因：可能是数据库直接修改了level，或者积分奖励逻辑没有正确执行
 * 
 * 解决方案：
 * 1. 检查所有用户的积分和等级是否一致
 * 2. 如果用户有organizationName但积分不足300，补充积分到300
 * 3. 根据积分重新计算等级
 */

import userPrisma from '../config/database.user';

function calculateLevel(points: number): number {
  if (points >= 3000) return 8;
  if (points >= 2000) return 7;
  if (points >= 1500) return 6;
  if (points >= 1000) return 5;
  if (points >= 600) return 4;
  if (points >= 300) return 3;
  if (points >= 100) return 2;
  return 1;
}

async function fixUserPointsAndLevel() {
  console.log('开始修复用户积分和等级...\n');

  const users = await userPrisma.user.findMany({
    select: {
      id: true,
      username: true,
      points: true,
      level: true,
      organizationName: true,
      createdAt: true,
    },
  });

  console.log(`共找到 ${users.length} 个用户\n`);

  let fixedCount = 0;

  for (const user of users) {
    const correctLevel = calculateLevel(user.points);
    const hasOrg = !!user.organizationName?.trim();
    const needsPointsBonus = hasOrg && user.points < 300;
    
    // 检查是否需要修复
    const needsFix = user.level !== correctLevel || needsPointsBonus;

    if (needsFix) {
      console.log(`\n用户: ${user.username} (${user.id})`);
      console.log(`  当前积分: ${user.points}, 当前等级: L${user.level}`);
      console.log(`  组织名称: ${user.organizationName || '无'}`);

      let newPoints = user.points;
      let newLevel = correctLevel;

      // 如果有组织名称但积分不足300，补充积分
      if (needsPointsBonus) {
        const bonusPoints = 300 - user.points;
        newPoints = 300;
        newLevel = calculateLevel(newPoints);
        
        console.log(`  ⚠️ 有组织名称但积分不足300，补充 ${bonusPoints} 积分`);

        // 创建积分记录
        await userPrisma.pointRecord.create({
          data: {
            userId: user.id,
            points: bonusPoints,
            actionType: 'profile_complete_fix',
            description: '完善资料奖励修复：填写组织名称',
          },
        });
      }

      // 更新用户积分和等级
      await userPrisma.user.update({
        where: { id: user.id },
        data: {
          points: newPoints,
          level: newLevel,
        },
      });

      console.log(`  ✅ 修复后: 积分 ${newPoints}, 等级 L${newLevel}`);
      fixedCount++;
    }
  }

  console.log(`\n\n修复完成！共修复 ${fixedCount} 个用户`);
}

async function main() {
  try {
    await fixUserPointsAndLevel();
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
