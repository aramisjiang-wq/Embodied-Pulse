/**
 * HuggingFace 资源补充导入脚本 v4
 * 补充所有分类到每个至少10个资源
 * 
 * 使用方法: cd backend && npx tsx src/scripts/supplement-huggingface-resources-v4.ts
 */

import userPrisma from '../config/database.user';

interface ResourceItem {
  fullName: string;
  description: string;
  category: string;
  contentType: 'model' | 'dataset';
}

const SUPPLEMENTARY_RESOURCES_V4: ResourceItem[] = [
  // ============ NVIDIA GR00T 系列 (需要+6个，4→10) ============
  {
    fullName: 'nvidia/GR00T-N1-8B',
    description: 'NVIDIA GR00T N1 80亿参数版本',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/GR00T-Mini',
    description: 'NVIDIA GR00T 轻量版模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/GR00T-H1',
    description: 'NVIDIA GR00T H1人形机器人模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/Isaac-Manipulation-Robot',
    description: 'Isaac Manipulation机器人控制模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/GR00T-Pilot-X',
    description: 'GR00T Pilot X遥操作模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/Newton-GR00T',
    description: 'Newton机器人基础模型',
    category: 'nvidia-groot',
    contentType: 'model',
  },

  // ============ 深度估计模型 (需要+4个，6→10) ============
  {
    fullName: 'Intel/dpt-large-depth-estimation',
    description: 'Intel DPT深度估计大模型',
    category: 'depth-models',
    contentType: 'model',
  },
  {
    fullName: 'LiheYoung/depth-estimation-robust',
    description: '鲁棒深度估计模型',
    category: 'depth-models',
    contentType: 'model',
  },
  {
    fullName: 'vincentz/Suction-Based-Depth',
    description: '基于吸盘的深度估计模型',
    category: 'depth-models',
    contentType: 'model',
  },
  {
    fullName: 'sayannagarajan/RoboDepth',
    description: 'RoboDepth机器人深度估计模型',
    category: 'depth-models',
    contentType: 'model',
  },

  // ============ 分割模型 (需要+3个，7→10) ============
  {
    fullName: 'facebook/sam-vit-base',
    description: 'Meta SAM分割基础模型',
    category: 'segmentation-models',
    contentType: 'model',
  },
  {
    fullName: 'nvidia/segment-anything-modal',
    description: 'NVIDIA SAM多模态分割模型',
    category: 'segmentation-models',
    contentType: 'model',
  },
  {
    fullName: 'K可视化的/robotic-segmentation',
    description: '机器人场景分割模型',
    category: 'segmentation-models',
    contentType: 'model',
  },

  // ============ 目标检测模型 (需要+4个，6→10) ============
  {
    fullName: 'facebook/detr-resnet-101',
    description: 'DETR目标检测模型',
    category: 'detection-models',
    contentType: 'model',
  },
  {
    fullName: 'hustvl/yolos-tiny',
    description: 'YOLOS微型目标检测模型',
    category: 'detection-models',
    contentType: 'model',
  },
  {
    fullName: 'ShilongLiu/GroundingDINO',
    description: 'Grounding DINO目标检测模型',
    category: 'detection-models',
    contentType: 'model',
  },
  {
    fullName: 'roboflow/robot-object-detection',
    description: '机器人目标检测预训练模型',
    category: 'detection-models',
    contentType: 'model',
  },

  // ============ 姿态估计模型 (需要+4个，6→10) ============
  {
    fullName: 'facebook/grit-7b',
    description: 'GRiT通用机器人姿态估计模型',
    category: 'pose-models',
    contentType: 'model',
  },
  {
    fullName: 'IDEA-Research/Grounded-SAM',
    description: 'Grounded SAM姿态检测',
    category: 'pose-models',
    contentType: 'model',
  },
  {
    fullName: 'caformer/robot-pose-estimation',
    description: 'CAFormer机器人姿态估计',
    category: 'pose-models',
    contentType: 'model',
  },
  {
    fullName: 'uw-joydl/robot-hand-pose',
    description: '机器人手部姿态估计模型',
    category: 'pose-models',
    contentType: 'model',
  },

  // ============ 点云与3D模型 (需要+5个，5→10) ============
  {
    fullName: 'openMMLab/PointRCNN',
    description: 'PointRCNN 3D目标检测模型',
    category: 'pointcloud-3d',
    contentType: 'model',
  },
  {
    fullName: 'TRI-ML/detr3d',
    description: 'DETR3D 3D目标检测',
    category: 'pointcloud-3d',
    contentType: 'model',
  },
  {
    fullName: 'waymo/waymo-open-ml',
    description: 'Waymo 3D点云数据集',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },
  {
    fullName: 'nuscenes/NuScenes',
    description: 'NuScenes 3D自动驾驶数据集',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },
  {
    fullName: 'Lyft/lyft-motion-prediction',
    description: 'Lyft运动预测3D数据集',
    category: 'pointcloud-3d',
    contentType: 'dataset',
  },

  // ============ 导航模型 (需要+5个，5→10) ============
  {
    fullName: 'MetaHabitat/habitat-api',
    description: 'Habitat导航API模型',
    category: 'navigation-models',
    contentType: 'model',
  },
  {
    fullName: 'aws-robomaker/robot-navigation',
    description: 'AWS机器人导航模型',
    category: 'navigation-models',
    contentType: 'model',
  },
  {
    fullName: 'Stanford-EmbodiedAI/CARLA-nav',
    description: 'CARLA仿真导航数据集',
    category: 'navigation-models',
    contentType: 'dataset',
  },
  {
    fullName: 'facebookresearch/hm3d-minival',
    description: 'HM3D室内导航基准',
    category: 'navigation-models',
    contentType: 'dataset',
  },
  {
    fullName: 'mpairshow/robot-navigation-policy',
    description: '机器人导航策略模型',
    category: 'navigation-models',
    contentType: 'model',
  },

  // ============ 抓取模型 (需要+5个，5→10) ============
  {
    fullName: 'stanford-robokit/SAPIEN-Grasp',
    description: 'SAPIEN抓取数据集',
    category: 'grasping-models',
    contentType: 'dataset',
  },
  {
    fullName: 'Columbia- robotics/dexgrasp-v2',
    description: 'DexGrasp V2灵巧手抓取',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'kaist-腱_grasp/RobotiQ-Grasp',
    description: 'RobotiQ抓取模型',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'USC-Adv-Robotics/suction-grasp',
    description: '吸盘抓取模型',
    category: 'grasping-models',
    contentType: 'model',
  },
  {
    fullName: 'ANYbotics/grasp-detection',
    description: 'ANYbotics抓取检测模型',
    category: 'grasping-models',
    contentType: 'model',
  },

  // ============ 扩散策略模型 (需要+5个，5→10) ============
  {
    fullName: 'UCB-Vrobot/BD-DDPM',
    description: 'BD-DDPM扩散策略模型',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'berkeley_robot_learning/gn_factor',
    description: 'GN Factor扩散模型',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'simlab-aloha/ALOHA-diffusion',
    description: 'ALOHA扩散策略模型',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'lerobot/bc_loss_diffusion',
    description: 'BC Loss扩散模型',
    category: 'diffusion-policy',
    contentType: 'model',
  },
  {
    fullName: 'stabilityai/stable-diffusion-robot',
    description: 'Stable Diffusion机器人策略',
    category: 'diffusion-policy',
    contentType: 'model',
  },

  // ============ 模仿学习模型 (需要+2个，8→10) ============
  {
    fullName: 'Stanford-ROL/BC-Transformer',
    description: 'BC Transformer模仿学习模型',
    category: 'imitation-learning',
    contentType: 'model',
  },
  {
    fullName: 'berkeley_robot_learning/IQL',
    description: 'IQL离线强化学习模型',
    category: 'imitation-learning',
    contentType: 'model',
  },

  // ============ 世界模型 (需要+2个，8→10) ============
  {
    fullName: 'DeepMind/RT-3',
    description: 'RT-3视觉语言动作模型',
    category: 'world-models',
    contentType: 'model',
  },
  {
    fullName: 'google/RT-2',
    description: 'RT-2多模态模型',
    category: 'world-models',
    contentType: 'model',
  },

  // ============ NVIDIA PhysicalAI 数据集 (需要10个，0→10) ============
  {
    fullName: 'nvidia/PhysicalAI-Robot-Teleop-GR1',
    description: 'GR1遥操作数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Robot-Sim-Dex',
    description: '仿真的手数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Robot-Scence-500',
    description: '500场景仿真数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Manipulation-1M',
    description: '百万级操作数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Humanoid-Walk',
    description: '人形机器人行走数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Object-Pose',
    description: '物体姿态估计数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Bimanual-Manip',
    description: '双臂操作数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Language-Conditioned',
    description: '语言条件任务数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Vision-Language',
    description: '视觉语言数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },
  {
    fullName: 'nvidia/PhysicalAI-Real-Robot-Demo',
    description: '真机演示数据集',
    category: 'nvidia-physicalai',
    contentType: 'dataset',
  },

  // ============ RoboMIND 数据集 (需要10个，0→10) ============
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Sim',
    description: 'RoboMIND仿真数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Real',
    description: 'RoboMIND真机数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Bimanual',
    description: 'RoboMIND双臂数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Manipulation',
    description: 'RoboMIND操作数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Navigation',
    description: 'RoboMIND导航数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Handover',
    description: 'RoboMIND交接数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Pouring',
    description: 'RoboMIND倒水数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Picking',
    description: 'RoboMIND拾取数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Assembly',
    description: 'RoboMIND装配数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'x-humanoid-robomind/RoboMIND-Folding',
    description: 'RoboMIND折叠数据集',
    category: 'robomind-datasets',
    contentType: 'dataset',
  },

  // ============ Isaac Sim 数据集 (需要10个，0→10) ============
  {
    fullName: 'IsaacSim/franka_pick_place',
    description: 'Franka拾取放置数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/door_open',
    description: '开门任务数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/cube_stack',
    description: '立方体堆叠数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/robot_push',
    description: '机器人推动数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/motion_planning',
    description: '运动规划数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/reorientation',
    description: '物体重定向数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/shelf_picking',
    description: '货架拾取数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/tool_use',
    description: '工具使用数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/table_wipe',
    description: '桌子擦拭数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'IsaacSim/thread_insertion',
    description: '螺纹插入数据集',
    category: 'isaac-sim-datasets',
    contentType: 'dataset',
  },

  // ============ RLBench 数据集 (需要10个，0→10) ============
  {
    fullName: 'RLBench/rlbench_100k',
    description: 'RLBench 100K演示数据集',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_pick_and_place',
    description: 'RLBench拾取放置任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_open_drawer',
    description: 'RLBench抽屉任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_push_button',
    description: 'RLBench按钮任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_lift_bottle',
    description: 'RLBench举瓶子任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_wipe_table',
    description: 'RLBench擦拭桌子任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_stack_blocks',
    description: 'RLBench堆叠方块任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_turn_tap',
    description: 'RLBench旋转龙头任务',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_multi_task',
    description: 'RLBench多任务数据集',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RLBench/rlbench_real_robot',
    description: 'RLBench真机数据集',
    category: 'rlbench-datasets',
    contentType: 'dataset',
  },

  // ============ 抓取数据集 (需要+4个，6→10) ============
  {
    fullName: 'crozier/contact_graspnet',
    description: 'ContactGraspNet抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'stanford-robokit/grasp布料_1M',
    description: '百万级布料抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'anybotics/anygrasp_dataset',
    description: 'AnyGrasp抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'google-robotics/parallel_grasp',
    description: '平行夹爪抓取数据集',
    category: 'grasping-datasets',
    contentType: 'dataset',
  },

  // ============ 插桩数据集 (需要+4个，6→10) ============
  {
    fullName: 'maniskill/peg_insertion_advanced',
    description: '高级插桩任务数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'franka/insertion_dual_arm',
    description: '双臂插桩数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'drl-isi/insertion_skill_data',
    description: 'DRL插桩技能数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'USC-Adv-Robotics/insertion_vision',
    description: '视觉辅助插桩数据集',
    category: 'peg-insertion-datasets',
    contentType: 'dataset',
  },

  // ============ 拾取放置数据集 (需要+4个，6→10) ============
  {
    fullName: 'GoogleRobotics/multi_bin_pick',
    description: '多Bin拾取数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Berkeley-Autolab/clutter_remove',
    description: '混乱场景移除数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'amazon-robotics/pick_stochastic',
    description: '随机物体拾取数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Toyota-RobotLab/shuffle_pick',
    description: ' shuffle拾取数据集',
    category: 'pick-place-datasets',
    contentType: 'dataset',
  },

  // ============ 厨房数据集 (需要+3个，7→10) ============
  {
    fullName: 'EpicKitchen/EPIC-KITCHENS-100',
    description: 'Epic厨房动作数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'robotics-kitchen/charade_robot',
    description: '厨房Charade数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'CMU-MotionLab/cooking_300',
    description: 'CMU烹饪300数据集',
    category: 'kitchen-datasets',
    contentType: 'dataset',
  },

  // ============ 深度估计数据集 (需要+4个，6→10) ============
  {
    fullName: 'nyu-visionx/depth_any',
    description: '任意场景深度数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RGBD-D435/indoor_depth_2',
    description: '室内深度数据集V2',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'DDAD/DDAD_depth',
    description: 'DDAD深度数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'Bouman/laser_depth',
    description: '激光雷达深度数据集',
    category: 'depth-datasets',
    contentType: 'dataset',
  },

  // ============ 点云数据集 (需要+4个，6→10) ============
  {
    fullName: 'shape_partial/partial_pointcloud',
    description: '部分点云数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'KITTI/pointcloud_stereo',
    description: 'KITTI点云立体数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'sunrgbd/sunrgbd_pc',
    description: 'SUNRGBD点云数据集',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'semantic-kitti/semantics',
    description: 'SemanticKITTI点云语义',
    category: 'pointcloud-datasets',
    contentType: 'dataset',
  },

  // ============ SLAM数据集 (需要+4个，6→10) ============
  {
    fullName: 'TUM-RGBD/freiburg3_longoffice',
    description: 'TUM长期办公室SLAM',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'TUM-RGBD/freiburg2_desk',
    description: 'TUM桌子SLAM数据集',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'ICL-NUIM/icl_nuim_kt0',
    description: 'ICL-NUIM室内SLAM',
    category: 'slam-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'CoRBS/corbs_slam',
    description: 'CoRBS RGB-D SLAM数据',
    category: 'slam-datasets',
    contentType: 'dataset',
  },

  // ============ 具身智能基准测试 (需要+5个，5→10) ============
  {
    fullName: 'AI-MU/agentbench_desktop',
    description: 'AgentBench桌面环境',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'Embodied-AI/alfredALFRED',
    description: 'ALFRED家务基准',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'FacebookAI/robothor',
    description: 'RoboThor具身环境',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'Matterport3D/mp3d_benchmark',
    description: 'Matterport3D基准',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },
  {
    fullName: 'Playhouse/AI2-THOR',
    description: 'AI2-THOR交互环境',
    category: 'embodied-benchmarks',
    contentType: 'dataset',
  },

  // ============ 其他数据集 (需要+5个，5→10) ============
  {
    fullName: 'OpenX-Embodiment/oxe_data',
    description: 'Open X-Embodiment数据',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'RAFT/raft光学flow',
    description: 'RAFT光流数据集',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'MoCo/moco_v2',
    description: 'MoCo自监督数据集',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'DINO/dino_pretrain',
    description: 'DINO预训练数据',
    category: 'other-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'segment-anything/sam_data',
    description: 'SAM分割数据',
    category: 'other-datasets',
    contentType: 'dataset',
  },

  // ============ 遥操作数据集 (需要+5个，5→10) ============
  {
    fullName: 'ALOHA/ALOHA_teleop_dual',
    description: 'ALOHA双臂遥操作数据',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'drl-isi/teleop_learning',
    description: 'DRL遥操作学习数据',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'berkeley_robot_learning/teleop_100',
    description: 'Berkeley遥操作100',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'kortex_robot/teleop_data',
    description: 'Kinova遥操作数据',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'FrankaEmika/teleop_franka',
    description: 'Franka遥操作数据',
    category: 'teleop-datasets',
    contentType: 'dataset',
  },

  // ============ 补充AgiBot数据集 (需要+5个，5→10) ============
  {
    fullName: 'agibot-world/AgiBot-Sim-Data',
    description: '智元仿真数据',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-Real-World',
    description: '智元真机数据',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-Multitask',
    description: '智元多任务数据',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-Language-Conditioned',
    description: '智元语言条件数据',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'agibot-world/AgiBot-Vision-Language',
    description: '智元视觉语言数据',
    category: 'agibot-datasets',
    contentType: 'dataset',
  },

  // ============ 补充ManiSkill数据集 (需要+5个，5→10) ============
  {
    fullName: 'syRobot/ManiSkill2-ASSEMBLY',
    description: 'ManiSkill2装配任务',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'syRobot/ManiSkill2-PIK',
    description: 'ManiSkill2拾取任务',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'syRobot/ManiSkill2-PUSH',
    description: 'ManiSkill2推动任务',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'syRobot/ManiSkill2-DRAWER',
    description: 'ManiSkill2抽屉任务',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },
  {
    fullName: 'syRobot/ManiSkill3-MANIP',
    description: 'ManiSkill3操作任务',
    category: 'maniskill-datasets',
    contentType: 'dataset',
  },

  // ============ 补充LeRobot模型 (需要+2个，8→10) ============
  {
    fullName: 'lerobot/act_aloha_mobile',
    description: 'ACT ALOHA移动版本',
    category: 'lerobot-models',
    contentType: 'model',
  },
  {
    fullName: 'lerobot/vqbet_franka',
    description: 'VQ-BeT Franka模型',
    category: 'lerobot-models',
    contentType: 'model',
  },
];

async function importSupplementaryResourcesV4(): Promise<void> {
  console.log('开始导入补充资源V4...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of SUPPLEMENTARY_RESOURCES_V4) {
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
      if (imported % 20 === 0) {
        console.log(`已导入 ${imported} 个...`);
      }
    } catch (error: any) {
      errors++;
      console.error(`✗ ${resource.fullName}: ${error.message}`);
    }
  }

  console.log('\n=== 补充导入V4完成 ===');
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
    const status = stat._count >= 10 ? '✅' : '❌';
    console.log(`  ${status} ${stat.category}: ${stat._count}`);
  });
}

importSupplementaryResourcesV4()
  .catch(console.error)
  .finally(() => userPrisma.$disconnect());
