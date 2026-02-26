/**
 * HuggingFace 资源补充导入脚本 v5
 * 补充剩余3个分类到10个
 */

import userPrisma from '../config/database.user';

const RESOURCES: any[] = [
  // detection-models: 8→10
  { fullName: 'bolt-ai/bolt-detr', description: 'Bolt DETR检测模型', category: 'detection-models', contentType: 'model' },
  { fullName: 'OpenGVLab/InternImage', description: 'InternImage检测模型', category: 'detection-models', contentType: 'model' },
  
  // diffusion-policy: 9→10
  { fullName: 'stanford-robokit/iso_diffusion', description: '等距扩散策略模型', category: 'diffusion-policy', contentType: 'model' },
  
  // segmentation-models: 9→10
  { fullName: 'Matsuo-腱/robot-semantic-seg', description: '机器人语义分割模型', category: 'segmentation-models', contentType: 'model' },
];

async function main() {
  let imported = 0, skipped = 0;
  for (const r of RESOURCES) {
    const existing = await userPrisma.huggingFaceModel.findUnique({ where: { fullName: r.fullName } });
    if (existing) { skipped++; continue; }
    const [author, name] = r.fullName.split('/');
    await userPrisma.huggingFaceModel.create({
      data: { fullName: r.fullName, name, author, description: r.description, task: 'robotics', downloads: 0, likes: 0, lastModified: new Date(), hf_id: r.fullName, license: null, tags: null, contentType: r.contentType, category: r.category }
    });
    imported++;
    console.log(`✓ ${r.fullName}`);
  }
  
  const total = await userPrisma.huggingFaceModel.count();
  console.log(`\n导入: ${imported}, 跳过: ${skipped}, 总计: ${total}`);
  
  const stats = await userPrisma.huggingFaceModel.groupBy({ by: ['category'], _count: true });
  console.log('\n分类统计:');
  stats.sort((a, b) => a._count - b._count).forEach(s => {
    console.log(`  ${s.category}: ${s._count}`);
  });
}

main().catch(console.error).finally(() => userPrisma.$disconnect());
