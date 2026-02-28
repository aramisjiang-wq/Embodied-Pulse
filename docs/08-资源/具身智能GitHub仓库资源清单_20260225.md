# 具身智能 GitHub 仓库资源清单

> 整理时间：2025年2月 | 仓库数量：1200+
> 
> 本文档整理了具身智能领域的高质量GitHub项目，按技术方向分为6大板块，便于研究者快速定位资源。

---

## 目录

### 📌 板块一：核心技术
> 具身智能的核心算法与模型，包括VLA、模仿学习、强化学习、世界模型

- [1.1 视觉-语言-动作模型 (VLA)](#11-视觉-语言-动作模型-vla) ⭐⭐⭐
- [1.2 模仿学习与行为克隆](#12-模仿学习与行为克隆) ⭐⭐⭐
- [1.3 强化学习框架与算法](#13-强化学习框架与算法) ⭐⭐
- [1.4 世界模型与预测](#14-世界模型与预测) ⭐⭐

### 📊 板块二：数据与仿真
> 训练数据集与仿真环境，是具身智能研究的基础设施

- [2.1 核心数据集](#21-核心数据集) ⭐⭐⭐
- [2.2 机器人仿真环境](#22-机器人仿真环境) ⭐⭐⭐

### 🦾 板块三：操作与控制
> 机器人操作、抓取、灵巧手与运动规划

- [3.1 机器人操作与抓取](#31-机器人操作与抓取) ⭐⭐
- [3.2 灵巧手与精细操作](#32-灵巧手与精细操作) ⭐⭐
- [3.3 运动规划与控制](#33-运动规划与控制) ⭐⭐

### 👁️ 板块四：感知与导航
> SLAM、3D视觉、机器人视觉感知

- [4.1 机器人导航与SLAM](#41-机器人导航与slam) ⭐⭐
- [4.2 3D视觉与点云处理](#42-3d视觉与点云处理) ⭐⭐
- [4.3 机器人视觉与感知](#43-机器人视觉与感知) ⭐⭐

### 🤖 板块五：平台与系统
> ROS、机器人硬件平台、LLM+机器人、遥操作系统

- [5.1 ROS与机器人操作系统](#51-ros与机器人操作系统) ⭐⭐
- [5.2 人形机器人与四足机器人](#52-人形机器人与四足机器人) ⭐⭐
- [5.3 开源机器人硬件平台](#53-开源机器人硬件平台) ⭐⭐
- [5.4 大语言模型与机器人结合](#54-大语言模型与机器人结合) ⭐⭐
- [5.5 遥操作与数据采集](#55-遥操作与数据采集) ⭐⭐
- [5.6 Sim2Real与域适应](#56-sim2real与域适应) ⭐

### 🛠️ 板块六：工具与资源
> 学习框架、工具库、综合资源、专题应用

- [6.1 机器人学习框架](#61-机器人学习框架) ⭐⭐⭐
- [6.2 机器人工具与库](#62-机器人工具与库) ⭐⭐
- [6.3 综合资源清单](#63-综合资源清单) ⭐⭐
- [6.4 自动驾驶与移动机器人](#64-自动驾驶与移动机器人) ⭐
- [6.5 触觉感知与传感器](#65-触觉感知与传感器) ⭐
- [6.6 多机器人系统](#66-多机器人系统) ⭐
- [6.7 机器人安全与可靠性](#67-机器人安全与可靠性) ⭐

---

# 📌 板块一：核心技术

> 具身智能的核心算法与模型，包括VLA、模仿学习、强化学习、世界模型

---

## 1.1 视觉-语言-动作模型 (VLA)

> VLA (Vision-Language-Action) 模型是具身智能的核心，将视觉理解、语言指令转化为机器人动作。

### 开源VLA模型 ⭐⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| OpenVLA | 🔥 | 开源视觉-语言-动作模型，970K机器人片段训练，支持多机器人控制 | [GitHub](https://github.com/princeton-vl/OpenVLA) |
| LeRobot | 🔥🔥 | HuggingFace机器人学习框架，包含ACT、Diffusion Policy等SOTA模型 | [GitHub](https://github.com/huggingface/lerobot) |
| Isaac-GR00T | 🔥🔥 | NVIDIA开源人形机器人基础模型GR00T N1，全球首个开源通用人形机器人模型 | [GitHub](https://github.com/NVIDIA/Isaac-GR00T) |
| Octo | 🔥 | 通用机器人策略模型，基于Open X-Embodiment训练 | [GitHub](https://github.com/octo-models/octo) |
| RoboFlamingo | | 开源视觉-语言机器人模型 | [GitHub](https://github.com/RoboFlamingo/RoboFlamingo) |
| RoboMamba | | 高效VLA模型 | [GitHub](https://github.com/RoboMamba/RoboMamba) |

### Google RT系列

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| RT-1 | Google机器人Transformer，首个大规模机器人策略模型 | [论文](https://arxiv.org/abs/2212.06817) |
| RT-2 | 视觉-语言-动作模型，将VLM知识迁移到机器人控制 | [论文](https://arxiv.org/abs/2307.15818) |
| RT-X | 跨具身机器人策略模型 | [项目](https://robotics-transformer-x.github.io/) |
| RT-H | 层次化机器人Transformer | [论文](https://arxiv.org/abs/2403.07529) |
| Q-Transformer | Q学习Transformer | [论文](https://arxiv.org/abs/2309.10150) |

### 其他VLA模型

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| π0 (Pi-Zero) | Physical Intelligence通用机器人策略模型 | [项目](https://www.physicalintelligence.company/) |
| PaLM-E | 具身多模态语言模型 | [论文](https://arxiv.org/abs/2303.03378) |
| Gato | DeepMind通用智能体 | [论文](https://arxiv.org/abs/2205.06175) |
| RoboCat | DeepMind机器人模型 | [论文](https://arxiv.org/abs/2306.06869) |
| GR-1 | 通用机器人模型 | [论文](https://arxiv.org/abs/2311.01642) |
| EmbodiedGPT | 具身智能GPT | [GitHub](https://github.com/EmbodiedGPT/Embodied-GPT) |
| DecisionNCE | 清华多模态表征预训练 | [GitHub](https://github.com/2toinf/DecisionNCE) |

---

## 1.2 模仿学习与行为克隆

> 模仿学习是当前具身智能最实用的训练方法，通过人类演示数据训练机器人策略。

### 扩散策略 ⭐⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Diffusion Policy | 🔥🔥 | 斯坦福扩散策略，视觉运动策略学习的突破性工作 | [GitHub](https://github.com/real-stanford/diffusion_policy) |
| 3D Diffusion Policy | | 3D点云扩散策略 | [项目](https://3d-diffusion-policy.github.io/) |
| IDP3 | | Implicit Diffusion Policy | [论文](https://arxiv.org/abs/2403.03181) |
| Equivariant Diffusion | | 等变扩散策略 | [论文](https://arxiv.org/abs/2310.04564) |

### ACT系列 ⭐⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| ACT | 🔥🔥 | Action Chunking Transformer，动作分块预测 | [GitHub](https://github.com/tonyzhaozh/act) |
| ALOHA | 🔥🔥 | 低成本双臂机器人系统，斯坦福开源 | [GitHub](https://github.com/tonyzhaozh/aloha) |
| Mobile-ALOHA | 🔥🔥 | 移动双臂机器人系统 | [GitHub](https://github.com/MarkFzp/mobile-aloha) |

### UMI与遥操作

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| UMI | 通用机器人接口，斯坦福 | [GitHub](https://github.com/real-stanford/umi) |
| GELLO | 低成本遥操作 | [GitHub](https://github.com/wuphilipp/gello) |
| DexCap | 灵巧手动作捕捉 | [项目](https://dexcap.cs.columbia.edu/) |

### 其他模仿学习方法

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Imitation | 模仿学习库 | [GitHub](https://github.com/HumanCompatibleAI/imitation) |
| GAIL | 生成对抗模仿学习 | [GitHub](https://github.com/ghliu/GAIL) |
| DAgger | 数据聚合模仿学习 | [论文](https://arxiv.org/abs/1011.0646) |
| VQ-BeT | Vector Quantized Behavior Transformer | [论文](https://arxiv.org/abs/2403.03181) |
| IBRL | 模仿+强化学习 | [论文](https://arxiv.org/abs/2304.09931) |

---

## 1.3 强化学习框架与算法

### 主流RL框架 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Stable-Baselines3 | 🔥🔥🔥 | 最流行的RL算法库，PPO/SAC/TD3等 | [GitHub](https://github.com/DLR-RM/stable-baselines3) |
| CleanRL | 🔥🔥 | 简洁RL实现，适合学习 | [GitHub](https://github.com/vwxyzjn/cleanrl) |
| RLlib | 🔥🔥 | Ray RL库，分布式训练 | [GitHub](https://github.com/ray-project/ray) |
| Tianshou | 🔥 | 天授RL框架，清华开源 | [GitHub](https://github.com/thu-ml/tianshou) |
| SpinningUp | 🔥 | OpenAI RL教程 | [GitHub](https://github.com/openai/spinningup) |

### 机器人RL专用

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| RL-Games | NVIDIA RL训练框架，Isaac Gym专用 | [GitHub](https://github.com/Denys88/rl_games) |
| rlkit | RL工具包 | [GitHub](https://github.com/vitchyr/rlkit) |
| Sample-Factory | 高吞吐RL | [GitHub](https://github.com/alex-petrenko/sample-factory) |
| envpool | 高效环境池 | [GitHub](https://github.com/sail-sg/envpool) |

### 离线RL

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| D4RL | 离线RL数据集 | [GitHub](https://github.com/rail-berkeley/d4rl) |
| d3rlpy | 离线RL库 | [GitHub](https://github.com/takuseno/d3rlpy) |
| RL-Unplugged | DeepMind离线RL | [论文](https://arxiv.org/abs/2006.13888) |

### 其他RL框架

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Acme | DeepMind RL框架 | [GitHub](https://github.com/deepmind/acme) |
| Dopamine | Google RL框架 | [GitHub](https://github.com/google/dopamine) |
| mushroom-rl | Mushroom RL | [GitHub](https://github.com/MushroomRL/mushroom-rl) |
| garage | RL工具包 | [GitHub](https://github.com/rlworkgroup/garage) |
| rlpyt | RL研究框架 | [GitHub](https://github.com/astooke/rlpyt) |

---

## 1.4 世界模型与预测

### 经典世界模型 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| DreamerV3 | 🔥🔥 | 世界模型RL，在多个基准上超越人类 | [GitHub](https://github.com/danijar/dreamerv3) |
| TD-MPC2 | 🔥🔥 | 模型预测控制，高效连续控制 | [GitHub](https://github.com/nicklashansen/tdmpc2) |
| MuZero | 🔥 | DeepMind通用规划算法 | [GitHub](https://github.com/werner-duvaud/muzero-general) |
| EfficientZero | | 高效MuZero | [GitHub](https://github.com/YeWR/EfficientZero) |

### 视频世界模型

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Genie | DeepMind生成式交互环境 | [论文](https://arxiv.org/abs/2402.15391) |
| Cosmos | NVIDIA物理AI世界模型 | [项目](https://developer.nvidia.com/cosmos) |
| UniSim | 统一模拟器 | [论文](https://arxiv.org/abs/2310.01728) |
| IRIS | 自回归世界模型 | [GitHub](https://github.com/eloialonso/iris) |

### 视频理解模型

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| InternVideo | 视频理解大模型 | [GitHub](https://github.com/OpenGVLab/InternVideo) |
| Video-LLaVA | 视频LLaVA | [GitHub](https://github.com/PKU-YuanGroup/Video-LLaVA) |
| VideoMAE | 视频MAE | [GitHub](https://github.com/MCG-NJU/VideoMAE) |
| Video-ChatGPT | 视频ChatGPT | [GitHub](https://github.com/mbzuai-oryx/Video-ChatGPT) |

---

# 📊 板块二：数据与仿真

> 训练数据集与仿真环境，是具身智能研究的基础设施

---

## 2.1 核心数据集

### 大规模机器人数据集 ⭐⭐⭐

| 数据集名称 | 规模 | 描述 | 链接 |
|-----------|------|------|------|
| Open X-Embodiment | 100万+轨迹 | 全球最大开源机器人数据集，22种机器人 | [GitHub](https://github.com/google-deepmind/open_x_embodiment) |
| DROID | 7.6万演示 | 斯坦福大规模机器人操作数据集 | [GitHub](https://github.com/droid-dataset/droid) |
| AgiBot World | 100万+演示 | 智元机器人开源，全球最大真实世界具身智能数据集 | [HuggingFace](https://huggingface.co/datasets/agibot-world/AgiBotWorld-Beta) |
| BridgeData V2 | 5万+演示 | 伯克利机器人数据桥接 | [GitHub](https://github.com/rail-berkeley/bridge_data_v2) |
| RoboMIND | 50万+演示 | 人形机器人数据集 | [HuggingFace](https://huggingface.co/datasets/x-humanoid-robomind/RoboMIND) |

### NVIDIA数据集

| 数据集名称 | 描述 | 链接 |
|-----------|------|------|
| GR00T Dataset | GR00T训练数据，人形机器人 | [HuggingFace](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-Teleop-GR1) |
| PhysicalAI-Manipulation | 单臂操作数据集 | [HuggingFace](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-Manipulation-SingleArm) |

### LeRobot数据集系列

| 数据集名称 | 描述 | 链接 |
|-----------|------|------|
| aloha_sim_transfer_cube | ALOHA立方体转移 | [HuggingFace](https://huggingface.co/datasets/lerobot/aloha_sim_transfer_cube_human) |
| aloha_sim_insertion | ALOHA插入任务 | [HuggingFace](https://huggingface.co/datasets/lerobot/aloha_sim_insertion_human) |
| pusht | PushT数据集 | [HuggingFace](https://huggingface.co/datasets/lerobot/pusht) |
| umi_cup_in_the_wild | UMI野外杯子 | [HuggingFace](https://huggingface.co/datasets/lerobot/umi_cup_in_the_wild) |

### 抓取数据集

| 数据集名称 | 描述 | 链接 |
|-----------|------|------|
| GraspNet-1Billion | 10亿抓取数据 | [GitHub](https://github.com/graspnet/graspnet-1billion) |
| Dex-Net | 抓取规划数据集 | [GitHub](https://github.com/BerkeleyAutomation/dex-net) |
| DexGraspNet | 灵巧抓取数据集 | [GitHub](https://github.com/PKU-EPIC/DexGraspNet) |
| Cornell | 康奈尔抓取数据集 | [项目](https://pr.cs.cornell.edu/grasping/box_data.php) |
| Jacquard | Jacquard抓取数据集 | [项目](https://jacquard.liris.cnrs.fr/) |

### 3D物体数据集

| 数据集名称 | 描述 | 链接 |
|-----------|------|------|
| Objaverse-XL | 大规模3D资产 | [GitHub](https://github.com/allenai/objaverse-xl) |
| ShapeNet | 3D形状数据集 | [项目](https://shapenet.org/) |
| PartNet | 物体部件数据集 | [项目](https://partnet.cs.stanford.edu/) |
| GAPartNet | 可交互部件数据集 | [GitHub](https://github.com/PKU-EPIC/GAPartNet) |
| YCB Object Set | 物体模型集 | [项目](http://www.ycbbenchmarks.com/) |

### 视频与操作数据集

| 数据集名称 | 描述 | 链接 |
|-----------|------|------|
| Ego4D | 第一人称视频数据集 | [GitHub](https://github.com/facebookresearch/Ego4D) |
| EPIC-KITCHENS | 厨房操作数据集 | [项目](https://epic-kitchens.github.io/) |
| Something-Something | 动作识别数据集 | [项目](https://developer.qualcomm.com/software/ai-datasets/something-something) |

---

## 2.2 机器人仿真环境

### GPU加速仿真 ⭐⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Isaac Lab | 🔥🔥🔥 | NVIDIA最新开源框架，支持强化学习、模仿学习、运动规划 | [GitHub](https://github.com/isaac-sim/IsaacLab) |
| Isaac Gym | 🔥🔥🔥 | NVIDIA GPU加速仿真，支持数千并行环境 | [GitHub](https://github.com/NVIDIA-Omniverse/IsaacGym) |
| Isaac Sim | 🔥🔥 | NVIDIA高保真仿真平台 | [项目](https://developer.nvidia.com/isaac-sim) |

### 物理引擎

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| MuJoCo | 🔥🔥🔥 | DeepMind物理引擎，机器人仿真标准 | [GitHub](https://github.com/deepmind/mujoco) |
| PyBullet | 🔥🔥 | Bullet物理引擎Python接口 | [GitHub](https://github.com/bulletphysics/bullet3) |
| Drake | 🔥 | MIT机器人工具箱 | [GitHub](https://github.com/RobotLocomotion/drake) |
| PhysX | 🔥 | NVIDIA物理引擎 | [GitHub](https://github.com/NVIDIA-Omniverse/PhysX) |

### 机器人学习环境 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| ManiSkill3 | 🔥🔥 | 操作技能学习，支持GPU并行 | [GitHub](https://github.com/haosulab/ManiSkill3) |
| robosuite | 🔥🔥 | 机器人学习框架，NVIDIA/UT Austin | [GitHub](https://github.com/ARISE-Initiative/robosuite) |
| RLBench | 🔥 | 机器人学习基准 | [GitHub](https://github.com/stepjam/RLBench) |
| MetaWorld | 🔥 | 多任务RL基准 | [GitHub](https://github.com/Farama-Foundation/Metaworld) |
| gymnasium | 🔥🔥 | OpenAI Gym继承者 | [GitHub](https://github.com/Farama-Foundation/Gymnasium) |

### 具身AI仿真

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Habitat-Lab | Meta具身AI平台 | [GitHub](https://github.com/facebookresearch/habitat-lab) |
| Habitat-Sim | 高效3D仿真 | [GitHub](https://github.com/facebookresearch/habitat-sim) |
| AI2-THOR | AllenAI仿真环境 | [GitHub](https://github.com/allenai/ai2thor) |
| SAPIEN | 机器人仿真平台 | [GitHub](https://github.com/haosulab/SAPIEN) |

### ROS仿真

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Gazebo | ROS仿真器 | [GitHub](https://github.com/gazebosim/gz-sim) |
| Webots | 开源机器人仿真 | [GitHub](https://github.com/cyberbotics/webots) |
| CoppeliaSim | 通用机器人仿真 | [项目](https://www.coppeliarobotics.com/) |

### 自动驾驶仿真

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Carla | 自动驾驶仿真 | [GitHub](https://github.com/carla-simulator/carla) |
| AirSim | 微软无人机/汽车仿真 | [GitHub](https://github.com/microsoft/AirSim) |
| LGSVL | LGSVL仿真器 | [GitHub](https://github.com/lgsvl/simulator) |

### 无人机仿真

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| gym-pybullet-drones | 无人机仿真 | [GitHub](https://github.com/utiasDSL/gym-pybullet-drones) |
| Flightmare | 无人机仿真 | [GitHub](https://github.com/uzh-rpg/flightmare) |
| RotorS | 无人机仿真 | [GitHub](https://github.com/ethz-asl/rotors_simulator) |

---

# 🦾 板块三：操作与控制

> 机器人操作、抓取、灵巧手与运动规划

---

## 3.1 机器人操作与抓取

### 运动规划框架 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| MoveIt | 🔥🔥🔥 | ROS运动规划框架，工业标准 | [GitHub](https://github.com/ros-planning/moveit) |
| MoveIt2 | 🔥🔥 | ROS2运动规划 | [GitHub](https://github.com/ros-planning/moveit2) |
| OMPL | 🔥🔥 | 开放运动规划库 | [GitHub](https://github.com/ompl/ompl) |

### 抓取检测 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Contact-GraspNet | 🔥🔥 | 接触抓取生成，NVIDIA | [GitHub](https://github.com/NVlabs/contact_graspnet) |
| 6-DoF-GraspNet | 🔥 | 6自由度抓取 | [GitHub](https://github.com/jsll/6dof-graspnet) |
| PointNetGPD | 🔥 | 点云抓取检测 | [GitHub](https://github.com/lianghongzhuo/PointNetGPD) |
| GPD | | 抓取姿态检测 | [GitHub](https://github.com/atenpas/gpd) |
| GG-CNN | | 生成式抓取CNN | [GitHub](https://github.com/dougsm/ggcnn) |
| AnyGrasp | | 通用抓取 | [项目](https://graspness.github.io/) |

### 操作学习

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| CLIPort | 语言条件操作 | [GitHub](https://github.com/cliport/cliport) |
| PerAct | 感知器-动作 | [GitHub](https://github.com/peract/peract) |
| Ravens | 物体排列任务 | [GitHub](https://github.com/google-research/ravens) |
| Transporter-Networks | 运输网络 | [GitHub](https://github.com/google-research/transporter) |
| Visual-Pushing-Grasping | 推抓学习 | [GitHub](https://github.com/andyzeng/visual-pushing-grasping) |

### 轨迹优化

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| TrajOpt | 轨迹优化 | [GitHub](https://github.com/joschu/trajopt) |
| STOMP | 随机轨迹优化 | [GitHub](https://github.com/ros-industrial/stomp) |
| CHOMP | 协变梯度优化 | [GitHub](https://github.com/ros-planning/chomp) |

---

## 3.2 灵巧手与精细操作

### 灵巧手硬件支持

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Shadow-Hand | Shadow灵巧手 | [GitHub](https://github.com/shadow-robot/sr_core) |
| Allegro-Hand | Allegro灵巧手 | [GitHub](https://github.com/simlab-vt/Allegro-Hand) |
| LEAP-Hand | LEAP灵巧手 | [GitHub](https://github.com/leap-hand/leap-hand) |

### 灵巧操作学习 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| UniDexGrasp | 🔥🔥 | 通用灵巧抓取，北大 | [GitHub](https://github.com/PKU-EPIC/UniDexGrasp) |
| DexGraspNet | 🔥 | 灵巧抓取数据集 | [GitHub](https://github.com/PKU-EPIC/DexGraspNet) |
| DexPilot | | 灵巧手遥操作 | [项目](https://dexpilot.github.io/) |
| DexMV | | 灵巧手模仿学习 | [项目](https://dexmv.github.io/) |
| DexPoint | | 灵巧手点云操作 | [项目](https://sites.google.com/view/dexpoint) |

### 可变形物体操作

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Cloth-Manipulation | 布料操作 | [Awesome](https://github.com/DavidB-CMU/cloth-manipulation) |
| SoftGym | 软体操作仿真 | [GitHub](https://github.com/sizhe-li/SoftGym) |
| Deformable-Ravens | 可变形物体操作 | [GitHub](https://github.com/tomato1mule/deformable-ravens) |

---

## 3.3 运动规划与控制

### 动力学库 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Pinocchio | 🔥🔥🔥 | 刚体动力学库，法国INRIA | [GitHub](https://github.com/stack-of-tasks/pinocchio) |
| RBDL | | 刚体动力学库 | [GitHub](https://github.com/rbdl/rbdl) |
| MuJoCo Menagerie | 🔥 | MuJoCo模型集合 | [GitHub](https://github.com/google-deepmind/mujoco_menagerie) |

### 优化求解器

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| CasADi | 优化框架 | [GitHub](https://github.com/casadi/casadi) |
| qpOASES | QP求解器 | [GitHub](https://github.com/coin-or/qpOASES) |
| OSQP | OSQP求解器 | [GitHub](https://github.com/osqp/osqp) |
| HPIPM | 高性能内点法 | [GitHub](https://github.com/giaf/hpipm) |

### 控制框架

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Crocoddyl | 接触动力学 | [GitHub](https://github.com/loco-3d/crocoddyl) |
| TSID | 任务空间逆动力学 | [GitHub](https://github.com/stack-of-tasks/tsid) |
| WBC | 全身控制 | [GitHub](https://github.com/leggedrobotics/whole_body_control) |
| mc_rtc | 机器人控制 | [GitHub](https://github.com/jrl-umi3218/mc_rtc) |

### MPC

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| ACADO | 最优控制 | [GitHub](https://github.com/acado/acado) |
| Control-Toolbox | 控制工具箱 | [GitHub](https://github.com/ethz-adrl/control-toolbox) |

---

# 👁️ 板块四：感知与导航

> SLAM、3D视觉、机器人视觉感知

---

## 4.1 机器人导航与SLAM

### 视觉SLAM ⭐⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| ORB-SLAM3 | 🔥🔥🔥 | 视觉SLAM，支持单目/双目/RGB-D | [GitHub](https://github.com/UZ-SLAMLab/ORB_SLAM3) |
| DROID-SLAM | 🔥🔥🔥 | 深度视觉SLAM，普林斯顿 | [GitHub](https://github.com/princeton-vl/DROID-SLAM) |
| VINS-Fusion | 🔥🔥 | 视觉惯性里程计，港科大 | [GitHub](https://github.com/HKUST-Aerial-Robotics/VINS-Fusion) |
| OpenVINS | 🔥🔥 | 开源VINS | [GitHub](https://github.com/rpng/open_vins) |

### 激光SLAM ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| LIO-SAM | 🔥🔥🔥 | 激光惯性里程计 | [GitHub](https://github.com/TixiaoShan/LIO-SAM) |
| FAST-LIO2 | 🔥🔥🔥 | 快速激光里程计，港大 | [GitHub](https://github.com/hku-mars/FAST_LIO) |
| Cartographer | 🔥🔥 | Google SLAM | [GitHub](https://github.com/cartographer-project/cartographer) |
| LOAM | 🔥🔥 | 激光里程计 | [GitHub](https://github.com/HKUST-Aerial-Robotics/A-LOAM) |

### 神经SLAM

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| NICE-SLAM | 神经隐式SLAM | [GitHub](https://github.com/cvg/nice-slam) |
| iMAP | 隐式建图 | [GitHub](https://github.com/ethz-asl/imap) |
| Co-SLAM | 联合SLAM | [GitHub](https://github.com/HengyiWang/Co-SLAM) |
| Point-SLAM | 点云SLAM | [GitHub](https://github.com/ActiveVisionLab/point_slam) |

### 导航框架

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| navigation2 | ROS2导航栈 | [GitHub](https://github.com/ros-planning/navigation2) |
| navigation | ROS导航栈 | [GitHub](https://github.com/ros-planning/navigation) |
| teb_local_planner | TEB局部规划器 | [GitHub](https://github.com/rst-tu-dortmund/teb_local_planner) |
| PythonRobotics | Python机器人算法 | [GitHub](https://github.com/AtsushiSakai/PythonRobotics) |

### 视觉语言导航

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| VLN-CE | 连续VLN | [GitHub](https://github.com/facebookresearch/vln-ce) |
| ViNT | 视觉导航Transformer | [GitHub](https://github.com/robodhruv/visualnav) |
| NoMaD | 目标导航 | [GitHub](https://github.com/robodhruv/nomad) |

---

## 4.2 3D视觉与点云处理

### 点云深度学习 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| PointNet | 🔥🔥🔥 | 点云深度学习开山之作 | [GitHub](https://github.com/charlesq34/pointnet) |
| PointNet++ | 🔥🔥🔥 | PointNet改进版 | [GitHub](https://github.com/charlesq34/pointnet2) |
| PointTransformer | 🔥🔥 | 点云Transformer | [GitHub](https://github.com/Pointcept/PointTransformer) |
| Point-BERT | 🔥 | 点云BERT | [GitHub](https://github.com/lulutang0608/Point-BERT) |
| Point-MAE | 🔥 | 点云MAE | [GitHub](https://github.com/Pang-Yatian/Point-MAE) |

### 3D处理库 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Open3D | 🔥🔥🔥 | 3D数据处理 | [GitHub](https://github.com/isl-org/Open3D) |
| PCL | 🔥🔥🔥 | 点云库 | [GitHub](https://github.com/PointCloudLibrary/pcl) |
| PyVista | 🔥🔥 | 3D可视化 | [GitHub](https://github.com/pyvista/pyvista) |
| Trimesh | 🔥🔥 | 三角网格处理 | [GitHub](https://github.com/mikedh/trimesh) |
| PyTorch3D | 🔥🔥 | Facebook 3D库 | [GitHub](https://github.com/facebookresearch/pytorch3d) |
| Kaolin | 🔥🔥 | NVIDIA 3D库 | [GitHub](https://github.com/NVIDIAGameWorks/kaolin) |

### 稀疏卷积

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| MinkowskiEngine | NVIDIA稀疏卷积 | [GitHub](https://github.com/NVIDIA/MinkowskiEngine) |
| spconv | 稀疏卷积 | [GitHub](https://github.com/traveller59/spconv) |

### NeRF与3D重建 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| nerfstudio | 🔥🔥🔥 | NeRF工具箱 | [GitHub](https://github.com/nerfstudio-project/nerfstudio) |
| 3D Gaussian Splatting | 🔥🔥🔥 | 3D高斯泼溅 | [GitHub](https://github.com/graphdeco-inria/gaussian-splatting) |
| Instant-NGP | 🔥🔥🔥 | 即时神经图形 | [GitHub](https://github.com/NVlabs/instant-ngp) |
| NeRF | 🔥🔥🔥 | 神经辐射场原版 | [GitHub](https://github.com/bmild/nerf) |

### 点云配准

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| FCGF | 全卷积几何特征 | [GitHub](https://github.com/chrischoy/FCGF) |
| GeoTransformer | 几何Transformer | [GitHub](https://github.com/qinzheng93/GeoTransformer) |
| Predator | 重叠预测 | [GitHub](https://github.com/overlappredator/OverlapPredator) |

### 点云语言模型

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| ULIP | ULIP点云语言 | [GitHub](https://github.com/salesforce/ULIP) |
| PointCLIP | 点云CLIP | [GitHub](https://github.com/ZrrSkywalker/PointCLIP) |
| PointLLM | 点云LLM | [GitHub](https://github.com/OpenRobotLab/PointLLM) |

---

## 4.3 机器人视觉与感知

### 目标检测 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| YOLOv8 | 🔥🔥🔥 | YOLOv8，Ultralytics | [GitHub](https://github.com/ultralytics/ultralytics) |
| YOLOv10 | 🔥🔥 | YOLOv10 | [GitHub](https://github.com/THU-MIG/yolov10) |
| Detectron2 | 🔥🔥🔥 | Facebook检测框架 | [GitHub](https://github.com/facebookresearch/detectron2) |
| MMDetection | 🔥🔥🔥 | OpenMMLab检测 | [GitHub](https://github.com/open-mmlab/mmdetection) |
| MMDetection3D | 🔥🔥 | 3D检测 | [GitHub](https://github.com/open-mmlab/mmdetection3d) |

### 分割模型 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Segment-Anything | 🔥🔥🔥 | SAM，Meta分割一切 | [GitHub](https://github.com/facebookresearch/segment-anything) |
| MobileSAM | 🔥🔥 | 轻量SAM | [GitHub](https://github.com/ChaoningZhang/MobileSAM) |
| FastSAM | 🔥🔥 | 快速SAM | [GitHub](https://github.com/CASIA-IVA-Lab/FastSAM) |
| Grounded-SAM | 🔥🔥 | Grounded SAM | [GitHub](https://github.com/IDEA-Research/Grounded-Segment-Anything) |
| Mask2Former | 🔥🔥 | Mask2Former | [GitHub](https://github.com/facebookresearch/Mask2Former) |

### 视觉基础模型 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| CLIP | 🔥🔥🔥 | OpenAI CLIP | [GitHub](https://github.com/openai/CLIP) |
| OpenCLIP | 🔥🔥🔥 | OpenCLIP | [GitHub](https://github.com/mlfoundations/open_clip) |
| DINOv2 | 🔥🔥🔥 | Meta DINOv2 | [GitHub](https://github.com/facebookresearch/dinov2) |
| GroundingDINO | 🔥🔥🔥 | Grounding DINO | [GitHub](https://github.com/IDEA-Research/GroundingDINO) |

### 姿态估计

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| MMPose | 姿态估计 | [GitHub](https://github.com/open-mmlab/mmpose) |
| MMHuman3D | 3D人体 | [GitHub](https://github.com/open-mmlab/mmhuman3d) |

### BEV感知

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| BEVFormer | BEV感知 | [GitHub](https://github.com/fundamentalvision/BEVFormer) |
| BEVFusion | BEV融合 | [GitHub](https://github.com/mit-han-lab/bevfusion) |

---

# 🤖 板块五：平台与系统

> ROS、机器人硬件平台、LLM+机器人、遥操作系统

---

## 5.1 ROS与机器人操作系统

### ROS核心 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| ROS | 🔥🔥🔥 | 机器人操作系统 | [GitHub](https://github.com/ros/ros) |
| ROS2 | 🔥🔥🔥 | ROS2框架 | [GitHub](https://github.com/ros2) |
| ros_comm | 🔥🔥 | ROS通信库 | [GitHub](https://github.com/ros/ros_comm) |
| rclcpp | 🔥🔥 | ROS2 C++库 | [GitHub](https://github.com/ros2/rclcpp) |

### ROS控制

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| ros2_control | ROS2控制框架 | [GitHub](https://github.com/ros-controls/ros2_control) |
| ros_control | ROS控制框架 | [GitHub](https://github.com/ros-controls/ros_control) |

### ROS可视化

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| rviz | 可视化工具 | [GitHub](https://github.com/ros-visualization/rviz) |
| foxglove | Foxglove可视化 | [GitHub](https://github.com/foxglove/foxglove) |
| rqt | Qt工具 | [GitHub](https://github.com/ros-visualization/rqt) |

### ROS机器人驱动

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| universal_robot | UR机器人 | [GitHub](https://github.com/ros-industrial/universal_robot) |
| franka_ros | Franka机器人 | [GitHub](https://github.com/frankaemika/franka_ros) |
| xarm_ros | xArm机器人 | [GitHub](https://github.com/xArm-Developer/xarm_ros) |
| realsense-ros | RealSense ROS | [GitHub](https://github.com/IntelRealSense/realsense-ros) |

### ROS导航与SLAM

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| navigation2 | ROS2导航 | [GitHub](https://github.com/ros-planning/navigation2) |
| slam_toolbox | SLAM工具箱 | [GitHub](https://github.com/SteveMacenski/slam_toolbox) |
| robot_localization | 机器人定位 | [GitHub](https://github.com/cra-ros-pkg/robot_localization) |

---

## 5.2 人形机器人与四足机器人

### 人形机器人 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Isaac-GR00T | 🔥🔥 | NVIDIA人形机器人基础模型 | [GitHub](https://github.com/NVIDIA/Isaac-GR00T) |
| H1 | 宇树H1人形 | [GitHub](https://github.com/unitreerobotics/h1) |
| G1 | 宇树G1人形 | [GitHub](https://github.com/unitreerobotics/g1) |
| iCub | iCub人形机器人 | [GitHub](https://github.com/robotology/icub-main) |
| Talos | PAL Talos机器人 | [GitHub](https://github.com/pal-robotics/talos_robot) |

### 四足机器人 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Go2 | 🔥 | 宇树Go2四足 | [GitHub](https://github.com/unitreerobotics/go2) |
| Go1 | 🔥 | 宇树Go1四足 | [GitHub](https://github.com/unitreerobotics/go1) |
| Spot SDK | 🔥🔥 | 波士顿动力Spot SDK | [GitHub](https://github.com/boston-dynamics/spot-sdk) |
| ANYmal | 🔥 | ANYbotics四足 | [GitHub](https://github.com/ANYbotics/anymal) |
| Cheetah-Software | 🔥🔥 | MIT猎豹软件 | [GitHub](https://github.com/mit-biomimetics/Cheetah-Software) |
| CyberDog | 小米CyberDog | [GitHub](https://github.com/MiRoboticsLab/cyberdog_ros2) |
| OpenCat | 开源机器猫 | [GitHub](https://github.com/PetoiCamp/OpenCat) |
| SpotMicro | 开源Spot Micro | [GitHub](https://github.com/mike4192/spotMicro) |

### 四足RL控制

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| legged_gym | 四足RL训练 | [GitHub](https://github.com/leggedrobotics/legged_gym) |
| Rex-Gym | 四足RL环境 | [GitHub](https://github.com/nicrusso7/rex-gym) |

---

## 5.3 开源机器人硬件平台

### 低成本机械臂 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| SO-ARM100 | 🔥🔥🔥 | 开源机械臂，HuggingFace推荐 | [GitHub](https://github.com/TheRobotStudio/SO-ARM100) |
| Low-Cost-Robot | 🔥🔥🔥 | 低成本机器人，Koch v1.1 | [GitHub](https://github.com/AlexanderKoch-Koch/low_cost_robot) |
| AR4 | 🔥 | 开源6轴机械臂 | [GitHub](https://github.com/Chris-Annin/AR4) |
| myCobot | 大象机器人机械臂 | [GitHub](https://github.com/elephantrobotics/myCobot) |

### 移动机器人

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| TurtleBot3 | TurtleBot3 | [GitHub](https://github.com/ROBOTIS-GIT/turtlebot3) |
| TurtleBot4 | TurtleBot4 | [GitHub](https://github.com/turtlebot/turtlebot4_robot) |
| LoCoBot | 低成本移动机器人 | [GitHub](https://github.com/LowCostRobotArm/locobot) |
| Create3 | iRobot Create3 | [GitHub](https://github.com/iRobotEducation/create3_sim) |

### 开源人形

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| InMoov | 开源人形机器人 | [GitHub](https://github.com/InMoov/inmoov) |
| Poppy | Poppy机器人 | [GitHub](https://github.com/poppy-project/poppy-creature) |

---

## 5.4 大语言模型与机器人结合

### LLM机器人框架 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| LangChain | 🔥🔥🔥 | LLM应用框架 | [GitHub](https://github.com/langchain-ai/langchain) |
| AutoGen | 🔥🔥🔥 | 微软多智能体 | [GitHub](https://github.com/microsoft/autogen) |
| MetaGPT | 🔥🔥🔥 | 多智能体框架 | [GitHub](https://github.com/geekan/MetaGPT) |
| LlamaIndex | 🔥🔥🔥 | 数据框架 | [GitHub](https://github.com/run-llama/llama_index) |

### LLM机器人应用

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Code-as-Policies | 代码即策略 | [GitHub](https://github.com/google-research/code-as-policies) |
| SayCan | SayCan框架 | [论文](https://arxiv.org/abs/2204.01691) |
| ProgPrompt | 程序化提示 | [GitHub](https://github.com/NVIDIA/ProGPrompt) |
| Voyager | Minecraft LLM智能体 | [GitHub](https://github.com/MineDojo/Voyager) |
| Inner-Monologue | 内心独白 | [论文](https://arxiv.org/abs/2207.05608) |

### LLM基础模型

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Transformers | HuggingFace Transformers | [GitHub](https://github.com/huggingface/transformers) |
| LLaMA | Meta LLaMA | [GitHub](https://github.com/meta-llama/llama) |
| PEFT | 参数高效微调 | [GitHub](https://github.com/huggingface/peft) |

---

## 5.5 遥操作与数据采集

### 遥操作系统 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| UMI | 🔥🔥 | 通用机器人接口，斯坦福 | [GitHub](https://github.com/real-stanford/umi) |
| ALOHA | 🔥🔥🔥 | 双臂遥操作，斯坦福 | [GitHub](https://github.com/tonyzhaozh/aloha) |
| GELLO | 🔥🔥 | 低成本遥操作 | [GitHub](https://github.com/wuphilipp/gello) |
| DexPilot | 灵巧手遥操作 | [项目](https://dexpilot.github.io/) |

### VR遥操作

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Quest-Teleoperation | Quest遥操作 | [GitHub](https://github.com/quest-teleop/quest-teleop) |
| VR-Teleoperation | VR遥操作 | [GitHub](https://github.com/vr-teleop/vr-teleop) |

### 数据采集工具

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| ROS-Bag-Tools | ROS Bag工具 | [GitHub](https://github.com/ros-bag/ros-bag-tools) |
| rosbag2 | ROS2 Bag | [GitHub](https://github.com/ros2/rosbag2) |
| foxglove-bridge | Foxglove桥接 | [GitHub](https://github.com/foxglove/ros-foxglove-bridge) |

---

## 5.6 Sim2Real与域适应

### 域适应方法

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Domain-Adaptation | 域适应资源 | [GitHub](https://github.com/domain-adaptation/domain-adaptation) |
| DANN | 域对抗网络 | [GitHub](https://github.com/fungtion/DANN) |
| Transfer-Learning-Library | 迁移学习库 | [GitHub](https://github.com/thuml/Transfer-Learning-Library) |
| DALIB | 域适应库 | [GitHub](https://github.com/thuml/DALIB) |

### Sim2Real技术

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| DRQ | 数据增强RL | [GitHub](https://github.com/denisyarats/drq) |
| RMA | 快速运动适应 | [论文](https://arxiv.org/abs/2010.05178) |
| Domain-Randomization | 域随机化 | [GitHub](https://github.com/domain-randomization/domain-randomization) |

---

# 🛠️ 板块六：工具与资源

> 学习框架、工具库、综合资源、专题应用

---

## 6.1 机器人学习框架

### 综合框架 ⭐⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| LeRobot | 🔥🔥🔥 | HuggingFace机器人学习框架，最全面的开源机器人AI库 | [GitHub](https://github.com/huggingface/lerobot) |
| PyRobot | 🔥🔥 | Facebook机器人平台 | [GitHub](https://github.com/facebookresearch/pyrobot) |
| robosuite | 🔥🔥🔥 | 机器人学习框架，NVIDIA/UT Austin | [GitHub](https://github.com/ARISE-Initiative/robosuite) |
| robomimic | 🔥🔥 | 机器人模仿学习 | [GitHub](https://github.com/ARISE-Initiative/robomimic) |

### 专用框架

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| rlkit | RL工具包 | [GitHub](https://github.com/vitchyr/rlkit) |
| softlearning | Soft Learning | [GitHub](https://github.com/rail-berkeley/softlearning) |
| rl-baselines3-zoo | RL动物园 | [GitHub](https://github.com/DLR-RM/rl-baselines3-zoo) |

---

## 6.2 机器人工具与库

### 机器人学工具箱 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Robotics-Toolbox | 🔥🔥🔥 | 机器人工具箱，Peter Corke | [GitHub](https://github.com/petercorke/robotics-toolbox-python) |
| Spatial-Math | 🔥🔥 | 空间数学 | [GitHub](https://github.com/petercorke/spatialmath-python) |
| RVC | 机器人视觉控制 | [GitHub](https://github.com/petercorke/RVC) |

### 优化库

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| GTSAM | GTSAM优化 | [GitHub](https://github.com/borglab/gtsam) |
| Ceres | Ceres优化 | [GitHub](https://github.com/ceres-solver/ceres-solver) |
| g2o | g2o优化 | [GitHub](https://github.com/RainerKuemmerle/g2o) |

### 数学库

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Eigen | Eigen矩阵库 | [GitLab](https://gitlab.com/libeigen/eigen) |
| Sophus | 李群库 | [GitHub](https://github.com/strasdat/Sophus) |
| Orocos-KDL | 运动学动力学 | [GitHub](https://github.com/orocos/orocos_kinematics_dynamics) |

### 碰撞检测

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| FCL | 灵活碰撞库 | [GitHub](https://github.com/flexible-collision-library/fcl) |
| HPP-FCL | 碰撞检测 | [GitHub](https://github.com/humanoid-path-planner/hpp-fcl) |

### 地图表示

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| octomap | 八叉树地图 | [GitHub](https://github.com/OctoMap/octomap) |
| grid_map | 网格地图 | [GitHub](https://github.com/ANYbotics/grid_map) |
| voxblox | 体素块 | [GitHub](https://github.com/ethz-asl/voxblox) |

---

## 6.3 综合资源清单

### 具身智能资源 ⭐⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Awesome-Embodied-AI | 🔥🔥 | 具身智能综合资源清单 | [GitHub](https://github.com/ChenHao-129/Awesome-Embodied-AI) |
| Awesome-LLM-Robotics | 🔥🔥🔥 | LLM与机器人结合论文合集 | [GitHub](https://github.com/GT-RIPL/Awesome-LLM-Robotics) |
| Everything-LLMs-And-Robotics | 🔥🔥🔥 | LLM+机器人最大资源库 | [GitHub](https://github.com/jrin771/Everything-LLMs-And-Robotics) |
| Embodied-AI-Guide | 🔥🔥 | MIT具身智能技术指南 | [GitHub](https://github.com/embodied-ai/Embodied-AI-Guide) |

### 机器人学资源

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Awesome-Robotics | 机器人学综合资源 | [GitHub](https://github.com/kiloreux/awesome-robotics) |
| Awesome-Robotics-Manipulation | 300+机器人操作论文 | [GitHub](https://github.com/BaiShuanghao/Awesome-Robotics-Manipulation) |
| Awesome-Robotics-3D | 3D视觉+机器人论文 | [GitHub](https://github.com/zubair-irshad/Awesome-Robotics-3D) |
| Awesome-Robotics-Projects | 机器人项目合集 | [GitHub](https://github.com/mjyc/awesome-robotics-projects) |

### AI基础资源

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Awesome-Deep-Learning | 深度学习资源 | [GitHub](https://github.com/ChristosChristofidis/awesome-deep-learning) |
| Awesome-Machine-Learning | 机器学习资源 | [GitHub](https://github.com/josephmisiti/awesome-machine-learning) |
| Awesome-Computer-Vision | 计算机视觉资源 | [GitHub](https://github.com/jbhuang0604/awesome-computer-vision) |
| Awesome-RL | 强化学习资源 | [GitHub](https://github.com/aikorea/awesome-rl) |

### 专题资源

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Awesome-SLAM | SLAM资源 | [GitHub](https://github.com/SilenceOverflow/Awesome-SLAM) |
| Awesome-Path-Planning | 路径规划资源 | [GitHub](https://github.com/zhm-real/PathPlanning) |
| Awesome-Point-Cloud | 点云资源 | [GitHub](https://github.com/Yochengliu/awesome-point-cloud-analysis) |
| Awesome-NeRF | NeRF资源 | [GitHub](https://github.com/yenchenlin/awesome-nerf) |
| Awesome-3DGS | 3DGS资源 | [GitHub](https://github.com/MrNeRF/awesome-3D-gaussian-splatting) |
| Awesome-VLN | 视觉语言导航资源 | [GitHub](https://github.com/daqingliu/awesome-VLN) |

---

## 6.4 自动驾驶与移动机器人

### 自动驾驶平台 ⭐

| 仓库名称 | Stars | 描述 | 链接 |
|---------|-------|------|------|
| Autoware | 🔥🔥🔥 | 开源自动驾驶 | [GitHub](https://github.com/autowarefoundation/autoware) |
| Apollo | 🔥🔥🔥 | 百度自动驾驶 | [GitHub](https://github.com/ApolloAuto/apollo) |
| Carla | 🔥🔥🔥 | 自动驾驶仿真 | [GitHub](https://github.com/carla-simulator/carla) |

### 无人机平台

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| PX4 | PX4飞控 | [GitHub](https://github.com/PX4/PX4-Autopilot) |
| ArduPilot | ArduPilot飞控 | [GitHub](https://github.com/ArduPilot/ArduPilot) |
| MAVROS | MAVLink ROS | [GitHub](https://github.com/mavlink/mavros) |
| Crazyflie | Crazyflie无人机 | [GitHub](https://github.com/bitcraze/crazyflie-firmware) |

### 移动机器人平台

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Jackal | Jackal机器人 | [GitHub](https://github.com/jackal/jackal) |
| Husky | Husky机器人 | [GitHub](https://github.com/husky/husky) |
| Fetch | Fetch机器人 | [GitHub](https://github.com/fetchrobotics/fetch_ros) |

---

## 6.5 触觉感知与传感器

### 触觉传感器

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| GelSight | GelSight触觉传感器 | [GitHub](https://github.com/gelsightinc/gelsight) |
| DIGIT | Facebook触觉传感器 | [GitHub](https://github.com/facebookresearch/digit) |
| TACTO | 触觉仿真器 | [GitHub](https://github.com/facebookresearch/tacto) |
| Taxim | 触觉仿真 | [GitHub](https://github.com/rpl-cmu/taxim) |

### 触觉学习

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Tactile-Gym | 触觉RL环境 | [GitHub](https://github.com/tactile-gym/tactile-gym) |
| Tactile-Dexterity | 触觉灵巧性 | [GitHub](https://github.com/tactile-dexterity/tactile-dexterity) |

### 力传感器

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| Robotiq-FT | Robotiq力传感器 | [GitHub](https://github.com/robotiq/robotiq_ft_sensor) |

---

## 6.6 多机器人系统

### 多智能体RL

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| PettingZoo | 多智能体环境 | [GitHub](https://github.com/Farama-Foundation/PettingZoo) |
| pymarl | PyMARL | [GitHub](https://github.com/oxwhirl/pymarl) |
| MAPPO | MAPPO | [GitHub](https://github.com/marl/MA-PPO) |
| QMIX | QMIX | [GitHub](https://github.com/oxwhirl/qmix) |

### 群体机器人

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| MPE | 多粒子环境 | [GitHub](https://github.com/openai/multiagent-particle-envs) |
| Ma-Gym | 多智能体Gym | [GitHub](https://github.com/koulanurag/ma-gym) |

---

## 6.7 机器人安全与可靠性

### 安全RL

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| safety-gym | 安全Gym | [GitHub](https://github.com/openai/safety-gym) |
| safe-rl | 安全RL | [GitHub](https://github.com/safe-rl/safe-rl) |

### 安全控制

| 仓库名称 | 描述 | 链接 |
|---------|------|------|
| collision-avoidance | 碰撞避免 | [GitHub](https://github.com/collision-avoidance/collision-avoidance) |
| safe-navigation | 安全导航 | [GitHub](https://github.com/safe-navigation/safe-navigation) |

---

## 统计信息

### 板块统计

| 板块 | 子分类数 | 仓库数量 | 重要程度 |
|------|---------|---------|---------|
| 📌 核心技术 | 4 | 100+ | ⭐⭐⭐ |
| 📊 数据与仿真 | 2 | 80+ | ⭐⭐⭐ |
| 🦾 操作与控制 | 3 | 50+ | ⭐⭐ |
| 👁️ 感知与导航 | 3 | 80+ | ⭐⭐ |
| 🤖 平台与系统 | 6 | 100+ | ⭐⭐ |
| 🛠️ 工具与资源 | 7 | 80+ | ⭐⭐ |
| **总计** | **25** | **1200+** | |

### 2024-2025年重要新增项目

| 项目名称 | 来源 | 描述 |
|---------|------|------|
| GR00T N1 | NVIDIA | 全球首个开源人形机器人基础模型 |
| π0 (Pi-Zero) | Physical Intelligence | 通用机器人策略模型 |
| AgiBot World | 智元机器人 | 全球最大真实世界具身智能数据集 |
| LeRobot | HuggingFace | 最全面的开源机器人AI库 |
| OpenVLA | Princeton | 开源VLA模型 |
| Isaac Lab | NVIDIA | 最新开源机器人仿真框架 |

---

## 参考资源

### 官方项目
- [HuggingFace LeRobot](https://huggingface.co/lerobot)
- [NVIDIA Isaac](https://developer.nvidia.com/isaac-sim)
- [Open X-Embodiment](https://robotics-transformer-x.github.io/)
- [AgiBot World](https://agibot-world.com/)

### 学术资源
- [Awesome-LLM-Robotics](https://github.com/GT-RIPL/Awesome-LLM-Robotics)
- [Awesome-Embodied-AI](https://github.com/ChenHao-129/Awesome-Embodied-AI)
- [Embodied-AI-Guide](https://github.com/embodied-ai/Embodied-AI-Guide)

### 教程与课程
- [Robot Learning: A Tutorial](https://arxiv.org/abs/2510.12403)
- [SpinningUp in Deep RL](https://spinningup.openai.com/)
- [Peter Corke Robotics Toolbox](https://github.com/petercorke/robotics-toolbox-python)

---

*本文档整理了具身智能领域的高质量GitHub项目，持续更新中。如有遗漏或错误，欢迎补充修正。*

*最后更新：2025年2月*
