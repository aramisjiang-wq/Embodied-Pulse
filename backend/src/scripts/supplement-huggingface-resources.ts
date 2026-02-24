/**
 * HuggingFace 资源补充导入脚本
 * 补充文档中缺失分类的HuggingFace资源
 * 
 * 使用方法: cd backend && npx tsx src/scripts/supplement-huggingface-resources.ts
 */

import userPrisma from '../config/database.user';

interface ResourceItem {
  fullName: string;
  description: string;
  category: string;
  contentType: 'model' | 'dataset';
}

const SUPPLEMENTARY_RESOURCES: ResourceItem[] = [
  // ============ Diffusion Policy 模型 (diffusion-policy) ============
  {
    fullName: 'robotics-diffusion-transformer/rdt-1b',
    description: 'RDT-1B: 扩散基础模型双臂操作, 清华THU开源',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'robotics-diffusion-transformer/rdt-1b-finetune',
    description: 'RDT-1B 微调版本',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'Xiaomi-Robotics/Xiaomi-Robotics-0',
    description: '小米开源 VLA 大模型, 47亿参数',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'UCB-Vrobot/RoboCat',
    description: 'RoboCat 机器人扩散策略模型',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'DeepMind/mtdm',
    description: 'MTDM 多任务扩散模型',
    category: 'diffusion-policy',
    contentType: 'model',
  },

  // ============ 模仿学习模型 (imitation-learning) ============
  {
    fullName: 'ACT/act_model',
    description: 'ACT (Action Chunking Transformer) 模仿学习模型',
    category: 'imitation-learning',
    contentType: 'model',
  },
  {
    fullName: 'stanford-oxe/bridge_data_v2',
    description: 'BridgeData V2 模仿学习数据集',
    category: 'imitation-learning',
    contentType: 'dataset',
  },
  {
    fullName: 'stanford-oxe/bridge_data_dex',
    description: 'BridgeData 灵巧手数据集',
    category: 'imitation-learning',
    contentType: 'dataset',
  },
  {
    fullName: 'berkeley_robot_learning/peract',
    description: 'PerAct 模仿学习模型',
    category: 'imitation-learning',
    contentType: 'model',
  },

  // ============ 世界模型 (world-models) ============
  {
    fullName: 'GAIR/world-model',
    description: 'GAIR 世界模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'DeepMind/RT-Trajectory',
    description: 'RT-Trajectory 轨迹世界模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'GAIR/simpler-world-model',
    description: '简化世界模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'VoxPoser/VoxPoser',
    description: 'VoxPoser 可编程世界模型',
    category: 'world-models',
    contentType: 'model',
  },

  // ============ NVIDIA PhysicalAI 系列 (nvidia-physicalai) ============
  {
    fullName: 'nvidia/PhysicalAI-Robotics-Manipulation-SingleArm',
    description: 'NVIDIA 单臂操作数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Robotics-Kitchen-Sim-Demos',
    description: 'NVIDIA 厨房仿真演示',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Robotics-GR00T-Teleop-GR1',
    description: 'GR00T 遥操作 GR1 数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Robotics-GR00T-X-Embodiment-Sim',
    description: 'GR00T X-Embodiment 仿真数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Kitchen-Assets',
    description: 'NVIDIA 厨房资产数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Robotics-GR00T-GR1',
    description: 'GR00T GR1 机器人数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },

  // ============ AgiBot 数据集 (agibot-datasets) ============
  {
    fullName: 'agibot-world/AgiBotWorld-Alpha',
    description: '智元机器人百万真机数据集 Alpha版',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBotWorld-Data',
    description: '智元机器人完整数据集',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-World-Chinese',
    description: '智元机器人中文场景数据集',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-World-Office',
    description: '智元机器人办公场景数据集',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-World-Industrial',
    description: '智元机器人工业场景数据集',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },

  // ============ RoboMIND 数据集 (robomind-datasets) ============
  {
    fullName: 'x-humanoid-robomind/RoboMIND',
    description: 'RoboMIND 人形机器人数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND2.0',
    description: 'RoboMIND 2.0 数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },

  // ============ Isaac Sim 数据集 (isaac-sim-datasets) ============
  {
    fullName: 'KeWangRobotics/LiftCube_IsaacSim',
    description: 'Isaac Sim 举立方体数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'KeWangRobotics/PlaceCube_IsaacSim',
    description: 'Isaac Sim 放置立方体数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'KeWangRobotics/PakchoiPicking_IsaacSim',
    description: 'Isaac Sim 白菜采摘数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ljw1105/so101_isaacsim',
    description: 'SO101 Isaac Sim 数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Beable/SOARM100_Isaacsim_129ep',
    description: 'SOARM100 Isaac Sim 数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'zhoumiaosen/Isaac_Sim_Grab_Cube',
    description: 'Isaac Sim 抓取立方体数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'zhoumiaosen/Isaac_Sim_Put_Cube_To_Basket',
    description: 'Isaac Sim 放置到篮子数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },

  // ============ ManiSkill 数据集 (maniskill-datasets) ============
  {
    fullName: 'syRobot/ManiSkill2-Demos',
    description: 'ManiSkill2 演示数据集',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'haoshuang/ManiSkill2-PickCube',
    description: 'ManiSkill2 抓取立方体数据集',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'haoshuang/ManiSkill2-PegInsertion',
    description: 'ManiSkill2 插桩数据集',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'syRobot/ManiSkill2-Reach',
    description: 'ManiSkill2 到达任务数据集',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'AI4Physical/ManiSkill3-Demos',
    description: 'ManiSkill3 演示数据集',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },

  // ============ RLBench 数据集 (rlbench-datasets) ============
  {
    fullName: 'rjgpinel/RLBench-18Task',
    description: 'RLBench 18任务数据集',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Jiaming2472/RLBench.18T.100D.256P.V1',
    description: 'RLBench 18任务100演示数据集',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'daixianjie/rlbench_rlds',
    description: 'RLBench RLDS 格式数据集',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'LPY/BridgeVLA_RLBench_TRAIN_DATA',
    description: 'BridgeVLA RLBench 训练数据',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },

  // ============ 抓取数据集 (grasping-datasets) ============
  {
    fullName: 'google-robotics/gqnn-grasp-dataset',
    description: 'GQNN 抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'sarath-腱_hook/GraspNet-1B',
    description: 'GraspNet-1B 大规模抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'jczhang/acronym_grasp',
    description: 'Acronym 抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },

  // ============ 插桩数据集 (peg-insertion-datasets) ============
  {
    fullName: 'maniskill/peg_insertion',
    description: 'ManiSkill 插桩数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'rllab/peg_insertion_sawyer',
    description: 'Sawyer 插桩数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },

  // ============ 拾取放置数据集 (pick-place-datasets) ============
  {
    fullName: ' ARC-Simulators/RLBench_Pick_and_Place',
    description: 'RLBench 拾取放置数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'GoogleRobotics/cross_embed_pick_place',
    description: 'Google 跨环境拾取放置数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },

  // ============ 厨房数据集 (kitchen-datasets) ============
  {
    fullName: 'meta-ai/ego4d_kitchen',
    description: ' Ego4D 厨房数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'berkeley_robot_learning/kitchen_v2',
    description: 'Berkeley 厨房任务数据集 V2',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'kaist-腱/rs_kitchen',
    description: 'RS 厨房数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },

  // ============ 深度估计数据集 (depth-datasets) ============
  {
    fullName: 'nyu-visionx/nyu_depth_v2',
    description: 'NYU 深度估计数据集 V2',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'scannet/ScanNet',
    description: 'ScanNet 室内深度数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },

  // ============ 点云数据集 (pointcloud-datasets) ============
  {
    fullName: 'ShapeNet/ShapeNetCore',
    description: 'ShapeNet 点云数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ModelNet/ModelNet40',
    description: 'ModelNet40 点云分类数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },

  // ============ SLAM 数据集 (slam-datasets) ============
  {
    fullName: 'KITTI/KITTI_depth',
    description: 'KITTI 深度与SLAM数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'TUM-RGBD/rgbd_dataset_freiburg1_desk',
    description: 'TUM RGB-D 室内SLAM数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },

  // ============ 具身智能基准测试 (embodied-benchmarks) ============
  {
    fullName: 'AI-MU/AgentBench',
    description: 'AgentBench 具身智能基准测试',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'BEHAVIOR/BEHAVIOR-1K',
    description: 'BEHAVIOR-1K 具身基准测试',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'stanford_robot_learning/oxe_benchmarks',
    description: 'Open X-Embodiment 基准测试',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'Habitat-AI/habitat-test-frames',
    description: 'Habitat 导航基准测试',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'SAPIEN/SAPIEN-Release',
    description: 'SAPIEN 交互式环境基准',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },

  // ============ 其他数据集 (other-datasets) ============
  {
    fullName: 'HORA-DB/HORA',
    description: 'HORA 视频转3D具身数据集, 15万条轨迹',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'chenhn02/MetaFold',
    description: 'MetaFold 衣物折叠数据集',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'OpenDriveLab/OpenDV-2K',
    description: 'OpenDV-2K 自动驾驶视频数据集',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Waymo/WaymoOpenDataset',
    description: 'Waymo 自动驾驶数据集',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'EPFL/FLAW',
    description: 'FLAW 无人机着陆数据集',
    category: 'other-datasets',
    contentType: 'dataset',
  },
];

async function importSupplementaryResources(): Promise<void> {
  console.log('开始导入补充资源...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of SUPPLEMENTARY_RESOURCES) {
    try {
      const [author, name] = resource.fullName.split('/');

      const existing = await userPrisma.huggingFaceModel.findUnique({
        where: { fullName: resource.fullName },
      });

      if (existing) {
        skipped++;
        continue;
      }

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

  console.log('\n=== 补充导入完成 ===');
  console.log(`  - 成功导入: ${imported}`);
  console.log(`  - 已存在跳过: ${skipped}`);
  console.log(`  - 失败: ${errors}`);

  const stats = await userPrisma.huggingFaceModel.groupBy({
    by: ['contentType', 'category'],
    _count: true,
  });

  console.log('\n=== 按分类统计 ===');
  const categoryStats: Record<string, number> = {};
  stats.forEach(stat => {
    const key = `${stat.contentType}:${stat.category}`;
    categoryStats[key] = stat._count;
    console.log(`  - ${stat.category} (${stat.contentType}): ${stat._count}`);
  });
}

importSupplementaryResources()
  .catch(console.error)
  .finally(() => userPrisma.$disconnect());
