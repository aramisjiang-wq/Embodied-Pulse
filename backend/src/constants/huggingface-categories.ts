/**
 * HuggingFace 具身智能资源大全 - 分类体系
 * 与 docs/HuggingFace_具身智能资源大全.md 一致
 */

export interface HuggingFaceCategoryItem {
  id: string;
  label: string;
  type: 'model' | 'dataset';
  parent?: string; // 一级分组 id，如 models-core, datasets-general
}

/** 模型分类（第一部分 一～十五） */
export const HF_MODEL_CATEGORIES: HuggingFaceCategoryItem[] = [
  { id: 'vla-openvla', label: '视觉-语言-动作 (VLA) · OpenVLA', type: 'model', parent: 'models-core' },
  { id: 'vla-rt', label: 'RT 系列 (Robotics Transformer)', type: 'model', parent: 'models-core' },
  { id: 'vla-octo', label: 'Octo 系列', type: 'model', parent: 'models-core' },
  { id: 'vla-pi0', label: 'π0 (Pi-Zero) 系列', type: 'model', parent: 'models-core' },
  { id: 'vla-other', label: '其他 VLA 模型', type: 'model', parent: 'models-core' },
  { id: 'gr00t', label: 'NVIDIA GR00T 系列', type: 'model', parent: 'models-core' },
  { id: 'lerobot-act', label: 'LeRobot ACT 模型', type: 'model', parent: 'models-core' },
  { id: 'lerobot-diffusion', label: 'LeRobot Diffusion Policy', type: 'model', parent: 'models-core' },
  { id: 'lerobot-vqbet', label: 'LeRobot VQ-BeT', type: 'model', parent: 'models-core' },
  { id: 'lerobot-tdmpc', label: 'LeRobot TDMPC', type: 'model', parent: 'models-core' },
  { id: 'diffusion-policy', label: '扩散策略模型', type: 'model', parent: 'models-core' },
  { id: 'bc-il', label: '行为克隆与模仿学习', type: 'model', parent: 'models-core' },
  { id: 'world-model', label: '世界模型', type: 'model', parent: 'models-core' },
  { id: 'depth', label: '深度估计模型', type: 'model', parent: 'models-vision' },
  { id: 'vision-foundation', label: '视觉基础模型', type: 'model', parent: 'models-vision' },
  { id: 'segmentation', label: '分割模型', type: 'model', parent: 'models-vision' },
  { id: 'object-detection', label: '目标检测模型', type: 'model', parent: 'models-vision' },
  { id: 'pose', label: '姿态估计模型', type: 'model', parent: 'models-vision' },
  { id: 'pointcloud-3d', label: '点云与3D模型', type: 'model', parent: 'models-3d' },
  { id: 'navigation', label: '导航模型', type: 'model', parent: 'models-motion' },
  { id: 'grasping', label: '抓取模型', type: 'model', parent: 'models-motion' },
  { id: 'other-robot', label: '其他机器人模型', type: 'model', parent: 'models-motion' },
];

/** 数据集分类（第二部分 十六～四十） */
export const HF_DATASET_CATEGORIES: HuggingFaceCategoryItem[] = [
  { id: 'dataset-core-openx', label: 'Open-X-Embodiment 系列', type: 'dataset', parent: 'datasets-general' },
  { id: 'dataset-core-droid', label: 'DROID 系列', type: 'dataset', parent: 'datasets-general' },
  { id: 'dataset-core-bridge', label: 'Bridge 系列', type: 'dataset', parent: 'datasets-general' },
  { id: 'dataset-manipulation', label: '机器人操作数据集', type: 'dataset', parent: 'datasets-general' },
  { id: 'dataset-lerobot-aloha', label: 'LeRobot ALOHA 系列', type: 'dataset', parent: 'datasets-lerobot' },
  { id: 'dataset-lerobot-xarm', label: 'LeRobot XArm / PushT / UMI', type: 'dataset', parent: 'datasets-lerobot' },
  { id: 'dataset-aloha', label: 'ALOHA 数据集系列', type: 'dataset', parent: 'datasets-special' },
  { id: 'dataset-libero', label: 'LIBERO 数据集系列', type: 'dataset', parent: 'datasets-special' },
  { id: 'dataset-humanoid', label: '人形机器人数据集', type: 'dataset', parent: 'datasets-special' },
  { id: 'dataset-navigation', label: '导航与移动数据集', type: 'dataset', parent: 'datasets-special' },
  { id: 'dataset-sim-rlbench', label: '仿真环境 · RLBench', type: 'dataset', parent: 'datasets-sim' },
  { id: 'dataset-sim-mujoco', label: '仿真环境 · MuJoCo', type: 'dataset', parent: 'datasets-sim' },
  { id: 'dataset-sim-isaac', label: '仿真环境 · Isaac Sim', type: 'dataset', parent: 'datasets-sim' },
  { id: 'dataset-physicalai', label: 'NVIDIA PhysicalAI 系列', type: 'dataset', parent: 'datasets-latest' },
  { id: 'dataset-agibot', label: 'AgiBot 数据集系列', type: 'dataset', parent: 'datasets-latest' },
  { id: 'dataset-robomind', label: 'RoboMIND 数据集系列', type: 'dataset', parent: 'datasets-latest' },
  { id: 'dataset-maniskill', label: 'ManiSkill 数据集系列', type: 'dataset', parent: 'datasets-latest' },
  { id: 'dataset-task-grasp', label: '抓取数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-task-peg', label: 'Peg Insertion 数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-task-pickplace', label: 'Pick & Place 数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-task-kitchen', label: '厨房数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-task-depth', label: '深度估计数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-task-pointcloud', label: '点云数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-task-slam', label: 'SLAM与定位数据集', type: 'dataset', parent: 'datasets-task' },
  { id: 'dataset-il', label: '模仿学习数据集', type: 'dataset', parent: 'datasets-paradigm' },
  { id: 'dataset-teleop', label: '遥操作数据集', type: 'dataset', parent: 'datasets-paradigm' },
  { id: 'dataset-benchmark', label: '具身智能基准测试', type: 'dataset', parent: 'datasets-paradigm' },
  { id: 'dataset-other', label: '其他相关数据集', type: 'dataset', parent: 'datasets-paradigm' },
];

export const HF_ALL_CATEGORIES = [...HF_MODEL_CATEGORIES, ...HF_DATASET_CATEGORIES];

/** 一级分组（用于侧边栏折叠） */
export const HF_TOP_GROUPS = [
  { id: 'models-core', label: '核心机器人模型', type: 'model' as const },
  { id: 'models-vision', label: '视觉感知模型', type: 'model' as const },
  { id: 'models-3d', label: '3D与空间理解', type: 'model' as const },
  { id: 'models-motion', label: '运动与控制', type: 'model' as const },
  { id: 'datasets-general', label: '通用数据集', type: 'dataset' as const },
  { id: 'datasets-lerobot', label: 'LeRobot 数据集系列', type: 'dataset' as const },
  { id: 'datasets-special', label: '专用数据集', type: 'dataset' as const },
  { id: 'datasets-sim', label: '仿真环境', type: 'dataset' as const },
  { id: 'datasets-latest', label: '最新数据集', type: 'dataset' as const },
  { id: 'datasets-task', label: '任务特定数据集', type: 'dataset' as const },
  { id: 'datasets-paradigm', label: '学习范式数据集', type: 'dataset' as const },
];
