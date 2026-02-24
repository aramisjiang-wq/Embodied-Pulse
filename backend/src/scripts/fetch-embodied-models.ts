/**
 * 抓取20个具身相关的HuggingFace模型/数据集
 * 关键词：robotics, embodied, robot, manipulation, navigation, vision-language, multimodal
 */

import { createHuggingFaceModel } from '../services/huggingface.service';
import { listModels, getModelInfo, listDatasets } from '../services/huggingface-api.service';
import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

// 已知的具身相关模型ID列表（真实存在的模型）
const KNOWN_EMBODIED_MODELS = [
  // RT系列（机器人Transformer）
  'google-research/rt-1',
  'google-research/rt-2',
  'google-research/rt-1-x',
  'google-research/rt-2-x',
  // 机器人相关
  'open-x-embodiment/open-x-embodiment',
  'facebookresearch/dinov2-base',
  'facebookresearch/dinov2-large',
  // 视觉-语言模型（常用于机器人）
  'Salesforce/blip-image-captioning-base',
  'Salesforce/blip-image-captioning-large',
  'Salesforce/blip-vqa-base',
  'Salesforce/blip-vqa-capfilt-large',
  // 目标检测（机器人感知）
  'facebook/detr-resnet-50',
  'facebook/detr-resnet-101',
  'microsoft/table-transformer-detection',
  // 深度估计（机器人导航）
  'Intel/dpt-large',
  'Intel/dpt-hybrid',
  'depth-anything/Depth-Anything-V2-Small-hf',
  // 图像分割（机器人操作）
  'facebook/detr-resnet-50-panoptic',
  'facebook/mask2former-swin-large-cityscapes-semantic',
  'microsoft/table-transformer-structure-recognition',
];

// 具身相关的搜索关键词
const EMBODIED_KEYWORDS = [
  'robotics',
  'embodied',
  'robot',
  'manipulation',
  'navigation',
  'vision-language',
  'multimodal',
  'gripper',
  'mobile robot',
  'humanoid',
];

// 具身相关的任务类型
const EMBODIED_TASKS = [
  'robotics',
  'object-detection',
  'depth-estimation',
  'image-segmentation',
  'reinforcement-learning',
  'video-classification',
];

interface ModelCandidate {
  id: string;
  fullName: string;
  description?: string;
  task?: string;
  downloads: number;
  likes: number;
  lastModified: string;
  author?: string;
  license?: string;
}

/**
 * 检查模型是否与具身相关
 */
function isEmbodiedRelated(model: any): boolean {
  const searchText = [
    model.id || '',
    model.fullName || '',
    model.description || '',
    model.pipeline_tag || '',
    (model.tags || []).join(' ').toLowerCase(),
  ].join(' ').toLowerCase();

  const embodiedTerms = [
    'robot',
    'robotics',
    'embodied',
    'manipulation',
    'navigation',
    'gripper',
    'mobile robot',
    'humanoid',
    'arm',
    'grasp',
    'pick',
    'place',
    'locomotion',
    'walking',
    'vision-language',
    'multimodal',
    'sim-to-real',
    'rl',
    'reinforcement learning',
    'policy',
    'control',
    'actuator',
    'sensor',
    'perception',
    'planning',
  ];

  return embodiedTerms.some(term => searchText.includes(term));
}

/**
 * 从HuggingFace API获取具身相关的模型
 */
async function fetchEmbodiedModels(): Promise<ModelCandidate[]> {
  const allModels: ModelCandidate[] = [];
  const seenIds = new Set<string>();

  logger.info('开始搜索具身相关的模型...');

  // 方法1: 尝试从已知模型列表获取
  console.log('尝试从已知模型列表获取信息...');
  for (const modelId of KNOWN_EMBODIED_MODELS.slice(0, 10)) {
    try {
      const modelInfo = await getModelInfo(modelId);
      if (modelInfo && !seenIds.has(modelInfo.id)) {
        allModels.push({
          id: modelInfo.id,
          fullName: modelInfo.id,
          description: modelInfo.cardData?.description || '',
          task: modelInfo.pipeline_tag || 'robotics',
          downloads: modelInfo.downloads || 0,
          likes: modelInfo.likes || 0,
          lastModified: modelInfo.lastModified,
          author: modelInfo.author,
          license: modelInfo.cardData?.license || '',
        });
        seenIds.add(modelInfo.id);
        console.log(`  ✅ 获取到: ${modelInfo.id}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      // 模型不存在或无法访问，跳过
      console.log(`  ⚠️  跳过: ${modelId} (${error.message})`);
    }
  }

  // 方法2: 通过任务类型搜索
  console.log('\n通过任务类型搜索...');
  for (const task of EMBODIED_TASKS.slice(0, 3)) { // 只搜索前3个任务类型
    try {
      logger.info(`搜索任务类型: ${task}`);
      const models = await listModels({
        filter: task,
        limit: 30,
      });

      for (const model of models) {
        if (!seenIds.has(model.id) && isEmbodiedRelated(model)) {
          allModels.push({
            id: model.id,
            fullName: model.id,
            description: model.description,
            task: model.pipeline_tag || task,
            downloads: model.downloads || 0,
            likes: model.likes || 0,
            lastModified: model.lastModified,
            author: model.author,
            license: model.license,
          });
          seenIds.add(model.id);
        }
      }
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      logger.warn(`搜索任务 ${task} 失败:`, error.message);
    }
  }

  // 方法3: 通过关键词搜索
  console.log('\n通过关键词搜索...');
  for (const keyword of EMBODIED_KEYWORDS.slice(0, 3)) { // 只搜索前3个关键词
    try {
      logger.info(`搜索关键词: ${keyword}`);
      const models = await listModels({
        search: keyword,
        limit: 20,
      });

      for (const model of models) {
        if (!seenIds.has(model.id) && isEmbodiedRelated(model)) {
          allModels.push({
            id: model.id,
            fullName: model.id,
            description: model.description,
            task: model.pipeline_tag || 'robotics',
            downloads: model.downloads || 0,
            likes: model.likes || 0,
            lastModified: model.lastModified,
            author: model.author,
            license: model.license,
          });
          seenIds.add(model.id);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      logger.warn(`搜索关键词 ${keyword} 失败:`, error.message);
    }
  }

  // 按下载量排序，选择最受欢迎的20个
  const sortedModels = allModels
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 20);

  logger.info(`找到 ${sortedModels.length} 个具身相关的模型`);
  return sortedModels;
}

/**
 * 获取模型的详细信息
 */
async function enrichModelInfo(model: ModelCandidate): Promise<ModelCandidate> {
  try {
    const detailedInfo = await getModelInfo(model.id);
    return {
      ...model,
      description: detailedInfo.cardData?.description || model.description || '',
      task: detailedInfo.pipeline_tag || model.task || 'robotics',
      license: detailedInfo.cardData?.license || model.license || '',
    };
  } catch (error: any) {
    logger.warn(`获取模型详情失败 (${model.id}):`, error.message);
    return model;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始抓取具身相关的HuggingFace模型...\n');

    // 获取模型列表
    const models = await fetchEmbodiedModels();

    if (models.length === 0) {
      console.log('❌ 未找到具身相关的模型');
      return;
    }

    console.log(`📋 找到 ${models.length} 个候选模型\n`);

    // 检查数据库中已存在的模型
    const existingModels = await userPrisma.huggingFaceModel.findMany({
      where: {
        fullName: {
          in: models.map(m => m.fullName),
        },
      },
      select: {
        fullName: true,
      },
    });

    const existingNames = new Set(existingModels.map(m => m.fullName));
    const newModels = models.filter(m => !existingNames.has(m.fullName));

    console.log(`📊 统计:`);
    console.log(`  - 已存在: ${existingModels.length} 个`);
    console.log(`  - 需要添加: ${newModels.length} 个\n`);

    if (newModels.length === 0) {
      console.log('✅ 所有模型都已存在，无需添加');
      return;
    }

    // 添加新模型
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < newModels.length; i++) {
      const model = newModels[i];
      try {
        console.log(`[${i + 1}/${newModels.length}] 处理模型: ${model.fullName}`);

        // 尝试获取详细信息
        const enrichedModel = await enrichModelInfo(model);

        // 检查是否已存在（双重检查）
        const existing = await userPrisma.huggingFaceModel.findUnique({
          where: { fullName: enrichedModel.fullName },
        });

        if (existing) {
          console.log(`  ⚠️  模型已存在，跳过`);
          skippedCount++;
          continue;
        }

        // 创建模型
        await createHuggingFaceModel({
          fullName: enrichedModel.fullName,
          description: enrichedModel.description || null,
          task: enrichedModel.task || 'robotics',
          downloads: enrichedModel.downloads,
          likes: enrichedModel.likes,
          lastModified: enrichedModel.lastModified ? new Date(enrichedModel.lastModified) : null,
          hf_id: enrichedModel.id,
          name: enrichedModel.fullName.split('/').pop() || enrichedModel.fullName,
          author: enrichedModel.author || enrichedModel.fullName.split('/')[0] || null,
          license: enrichedModel.license || null,
          tags: null,
        } as any);

        console.log(`  ✅ 成功添加: ${enrichedModel.fullName}`);
        console.log(`     - 下载量: ${enrichedModel.downloads.toLocaleString()}`);
        console.log(`     - 点赞数: ${enrichedModel.likes.toLocaleString()}`);
        console.log(`     - 任务: ${enrichedModel.task || 'N/A'}`);
        successCount++;

        // 避免请求过快
        if (i < newModels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        if (error.code === 'P2002' || error.message?.includes('unique')) {
          console.log(`  ⚠️  模型已存在（唯一约束冲突）: ${model.fullName}`);
          skippedCount++;
        } else {
          console.error(`  ❌ 添加失败: ${model.fullName}`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n📊 最终统计:');
    console.log(`  ✅ 成功添加: ${successCount} 个`);
    console.log(`  ⚠️  已存在/跳过: ${skippedCount} 个`);
    console.log(`  ❌ 失败: ${errorCount} 个`);
    console.log(`  📦 总计处理: ${newModels.length} 个\n`);

    if (successCount > 0) {
      console.log('🎉 具身模型抓取完成！');
    }
  } catch (error: any) {
    console.error('❌ 脚本执行失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await userPrisma.$disconnect();
  }
}

// 运行脚本
main();
