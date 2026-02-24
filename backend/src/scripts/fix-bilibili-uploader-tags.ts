/**
 * 修正 B站 UP主 标签：将误标为「厂家」的非厂家账号改为「媒体」
 *
 * 仅以下 mid 视为已核实的机器人厂家，其余带「厂家」标签的均改为「媒体」。
 *
 * 运行: npx tsx src/scripts/fix-bilibili-uploader-tags.ts
 */

import userPrisma from '../config/database.user';

/** 已核实的厂家 B站 mid（与 seed-embodied-robot-manufacturers 一致） */
const VERIFIED_MANUFACTURER_MIDS = new Set([
  '1223743334', // 银河通用
  '349318020',  // 乐聚
  '521974986',  // 宇树
  '175659048',  // 智元
  '206751234',  // 众擎
  '1894853857', // 它石智航
  '198765432',  // 松延动力
  '102260233',  // 特斯拉
  '1009180554', // 波士顿动力
  '2081494677', // ABB
  '1009180558', // KUKA
  '1009180563', // 本田
  '1009180564', // 丰田
  '1172054289', // 优必选
  '291083777',  // 越疆
]);

async function main() {
  console.log('修正误标为「厂家」的 UP 主 → 改为「媒体」\n');
  console.log('已核实厂家 mid 数量:', VERIFIED_MANUFACTURER_MIDS.size);

  const all = await userPrisma.bilibiliUploader.findMany({
    select: { id: true, mid: true, name: true, tags: true },
  });

  let fixed = 0;
  for (const u of all) {
    let tags: string[] = [];
    try {
      const raw = u.tags;
      tags = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw || [];
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
    if (!tags.includes('厂家')) continue;
    if (VERIFIED_MANUFACTURER_MIDS.has(u.mid)) continue;

    await userPrisma.bilibiliUploader.update({
      where: { id: u.id },
      data: { tags: JSON.stringify(['媒体']) },
    });
    console.log(`  改为媒体: ${u.name} (mid: ${u.mid})`);
    fixed++;
  }

  console.log('\n已修正:', fixed, '个 UP 主');
  await userPrisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
