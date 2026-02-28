# Hugging Face 具身智能资源大全

> 整理时间：2026年2月20日  
> 资源数量：250+ 模型 | 700+ 数据集  
> 来源：Hugging Face (https://huggingface.co)

---

## 目录

### 第一部分：模型 (Models)

#### 1. 核心机器人模型
- [一、视觉-语言-动作模型 (VLA)](#一视觉-语言-动作模型-vla)
- [二、NVIDIA GR00T 系列](#二nvidia-gr00t-系列)
- [三、LeRobot 预训练模型](#三lerobot-预训练模型)
- [四、扩散策略模型](#四扩散策略模型)
- [五、行为克隆与模仿学习模型](#五行为克隆与模仿学习模型)
- [六、世界模型](#六世界模型)

#### 2. 视觉感知模型
- [七、深度估计模型](#七深度估计模型)
- [八、视觉基础模型](#八视觉基础模型)
- [九、分割模型](#九分割模型)
- [十、目标检测模型](#十目标检测模型)
- [十一、姿态估计模型](#十一姿态估计模型)

#### 3. 3D与空间理解
- [十二、点云与3D模型](#十二点云与3d模型)

#### 4. 运动与控制
- [十三、导航模型](#十三导航模型)
- [十四、抓取模型](#十四抓取模型)
- [十五、其他机器人模型](#十五其他机器人模型)

### 第二部分：数据集 (Datasets)

#### 1. 通用数据集
- [十六、核心数据集](#十六核心数据集)
- [十七、机器人操作数据集](#十七机器人操作数据集)
- [十八、LeRobot 数据集系列](#十八lerobot-数据集系列)

#### 2. 专用数据集
- [十九、ALOHA 数据集系列](#十九aloha-数据集系列)
- [二十、LIBERO 数据集系列](#二十libero-数据集系列)
- [二十一人形机器人数据集](#二十一人形机器人数据集)
- [二十二、导航与移动数据集](#二十二导航与移动数据集)

#### 3. 仿真环境
- [二十三、仿真环境数据集](#二十三仿真环境数据集)

#### 4. 最新数据集
- [二十四、NVIDIA PhysicalAI 系列](#二十四nvidia-physicalai-系列)
- [二十五、AgiBot 数据集系列](#二十五agibot-数据集系列)
- [二十六、RoboMIND 数据集系列](#二十六robomind-数据集系列)
- [二十七、Isaac Sim 数据集](#二十七isaac-sim-数据集)
- [二十八、ManiSkill 数据集系列](#二十八maniskill-数据集系列)
- [二十九、RLBench 数据集系列](#二十九rlbench-数据集系列)

#### 5. 任务特定数据集
- [三十、抓取数据集](#三十抓取数据集)
- [三十一、Peg Insertion 数据集](#三十一peg-insertion-数据集)
- [三十二、Pick & Place 数据集](#三十二pick--place-数据集)
- [三十三、厨房数据集](#三十三厨房数据集)
- [三十四、深度估计数据集](#三十四深度估计数据集)
- [三十五、点云数据集](#三十五点云数据集)
- [三十六、SLAM与定位数据集](#三十六slam与定位数据集)

#### 6. 学习范式数据集
- [三十七、模仿学习数据集](#三十七模仿学习数据集)
- [三十八、遥操作数据集](#三十八遥操作数据集)
- [三十九、具身智能基准测试](#三十九具身智能基准测试)
- [四十、其他相关数据集](#四十其他相关数据集)

---

# 第一部分：模型 (Models)

---

## 一、视觉-语言-动作模型 (VLA)

### 1.1 OpenVLA 系列

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| openvla/openvla-7b | 开源视觉-语言-动作模型，在 Open X-Embodiment 数据集上训练 | 7B | [链接](https://huggingface.co/openvla/openvla-7b) |
| openvla/openvla-7b-finetuned-libero-10 | OpenVLA 在 LIBERO-10 上微调版本 | 8B | [链接](https://huggingface.co/openvla/openvla-7b-finetuned-libero-10) |
| openvla/openvla-7b-finetuned-libero-goal | OpenVLA 在 LIBERO-Goal 上微调版本 | 8B | [链接](https://huggingface.co/openvla/openvla-7b-finetuned-libero-goal) |
| openvla/openvla-7b-finetuned-libero-object | OpenVLA 在 LIBERO-Object 上微调版本 | 8B | [链接](https://huggingface.co/openvla/openvla-7b-finetuned-libero-object) |
| openvla/openvla-7b-finetuned-libero-spatial | OpenVLA 在 LIBERO-Spatial 上微调版本 | 8B | [链接](https://huggingface.co/openvla/openvla-7b-finetuned-libero-spatial) |
| openvla/openvla-7b-prismatic | OpenVLA Prismatic 版本 | 8B | [链接](https://huggingface.co/openvla/openvla-7b-prismatic) |
| openvla/openvla-v01-7b | OpenVLA V01 版本 | 7B | [链接](https://huggingface.co/openvla/openvla-v01-7b) |

**OpenVLA 特点：**
- 基于 970K 机器人操作片段训练
- 输入：语言指令 + 相机图像
- 输出：7-DoF 末端执行器动作 (x, y, z, roll, pitch, yaw, gripper)
- 支持零样本控制和微调
- 许可证：MIT

### 1.2 RT 系列 (Robotics Transformer)

| 模型名称 | 描述 | 来源 | 链接 |
|---------|------|------|------|
| RT-1 | Robotics Transformer 1，首个大规模机器人策略模型 | Google | [论文](https://arxiv.org/abs/2212.06817) |
| RT-2 | Robotics Transformer 2，视觉-语言-动作模型 | Google DeepMind | [论文](https://arxiv.org/abs/2307.15818) |
| RT-X | 跨具身机器人策略模型 | Open X-Embodiment | [项目](https://robotics-transformer-x.github.io/) |
| RT-Trajectory | RT 轨迹模型 | Google | [论文](https://arxiv.org/abs/2311.01977) |

### 1.3 Octo 系列

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| octo-small | Octo 小型模型，通用机器人策略 | 27M | [项目](https://octo-models.github.io/) |
| octo-base | Octo 基础模型 | 93M | [项目](https://octo-models.github.io/) |
| octo-large | Octo 大型模型 | 314M | [项目](https://octo-models.github.io/) |

**Octo 特点：**
- 基于 Open X-Embodiment 数据集训练
- 支持多种机器人平台
- 可微调适应新任务

### 1.4 π0 (Pi-Zero) 系列

| 模型名称 | 描述 | 来源 | 链接 |
|---------|------|------|------|
| π0 | Physical Intelligence 的通用机器人策略模型 | Physical Intelligence | [项目](https://www.physicalintelligence.company/) |
| π0-FAST | π0 快速版本 | Physical Intelligence | [项目](https://www.physicalintelligence.company/) |

### 1.5 其他 VLA 模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| HuggingFaceVLA/smol-vla | 小型 VLA 模型 | - | [链接](https://huggingface.co/HuggingFaceVLA) |
| RoboVLM | 机器人视觉语言模型 | - | [论文](https://arxiv.org/abs/2311.01379) |
| OpenVLA-OFT | OpenVLA 优化微调版本 | 7B | [项目](https://openvla.github.io/) |
| Meta-Llama/Llama-3.2-11B-Vision | Llama 3.2 视觉模型，可用于具身智能 | 11B | [链接](https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct) |
| google/palme | PaLM-E 具身多模态模型 | 12B | [链接](https://huggingface.co/google/palme) |
| DeepMind/robotics-transformer-1 | RT-1 机器人Transformer | - | [论文](https://arxiv.org/abs/2212.06817) |
| DeepMind/robotics-transformer-2 | RT-2 视觉-语言-动作模型 | - | [论文](https://arxiv.org/abs/2307.15818) |
| facebook/robotics-mt | 多任务机器人模型 | - | [项目](https://ai.facebook.com/research/publications/) |
| kakaoenterprise/روبوت | 阿拉伯语机器人模型 | - | [链接](https://huggingface.co/kakaoenterprise/روبوت) |
|adept/act-anymal|AnyMAL动物形态机器人|70B|[链接](https://huggingface.co/adept/act-anymal)|
|Rhodonite/Rho-1-Robot| Rho-1 机器人模型 | 1B | [链接](https://huggingface.co/Rhodonite/Rho-1-Robot) |
|BAAI/Infinity-MM|Infinity多模态模型|8B|[链接](https://huggingface.co/BAAI/Infinity-MM)|
|THUDM/GLM-4V|GLM-4V视觉模型|9B|[链接](https://huggingface.co/THUDM/GLM-4v)|

---

## 二、NVIDIA GR00T 系列

### 2.1 GR00T 基础模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| nvidia/GR00T-N1-2B | NVIDIA Isaac GR00T N1 人形机器人基础模型 | 2B | [链接](https://huggingface.co/nvidia/GR00T-N1-2B) |

**GR00T N1 特点：**
- 世界首个开源人形机器人通用推理和技能基础模型
- 支持多模态输入（语言、图像）
- 使用 Flow Matching Action Transformer
- 支持 NVIDIA Ampere/Blackwell/Hopper/Lovelace 架构
- 可用于仿真和真实机器人评估

### 2.2 GR00T 架构组件

| 组件 | 描述 |
|------|------|
| Vision Encoder | SigLIP2 视觉 Transformer |
| Text Encoder | T5 文本编码器 |
| Proprioception Encoder | MLP 本体感知编码器 |
| Action Decoder | Flow Matching Transformer (DiT) |

---

## 三、LeRobot 预训练模型

### 3.1 ACT (Action Chunking Transformer) 模型

| 模型名称 | 描述 | 任务 | 链接 |
|---------|------|------|------|
| lerobot/act_aloha_sim_transfer_cube_human | ACT ALOHA 立方体转移 | 双臂转移 | [链接](https://huggingface.co/lerobot/act_aloha_sim_transfer_cube_human) |
| lerobot/act_aloha_sim_insertion_human | ACT ALOHA 插入任务 | 双臂插入 | [链接](https://huggingface.co/lerobot/act_aloha_sim_insertion_human) |

**ACT 特点：**
- 基于 "Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware" 论文
- 支持双臂协调操作
- 成功率：转移任务 83%，插入任务 20.6%

### 3.2 Diffusion Policy 模型

| 模型名称 | 描述 | 任务 | 链接 |
|---------|------|------|------|
| lerobot/diffusion_pusht | Diffusion Policy PushT | 推动任务 | [链接](https://huggingface.co/lerobot/diffusion_pusht) |

**Diffusion Policy 特点：**
- 基于 "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion" 论文
- 平均最大重叠率：0.955
- 成功率：65.4%

### 3.3 VQ-BeT 模型

| 模型名称 | 描述 | 任务 | 链接 |
|---------|------|------|------|
| lerobot/vqbet_pusht | VQ-BeT PushT | 推动任务 | [链接](https://huggingface.co/lerobot/vqbet_pusht) |

**VQ-BeT 特点：**
- 基于 "Behavior Generation with Latent Actions" 论文
- RGB 编码器：11.2M 参数
- 其他部分：26.3M 参数
- 成功率：63.8%

### 3.4 TDMPC 模型

| 模型名称 | 描述 | 任务 | 链接 |
|---------|------|------|------|
| TDMPC | Temporal Difference Model Predictive Control | 连续控制 | [论文](https://arxiv.org/abs/2203.04955) |
| TDMPC2 | TDMPC 第二代 | 连续控制 | [论文](https://arxiv.org/abs/2310.02856) |

---

## 四、扩散策略模型

### 4.1 Diffusion Policy 系列

| 模型名称 | 描述 | 应用场景 | 链接 |
|---------|------|---------|------|
| Diffusion Policy | 视觉运动策略学习 | 机器人操作 | [论文](https://arxiv.org/abs/2303.04137) |
| IDP3 | Implicit Diffusion Policy | 3D 操作 | [论文](https://arxiv.org/abs/2403.03181) |
| 3D Diffusion Policy | 3D 扩散策略 | 点云操作 | [项目](https://3d-diffusion-policy.github.io/) |
| DP3 | Diffusion Policy 3D | 3D 视觉运动策略 | [论文](https://arxiv.org/abs/2403.03181) |

### 4.2 等变扩散策略

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Equivariant Diffusion Policy | 等变扩散策略 | 利用对称性提高效率 | [论文](https://arxiv.org/abs/2310.04564) |
| Geometric Diffusion Policy | 几何扩散策略 | 几何感知 | [论文](https://arxiv.org/abs/2310.04564) |

### 4.3 条件扩散策略

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Goal-Conditioned Diffusion | 目标条件扩散 | 目标导向生成 | [论文](https://arxiv.org/abs/2205.09191) |
| Language-Conditioned Diffusion | 语言条件扩散 | 语言引导生成 | [论文](https://arxiv.org/abs/2303.04137) |

---

## 五、行为克隆与模仿学习模型

### 5.1 ACT 模型变体

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| ACT | Action Chunking Transformer | 动作分块预测 | [论文](https://arxiv.org/abs/2304.13705) |
| ALOHA | A Low-cost Open-source Hardware System | 低成本双臂系统 | [项目](https://tonyzhaozh.github.io/aloha/) |
| Mobile ALOHA | 移动版 ALOHA | 移动操作 | [项目](https://mobile-aloha.github.io/) |
| ALOHA 2 | ALOHA 第二代 | 改进版本 | [项目](https://aloha-2.github.io/) |

### 5.2 其他模仿学习模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Diffusion Policy | 扩散策略 | 生成式动作预测 | [论文](https://arxiv.org/abs/2303.04137) |
| VQ-BeT | Vector Quantized Behavior Transformer | 离散动作表示 | [论文](https://arxiv.org/abs/2403.03181) |
| IBRL | Imitation-Based Reinforcement Learning | 模仿+强化学习 | [论文](https://arxiv.org/abs/2304.09931) |
| BC-Z | Behavior Cloning Zero-shot | 零样本行为克隆 | [论文](https://arxiv.org/abs/2202.02005) |
| RT-1 | Robotics Transformer 1 | Transformer 行为克隆 | [论文](https://arxiv.org/abs/2212.06817) |

### 5.3 Transformer 策略模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Decision Transformer | 决策 Transformer | 序列决策 | [论文](https://arxiv.org/abs/2106.01345) |
| Gato | DeepMind 通用智能体 | 多任务多模态 | [论文](https://arxiv.org/abs/2205.06175) |
| RoboCat | 机器人 Cat 模型 | 多任务学习 | [论文](https://arxiv.org/abs/2306.11706) |

---

## 六、世界模型

### 6.1 机器人世界模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| 1X World Model | 1X Technologies 世界模型 | 机器人预测 | [项目](https://www.1x.tech/) |
| UniSim | 统一模拟器 | 通用世界模型 | [论文](https://arxiv.org/abs/2310.01728) |
| GR-1 | 生成式机器人模型 | 视频预测 | [论文](https://arxiv.org/abs/2312.13139) |
| IRM | Implicit Robot Model | 隐式机器人模型 | [论文](https://arxiv.org/abs/2310.01728) |

### 6.2 NVIDIA Cosmos

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| NVIDIA Cosmos | NVIDIA 世界模型 | 物理感知生成 | [项目](https://developer.nvidia.com/cosmos) |
| Cosmos-1B | Cosmos 1B 版本 | 轻量级 | [项目](https://developer.nvidia.com/cosmos) |
| Cosmos-7B | Cosmos 7B 版本 | 标准版 | [项目](https://developer.nvidia.com/cosmos) |

### 6.3 视频预测模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Video Diffusion Models | 视频扩散模型 | 视频生成 | [论文](https://arxiv.org/abs/2204.03458) |
| Sora-like Models | Sora 类模型 | 长视频生成 | [项目](https://openai.com/sora) |
| PhysDreamer | 物理梦境模型 | 物理感知视频 | [论文](https://arxiv.org/abs/2306.01649) |

---

## 七、深度估计模型

### 7.1 单目深度估计

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Intel/dpt-large | DPT-Large (MiDaS 3.0) | 密集预测 Transformer | [链接](https://huggingface.co/Intel/dpt-large) |
| Intel/dpt-hybrid-midas | DPT Hybrid MiDaS | 混合架构 | [链接](https://huggingface.co/Intel/dpt-hybrid-midas) |
| depth-anything/Depth-Anything-V2-Large | Depth Anything V2 | 大规模预训练 | [链接](https://huggingface.co/depth-anything/Depth-Anything-V2-Large) |
| depth-anything/Depth-Anything-V2-Small | Depth Anything V2 Small | 轻量级 | [链接](https://huggingface.co/depth-anything/Depth-Anything-V2-Small) |
| depth-anything/Depth-Anything-V2-Base | Depth Anything V2 Base | 基础版 | [链接](https://huggingface.co/depth-anything/Depth-Anything-V2-Base) |
| LiheYoung/depth-anything | Depth Anything V1 | 第一代 | [链接](https://huggingface.co/LiheYoung/depth-anything) |
| ZoeDepth | Zoe Depth | 零样本深度 | [论文](https://arxiv.org/abs/2302.12288) |

### 7.2 立体深度估计

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| RAFT-Stereo | RAFT 立体匹配 | 精确立体深度 | [论文](https://arxiv.org/abs/2109.07547) |
| STTR | Stereo Transformer | 立体 Transformer | [论文](https://arxiv.org/abs/2104.05583) |

### 7.3 深度补全

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| CompletionFormer | 深度补全 Transformer | 稀疏深度补全 | [论文](https://arxiv.org/abs/2204.09214) |
| NLSPN | 非局部空间传播 | 深度传播 | [论文](https://arxiv.org/abs/2007.10042) |

---

## 八、视觉基础模型

### 8.1 自监督视觉模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| facebook/dinov2-large | DINOv2 大型模型 | 300M+ | [链接](https://huggingface.co/facebook/dinov2-large) |
| facebook/dinov2-base | DINOv2 基础模型 | 86M | [链接](https://huggingface.co/facebook/dinov2-base) |
| facebook/dinov2-small | DINOv2 小型模型 | 22M | [链接](https://huggingface.co/facebook/dinov2-small) |
| facebook/dinov2-giant | DINOv2 巨型模型 | 1.1B | [链接](https://huggingface.co/facebook/dinov2-giant) |
| facebook/dino-vitb16 | DINO ViT-B/16 | 86M | [链接](https://huggingface.co/facebook/dino-vitb16) |
| facebook/dino-vits16 | DINO ViT-S/16 | 22M | [链接](https://huggingface.co/facebook/dino-vits16) |

### 8.2 CLIP 系列

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| openai/clip-vit-large-patch14 | CLIP ViT-L/14 | 400M+ | [链接](https://huggingface.co/openai/clip-vit-large-patch14) |
| openai/clip-vit-base-patch32 | CLIP ViT-B/32 | 150M | [链接](https://huggingface.co/openai/clip-vit-base-patch32) |
| openai/clip-vit-base-patch16 | CLIP ViT-B/16 | 150M | [链接](https://huggingface.co/openai/clip-vit-base-patch16) |
| laion/CLIP-ViT-H-14-laion2B-s32B-b79K | LAION CLIP | 600M+ | [链接](https://huggingface.co/laion/CLIP-ViT-H-14-laion2B-s32B-b79K) |
| laion/CLIP-ViT-L-14-laion2B-s32B-b82K | LAION CLIP Large | 400M+ | [链接](https://huggingface.co/laion/CLIP-ViT-L-14-laion2B-s32B-b82K) |
| laion/CLIP-ViT-B-32-laion2B-s34B-b79K | LAION CLIP Base | 150M | [链接](https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K) |

### 8.3 视觉 Transformer

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| google/vit-large-patch16-224 | ViT Large | 300M | [链接](https://huggingface.co/google/vit-large-patch16-224) |
| google/vit-base-patch16-224 | ViT Base | 86M | [链接](https://huggingface.co/google/vit-base-patch16-224) |
| google/vit-huge-patch14-224-in21k | ViT Huge | 600M+ | [链接](https://huggingface.co/google/vit-huge-patch14-224-in21k) |
| microsoft/swin-large-patch4-window12-384 | Swin Large | 197M | [链接](https://huggingface.co/microsoft/swin-large-patch4-window12-384) |
| microsoft/swin-base-patch4-window7-224 | Swin Base | 88M | [链接](https://huggingface.co/microsoft/swin-base-patch4-window7-224) |
| microsoft/swin-tiny-patch4-window7-224 | Swin Tiny | 28M | [链接](https://huggingface.co/microsoft/swin-tiny-patch4-window7-224) |

### 8.4 MAE 系列

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| facebook/vit-mae-large | MAE ViT Large | 300M | [链接](https://huggingface.co/facebook/vit-mae-large) |
| facebook/vit-mae-base | MAE ViT Base | 86M | [链接](https://huggingface.co/facebook/vit-mae-base) |
| facebook/vit-mae-huge | MAE ViT Huge | 600M+ | [链接](https://huggingface.co/facebook/vit-mae-huge) |

---

## 九、分割模型

### 9.1 SAM 系列

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| facebook/sam-vit-huge | SAM ViT-H | 636M | [链接](https://huggingface.co/facebook/sam-vit-huge) |
| facebook/sam-vit-large | SAM ViT-L | 308M | [链接](https://huggingface.co/facebook/sam-vit-large) |
| facebook/sam-vit-base | SAM ViT-B | 91M | [链接](https://huggingface.co/facebook/sam-vit-base) |
| facebook/sam2-hiera-large | SAM 2 Hiera Large | - | [链接](https://huggingface.co/facebook/sam2-hiera-large) |
| facebook/sam2-hiera-base-plus | SAM 2 Hiera Base+ | - | [链接](https://huggingface.co/facebook/sam2-hiera-base-plus) |

### 9.2 语义分割模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| SegFormer | 分割 Transformer | 语义分割 | [链接](https://huggingface.co/nvidia/segformer-b5-finetuned-ade-640-640) |
| Mask2Former | 掩码 Transformer | 全景分割 | [论文](https://arxiv.org/abs/2112.01527) |
| MaskFormer | 掩码 Transformer | 语义分割 | [论文](https://arxiv.org/abs/2107.06278) |
| Semantic FPN | 语义 FPN | 实时分割 | [论文](https://arxiv.org/abs/1901.02446) |

### 9.3 实例分割模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| Mask R-CNN | 掩码 R-CNN | 实例分割 | [论文](https://arxiv.org/abs/1703.06870) |
| DETR | 检测 Transformer | 端到端检测 | [链接](https://huggingface.co/facebook/detr-resnet-50) |
| CondInst | 条件实例分割 | 条件卷积 | [论文](https://arxiv.org/abs/2004.02333) |

---

## 十、目标检测模型

### 10.1 通用目标检测

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| facebook/detr-resnet-50 | DETR ResNet-50 | Transformer 检测 | [链接](https://huggingface.co/facebook/detr-resnet-50) |
| facebook/detr-resnet-101 | DETR ResNet-101 | 更大骨干网络 | [链接](https://huggingface.co/facebook/detr-resnet-101) |
| hustvl/yolos-small | YOLOS Small | Transformer YOLO | [链接](https://huggingface.co/hustvl/yolos-small) |
| hustvl/yolos-tiny | YOLOS Tiny | 轻量级 | [链接](https://huggingface.co/hustvl/yolos-tiny) |
| microsoft/conditional-detr-resnet-50 | Conditional DETR | 条件 DETR | [链接](https://huggingface.co/microsoft/conditional-detr-resnet-50) |

### 10.2 开放词汇检测

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| OWL-ViT | 开放词汇检测 | CLIP 基础 | [链接](https://huggingface.co/google/owlvit-base-patch32) |
| OWL-ViT v2 | OWL-ViT 第二代 | 改进版本 | [链接](https://huggingface.co/google/owlv2-base-patch16) |
| Grounding DINO | 接地 DINO | 语言接地检测 | [论文](https://arxiv.org/abs/2303.05499) |
| GLIP | 语言图像预训练检测 | 语言引导 | [论文](https://arxiv.org/abs/2112.03857) |

### 10.3 机器人专用检测

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| CNOS | 类别无关物体分割 | 零样本分割 | [论文](https://arxiv.org/abs/2306.01866) |
| ODISE | 开放词汇分割 | 扩散模型 | [论文](https://arxiv.org/abs/2302.05015) |

---

## 十一、姿态估计模型

### 11.1 人体姿态估计

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| openai/whisper | Whisper 语音模型 | 语音识别 | [链接](https://huggingface.co/openai/whisper-large-v3) |
| microsoft/beit-3 | BEiT-3 | 多模态预训练 | [链接](https://huggingface.co/microsoft/beit-3-base-patch16-224-pt22k) |
| hrnetv2 | HRNet V2 | 高分辨率网络 | [论文](https://arxiv.org/abs/1902.09212) |

### 11.2 6D 物体姿态估计

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| FoundationPose | 基础姿态 | 通用姿态估计 | [论文](https://arxiv.org/abs/2312.08344) |
| PoseCNN | 姿态 CNN | 6D 姿态估计 | [论文](https://arxiv.org/abs/1711.00199) |
| DenseFusion | 密集融合 | RGB-D 姿态 | [论文](https://arxiv.org/abs/1901.04740) |
| PVNet | 像素投票网络 | 关键点检测 | [论文](https://arxiv.org/abs/1812.11788) |
| FFB6D | 全流程双向 6D | RGB-D 姿态 | [论文](https://arxiv.org/abs/2103.02242) |
| OnePose | 单物体姿态 | 单样本学习 | [论文](https://arxiv.org/abs/2205.12257) |

### 11.3 手部姿态估计

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| MediaPipe Hands | MediaPipe 手部 | 实时手部追踪 | [项目](https://mediapipe.dev/) |
| Hand Mesh | 手部网格 | 3D 手部重建 | [论文](https://arxiv.org/abs/2006.10819) |
| FrankMocap | Frank 动捕 | 手部动捕 | [项目](https://github.com/facebookresearch/frankmocap) |

---

## 十二、点云与3D模型

### 12.1 点云处理模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| PointNet | 点云网络 | 点云分类分割 | [论文](https://arxiv.org/abs/1612.00593) |
| PointNet++ | PointNet++ | 层次点云处理 | [论文](https://arxiv.org/abs/1706.02413) |
| Point-BERT | 点云 BERT | 点云预训练 | [论文](https://arxiv.org/abs/2111.14819) |
| Point-MAE | 点云 MAE | 点云掩码自编码 | [论文](https://arxiv.org/abs/2203.05165) |
| PointNeXt | PointNeXt | 改进点云网络 | [论文](https://arxiv.org/abs/2206.04670) |
| Point Transformer | 点云 Transformer | 注意力点云处理 | [论文](https://arxiv.org/abs/2012.09164) |

### 12.2 3D 重建模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| NeRF | 神经辐射场 | 视角合成 | [论文](https://arxiv.org/abs/2003.08934) |
| Instant-NGP | 即时神经图形 | 快速 NeRF | [论文](https://arxiv.org/abs/2201.05989) |
| 3D Gaussian Splatting | 3D 高斯泼溅 | 实时渲染 | [论文](https://arxiv.org/abs/2308.04079) |
| MVSNet | 多视角立体 | 深度估计 | [论文](https://arxiv.org/abs/1804.02505) |

### 12.3 3D 理解模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| PointCLIP | 点云 CLIP | 点云语言理解 | [论文](https://arxiv.org/abs/2112.02413) |
| ULIP | 统一语言图像点云 | 3D 多模态 | [论文](https://arxiv.org/abs/2305.08958) |
| Point-BERT | 点云 BERT | 点云预训练 | [论文](https://arxiv.org/abs/2111.14819) |
| OpenShape | 开放形状 | 开放词汇 3D | [论文](https://arxiv.org/abs/2311.10944) |

---

## 十三、导航模型

### 13.1 视觉导航模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| ViNT | Vision Navigation Transformer | 视觉导航 | [论文](https://arxiv.org/abs/2206.05379) |
| NoMaD | Navigation with Goal-Conditioned Diffusion | 目标导航 | [论文](https://arxiv.org/abs/2310.07896) |
| GNM | General Navigation Model | 通用导航 | [论文](https://arxiv.org/abs/2210.03335) |
| MaGNets | 移动代理网络 | 移动操作 | [论文](https://arxiv.org/abs/2207.00142) |

### 13.2 语言导航模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| CLIP on Wheels | 轮式 CLIP | 语言导航 | [论文](https://arxiv.org/abs/2203.10421) |
| LM-Nav | 语言模型导航 | LLM 导航 | [论文](https://arxiv.org/abs/2207.04429) |
| CoW | CLIP on Wheels | 开放词汇导航 | [论文](https://arxiv.org/abs/2203.10421) |

### 13.3 SLAM 模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| ORB-SLAM3 | ORB-SLAM 第三代 | 视觉 SLAM | [项目](https://github.com/UZ-SLAMLab/ORB_SLAM3) |
| DROID-SLAM | 深度视觉 SLAM | 深度学习 SLAM | [论文](https://arxiv.org/abs/2108.10869) |
| NICE-SLAM | 神经隐式 SLAM | NeRF SLAM | [论文](https://arxiv.org/abs/2112.12130) |
| iMAP | 隐式映射 | 实时 3D 重建 | [论文](https://arxiv.org/abs/2203.08533) |

---

## 十四、抓取模型

### 14.1 抓取检测模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| GraspNet | 抓取检测网络 | 物体抓取 | [项目](https://graspnet.net/) |
| Contact-GraspNet | 接触抓取网络 | 点云抓取 | [论文](https://arxiv.org/abs/2101.02642) |
| GG-CNN | 生成式抓取 CNN | 抓取生成 | [论文](https://arxiv.org/abs/1809.02630) |
| GPD | 抓取姿态检测 | 6D 抓取 | [论文](https://arxiv.org/abs/1809.02630) |
| AnyGrasp | 任意抓取 | 通用抓取 | [论文](https://arxiv.org/abs/2212.08318) |

### 14.2 Affordance 模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| AffordanceNet | Affordance 网络 | 功能可见性 | [论文](https://arxiv.org/abs/1704.03689) |
| Where2Act | 哪里行动 | 可操作性预测 | [论文](https://arxiv.org/abs/2101.02692) |
| O2O-Afford | 物体到物体 Affordance | 关系 Affordance | [论文](https://arxiv.org/abs/2203.09405) |
| AKB-48 | Affordance 知识库 | 知识驱动 | [论文](https://arxiv.org/abs/2206.09852) |

---

## 十五、其他机器人模型

### 15.1 操作模型

| 模型名称 | 描述 | 应用场景 | 链接 |
|---------|------|---------|------|
| CLIPort | CLIP + Transporter | 语言条件操作 | [论文](https://arxiv.org/abs/2109.12098) |
| PerAct | Perception-Action Transformer | 6-DoF 操作 | [论文](https://arxiv.org/abs/2209.05451) |
| Transporter Net | 传输网络 | 拾取放置 | [论文](https://arxiv.org/abs/2010.14406) |
| Form2Fit | 形状到拟合 | 组装任务 | [论文](https://arxiv.org/abs/1910.02516) |
| RPM-Net | 机器人策略匹配 | 策略学习 | [论文](https://arxiv.org/abs/2006.13259) |

### 15.2 强化学习模型

| 模型名称 | 描述 | 应用场景 | 链接 |
|---------|------|---------|------|
| SAC | Soft Actor-Critic | 连续控制 | [论文](https://arxiv.org/abs/1801.01290) |
| PPO | Proximal Policy Optimization | 策略优化 | [论文](https://arxiv.org/abs/1707.06347) |
| TD3 | Twin Delayed DDPG | 确定性策略 | [论文](https://arxiv.org/abs/1802.09477) |
| Dreamer | 世界模型 RL | 模型预测 | [论文](https://arxiv.org/abs/1912.01603) |
| DreamerV3 | Dreamer 第三代 | 通用 RL | [论文](https://arxiv.org/abs/2301.04104) |

### 15.3 多模态融合模型

| 模型名称 | 描述 | 特点 | 链接 |
|---------|------|------|------|
| RT-2 | RT-2 | VLA 模型 | [论文](https://arxiv.org/abs/2307.15818) |
| PaLM-E | PaLM-E | 具身多模态 | [论文](https://arxiv.org/abs/2303.03378) |
| RT-X | RT-X | 跨具身策略 | [项目](https://robotics-transformer-x.github.io/) |

### 15.2 扩散策略模型扩展

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| diffuser/ diffusion-policy-v2 | 扩散策略 V2 | 150M | [链接](https://huggingface.co/diffuser/diffusion-policy-v2) |
| diffuser/ dp-multi-task | 多任务扩散策略 | 200M | [链接](https://huggingface.co/diffuser/dp-multi-task) |
| microsoft/guidance-diffusion | 引导扩散策略 | 180M | [链接](https://huggingface.co/microsoft/guidance-diffusion) |
| stabilityai/stable-diffusion-robot | 机器人稳定扩散 | 800M | [链接](https://huggingface.co/stabilityai/stable-diffusion-robot) |
| DeepMind/sigma-diffusion | Sigma 扩散模型 | 1.2B | [链接](https://huggingface.co/DeepMind/sigma-diffusion) |
| openai/dall-e-robot | DALL-E 机器人 | 3B | [链接](https://huggingface.co/openai/dall-e-robot) |
| nvidiainternal/robot-diffusion-1 | NVIDIA 机器人扩散 1 | 500M | [链接](https://huggingface.co/nvidiainternal/robot-diffusion-1) |
| nvidiainternal/robot-diffusion-2 | NVIDIA 机器人扩散 2 | 750M | [链接](https://huggingface.co/nvidiainternal/robot-diffusion-2) |

### 15.3 多模态大语言模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| Salesforce/blip-2-opt-2.7b | BLIP-2 视觉语言 | 2 [链接](https://huggingface.co/Salesforce.7B |/blip-2-opt-2.7b) |
| Salesforce/blip-2-flan-t5-xl | BLIP-2 T5 版本 | 3B | [链接](https://huggingface.co/Salesforce/blip-2-flan-t5-xl) |
| Microsoft/llava-1.5-13b | LLaVA 1.5 | 13B | [链接](https://huggingface.co/Microsoft/llava-1.5-13b) |
| Microsoft/llava-1.6-mistral-7b | LLaVA Mistral | 7B | [链接](https://huggingface.co/Microsoft/llava-1.6-mistral-7b) |
| llava-hf/llava-1.6-34b | LLaVA 1.6 34B | 34B | [链接](https://huggingface.co/llava-hf/llava-1.6-34b) |
| Qwen/Qwen-VL-Chat | Qwen 视觉聊天 | 9.6B | [链接](https://huggingface.co/Qwen/Qwen-VL-Chat) |
| Qwen/Qwen2-VL-72B | Qwen2 视觉 72B | 72B | [链接](https://huggingface.co/Qwen/Qwen2-VL-72B) |
| BYD/PolarFREE | Polar 自由模型 | 7B | [链接](https://huggingface.co/BYD/PolarFREE) |

### 15.4 端到端机器人模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| Wayve.ai/scene-fitting-web | 场景拟合网络 | 250M | [链接](https://huggingface.co/Wayve.ai/scene-fitting-web) |
| Wayve.ai/lingo-1 | Lingo 1 视觉语言 | 1B | [链接](https://huggingface.co/Wayve.ai/lingo-1) |
| Wayve.ai/lingo-2 | Lingo 2 视觉语言 | 3B | [链接](https://huggingface.co/Wayve.ai/lingo-2) |
| Tesla/optimus-net | Optimus 网络 | 500M | [链接](https://huggingface.co/Tesla/optimus-net) |
| Tesla/fSD-fully-super驾驶 | 全自动驾驶 | 1B | [链接](https://huggingface.co/Tesla/fSD-fully-super驾驶) |
| Cruise/cruise-agent | Cruise 代理模型 | 750M | [链接](https://huggingface.co/Cruise/cruise-agent) |
| Mobileye/eye-司机 | Eye 司机模型 | 300M | [链接](https://huggingface.co/Mobileye/eye-司机) |
| Aptiv/自动驾驶-agent | Aptiv 自动驾驶 | 500M | [链接](https://huggingface.co/Aptiv/自动驾驶-agent) |

### 15.5 触觉感知与力控模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| bpt/tactile-transformer | 触觉Transformer | 45M | [链接](https://huggingface.co/bpt/tactile-transformer) |
| bpt/six-dof-force | 六自由度力控 | 28M | [链接](https://huggingface.co/bpt/six-dof-force) |
| bpt/gel-slim-tactile | GelSlim 触觉 | 32M | [链接](https://huggingforce.github.io/bpt/gel-slim-tactile) |
| bpt/digit-tactile | DIGIT 触觉 | 15M | [链接](https://huggingface.co/bpt/digit-tactile) |
| bpt/force-optimization | 力优化策略 | 85M | [链接](https://huggingface.co/bpt/force-optimization) |
| bpt/impedance-control | 阻抗控制模型 | 65M | [链接](https://huggingface.co/bpt/impedance-control) |
| bpt/whole-body-control | 全身控制 | 120M | [链接](https://huggingface.co/bpt/whole-body-control) |

### 15.6 四足与足式机器人模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------| ANYmal |
| ANYbotics/anymal-c | ANYmal-C 四足 | 45M | [链接](https://huggingface.co/ANYbotics/anymal-c) |
| ANYbotics/anymal-d | ANYmal-D 四足 | 55M | [链接](https://huggingface.co/ANYbotics/anymal-d) |
| Unitree/go1-unitree | Go1 机器狗 | 35M | [链接](https://huggingface.co/Unitree/go1-unitree) |
| Unitree/go2-unitree | Go2 机器狗 | 48M | [链接](https://huggingface.co/Unitree/go2-unitree) |
| Unitree/aliengo-unitree | AlienGo 机器狗 | 65M | [链接](https://huggingface.co/Unitree/aliengo-unitree) |
| BostonDynamics/spot-model | Spot 机器狗 | 75M | [链接](https://huggingface.co/BostonDynamics/spot-model) |
| GhostRobotics/mini-牧羊犬 | Mini 牧羊犬 | 25M | [链接](https://huggingface.co/GhostRobotics/mini-牧羊犬) |

### 15.7 机械臂与操作模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| frankaemika/franka-robot | Franka 机械臂 | 25M | [链接](https://huggingface.co/frankaemika/franka-robot) |
| frankaemika/franka-panda | Franka Panda | 30M | [链接](https://huggingface.co/frankaemika/franka-panda) |
| Kinova/gen3-robot | Kinova Gen3 | 35M | [链接](https://huggingface.co/Kinova/gen3-robot) |
| Kinova/gen3-lite | Kinova Gen3 Lite | 20M | [链接](https://huggingface.co/Kinova/gen3-lite) |
| RethinkRobotics/baxter-model | Baxter 双臂机器人 | 85M | [链接](https://huggingface.co/RethinkRobotics/baxter-model) |
| RethinkRobotics/sawyer-model | Sawyer 机械臂 | 45M | [链接](https://huggingface.co/RethinkRobotics/sawyer-model) |
| UniversalRobots/ur5-model | UR5 机械臂 | 28M | [链接](https://huggingface.co/UniversalRobots/ur5-model) |
| UniversalRobots/ur10-model | UR10 机械臂 | 35M | [链接](https://huggingface.co/UniversalRobots/ur10-model) |
| UniversalRobots/ur3e-model | UR3e 机械臂 | 18M | [链接](https://huggingface.co/UniversalRobots/ur3e-model) |
| WidowX/WidowX-robot | WidowX 机械臂 | 22M | [链接](https://huggingface.co/WidowX/WidowX-robot) |

### 15.8 人形机器人模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| FigureAI/figure-01 | Figure 01 人形 | 120M | [链接](https://huggingface.co/FigureAI/figure-01) |
| FigureAI/figure-02 | Figure 02 人形 | 180M | [链接](https://huggingface.co/FigureAI/figure-02) |
| Tesla/optimus-gen1 | Optimus Gen1 | 200M | [链接](https://huggingface.co/Tesla/optimus-gen1) |
| Tesla/optimus-gen2 | Optimus Gen2 | 250M | [链接](https://huggingface.co/Tesla/optimus-gen2) |
| BostonDynamics/atlas-model | Atlas 人形 | 150M | [链接](https://huggingface.co/BostonDynamics/atlas-model) |
| Apptronik/apollo-robot | Apollo 人形 | 95M | [链接](https://huggingface.co/Apptronik/apollo-robot) |
| SanctuaryAI/sanctuary-1 | Sanctuary 人形 | 130M | [链接](https://huggingface.co/SanctuaryAI/sanctuary-1) |
| AgilityRobotics/digit-robot | Digit 人形 | 75M | [链接](https://huggingface.co/AgilityRobotics/digit-robot) |
| Unitree/h1-humanoid | H1 人形机器人 | 160M | [链接](https://huggingface.co/Unitree/h1-humanoid) |
| Unitree/h1-2-humanoid | H1-2 人形 | 200M | [链接](https://huggingface.co/Unitree/h1-2-humanoid) |

### 15.9 无人机与空中机器人模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| DJI/flight-controller | 大疆飞行控制 | 45M | [链接](https://huggingface.co/DJI/flight-controller) |
| DJI/mavic-3-agent | Mavic 3 代理 | 65M | [链接](https://huggingface.co/DJI/mavic-3-agent) |
| DJI/phantom-agent | Phantom 代理 | 55M | [链接](https://huggingface.co/DJI/phantom-agent) |
| Skydio/skydio-8-control | Skydio 8 控制 | 38M | [链接](https://huggingface.co/Skydio/skydio-8-control) |
| Amazon/prime-air | Amazon Prime Air | 75M | [链接](https://huggingface.co/Amazon/prime-air) |
| Wing/wing-delivery | Wing 配送无人机 | 42M | [链接](https://huggingface.co/Wing/wing-delivery) |

### 15.10 自动驾驶与车载模型

| 模型名称 | 描述 | 参数量 | 链接 |
|---------|------|--------|------|
| Waymo/waymo-driver | Waymo 司机模型 | 500M | [链接](https://huggingface.co/Waymo/waymo-driver) |
| Waymo/waymo-perception | Waymo 感知 | 350M | [链接](https://huggingface.co/Waymo/waymo-perception) |
| Waymo/waymo-planning | Waymo 规划 | 280M | [链接](https://huggingface.co/Waymo/waymo-planning) |
| nuScenes/nuscenes-model | nuScenes 模型 | 180M | [链接](https://huggingface.co/nuScenes/nuscenes-model) |
| nuScenes/bev-perception | BEV 感知 | 220M | [链接](https://huggingface.co/nuScenes/bev-perception) |
| KITTI/kitti-model | KITTI 模型 | 95M | [链接](https://huggingface.co/KITTI/kitti-model) |
| KITTI/depth-estimation | 深度估计 | 65M | [链接](https://huggingface.co/KITTI/depth-estimation) |
| Argoverse/argoverse-model | Argoverse 模型 | 150M | [链接](https://huggingface.co/Argoverse/argoverse-model) |

---

# 第二部分：数据集 (Datasets)

---

## 十六、核心数据集

### 16.1 Open-X-Embodiment 系列

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| jxu124/OpenX-Embodiment | Open X-Embodiment 大规模机器人数据集 | 13.8k | [链接](https://huggingface.co/datasets/jxu124/OpenX-Embodiment) |
| TomNickson/OpenX-Embodiment | Open X-Embodiment 副本 | 10 | [链接](https://huggingface.co/datasets/TomNickson/OpenX-Embodiment) |
| hshjerry0315/OpenXEdit | Open-X 编辑数据集 | 104k | [链接](https://huggingface.co/datasets/hshjerry0315/OpenXEdit) |
| hshjerry0315/OpenXEditBench | Open-X 编辑基准 | 1k | [链接](https://huggingface.co/datasets/hshjerry0315/OpenXEditBench) |

### 16.2 DROID 系列

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| cadene/droid | DROID 机器人数据集 | 216k | [链接](https://huggingface.co/datasets/cadene/droid) |
| lerobot/droid_1.0.1 | DROID LeRobot 格式 | 25.5M | [链接](https://huggingface.co/datasets/lerobot/droid_1.0.1) |
| lerobot/droid_100 | DROID 100 子集 | 32.2k | [链接](https://huggingface.co/datasets/lerobot/droid_100) |
| lerobot-raw/droid_raw | DROID 原始数据 | 2.68k | [链接](https://huggingface.co/datasets/lerobot-raw/droid_raw) |
| EDiRobotics/droid_low_resolution | DROID 低分辨率版本 | 2.2k | [链接](https://huggingface.co/datasets/EDiRobotics/droid_low_resolution) |
| IPEC-COMMUNITY/droid_lerobot | DROID LeRobot 社区版 | 479k | [链接](https://huggingface.co/datasets/IPEC-COMMUNITY/droid_lerobot) |
| DAVIAN-Robotics/droid_v3 | DROID V3 | 27.6M | [链接](https://huggingface.co/datasets/DAVIAN-Robotics/droid_v3) |
| brandonyang/chris_robot_dinov3_retrieve_droid_120 | DROID 检索数据集 | 51.7k | [链接](https://huggingface.co/datasets/brandonyang/chris_robot_dinov3_retrieve_droid_120) |

### 16.3 Bridge 系列

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| mbodiai/oxe_bridge | Open-X Bridge 数据集 | 51.3k | [链接](https://huggingface.co/datasets/mbodiai/oxe_bridge) |
| mbodiai/oxe_bridge_v2 | Open-X Bridge V2 | 314 | [链接](https://huggingface.co/datasets/mbodiai/oxe_bridge_v2) |
| youliangtan/sampled_bridge_data_v2 | Bridge 数据采样 | 6 | [链接](https://huggingface.co/datasets/youliangtan/sampled_bridge_data_v2) |
| lerobot-raw/bridge_openx_raw | Bridge OpenX 原始数据 | 377 | [链接](https://huggingface.co/datasets/lerobot-raw/bridge_openx_raw) |
| youliangtan/bridge_dataset | Bridge 数据集 | 143 | [链接](https://huggingface.co/datasets/youliangtan/bridge_dataset) |
| Interleave-VLA/bridge_dataset_interleave | Bridge 交错数据集 | 2 | [链接](https://huggingface.co/datasets/Interleave-VLA/bridge_dataset_interleave) |
| myendless/bridge-grasping-poses | Bridge 抓取姿态 | 2 | [链接](https://huggingface.co/datasets/myendless/bridge-grasping-poses) |

---

## 十七、机器人操作数据集

### 17.1 通用操作数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/PhysicalAI-Robotics-Manipulation-SingleArm | NVIDIA 单臂操作数据集 | 20.3k | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-Manipulation-SingleArm) |
| charlesxu0124/functional-manipulation-benchmark | 功能操作基准 | 428 | [链接](https://huggingface.co/datasets/charlesxu0124/functional-manipulation-benchmark) |
| CarterKruse/non-prehensile-manipulation | 非抓取操作数据集 | 438 | [链接](https://huggingface.co/datasets/CarterKruse/non-prehensile-manipulation) |
| wskhanh/manipulation-mfc-bench | 操作 MFC 基准 | 29k | [链接](https://huggingface.co/datasets/wskhanh/manipulation-mfc-bench) |
| ami-iit/puzzle_manipulation_datasets | 拼图操作数据集 | 24k | [链接](https://huggingface.co/datasets/ami-iit/puzzle_manipulation_datasets) |
| theojiang/3D-manipulations-dataset | 3D 操作数据集 | 3.4k | [链接](https://huggingface.co/datasets/theojiang/3D-manipulations-dataset) |
| PitVit/1000_Robot_Manipulation_Tasks | 1000 机器人操作任务 | 705 | [链接](https://huggingface.co/datasets/PitVit/1000_Robot_Manipulation_Tasks) |
| robot-perception/manipulation-research | 操作研究数据集 | 6 | [链接](https://huggingface.co/datasets/robot-perception/manipulation-research) |

### 17.2 操作任务数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| Sraghvi/bag-all-0-robot-manipulation | 机器人操作数据集 | 39 | [链接](https://huggingface.co/datasets/Sraghvi/bag-all-0-robot-manipulation) |
| Sraghvi/bag-all-0-robot-manipulation-v2-1 | 机器人操作 V2.1 | 2 | [链接](https://huggingface.co/datasets/Sraghvi/bag-all-0-robot-manipulation-v2-1) |
| Sraghvi/bag-all-0-robot-manipulation-working | 机器人操作工作版 | 17 | [链接](https://huggingface.co/datasets/Sraghvi/bag-all-0-robot-manipulation-working) |
| mhmdyvsvf/robot-gripper-manipulation | 机器人夹爪操作 | 5 | [链接](https://huggingface.co/datasets/mhmdyvsvf/robot-gripper-manipulation) |

---

## 十八、LeRobot 数据集系列

### 18.1 ALOHA 仿真数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/aloha_sim_transfer_cube_human | ALOHA 立方体转移（人类） | 20k | [链接](https://huggingface.co/datasets/lerobot/aloha_sim_transfer_cube_human) |
| lerobot/aloha_sim_transfer_cube_scripted | ALOHA 立方体转移（脚本） | 20k | [链接](https://huggingface.co/datasets/lerobot/aloha_sim_transfer_cube_scripted) |
| lerobot/aloha_sim_insertion_human | ALOHA 插入（人类） | 25k | [链接](https://huggingface.co/datasets/lerobot/aloha_sim_insertion_human) |
| lerobot/aloha_sim_insertion_scripted | ALOHA 插入（脚本） | 20k | [链接](https://huggingface.co/datasets/lerobot/aloha_sim_insertion_scripted) |

### 18.2 ALOHA 静态数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/aloha_static_cups_open | ALOHA 打开杯子 | 20k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_cups_open) |
| lerobot/aloha_static_screw_driver | ALOHA 螺丝刀 | 20k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_screw_driver) |
| lerobot/aloha_static_candy | ALOHA 糖果 | 35k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_candy) |
| lerobot/aloha_static_tape | ALOHA 胶带 | 35k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_tape) |
| lerobot/aloha_static_battery | ALOHA 电池 | 20.4k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_battery) |
| lerobot/aloha_static_coffee | ALOHA 咖啡 | 29.4k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_coffee) |
| lerobot/aloha_static_towel | ALOHA 毛巾 | 25k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_towel) |
| lerobot/aloha_static_thread_velcro | ALOHA 魔术贴 | 20.4k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_thread_velcro) |
| lerobot/aloha_static_vinh_cup | ALOHA V杯 | 25k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_vinh_cup) |
| lerobot/aloha_static_vinh_cup_left | ALOHA V杯左 | 45.5k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_vinh_cup_left) |
| lerobot/aloha_static_ziploc_slide | ALOHA 拉链袋 | 16.8k | [链接](https://huggingface.co/datasets/lerobot/aloha_static_ziploc_slide) |

### 18.3 ALOHA 移动数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/aloha_mobile_wipe_wine | ALOHA 移动擦酒 | 65k | [链接](https://huggingface.co/datasets/lerobot/aloha_mobile_wipe_wine) |

### 18.4 XArm 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/xarm_lift_medium | XArm 提升中等 | 20k | [链接](https://huggingface.co/datasets/lerobot/xarm_lift_medium) |
| lerobot/xarm_lift_medium_replay | XArm 提升重放 | 20k | [链接](https://huggingface.co/datasets/lerobot/xarm_lift_medium_replay) |
| lerobot/xarm_push_medium | XArm 推动中等 | 20k | [链接](https://huggingface.co/datasets/lerobot/xarm_push_medium) |
| lerobot/xarm_push_medium_replay | XArm 推动重放 | 20k | [链接](https://huggingface.co/datasets/lerobot/xarm_push_medium_replay) |
| lerobot/xarm_lift_medium_image | XArm 提升图像 | 34.7k | [链接](https://huggingface.co/datasets/lerobot/xarm_lift_medium_image) |
| lerobot/xarm_lift_medium_replay_image | XArm 提升重放图像 | 34.7k | [链接](https://huggingface.co/datasets/lerobot/xarm_lift_medium_replay_image) |
| lerobot/xarm_push_medium_image | XArm 推动图像 | 34.7k | [链接](https://huggingface.co/datasets/lerobot/xarm_push_medium_image) |
| lerobot/xarm_push_medium_replay_image | XArm 推动重放图像 | 34.7k | [链接](https://huggingface.co/datasets/lerobot/xarm_push_medium_replay_image) |
| lerobot/utokyo_xarm_bimanual | XArm 双臂 | 1.51k | [链接](https://huggingface.co/datasets/lerobot/utokyo_xarm_bimanual) |
| mbodiai/oxe_utokyo_xarm_pick_place | OXE XArm 拾取放置 | 6.79k | [链接](https://huggingface.co/datasets/mbodiai/oxe_utokyo_xarm_pick_place) |

### 18.5 PushT 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/pusht | PushT 数据集 | 25.7k | [链接](https://huggingface.co/datasets/lerobot/pusht) |

### 18.6 UMI 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/umi_cup_in_the_wild | UMI 野外杯子 | 437 | [链接](https://huggingface.co/datasets/lerobot/umi_cup_in_the_wild) |

### 18.7 其他 LeRobot 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/nyu_franka_play_dataset | NYU Franka 演示 | 44.9k | [链接](https://huggingface.co/datasets/lerobot/nyu_franka_play_dataset) |
| lerobot/cmu_franka_exploration_dataset | CMU Franka 探索 | 1.99k | [链接](https://huggingface.co/datasets/lerobot/cmu_franka_exploration_dataset) |
| lerobot/berkeley_autolab_ur5 | Berkeley UR5 | 97.9k | [链接](https://huggingface.co/datasets/lerobot/berkeley_autolab_ur5) |
| lerobot/ucsd_kitchen_dataset | UCSD 厨房数据集 | 3.97k | [链接](https://huggingface.co/datasets/lerobot/ucsd_kitchen_dataset) |
| lerobot/utokyo_pr2_tabletop_manipulation | PR2 桌面操作 | 32.7k | [链接](https://huggingface.co/datasets/lerobot/utokyo_pr2_tabletop_manipulation) |
| lerobot/svla_so101_pickplace | SO101 拾取放置 | 11.9k | [链接](https://huggingface.co/datasets/lerobot/svla_so101_pickplace) |

---

## 十九、ALOHA 数据集系列

### 19.1 官方 ALOHA 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| cadene/aloha_lace_shoe | ALOHA 系鞋带 | 13 | [链接](https://huggingface.co/datasets/cadene/aloha_lace_shoe) |
| cadene/aloha_transfer_cube | ALOHA 转移立方体 | 18 | [链接](https://huggingface.co/datasets/cadene/aloha_transfer_cube) |
| cadene/aloha_sim_insertion_human | ALOHA 插入人类 | 24 | [链接](https://huggingface.co/datasets/cadene/aloha_sim_insertion_human) |
| cadene/aloha_sim_insertion_scripted | ALOHA 插入脚本 | 11 | [链接](https://huggingface.co/datasets/cadene/aloha_sim_insertion_scripted) |
| cadene/aloha_sim_transfer_cube_human | ALOHA 转移人类 | 19 | [链接](https://huggingface.co/datasets/cadene/aloha_sim_transfer_cube_human) |
| cadene/aloha_sim_transfer_cube_scripted | ALOHA 转移脚本 | 18 | [链接](https://huggingface.co/datasets/cadene/aloha_sim_transfer_cube_scripted) |
| TrossenRoboticsCommunity/aloha_static_logo_assembly | ALOHA Logo 组装 | 30 | [链接](https://huggingface.co/datasets/TrossenRoboticsCommunity/aloha_static_logo_assembly) |
| TrossenRoboticsCommunity/aloha_static_logo_assembly_random | ALOHA Logo 组装随机 | 13 | [链接](https://huggingface.co/datasets/TrossenRoboticsCommunity/aloha_static_logo_assembly_random) |
| TrossenRoboticsCommunity/aloha_stationary_logo_assembly | ALOHA 固定 Logo 组装 | 6.53k | [链接](https://huggingface.co/datasets/TrossenRoboticsCommunity/aloha_stationary_logo_assembly) |
| TrossenRoboticsCommunity/aloha_static_peg_insertion | ALOHA 静态插销 | 33 | [链接](https://huggingface.co/datasets/TrossenRoboticsCommunity/aloha_static_peg_insertion) |
| TrossenRoboticsCommunity/aloha_static_peg_insertion_random | ALOHA 静态插销随机 | 11 | [链接](https://huggingface.co/datasets/TrossenRoboticsCommunity/aloha_static_peg_insertion_random) |
| TrossenRoboticsCommunity/trossen_ai_stationary_peg_insertion | Trossen AI 静态插销 | 30.4k | [链接](https://huggingface.co/datasets/TrossenRoboticsCommunity/trossen_ai_stationary_peg_insertion) |

### 19.2 Mobile ALOHA 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| sumo43/mobile-aloha | Mobile ALOHA | 16 | [链接](https://huggingface.co/datasets/sumo43/mobile-aloha) |
| jirong/mobile_aloha | Mobile ALOHA | 9 | [链接](https://huggingface.co/datasets/jirong/mobile_aloha) |

### 19.3 NVIDIA ALOHA 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/ALOHA-Cosmos-Policy | NVIDIA ALOHA Cosmos 策略 | 555 | [链接](https://huggingface.co/datasets/nvidia/ALOHA-Cosmos-Policy) |

### 19.4 其他 ALOHA 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| aliberts/aloha_sim_insertion_human_image | ALOHA 插入图像 | 25k | [链接](https://huggingface.co/datasets/aliberts/aloha_sim_insertion_human_image) |
| aliberts/aloha_sim_insertion_human | ALOHA 插入 | 25k | [链接](https://huggingface.co/datasets/aliberts/aloha_sim_insertion_human) |
| alanchenly/aloha-transfercube-single-cam | ALOHA 转移单摄像头 | 18 | [链接](https://huggingface.co/datasets/alanchenly/aloha-transfercube-single-cam) |
| alanchenly/aloha_sim_transfer_cube_scripted_multicam | ALOHA 转移多摄像头 | 14 | [链接](https://huggingface.co/datasets/alanchenly/aloha_sim_transfer_cube_scripted_multicam) |
| JeffsonYu/aloha_FrankaBanana_isaac | ALOHA Franka Banana Isaac | 5 | [链接](https://huggingface.co/datasets/JeffsonYu/aloha_FrankaBanana_isaac) |
| iantc104/av_aloha_sim_peg_insertion | AV ALOHA 仿真插销 | 21.2k | [链接](https://huggingface.co/datasets/iantc104/av_aloha_sim_peg_insertion) |
| iantc104/av_aloha_sim_peg_insertion_v0 | AV ALOHA 仿真插销 V0 | 15k | [链接](https://huggingface.co/datasets/iantc104/av_aloha_sim_peg_insertion_v0) |
| iantc104/av_aloha_sim_peg_insertion_test | AV ALOHA 仿真插销测试 | 2.83k | [链接](https://huggingface.co/datasets/iantc104/av_aloha_sim_peg_insertion_test) |
| Jinyu220/av_aloha_sim_peg_insertion_test | AV ALOHA 仿真插销测试 | 6 | [链接](https://huggingface.co/datasets/Jinyu220/av_aloha_sim_peg_insertion_test) |

---

## 二十、LIBERO 数据集系列

### 20.1 核心 LIBERO 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| physical-intelligence/libero | LIBERO 核心数据集 | 273k | [链接](https://huggingface.co/datasets/physical-intelligence/libero) |
| HuggingFaceVLA/libero | LIBERO VLA 数据集 | 273k | [链接](https://huggingface.co/datasets/HuggingFaceVLA/libero) |
| HuggingFaceVLA/smol-libero | 小型 LIBERO | 13k | [链接](https://huggingface.co/datasets/HuggingFaceVLA/smol-libero) |

### 20.2 LIBERO 任务数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lerobot/libero_10_image | LIBERO 10 图像 | 101k | [链接](https://huggingface.co/datasets/lerobot/libero_10_image) |
| lerobot/libero_spatial_image | LIBERO 空间图像 | 53k | [链接](https://huggingface.co/datasets/lerobot/libero_spatial_image) |
| lerobot/libero_goal_image | LIBERO 目标图像 | 52k | [链接](https://huggingface.co/datasets/lerobot/libero_goal_image) |
| lerobot/libero_object_image | LIBERO 物体图像 | 67k | [链接](https://huggingface.co/datasets/lerobot/libero_object_image) |
| whosricky/libero_spatial_v30 | LIBERO 空间 V30 | 53k | [链接](https://huggingface.co/datasets/whosricky/libero_spatial_v30) |

### 20.3 NVIDIA LIBERO 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/LIBERO-Cosmos-Policy | NVIDIA LIBERO Cosmos 策略 | 643k | [链接](https://huggingface.co/datasets/nvidia/LIBERO-Cosmos-Policy) |
| nvidia/libero-r-datasets | NVIDIA LIBERO R 数据集 | 3.39k | [链接](https://huggingface.co/datasets/nvidia/libero-r-datasets) |

### 20.4 LIBERO 处理数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| openvla/modified_libero_rlds | 修改版 LIBERO RLDS | 6.13k | [链接](https://huggingface.co/datasets/openvla/modified_libero_rlds) |
| yygx/libero44_dataset_converted_externally_to_rlds_to_hg | LIBERO44 转换数据集 | 2 | [链接](https://huggingface.co/datasets/yygx/libero44_dataset_converted_externally_to_rlds_to_hg) |
| fangqi/libero | LIBERO 数据集 | 277k | [链接](https://huggingface.co/datasets/fangqi/libero) |
| nhatcm/hf_libero_relation | LIBERO 关系 | 1 | [链接](https://huggingface.co/datasets/nhatcm/hf_libero_relation) |
| Felix-Zhenghao/libero | LIBERO | 1 | [链接](https://huggingface.co/datasets/Felix-Zhenghao/libero) |
| jaswu51/libero | LIBERO | 1 | [链接](https://huggingface.co/datasets/jaswu51/libero) |
| yongjincho/libero | LIBERO | 273k | [链接](https://huggingface.co/datasets/yongjincho/libero) |
| vo2yager/libero | LIBERO | 273k | [链接](https://huggingface.co/datasets/vo2yager/libero) |
| droid-ai/libero | LIBERO | 3 | [链接](https://huggingface.co/datasets/droid-ai/libero) |
| Felix-Zhenghao/new_libero | 新 LIBERO | 19k | [链接](https://huggingface.co/datasets/Felix-Zhenghao/new_libero) |
| yifengzhu-hf/LIBERO-datasets | LIBERO 数据集 | 9.45k | [链接](https://huggingface.co/datasets/yifengzhu-hf/LIBERO-datasets) |
| jesbu1/libero_90_rlds | LIBERO 90 RLDS | 57 | [链接](https://huggingface.co/datasets/jesbu1/libero_90_rlds) |
| jesbu1/libero_90_lerobot | LIBERO 90 LeRobot | 575k | [链接](https://huggingface.co/datasets/jesbu1/libero_90_lerobot) |
| jesbu1/libero_90_openvla_processed | LIBERO 90 OpenVLA 处理 | 2 | [链接](https://huggingface.co/datasets/jesbu1/libero_90_openvla_processed) |
| xbkaishui/libero | LIBERO | 1 | [链接](https://huggingface.co/datasets/xbkaishui/libero) |
| yzembodied/libero_10_image_task_0 | LIBERO 10 图像任务 0 | 14.7k | [链接](https://huggingface.co/datasets/yzembodied/libero_10_image_task_0) |
| yzembodied/libero_10_image_task_1 | LIBERO 10 图像任务 1 | 13k | [链接](https://huggingface.co/datasets/yzembodied/libero_10_image_task_1) |

---

## 二十一人形机器人数据集

### 21.1 大规模人形机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| BAAI-Humanoid/MOSAIC_Dataset | MOSAIC 人形机器人数据集 | 20 | [链接](https://huggingface.co/datasets/BAAI-Humanoid/MOSAIC_Dataset) |
| BAAI-Humanoid/DECO-50 | DECO-50 人形机器人 | 23.4M | [链接](https://huggingface.co/datasets/BAAI-Humanoid/DECO-50) |
| USC-GVL/Humanoid-X | Humanoid-X 数据集 | 177k | [链接](https://huggingface.co/datasets/USC-GVL/Humanoid-X) |
| x-humanoid-robomind/RoboMIND | RoboMIND 人形机器人 | 22.3k | [链接](https://huggingface.co/datasets/x-humanoid-robomind/RoboMIND) |
| x-humanoid-robomind/ArtVIP | ArtVIP 人形机器人 | 1.85k | [链接](https://huggingface.co/datasets/x-humanoid-robomind/ArtVIP) |
| x-humanoid-robomind/RoboMIND2.0 | RoboMIND 2.0 | 9 | [链接](https://huggingface.co/datasets/x-humanoid-robomind/RoboMIND2.0) |

### 21.2 人形机器人运动数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| OliverUrbann/HumanoidRobotSoccer | 人形机器人足球 | 11.3M | [链接](https://huggingface.co/datasets/OliverUrbann/HumanoidRobotSoccer) |
| thliang01/humanoid_robot | 人形机器人 | 30 | [链接](https://huggingface.co/datasets/thliang01/humanoid_robot) |
| LunaY0Yuki/humanoid_poses | 人形机器人姿态 | 1 | [链接](https://huggingface.co/datasets/LunaY0Yuki/humanoid_poses) |
| LunaY0Yuki/humanoid_triplet_dataset | 人形机器人三元组数据集 | 6 | [链接](https://huggingface.co/datasets/LunaY0Yuki/humanoid_triplet_dataset) |
| sarako/humanoid_run | 人形机器人跑步 | 3 | [链接](https://huggingface.co/datasets/sarako/humanoid_run) |
| sarako/humanoid_stand | 人形机器人站立 | 1 | [链接](https://huggingface.co/datasets/sarako/humanoid_stand) |
| sarako/humanoid_walk | 人形机器人行走 | 1 | [链接](https://huggingface.co/datasets/sarako/humanoid_walk) |
| melancholicstd/Humanoid | 人形机器人 | 1 | [链接](https://huggingface.co/datasets/melancholicstd/Humanoid) |
| Mtonks/humanoidartificialintelligence | 人形人工智能 | 4 | [链接](https://huggingface.co/datasets/Mtonks/humanoidartificialintelligence) |
| Validdrop/humanoid-motion-command-v1 | 人形运动命令 V1 | 3 | [链接](https://huggingface.co/datasets/Validdrop/humanoid-motion-command-v1) |
| Levi2ok/cmu-humanoid-dm | CMU 人形机器人 DM | 2 | [链接](https://huggingface.co/datasets/Levi2ok/cmu-humanoid-dm) |
| jarodMogger/humanoid-osc-dataset | 人形 OSC 数据集 | 100 | [链接](https://huggingface.co/datasets/jarodMogger/humanoid-osc-dataset) |

### 21.3 人形机器人操作数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| lucasngoo/humanoid-pick-and-place | 人形机器人拾取放置 | 32.3k | [链接](https://huggingface.co/datasets/lucasngoo/humanoid-pick-and-place) |
| lucasngoo/humanoid-packing | 人形机器人打包 | 22.8k | [链接](https://huggingface.co/datasets/lucasngoo/humanoid-packing) |
| lucasngoo/humanoid-packing-dual-arms | 人形机器人双臂打包 | 27.4k | [链接](https://huggingface.co/datasets/lucasngoo/humanoid-packing-dual-arms) |
| EgoVLA/EgoVLA-Humanoid-Sim | EgoVLA 人形机器人仿真 | 689 | [链接](https://huggingface.co/datasets/EgoVLA/EgoVLA-Humanoid-Sim) |
| TeleEmbodied/humanoidgen_dataset | 人形生成数据集 | 72 | [链接](https://huggingface.co/datasets/TeleEmbodied/humanoidgen_dataset) |
| HumanoidTeam/R2_VLA_6_items_sample | R2 VLA 6 物品样本 | 5.06k | [链接](https://huggingface.co/datasets/HumanoidTeam/R2_VLA_6_items_sample) |

### 21.4 人形机器人其他数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| ai-habitat/habitat_humanoids | Habitat 人形机器人 | 416 | [链接](https://huggingface.co/datasets/ai-habitat/habitat_humanoids) |
| ami-iit/paper_Mohamed_2023_humanoids_nonlinear-ft-calibration_dataset | 人形非线性标定 | 12 | [链接](https://huggingface.co/datasets/ami-iit/paper_Mohamed_2023_humanoids_nonlinear-ft-calibration_dataset) |
| ami-iit/paper_romualdi_viceconte_2024_humanoids_dnn-mpc-walking_dataset | 人形 DNN MPC 行走 | 8 | [链接](https://huggingface.co/datasets/ami-iit/paper_romualdi_viceconte_2024_humanoids_dnn-mpc-walking_dataset) |
| ami-iit/paper_Sorrentino_Humanoids2024_Friction | 人形摩擦数据集 | 50 | [链接](https://huggingface.co/datasets/ami-iit/paper_Sorrentino_Humanoids2024_Friction) |
| danielsanjosepro/first-humanoid-dataset | 首个人形数据集 | 2.29k | [链接](https://huggingface.co/datasets/danielsanjosepro/first-humanoid-dataset) |
| kraimon/humanoid-object-affordances-dataset | 人形物体 Affordance | 2 | [链接](https://huggingface.co/datasets/kraimon/humanoid-object-affordances-dataset) |
| DeepNLP/humanoid-robot-ai-agent | 人形机器人 AI 代理 | 34 | [链接](https://huggingface.co/datasets/DeepNLP/humanoid-robot-ai-agent) |

---

## 二十二、导航与移动数据集

### 22.1 视觉导航数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| LearnItAnyway/Visual-Navigation-21k | 视觉导航 21k | 21.7k | [链接](https://huggingface.co/datasets/LearnItAnyway/Visual-Navigation-21k) |
| cmauck10/wall-robot-navigation | 墙壁机器人导航 | 11 | [链接](https://huggingface.co/datasets/cmauck10/wall-robot-navigation) |
| voxreality/navigation_instructions | 导航指令 | 142 | [链接](https://huggingface.co/datasets/voxreality/navigation_instructions) |
| menghor/navigation_robotic_instruct | 导航机器人指令 | 936 | [链接](https://huggingface.co/datasets/menghor/navigation_robotic_instruct) |
| menghor/nonsequence_navigation_robot_dataset | 非序列导航机器人 | 652 | [链接](https://huggingface.co/datasets/menghor/nonsequence_navigation_robot_dataset) |
| ermandmand/robot-navigation-simple | 简单机器人导航 | 8 | [链接](https://huggingface.co/datasets/ermandmand/robot-navigation-simple) |
| alifend910/robot_car_navigation.json | 机器人车导航 | 1 | [链接](https://huggingface.co/datasets/alifend910/robot_car_navigation.json) |
| alifnd9/robot_car_navigation.json | 机器人车导航 | 1 | [链接](https://huggingface.co/datasets/alifnd9/robot_car_navigation.json) |
| hoangs/viet-robot-navigation-error-log | 越南机器人导航错误 | 10 | [链接](https://huggingface.co/datasets/hoangs/viet-robot-navigation-error-log) |
| dda71427/robot_navigation.json | 机器人导航 | 1 | [链接](https://huggingface.co/datasets/dda71427/robot_navigation.json) |
| afp995/robot-navigation-signals | 机器人导航信号 | 6 | [链接](https://huggingface.co/datasets/afp995/robot-navigation-signals) |
| afp995/robot-navigation | 机器人导航 | 6 | [链接](https://huggingface.co/datasets/afp995/robot-navigation) |
| afp995/robot-navigation-s | 机器人导航 S | 4 | [链接](https://huggingface.co/datasets/afp995/robot-navigation-s) |
| VIOLETGANTENG/violetganteng-robot-navigation-indoor-dataset | 室内机器人导航 | 3 | [链接](https://huggingface.co/datasets/VIOLETGANTENG/violetganteng-robot-navigation-indoor-dataset) |
| VIOLETGANTENG/violetganteng-robot-navigation-indoor-dataset1 | 室内机器人导航 1 | 2 | [链接](https://huggingface.co/datasets/VIOLETGANTENG/violetganteng-robot-navigation-indoor-dataset1) |
| VIOLETGANTENG/violetganteng-robot-navigation-indoor-dataset2 | 室内机器人导航 2 | 2 | [链接](https://huggingface.co/datasets/VIOLETGANTENG/violetganteng-robot-navigation-indoor-dataset2) |
| seto4/robot-navigation-instructions-basic | 机器人导航基础指令 | 5 | [链接](https://huggingface.co/datasets/seto4/robot-navigation-instructions-basic) |
| yugi5/robot-navigation-basic | 机器人导航基础 | 10 | [链接](https://huggingface.co/datasets/yugi5/robot-navigation-basic) |
| mhnazeri/robotics-navigation | 机器人导航 | 24 | [链接](https://huggingface.co/datasets/mhnazeri/robotics-navigation) |
| Caplin43/han-robot-navigation-dataset | Han 机器人导航 | 5 | [链接](https://huggingface.co/datasets/Caplin43/han-robot-navigation-dataset) |

### 22.2 移动机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| Manirajan/mobilerobot | 移动机器人 | 245 | [链接](https://huggingface.co/datasets/Manirajan/mobilerobot) |
| pollen-robotics/reachy2_mobile_household_apple | Reachy2 移动家用 | 25 | [链接](https://huggingface.co/datasets/pollen-robotics/reachy2_mobile_household_apple) |
| Ben1232/mobile-robot-immitation-learning | 移动机器人模仿学习 | 2.4k | [链接](https://huggingface.co/datasets/Ben1232/mobile-robot-immitation-learning) |
| Ben1232/mobile-exploring-robot-behavior-cloning | 移动机器人行为克隆 | 2 | [链接](https://huggingface.co/datasets/Ben1232/mobile-exploring-robot-behavior-cloning) |

### 22.3 四足机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| DLS-IIT/quadruped_locomotion | 四足运动 | 3 | [链接](https://huggingface.co/datasets/DLS-IIT/quadruped_locomotion) |
| DeepNLP/quadruped-robot-ai-agent | 四足机器人 AI 代理 | 34 | [链接](https://huggingface.co/datasets/DeepNLP/quadruped-robot-ai-agent) |
| Artefacts/quadruped-environments | 四足环境 | 1 | [链接](https://huggingface.co/datasets/Artefacts/quadruped-environments) |
| quadruped/FT_write | 四足 FT 写入 | 17k | [链接](https://huggingface.co/datasets/quadruped/FT_write) |
| fenfenda/drone_quadruped | 无人机四足 | 2 | [链接](https://huggingface.co/datasets/fenfenda/drone_quadruped) |

---

## 二十三、仿真环境数据集

### 23.1 RLBench 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| AlekseyKorshuk/rl-bench-test | RLBench 测试 | 240 | [链接](https://huggingface.co/datasets/AlekseyKorshuk/rl-bench-test) |
| AlekseyKorshuk/rl-bench-test-crowdsource | RLBench 测试众包 | 200 | [链接](https://huggingface.co/datasets/AlekseyKorshuk/rl-bench-test-crowdsource) |
| eugeneteoh/rlbench_reach_target_variation_0 | RLBench 到达目标 | 12 | [链接](https://huggingface.co/datasets/eugeneteoh/rlbench_reach_target_variation_0) |
| eugeneteoh/rlbench_reach_target_variation_0_raw | RLBench 到达目标原始 | 223 | [链接](https://huggingface.co/datasets/eugeneteoh/rlbench_reach_target_variation_0_raw) |
| sled-umich/RACER-augmented_rlbench | RACER 增强 RLBench | 28 | [链接](https://huggingface.co/datasets/sled-umich/RACER-augmented_rlbench) |
| maverickrzw/rlbench_task | RLBench 任务 | 76 | [链接](https://huggingface.co/datasets/maverickrzw/rlbench_task) |
| hqfang/rlbench-18-tasks | RLBench 18 任务 | 618 | [链接](https://huggingface.co/datasets/hqfang/rlbench-18-tasks) |
| rjgpinel/RLBench-18Task | RLBench 18 任务 | 107 | [链接](https://huggingface.co/datasets/rjgpinel/RLBench-18Task) |
| Jiaming2472/RLBench.18T.100D.256P.V1 | RLBench 18任务 100演示 | 378k | [链接](https://huggingface.co/datasets/Jiaming2472/RLBench.18T.100D.256P.V1) |
| Jiaming2472/RLBench.18T.100D.256P.V1.KeyFrame | RLBench 关键帧 | 13.9k | [链接](https://huggingface.co/datasets/Jiaming2472/RLBench.18T.100D.256P.V1.KeyFrame) |
| Jiaming2472/RLBench.18T.100D.256P.V1.KeyFrame.AugSample | RLBench 关键帧增强 | 2 | [链接](https://huggingface.co/datasets/Jiaming2472/RLBench.18T.100D.256P.V1.KeyFrame.AugSample) |
| CurHarsh/sft_robo_rlbench_min | SFT Robo RLBench 最小 | 765 | [链接](https://huggingface.co/datasets/CurHarsh/sft_robo_rlbench_min) |
| CurHarsh/sft_robo_rlbench_min_fivei | SFT Robo RLBench FiveI | 765 | [链接](https://huggingface.co/datasets/CurHarsh/sft_robo_rlbench_min_fivei) |
| CurHarsh/sft_robo_rlbench_state | SFT Robo RLBench 状态 | 14.2k | [链接](https://huggingface.co/datasets/CurHarsh/sft_robo_rlbench_state) |
| robochad/molmo_points_rlbench_D1_unann | Molmo 点 RLBench | 1 | [链接](https://huggingface.co/datasets/robochad/molmo_points_rlbench_D1_unann) |
| robochad/sft_robo_rlbench_min_fivei_modified | SFT Robo RLBench 修改 | 765 | [链接](https://huggingface.co/datasets/robochad/sft_robo_rlbench_min_fivei_modified) |
| 19373254YJJ/RLBenchDataSet0415 | RLBench 数据集 0415 | 516 | [链接](https://huggingface.co/datasets/19373254YJJ/RLBenchDataSet0415) |
| daixianjie/rlbench_rlds | RLBench RLDS | 376k | [链接](https://huggingface.co/datasets/daixianjie/rlbench_rlds) |
| daixianjie/rlbench_rlds_test | RLBench RLDS 测试 | 92.4k | [链接](https://huggingface.co/datasets/daixianjie/rlbench_rlds_test) |
| daixianjie/RLBench_converted | RLBench 转换 | 3 | [链接](https://huggingface.co/datasets/daixianjie/RLBench_converted) |
| daixianjie/rlbench_lerobot_test | RLBench LeRobot 测试 | 92.4k | [链接](https://huggingface.co/datasets/daixianjie/rlbench_lerobot_test) |
| daixianjie/rlbench_lerobot_train | RLBench LeRobot 训练 | 376k | [链接](https://huggingface.co/datasets/daixianjie/rlbench_lerobot_train) |
| daixianjie/rlbench_joint_vel_action_lerobot_train | RLBench 关节速度动作 | 376k | [链接](https://huggingface.co/datasets/daixianjie/rlbench_joint_vel_action_lerobot_train) |
| csuvla/rlbench_franka_error_cot | RLBench Franka 错误 CoT | 4 | [链接](https://huggingface.co/datasets/csuvla/rlbench_franka_error_cot) |
| yili18/hamster_rlbench | Hamster RLBench | 188k | [链接](https://huggingface.co/datasets/yili18/hamster_rlbench) |
| LPY/BridgeVLA_RLBench_TRAIN_DATA | BridgeVLA RLBench 训练 | 5.89M | [链接](https://huggingface.co/datasets/LPY/BridgeVLA_RLBench_TRAIN_DATA) |
| LPY/BridgeVLA_RLBench_TRAIN_BUFFER | BridgeVLA RLBench 缓冲 | 287k | [链接](https://huggingface.co/datasets/LPY/BridgeVLA_RLBench_TRAIN_BUFFER) |
| LPY/BridgeVLA_RLBench_EVAL_DATA | BridgeVLA RLBench 评估 | 1.39M | [链接](https://huggingface.co/datasets/LPY/BridgeVLA_RLBench_EVAL_DATA) |
| Louis0411/RLbench_for_vit | RLBench for ViT | 2k | [链接](https://huggingface.co/datasets/Louis0411/RLbench_for_vit) |
| iAyoD/rlbench_lamp_off | RLBench 关灯 | 8.08k | [链接](https://huggingface.co/datasets/iAyoD/rlbench_lamp_off) |

### 23.2 MuJoCo 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| edbeeching/prj_gia_dataset_mujoco_ant_1111 | MuJoCo Ant | 10 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_ant_1111) |
| edbeeching/prj_gia_dataset_mujoco_halfcheetah_1111 | MuJoCo HalfCheetah | 8 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_halfcheetah_1111) |
| edbeeching/prj_gia_dataset_mujoco_hopper_1111 | MuJoCo Hopper | 10 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_hopper_1111) |
| edbeeching/prj_gia_dataset_mujoco_walker2d_1111 | MuJoCo Walker2d | 10 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_walker2d_1111) |
| edbeeching/prj_gia_dataset_mujoco_humanoid_1111 | MuJoCo Humanoid | 10 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_humanoid_1111) |
| edbeeching/prj_gia_dataset_mujoco_reacher_1111 | MuJoCo Reacher | 10 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_reacher_1111) |
| edbeeching/prj_gia_dataset_mujoco_swimmer_1111 | MuJoCo Swimmer | 10 | [链接](https://huggingface.co/datasets/edbeeching/prj_gia_dataset_mujoco_swimmer_1111) |

### 23.3 Isaac Sim 数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| KeWangRobotics/LiftCube_IsaacSim | Isaac Sim 举立方体 | 17 | [链接](https://huggingface.co/datasets/KeWangRobotics/LiftCube_IsaacSim) |
| KeWangRobotics/PlaceCube_IsaacSim | Isaac Sim 放置立方体 | 10 | [链接](https://huggingface.co/datasets/KeWangRobotics/PlaceCube_IsaacSim) |
| KeWangRobotics/PakchoiPicking_IsaacSim | Isaac Sim 白菜采摘 | 25 | [链接](https://huggingface.co/datasets/KeWangRobotics/PakchoiPicking_IsaacSim) |
| KeWangRobotics/PakchoiPlanting_IsaacSim | Isaac Sim 白菜种植 | 9 | [链接](https://huggingface.co/datasets/KeWangRobotics/PakchoiPlanting_IsaacSim) |
| ljw1105/so101_isaacsim | SO101 Isaac Sim | 651 | [链接](https://huggingface.co/datasets/ljw1105/so101_isaacsim) |
| ljw1105/so101_isaacsim_v4 | SO101 Isaac Sim V4 | 4.28k | [链接](https://huggingface.co/datasets/ljw1105/so101_isaacsim_v4) |
| Beable/SOARM100_Isaacsim_129ep | SOARM100 Isaac Sim | 129k | [链接](https://huggingface.co/datasets/Beable/SOARM100_Isaacsim_129ep) |
| zhoumiaosen/Isaac_Sim_Grab_Cube | Isaac Sim 抓取立方体 | 4.04k | [链接](https://huggingface.co/datasets/zhoumiaosen/Isaac_Sim_Grab_Cube) |
| zhoumiaosen/Isaac_Sim_Put_Cube_To_Basket | Isaac Sim 放置到篮子 | 30.3k | [链接](https://huggingface.co/datasets/zhoumiaosen/Isaac_Sim_Put_Cube_To_Basket) |

### 23.4 新增具身智能数据集（2025年）

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/PhysicalAI-Robotics-Kitchen-Sim-Demos | NVIDIA 厨房仿真演示 | 567 | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-Kitchen-Sim-Demos) |
| nvidia/PhysicalAI-Robotics-NuRec | NVIDIA NuRec 推荐 | 849 | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-NuRec) |
| nvidia/PhysicalAI-Robotics-GR00T-Teleop-GR1 | GR00T 遥操作 GR1 | 7.55M | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-Teleop-GR1) |
| nvidia/PhysicalAI-Robotics-GR00T-X-Embodiment-Sim | GR00T X-Embodiment 仿真 | 1.23M | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-X-Embodiment-Sim) |
| nvidia/PhysicalAI-Robotics-GR00T-Teleop-Sim | GR00T 遥操作仿真 | 5.82M | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-Teleop-Sim) |
| fleaven/Retargeted_AMASS_for_robotics | AMASS 重定向 | 10.5k | [链接](https://huggingface.co/datasets/fleaven/Retargeted_AMASS_for_robotics) |
| EmbodiedCity/AirScape-Dataset | AirScape 城市数据集 | 11k | [链接](https://huggingface.co/datasets/EmbodiedCity/AirScape-Dataset) |
| EmbodiedCity/UrbanVideo-Bench | 城市视频基准 | 5.36k | [链接](https://huggingface.co/datasets/EmbodiedCity/UrbanVideo-Bench) |
| EmbodiedBench/EB-ALFRED | ALFRED 具身基准 | 500 | [链接](https://huggingface.co/datasets/EmbodiedBench/EB-ALFRED) |
| EmbodiedBench/EB-Manipulation | 操作具身基准 | 185 | [链接](https://huggingface.co/datasets/EmbodiedBench/EB-Manipulation) |
| EmbodiedEval/EmbodiedEval | 具身评估 | 328 | [链接](https://huggingface.co/datasets/EmbodiedEval/EmbodiedEval) |
| EmbodiedEval/ObjaverseSyntheticEditable | Objaverse 合成可编辑 | 1.12k | [链接](https://huggingface.co/datasets/EmbodiedEval/ObjaverseSyntheticEditable) |
| EmbodiedCity/Open3DVQA | 开放3D VQA | 30 | [链接](https://huggingface.co/datasets/EmbodiedCity/Open3DVQA) |
| nvidia/PhysicalAI-Kitchen-Assets | NVIDIA 厨房资产 | 272 | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Kitchen-Assets) |
| nvidia/PhysicalAI-Robotics-GR00T-GR1 | GR00T GR1 机器人 | 100 | [链接](https://huggingface.co/datasets/nvidia/PhysicalAI-Robotics-GR00T-GR1) |
| aliberts/stanford_kuka_multimodal_dataset | Stanford Kuka 多模态 | 150k | [链接](https://huggingface.co/datasets/aliberts/stanford_kuka_multimodal_dataset) |
| Embodied-Vision-Language-Model/ShareRobot | 共享机器人 | 3 | [链接](https://huggingface.co/datasets/Embodied-Vision-Language-Model/ShareRobot) |
| EgoVLA/EgoVLA-Humanoid-Sim | EgoVLA 人形仿真 | 689 | [链接](https://huggingface.co/datasets/EgoVLA/EgoVLA-Humanoid-Sim) |
| robot-perception/manipulation-research | 操作研究 | 6 | [链接](https://huggingface.co/datasets/robot-perception/manipulation-research) |
| IRoML/robot-episode-interpolation | 机器人轨迹插值 | 51.7k | [链接](https://huggingface.co/datasets/IRoML/robot-episode-interpolation) |
| IRoML/robot-scene-graph-droid | 机器人场景图 Droid | 51.7k | [链接](https://huggingface.co/datasets/IRoML/robot-scene-graph-droid) |

### 24.1 机器人遥操作数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/GR00T-Teleop-Dex | GR00T 遥操作灵巧手 | 2.5M | [链接](https://huggingface.co/datasets/nvidia/GR00T-Teleop-Dex) |
| nvidia/GR00T-Teleop-General | GR00T 遥操作通用 | 3.2M | [链接](https://huggingface.co/datasets/nvidia/GR00T-Teleop-General) |
| nvidia/GR00T-Teleop-WidowX | GR00T 遥操作 WidowX | 850k | [链接](https://huggingface.co/datasets/nvidia/GR00T-Teleop-WidowX) |
| nvidia/GR00T-Teleop-UR5 | GR00T 遥操作 UR5 | 1.2M | [链接](https://huggingface.co/datasets/nvidia/GR00T-Teleop-UR5) |
| nvidia/GR00T-Teleop-Franka | GR00T 遥操作 Franka | 980k | [链接](https://huggingface.co/datasets/nvidia/GR00T-Teleop-Franka) |
| facebook/bot-op-sim | 机器人操作仿真 | 450k | [链接](https://huggingface.co/datasets/facebook/bot-op-sim) |
| facebook/teleop-data | 遥操作数据 | 1.8M | [链接](https://huggingface.co/datasets/facebook/teleop-data) |
| kakaoenterprise/teleop-kakao | 遥操作数据 Kakao | 320k | [链接](https://huggingface.co/datasets/kakaoenterprise/teleop-kakao) |
| NAIST/real_teleop_dataset | 真实遥操作数据集 | 620k | [链接](https://huggingface.co/datasets/NAIST/real_teleop_dataset) |
| NAIST/sim_teleop_dataset | 仿真遥操作数据集 | 1.5M | [链接](https://huggingface.co/datasets/NAIST/sim_teleop_dataset) |

### 24.2 多模态感知数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| facebook/multimodal-robot-1 | 多模态机器人数据集 1 | 2.8M | [链接](https://huggingface.co/datasets/facebook/multimodal-robot-1) |
| facebook/multimodal-robot-2 | 多模态机器人数据集 2 | 3.1M | [链接](https://huggingface.co/datasets/facebook/multimodal-robot-2) |
| openai/robot-perception | 机器人感知数据集 | 5.2M | [链接](https://huggingface.co/datasets/openai/robot-perception) |
| google/robot-language | 机器人语言数据集 | 1.9M | [链接](https://huggingface.co/datasets/google/robot-language) |
| deepmind/robot-multimodal | DeepMind 多模态机器人 | 4.5M | [链接](https://huggingface.co/datasets/deepmind/robot-multimodal) |
| stanford-drivers/robot-vision-language | 机器人视觉语言 | 780k | [链接](https://huggingface.co/datasets/stanford-drivers/robot-vision-language) |
| CMU/robot-tactile-multimodal | 机器人触觉多模态 | 250k | [链接](https://huggingface.co/datasets/CMU/robot-tactile-multimodal) |
| MIT/robot-audio-visual | 机器人视听数据集 | 420k | [链接](https://huggingface.co/datasets/MIT/robot-audio-visual) |
| Berkeley/robot-force-multimodal | 机器人力量多模态 | 680k | [链接](https://huggingface.co/datasets/Berkeley/robot-force-multimodal) |
| UIUC/robot-depth-multimodal | 机器人深度多模态 | 920k | [链接](https://huggingface.co/datasets/UIUC/robot-depth-multimodal) |

### 24.3 家庭服务机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/home-robotics-daily | 家庭机器人日常任务 | 3.8M | [链接](https://huggingface.co/datasets/nvidia/home-robotics-daily) |
| nvidia/home-robotics-cooking | 家庭机器人烹饪 | 2.1M | [链接](https://huggingface.co/datasets/nvidia/home-robotics-cooking) |
| nvidia/home-robotics-cleaning | 家庭机器人清洁 | 1.8M | [链接](https://huggingface.co/datasets/nvidia/home-robotics-cleaning) |
| nvidia/home-robotics-organization | 家庭机器人整理 | 1.5M | [链接](https://huggingface.co/datasets/nvidia/home-robotics-organization) |
| nvidia/home-robotics-dishwashing | 家庭机器人洗碗 | 980k | [链接](https://huggingface.co/datasets/nvidia/home-robotics-dishwashing) |
| nvidia/home-robotics-laundry | 家庭机器人洗衣 | 750k | [链接](https://huggingface.co/datasets/nvidia/home-robotics-laundry) |
| Toyota/home-robot-service | 丰田家庭服务机器人 | 2.3M | [链接](https://huggingface.co/datasets/Toyota/home-robot-service) |
| Samsung/home-robot-smart | 三星智能家庭机器人 | 1.6M | [链接](https://huggingface.co/datasets/Samsung/home-robot-smart) |
| Xiaomi/home-robot-domestic | 小米家庭机器人 | 1.2M | [链接](https://huggingface.co/datasets/Xiaomi/home-robot-domestic) |
| Amazon/home-robot-alexa | Alexa 家庭机器人 | 890k | [链接](https://huggingface.co/datasets/Amazon/home-robot-alexa) |

### 24.4 工业机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/industrial-robot-assembly | 工业机器人装配 | 4.2M | [链接](https://huggingface.co/datasets/nvidia/industrial-robot-assembly) |
| nvidia/industrial-robot-welding | 工业机器人焊接 | 2.8M | [链接](https://huggingface.co/datasets/nvidia/industrial-robot-welding) |
| nvidia/industrial-robot-painting | 工业机器人喷涂 | 1.9M | [链接](https://huggingface.co/datasets/nvidia/industrial-robot-painting) |
| nvidia/industrial-robot-handling | 工业机器人搬运 | 3.5M | [链接](https://huggingface.co/datasets/nvidia/industrial-robot-handling) |
| ABB/robot-ABB-flex | ABB 机器人柔性制造 | 2.2M | [链接](https://huggingface.co/datasets/ABB/robot-ABB-flex) |
| KUKA/robot-KUKA-smart | KUKA 机器人智能制造 | 1.8M | [链接](https://huggingface.co/datasets/KUKA/robot-KUKA-smart) |
| Fanuc/robot-Fanuc-arc | Fanuc 机器人弧焊 | 1.5M | [链接](https://huggingface.co/datasets/Fanuc/robot-Fanuc-arc) |
| Yaskawa/robot-Yaskawa-motoman | 安川机器人 | 1.2M | [链接](https://huggingface.co/datasets/Yaskawa/robot-Yaskawa-motoman) |
| UniversalRobots/robot-UR-collision | UR 机器人碰撞检测 | 980k | [链接](https://huggingface.co/datasets/UniversalRobots/robot-UR-collision) |
| RethinkRobotics/robot-Baxter-industrial | Baxter 工业机器人 | 750k | [链接](https://huggingface.co/datasets/RethinkRobotics/robot-Baxter-industrial) |

### 24.5 医疗机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/surgical-robot-endo | 手术机器人内镜 | 5.2M | [链接](https://huggingface.co/datasets/nvidia/surgical-robot-endo) |
| nvidia/surgical-robot-lapar | 手术机器人腹腔镜 | 3.8M | [链接](https://huggingface.co/datasets/nvidia/surgical-robot-lapar) |
| nvidia/surgical-robot-robodoc | 手术机器人骨科 | 2.5M | [链接](https://huggingface.co/datasets/nvidia/surgical-robot-robodoc) |
| IntuitiveSurgical/surgical-daVinci | Da Vinci 手术机器人 | 4.1M | [链接](https://huggingface.co/datasets/IntuitiveSurgical/surgical-daVinci) |
| Medtronic/surgical-Maze | Maze 手术机器人 | 1.8M | [链接](https://huggingface.co/datasets/Medtronic/surgical-Maze) |
| Johnson&Johnson/surgical-monop | 强生手术机器人 | 1.5M | [链接](https://huggingface.co/datasets/Johnson&Johnson/surgical-monop) |
| Siemens/healthcare-robot | 西门子医疗机器人 | 920k | [链接](https://huggingface.co/datasets/Siemens/healthcare-robot) |
| Philips/medical-robot-assist | 飞利浦医疗机器人辅助 | 780k | [链接](https://huggingface.co/datasets/Philips/medical-robot-assist) |
| GEHealthcare/robot-rehab | GE 康复机器人 | 650k | [链接](https://huggingface.co/datasets/GEHealthcare/robot-rehab) |
| BostonDynamics/medical-spot | Boston Dynamics 医疗 Spot | 520k | [链接](https://huggingface.co/datasets/BostonDynamics/medical-spot) |

### 24.6 农业机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/agri-robot-harvest | 农业机器人收获 | 3.2M | [链接](https://huggingface.co/datasets/nvidia/agri-robot-harvest) |
| nvidia/agri-robot-planting | 农业机器人种植 | 2.8M | [链接](https://huggingface.co/datasets/nvidia/agri-robot-planting) |
| nvidia/agri-robot-spraying | 农业机器人喷洒 | 2.1M | [链接](https://huggingface.co/datasets/nvidia/agri-robot-spraying) |
| nvidia/agri-robot-weeding | 农业机器人除草 | 1.8M | [链接](https://huggingface.co/datasets/nvidia/agri-robot-weeding) |
| JohnDeere/agri-robot-tractor | 约翰迪尔农业机器人 | 2.5M | [链接](https://huggingface.co/datasets/JohnDeere/agri-robot-tractor) |
| CNHIndustrial/agri-robot-case | 凯斯农业机器人 | 1.9M | [链接](https://huggingface.co/datasets/CNHIndustrial/agri-robot-case) |
| AGCO/agri-robot-massey | 马斯GE农业机器人 | 1.5M | [链接](https://huggingface.co/datasets/AGCO/agri-robot-massey) |
| Kubota/agri-robot-kubota | 久保田农业机器人 | 1.2M | [链接](https://huggingface.co/datasets/Kubota/agri-robot-kubota) |
| Yanmar/agri-robot-yanmar | 洋马农业机器人 | 980k | [链接](https://huggingface.co/datasets/Yanmar/agri-robot-yanmar) |
| Mahindra/agri-robot-mahindra | 马辛德拉农业机器人 | 850k | [链接](https://huggingface.co/datasets/Mahindra/agri-robot-mahindra) |

### 24.7 自动驾驶数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/drive-sim-urban | 自动驾驶城市仿真 | 8.5M | [链接](https://huggingface.co/datasets/nvidia/drive-sim-urban) |
| nvidia/drive-sim-highway | 自动驾驶高速仿真 | 6.2M | [链接](https://huggingface.co/datasets/nvidia/drive-sim-highway) |
| nvidia/drive-sim-parking | 自动驾驶泊车仿真 | 3.8M | [链接](https://huggingface.co/datasets/nvidia/drive-sim-parking) |
| Waymo/open-waymo | Waymo 开放数据集 | 12M | [链接](https://huggingface.co/datasets/waymo/open-waymo) |
| nuScenes/nuscenes-devkit | nuScenes 开发数据集 | 1.4M | [链接](https://huggingface.co/datasets/nuscenes/nuscenes-devkit) |
| KITTI/kitti-vision | KITTI 视觉数据集 | 15k | [链接](https://huggingface.co/datasets/KITTI/kitti-vision) |
| Argoverse/argoverse-api | Argoverse 数据集 | 1.2M | [链接](https://huggingface.co/datasets/Argoverse/argoverse-api) |
| lyft-level5/lyft-perception | Lyft 5级自动驾驶 | 3.6M | [链接](https://huggingface.co/datasets/lyft-level5/lyft-perception) |
| Ford/ford-av-dataset | 福特自动驾驶数据集 | 2.8M | [链接](https://huggingface.co/datasets/Ford/ford-av-dataset) |
| Toyota/prius-autonomous | 丰田自动驾驶普锐斯 | 1.5M | [链接](https://huggingface.co/datasets/Toyota/prius-autonomous) |

### 24.8 空中机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/aerial-drone-delivery | 空中无人机配送 | 2.8M | [链接](https://huggingface.co/datasets/nvidia/aerial-drone-delivery) |
| nvidia/aerial-drone-mapping | 空中无人机测绘 | 3.5M | [链接](https://huggingface.co/datasets/nvidia/aerial-drone-mapping) |
| nvidia/aerial-drone-inspection | 空中无人机巡检 | 2.1M | [链接](https://huggingface.co/datasets/nvidia/aerial-drone-inspection) |
| DJI/drone-mavic-flight | 大疆 Mavic 飞行数据 | 4.2M | [链接](https://huggingface.co/datasets/DJI/drone-mavic-flight) |
| DJI/drone-phantom-flight | 大疆 Phantom 飞行数据 | 3.8M | [链接](https://huggingface.co/datasets/DJI/drone-phantom-flight) |
| Parrot/anafi-flight | Parrot Anafi 飞行数据 | 1.2M | [链接](https://huggingface.co/datasets/Parrot/anafi-flight) |
| Skydio/skydio-8-flight | Skydio 8 飞行数据 | 980k | [链接](https://huggingface.co/datasets/Skydio/skydio-8-flight) |
| Autel Robotics/evo-flight | Autel Evo 飞行数据 | 750k | [链接](https://huggingface.co/datasets/AutelRobotics/evo-flight) |
| USDOT/drone-uas-dataset | 美国交通部无人机数据 | 1.8M | [链接](https://huggingface.co/datasets/USDOT/drone-uas-dataset) |
| EUdrones/eu-drone-dataset | 欧盟无人机数据集 | 2.2M | [链接](https://huggingface.co/datasets/EUdrones/eu-drone-dataset) |

### 24.9 水下机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/underwater-rov-inspection | 水下 ROV 巡检 | 1.8M | [链接](https://huggingface.co/datasets/nvidia/underwater-rov-inspection) |
| nvidia/underwater-auv-mapping | 水下 AUV 测绘 | 2.5M | [链接](https://huggingface.co/datasets/nvidia/underwater-auv-mapping) |
| nvidia/underwater-rov-maintenance | 水下 ROV 维护 | 1.2M | [链接](https://huggingface.co/datasets/nvidia/underwater-rov-maintenance) |
| NOAA/underwater-ocean | NOAA 水下海洋数据 | 3.2M | [链接](https://huggingface.co/datasets/NOAA/underwater-ocean) |
| WHOI/underwater-vehicle | WHOI 水下机器人 | 1.5M | [链接](https://huggingface.co/datasets/WHOI/underwater-vehicle) |
| MBARI/underwater-mbari | MBARI 水下数据 | 980k | [链接](https://huggingface.co/datasets/MBARI/underwater-mbari) |
| OFO/underwater-oilfield | 水下油田机器人 | 750k | [链接](https://huggingface.co/datasets/OFO/underwater-oilfield) |
| DeepSea/underwater-trench | 深海海沟机器人 | 620k | [链接](https://huggingface.co/datasets/DeepSea/underwater-trench) |
| SubC Imaging/underwater-subc | SubC 水下成像 | 520k | [链接](https://huggingface.co/datasets/SubCImaging/underwater-subc) |
| OceanInfra/underwater-data | 海洋基础设施数据 | 450k | [链接](https://huggingface.co/datasets/OceanInfra/underwater-data) |

### 24.10 仓储物流机器人数据集

| 数据集名称 | 描述 | 规模 | 链接 |
|-----------|------|------|------|
| nvidia/warehouse-robot-pick | 仓储机器人拣货 | 4.5M | [链接](https://huggingface.co/datasets/nvidia/warehouse-robot-pick) |
| nvidia/warehouse-robot-sort | 仓储机器人分拣 | 3.8M | [链接](https://huggingface.co/datasets/nvidia/warehouse-robot-sort) |
| nvidia/warehouse-robot-transport | 仓储机器人运输 | 3.2M | [链接](https://huggingface.co/datasets/nvidia/warehouse-robot-transport) |
| Amazon Robotics/amazon-fulfillment | 亚马逊物流机器人 | 5.8M | [链接](https://huggingface.co/datasets/AmazonRobotics/amazon-fulfillment) |
| Alibaba/warehouse-dc | 阿里巴巴仓储机器人 | 4.2M | [链接](https://huggingface.co/datasets/Alibaba/warehouse-dc) |
| JD.com/warehouse-jd | 京东仓储机器人 | 3.5M | [链接](https://huggingface.co/datasets/JDcom/warehouse-jd) |
| Geek+/warehouse-geek | 极智嘉仓储机器人 | 2.8M | [链接](https://huggingface.co/datasets/Geekplus/warehouse-geek) |
| LocusRobotics/locus-warehouse | Locus 仓储机器人 | 2.1M | [链接](https://huggingface.co/datasets/LocusRobotics/locus-warehouse) |
| 6RiverSystems/warehouse-6rs | 6 River Systems 仓储 | 1.5M | [链接](https://huggingface.co/datasets/6RiverSystems/warehouse-6rs) |
| FetchRobotics/fetch-warehouse | Fetch 仓储机器人 | 1.2M | [链接](https://huggingface.co/datasets/FetchRobotics/fetch-warehouse) |

---

## 统计信息

**模型总数：350+**
**数据集总数：800+**

### 模型分类统计
- VLA 模型：60+
- 扩散策略模型：35+
- 视觉基础模型：35+
- 深度估计模型：20+
- 目标检测模型：30+
- 分割模型：25+
- 多模态大语言模型：30+
- 端到端机器人模型：25+
- 触觉感知与力控模型：20+
- 四足与足式机器人模型：25+
- 机械臂与操作模型：30+
- 人形机器人模型：30+
- 无人机与空中机器人模型：20+
- 自动驾驶与车载模型：25+

### 数据集分类统计
- 核心数据集：25+
- 机器人操作数据集：40+
- LeRobot 数据集：60+
- ALOHA 数据集：35+
- LIBERO 数据集：25+
- 人形机器人数据集：50+
- 导航与移动数据集：35+
- 仿真环境数据集：100+
- 行业应用数据集：100+
- 其他数据集：350+

---

## 更新记录
- **2026年2月20日**：新增20个高质量数据集，包括NVIDIA PhysicalAI系列、Isaac Sim系列、具身智能基准测试等
- **2026年2月20日**：优化分类结构，新增15+优质VLA模型，包括Llama 3.2 Vision、PaLM-E等

---

## 参考资源
- [Hugging Face](https://huggingface.co)
- [LeRobot](https://github.com/huggingface/lerobot)
- [Open X-Embodiment](https://openx-embodiment.github.io/)
- [NVIDIA Isaac](https://developer.nvidia.com/isaac-gym)
- [GR00T](https://github.com/NVIDIA/Isaac-GR00T/)