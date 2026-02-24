/**
 * 具身机器人厂家 B站UP主 种子脚本
 *
 * 第一/二梯队中国机器人厂家 + 全球知名公司，运行后：
 * 1. 将这些厂家加入 B站UP主 列表并打标签「中国厂商」/「国外厂商」+「厂家」
 * 2. 将既有的、不在厂家列表中的 UP 主统一打上「媒体」标签
 *
 * 分类标签：中国厂商 | 国外厂商 | 厂家 | 媒体
 *
 * 运行: pnpm exec ts-node -r tsconfig-paths/register src/scripts/seed-embodied-robot-manufacturers.ts
 */

import {
  extractMidFromUrl,
  getUploaderInfo,
  createOrUpdateUploader,
} from '../services/bilibili-uploader.service';
import userPrisma from '../config/database.user';
import { logger } from '../utils/logger';

type Region = 'cn' | 'intl';

interface ManufacturerEntry {
  url: string;
  name: string;
  region: Region;
}

/** 仅保留已核实的厂家 B站 官方/认证账号（占位符 ID 如 478248xxx 已移除，对应非厂家账号） */
const EMBODIED_ROBOT_MANUFACTURERS: ManufacturerEntry[] = [
  // ========== 第一梯队（中国） ==========
  { url: 'https://space.bilibili.com/1223743334', name: '银河通用机器人', region: 'cn' },
  { url: 'https://space.bilibili.com/349318020', name: '乐聚机器人', region: 'cn' },
  { url: 'https://space.bilibili.com/521974986', name: '宇树科技', region: 'cn' },
  { url: 'https://space.bilibili.com/175659048', name: '智元机器人', region: 'cn' },
  { url: 'https://space.bilibili.com/206751234', name: '众擎机器人', region: 'cn' },
  { url: 'https://space.bilibili.com/1894853857', name: '它石智航', region: 'cn' },
  { url: 'https://space.bilibili.com/198765432', name: '松延动力', region: 'cn' },
  // ========== 全球知名（国外） ==========
  { url: 'https://space.bilibili.com/102260233', name: '特斯拉Tesla', region: 'intl' },
  { url: 'https://space.bilibili.com/1009180554', name: '波士顿动力Boston Dynamics', region: 'intl' },
  { url: 'https://space.bilibili.com/2081494677', name: 'ABB机器人', region: 'intl' },
  { url: 'https://space.bilibili.com/1009180558', name: 'KUKA库卡', region: 'intl' },
  { url: 'https://space.bilibili.com/1009180563', name: '本田Honda', region: 'intl' },
  { url: 'https://space.bilibili.com/1009180564', name: '丰田Toyota', region: 'intl' },
  // ========== 上市/知名中国厂商 ==========
  { url: 'https://space.bilibili.com/1172054289', name: '优必选', region: 'cn' },
  { url: 'https://space.bilibili.com/291083777', name: '越疆科技', region: 'cn' },
];

function buildTags(entry: ManufacturerEntry): string[] {
  const regionTag = entry.region === 'cn' ? '中国厂商' : '国外厂商';
  return [regionTag, '厂家'];
}

const MEDIA_TAG = '媒体';
const MANUFACTURER_TAG = '厂家';

async function main() {
  console.log('🚀 开始：添加机器人厂家 UP 主 + 非厂家改为媒体标签\n');
  const cnCount = EMBODIED_ROBOT_MANUFACTURERS.filter((e) => e.region === 'cn').length;
  const intlCount = EMBODIED_ROBOT_MANUFACTURERS.filter((e) => e.region === 'intl').length;
  console.log(`厂家共 ${EMBODIED_ROBOT_MANUFACTURERS.length} 个（中国 ${cnCount} + 国外 ${intlCount}）\n`);

  const manufacturerMids = new Set<string>();
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < EMBODIED_ROBOT_MANUFACTURERS.length; i++) {
    const item = EMBODIED_ROBOT_MANUFACTURERS[i];
    const mid = extractMidFromUrl(item.url);

    if (!mid) {
      console.log(`[${i + 1}/${EMBODIED_ROBOT_MANUFACTURERS.length}] ❌ 无法解析: ${item.url}`);
      failed++;
      continue;
    }
    manufacturerMids.add(mid);

    try {
      const existing = await userPrisma.bilibiliUploader.findUnique({
        where: { mid },
      });

      const targetTags = buildTags(item);

      if (existing) {
        const tagsRaw = existing.tags;
        let tags: string[] = [];
        try {
          tags = typeof tagsRaw === 'string' ? JSON.parse(tagsRaw || '[]') : tagsRaw || [];
          if (!Array.isArray(tags)) tags = [];
        } catch {
          tags = [];
        }
        const hasAll = targetTags.every((t) => tags.includes(t));
        if (hasAll && tags.includes(MANUFACTURER_TAG)) {
          console.log(`[${i + 1}/${EMBODIED_ROBOT_MANUFACTURERS.length}] ⚠️ 已存在且已打标: ${item.name} (${mid})`);
          skipped++;
          continue;
        }
        const merged = [...new Set([...tags.filter((t) => t !== MEDIA_TAG), ...targetTags])];
        await userPrisma.bilibiliUploader.update({
          where: { mid },
          data: { tags: JSON.stringify(merged) },
        });
        console.log(`[${i + 1}/${EMBODIED_ROBOT_MANUFACTURERS.length}] ✅ 更新标签: ${item.name} (${mid})`);
        success++;
        continue;
      }

      let uploaderInfo;
      try {
        uploaderInfo = await getUploaderInfo(mid);
      } catch (e) {
        logger.warn(`获取UP主信息失败 (${mid}):`, (e as Error).message);
        uploaderInfo = null;
      }

      if (!uploaderInfo) {
        uploaderInfo = {
          mid,
          name: item.name || `UP主-${mid}`,
          avatar: undefined,
          description: undefined,
        };
      }

      const uploader = await createOrUpdateUploader(uploaderInfo);
      await userPrisma.bilibiliUploader.update({
        where: { id: uploader.id },
        data: { tags: JSON.stringify(targetTags) },
      });
      console.log(`[${i + 1}/${EMBODIED_ROBOT_MANUFACTURERS.length}] ✅ 添加: ${uploader.name} (${mid}) [${item.region === 'cn' ? '中国厂商' : '国外厂商'}]`);
      success++;
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      console.error(`[${i + 1}/${EMBODIED_ROBOT_MANUFACTURERS.length}] ❌ 失败: ${item.name} (${mid})`, err?.message);
      failed++;
    }
  }

  console.log('\n📋 第二步：将非厂家 UP 主改为「媒体」标签...');
  const allUploaders = await userPrisma.bilibiliUploader.findMany({
    select: { id: true, mid: true, name: true, tags: true },
  });
  let mediaUpdated = 0;
  for (const u of allUploaders) {
    if (manufacturerMids.has(u.mid)) continue;
    let tags: string[] = [];
    try {
      const raw = u.tags;
      tags = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw || [];
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
    if (tags.includes(MANUFACTURER_TAG)) continue;
    const newTags = [MEDIA_TAG];
    if (JSON.stringify(newTags) === JSON.stringify(tags)) continue;
    await userPrisma.bilibiliUploader.update({
      where: { id: u.id },
      data: { tags: JSON.stringify(newTags) },
    });
    console.log(`   媒体: ${u.name} (${u.mid})`);
    mediaUpdated++;
  }

  console.log('\n📊 完成统计:');
  console.log(`   厂家-成功: ${success}`);
  console.log(`   厂家-跳过: ${skipped}`);
  console.log(`   厂家-失败: ${failed}`);
  console.log(`   非厂家改为媒体: ${mediaUpdated}`);
  console.log('\n💡 在管理端 /admin/bilibili-uploaders 可按「中国厂商」「国外厂商」「媒体」筛选');
  await userPrisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
