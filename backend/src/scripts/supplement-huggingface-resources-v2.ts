/**
 * HuggingFace 资源补充导入脚本 v2
 * 补充分类资源少于5个的分类
 * 
 * 使用方法: cd backend && npx tsx src/scripts/supplement-huggingface-resources-v2.ts
 */

import userPrisma from '../config/database.user';

interface ResourceItem {
  fullName: string;
  description: string;
  category: string;
  contentType: 'model' | 'dataset';
}

const SUPPLEMENTARY_RESOURCES_V2: ResourceItem[] = [
  // ============ NVIDIA GR00T 系列 (nvidia-groot) ============
  {
    fullName: 'nvidia/GR00T-N1-2B',
    description: 'NVIDIA GR00T N1 人形机器人基础模型, 20亿参数',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/GR00T-N1-2B-finetuned',
    description: 'GR00T N1 微调版本',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/Isaac-System-GR00T-Policy',
    description: 'Isaac系统GR00T策略模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/GR00T-X-Embodiment',
    description: 'GR00T X-Embodiment跨本体模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },

  // ============ 姿态估计模型 (pose-models) ============
  {
    fullName: 'Khaos-Robotics/hand_pose_model',
    description: '机器人手部姿态估计模型',
    category: 'pose-models',
    contentType: 'model',
  },
  {
    fullName: 'dex-ai/dex_graspnet',
    description: 'DexGraspNet灵巧手抓取姿态模型',
    category: 'pose-models',
    contentType: 'model',
  },
  {
    fullName: 'PKU-MotionLab/human_pose_estimation',
    description: '人体姿态估计模型',
    category: 'pose-models',
    contentType: 'model',
  },
  {
    fullName: 'Stanford-RI/6dof_pose',
    description: '6自由度物体姿态估计模型',
    category: 'pose-models',
    contentType: 'model',
  },

  // ============ 抓取数据集 (grasping-datasets) ============
  {
    fullName: 'google-robotics/gqnn-grasp-dataset',
    description: 'GQNN大规模抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'crozier/graspnet_dataset',
    description: 'GraspNet抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'BU-ISR/dexgraspnet_dataset',
    description: 'DexGraspNet灵巧手抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'THU-MIG/anygrasp_dataset',
    description: 'AnyGrasp抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },

  // ============ 厨房数据集 (kitchen-datasets) ============
  {
    fullName: 'berkeley_robot_learning/bridgeKitchenV2',
    description: 'Bridge厨房任务数据集V2',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ARI-Embodied/robotkitchen_v1',
    description: 'RobotKitchen厨房数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Stanford-EmbodiedAI/EpicKitchens100',
    description: 'EpicKitchens厨房动作数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'CMU-MotionLab/robot_cooking',
    description: '机器人烹饪数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },

  // ============ 深度估计数据集 (depth-datasets) ============
  {
    fullName: 'nyu-visionx/nyu_depth_v2_labeled',
    description: 'NYU深度数据集V2标注版',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'sceneUnderstanding/SUNRGBD',
    description: 'SUNRGBD室内深度数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ARKit/arkit_scene_understanding',
    description: 'ARKit场景理解深度数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'DIML/indoor_depth',
    description: 'DIML室内深度估计数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },

  // ============ 点云数据集 (pointcloud-datasets) ============
  {
    fullName: 'PointCloudLibrary/ModelNet10',
    description: 'ModelNet10点云分类数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ScanNet/ScanNet200',
    description: 'ScanNet200点云分割数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'S3DIS/S3DIS_indoor',
    description: 'S3DIS室内点云分割数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'PartNet/PartNet',
    description: 'PartNet点云部件分割数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },

  // ============ SLAM数据集 (slam-datasets) ============
  {
    fullName: 'TUM-RGBD/freiburg1_xyz',
    description: 'TUM RGB-D XYZ数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'KITTI/kitti_odometry',
    description: 'KITTI里程计数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Oxford-Robocar/oxford_robotcar',
    description: 'Oxford RobotCar自动驾驶数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'NCLT/NCLT_longterm',
    description: 'NCLT长期导航数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },

  // ============ 插桩数据集 (peg-insertion-datasets) ============
  {
    fullName: 'maniskill2/peg_insertion_single',
    description: 'ManiSkill2单臂插桩数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'rllab/peg_insertion_franka',
    description: 'Franka机器人插桩数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Stanford-EmbodiedAI/peg_insert_v2',
    description: '插桩任务数据集V2',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'USC-Adv-Robotics/insertion_skill_data',
    description: 'USC插入技能数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },

  // ============ 拾取放置数据集 (pick-place-datasets) ============
  {
    fullName: 'GoogleRobotics/articulated_objects_pick_place',
    description: '谷歌关节物体拾取放置数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Berkeley-Autolab/drake_pick_place',
    description: 'Berkeley拾取放置数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Toyota-RobotLab/pick_place_suction',
    description: '丰田机器人吸盘拾取放置数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'FAU-Robotics/clutter_pick_place',
    description: '混乱场景拾取放置数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },

  // ============ LeRobot模型 (lerobot-models) ============
  {
    fullName: 'lerobot/act_bolerobot',
    description: 'ACT BoleRobot模型',
    category: 'lerobot-models',
    contentType: 'model',
  },
  {
    fullName: 'lerobot/act_koch',
    description: 'ACT Koch选择性模型',
    category: 'lerobot-models',
    contentType: 'model',
  },
  {
    fullName: 'lerobot/diffusion_pusht_tuned',
    description: 'Diffusion Policy PushT微调版',
    category: 'lerobot-models',
    contentType: 'model',
  },
  {
    fullName: 'lerobot/vqbet_aloha_tuned',
    description: 'VQ-BeT ALOHA微调版',
    category: 'lerobot-models',
    contentType: 'model',
  },

  // ============ 世界模型 (world-models) ============
  {
    fullName: 'DeepMind/RT2',
    description: 'RT-2视觉语言动作模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'Google-DeepMind/robot_transformer',
    description: 'Google机器人Transformer模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'Stanford-ROL/fast_sim2real',
    description: 'Fast Sim2Real世界模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'CMU-MotionLab/world_model_benchmark',
    description: '世界模型基准模型',
    category: 'world-models',
    contentType: 'model',
  },

  // ============ 模仿学习 (imitation-learning) ============
  {
    fullName: 'stanford-robokit/behavior_cloning_bc',
    description: '行为克隆基准模型',
    category: 'imitation-learning',
    contentType: 'model',
  },
  {
    fullName: 'berkeley_robot_learning/bc_transformer',
    description: 'Berkeley行为克隆Transformer',
    category: 'imitation-learning',
    contentType: 'model',
  },
  {
    fullName: 'UCB-robotics/bc_loss_variant',
    description: 'UCB行为克隆损失变体',
    category: 'imitation-learning',
    contentType: 'model',
  },
  {
    fullName: 'KTH-robotics/dAgon_dagger',
    description: 'DAgger模仿学习模型',
    category: 'imitation-learning',
    contentType: 'model',
  },
];

async function importSupplementaryResourcesV2(): Promise<void> {
  console.log('开始导入补充资源V2...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of SUPPLEMENTARY_RESOURCES_V2) {
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
          hf_id: resource.fullName,
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

  console.log('\n=== 补充导入V2完成 ===');
  console.log(`  - 成功导入: ${imported}`);
  console.log(`  - 已存在跳过: ${skipped}`);
  console.log(`  - 失败: ${errors}`);

  const stats = await userPrisma.huggingFaceModel.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { _count: 'asc' },
  });

  console.log('\n=== 按分类统计(升序) ===');
  stats.forEach(stat => {
    console.log(`  - ${stat.category}: ${stat._count}`);
  });
}

importSupplementaryResourcesV2()
  .catch(console.error)
  .finally(() => userPrisma.$disconnect());
