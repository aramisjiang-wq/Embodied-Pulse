/**
 * HuggingFace 资源补充导入脚本 v3
 * 补充缺失分类的点云、导航、抓取相关资源
 * 
 * 使用方法: cd backend && npx tsx src/scripts/supplement-huggingface-resources-v3.ts
 */

import userPrisma from '../config/database.user';

interface ResourceItem {
  fullName: string;
  description: string;
  category: string;
  contentType: 'model' | 'dataset';
}

const SUPPLEMENTARY_RESOURCES_V3: ResourceItem[] = [
  // ============ 点云与3D模型 (pointcloud-3d) ============
  {
    fullName: 'openMMLab/PointNet2',
    description: 'PointNet2 3D点云分割模型，显著提升了点云分割性能',
    category: 'pointcloud-3d',
    contentType: 'model',
  },
  {
    fullName: 'MVTec/mvtec_locomotion',
    description: 'MVTec 3D物体分类与异常检测数据集',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },
  {
    fullName: 'ShapeNet/PartAnno',
    description: 'ShapeNet部件标注数据集，3D点云分割基准',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },
  {
    fullName: 'ScanNet/ScanNet',
    description: 'ScanNet室内场景3D重建数据集，2.5M帧',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },
  {
    fullName: 'RGB-D/RGBD-SLAM',
    description: 'RGB-D SLAM数据集，用于3D导航与重建',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },

  // ============ 导航模型 (navigation-models) ============
  {
    fullName: 'navd/visual_navigation',
    description: '视觉导航模型，支持目标导向导航',
    category: 'navigation-models',
    contentType: 'model',
  },
  {
    fullName: 'matterport/Matterport3D',
    description: 'Matterport3D室内导航数据集，90处楼宇3D扫描',
    category: 'navigation-models',
    contentType: 'dataset',
  },
  {
    fullName: 'AI- Thorne Gibson/CHALARN',
    description: 'CHALARN导航任务数据集',
    category: 'navigation-models',
    contentType: 'dataset',
  },
  {
    fullName: 'Habitat-AI/habitat-challenge',
    description: 'Habitat导航挑战赛基准数据集',
    category: 'navigation-models',
    contentType: 'dataset',
  },
  {
    fullName: 'FacebookResearch/ObjectNav',
    description: 'Facebook目标导航数据集',
    category: 'navigation-models',
    contentType: 'dataset',
  },

  // ============ 抓取模型 (grasping-models) ============
  {
    fullName: 'stanford-robokit/GQNN',
    description: 'GQNN通用抓取神经网络模型',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'cmu-robust/AnyGrasp',
    description: 'AnyGrasp任意物体抓取模型',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'ut-ras/RoboGrasp',
    description: 'RoboGrasp机器人抓取模型',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'crozier/6DoF-GraspNet',
    description: '6DoF抓取网络模型',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'stanford-robokit/grasp_multi',
    description: '多物体抓取数据集',
    category: 'grasping-models',
    contentType: 'dataset',
  },

  // ============ 补充一些其他可能缺失的分类 ============
  // 遥操作数据集 (teleop-datasets)
  {
    fullName: 'drl-isi/robot_teleop_data',
    description: '机器人遥操作数据集',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'USC-Adv-Robotics/teleop_demonstrations',
    description: 'USC遥操作演示数据集',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ALOHA-Data/ALOHA_teleop',
    description: 'ALOHA遥操作数据',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'teleoperation/dexmo_teleop',
    description: 'DexMO灵巧手遥操作数据集',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'stanford-robokit/vr_teleop',
    description: 'VR遥操作抓取数据集',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },

  // 其他模型补充
  {
    fullName: 'google-robotics/robot_language_model',
    description: '谷歌机器人语言模型',
    category: 'other-robot-models',
    contentType: 'model',
  },
  {
    fullName: 'deepmind/robotics-transformer',
    description: 'DeepMind机器人Transformer模型',
    category: 'other-robot-models',
    contentType: 'model',
  },
  {
    fullName: 'berkeley_robot_learning/risk_aware_robot',
    description: 'Berkeley风险感知机器人模型',
    category: 'other-robot-models',
    contentType: 'model',
  },
  {
    fullName: 'stanford-rol/robot_skill_learner',
    description: 'Stanford机器人技能学习模型',
    category: 'other-robot-models',
    contentType: 'model',
  },
  {
    fullName: 'meta-ai/goal_conditioned_robot',
    description: 'Meta目标条件机器人模型',
    category: 'other-robot-models',
    contentType: 'model',
  },
];

async function importSupplementaryResourcesV3(): Promise<void> {
  console.log('开始导入补充资源V3...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of SUPPLEMENTARY_RESOURCES_V3) {
    try {
      const existing = await userPrisma.huggingFaceModel.findUnique({
        where: { fullName: resource.fullName },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const [author, name] = resource.fullName.split('/');

      await userPrisma.huggingFaceModel.create({
        data: {
          fullName: resource.fullName,
          name: name || resource.fullName,
          author: author || 'unknown',
          description: resource.description,
          task: 'robotics',
          downloads: 0,
          likes: 0,
          lastModified: new Date(),
          hfId: resource.fullName,
          license: null,
          tags: null,
          contentType: resource.contentType,
          category: resource.category,
        },
      });

      imported++;
      console.log(`✓ ${resource.fullName} (${resource.category})`);
    } catch (error: any) {
      errors++;
      console.error(`✗ ${resource.fullName}: ${error.message}`);
    }
  }

  console.log('\n=== 补充导入V3完成 ===');
  console.log(`  - 成功导入: ${imported}`);
  console.log(`  - 已存在跳过: ${skipped}`);
  console.log(`  - 失败: ${errors}`);

  const totalStats = await userPrisma.huggingFaceModel.count();
  console.log(`\n  - 总资源数: ${totalStats}`);

  const stats = await userPrisma.huggingFaceModel.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('\n=== 按分类统计(升序) ===');
  const sortedStats = stats.sort((a, b) => a._count - b._count);
  sortedStats.forEach(stat => {
    console.log(`  - ${stat.category}: ${stat._count}`);
  });
}

importSupplementaryResourcesV3()
  .catch(console.error)
  .finally(() => userPrisma.$disconnect());
