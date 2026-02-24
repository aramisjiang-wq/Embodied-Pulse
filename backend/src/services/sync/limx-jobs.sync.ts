/**
 * 逐际动力（LimX Dynamics）招聘岗位同步
 * 来源: https://career.limxdynamics.com/
 * 共 38 个岗位
 */

import { logger } from '../../utils/logger';
import userPrisma from '../../config/database.user';

const prisma = userPrisma;

const LIMX_CAREER_URL = 'https://career.limxdynamics.com/';
const COMPANY = '逐际动力';

export interface SyncLimXJobsResult {
  success: boolean;
  synced: number;
  errors: number;
  total: number;
  message?: string;
}

/** 逐际动力 38 个岗位静态数据（来自官网 career.limxdynamics.com），含岗位描述摘要 */
const LIMX_JOBS: Array<{
  title: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  experience?: string;
  /** 岗位描述摘要，用于卡片展示 */
  summary?: string;
}> = [
  { title: '大模型-具身智能算法工程师', location: '北京', salaryMin: 25, salaryMax: 50, experience: '3-5年', summary: '负责大模型与具身智能算法研发与落地' },
  { title: '人形机器人智能体算法工程师', location: '深圳', salaryMin: 30, salaryMax: 60, experience: '3-5年', summary: '人形机器人智能体与决策算法研发' },
  { title: '机器人感知算法工程师', location: '深圳', salaryMin: 30, salaryMax: 50, experience: '2-5年', summary: '视觉/多模态感知算法，支撑机器人操作与导航' },
  { title: '机器人运控算法工程师', location: '深圳', salaryMin: 25, salaryMax: 40, experience: '2-4年', summary: '机械臂/人形运控与轨迹规划' },
  { title: '机器人强化学习工程师', location: '深圳', salaryMin: 25, salaryMax: 50, experience: '2-5年', summary: '强化学习策略训练与仿真到真机迁移' },
  { title: '具身大模型算法工程师', location: '北京/深圳', salaryMin: 30, salaryMax: 60, experience: '2-5年', summary: '具身大模型与 VLA 方向算法' },
  { title: 'RLHF/数据算法工程师', location: '北京/深圳', salaryMin: 25, salaryMax: 50, experience: '2-4年', summary: 'RLHF 与高质量具身数据 pipeline' },
  { title: '人形全身控制算法工程师', location: '深圳', salaryMin: 30, salaryMax: 55, experience: '3-5年', summary: '人形全身运动控制与步态' },
  { title: '机器人软件开发工程师', location: '深圳', salaryMin: 20, salaryMax: 40, experience: '2-4年', summary: '机器人中间件、通信与系统开发' },
  { title: 'Python后端工程师', location: '北京/深圳', salaryMin: 20, salaryMax: 40, experience: '2-4年', summary: '训练/数据/评测后端服务' },
  { title: '后端开发工程师', location: '深圳', salaryMin: 20, salaryMax: 40, experience: '2-4年', summary: '云平台与后端系统开发' },
  { title: '前端开发工程师', location: '深圳', salaryMin: 18, salaryMax: 35, experience: '2-4年', summary: '数据标注、仿真与调试前端' },
  { title: 'AI软件工程师', location: '北京/深圳', salaryMin: 25, salaryMax: 50, experience: '2-5年', summary: '模型训练/推理与工具链' },
  { title: '硬件工程师', location: '深圳', salaryMin: 20, salaryMax: 40, experience: '2-5年', summary: '电机、传感器与整机硬件' },
  { title: '嵌入式硬件开发工程师', location: '深圳', salaryMin: 18, salaryMax: 35, experience: '2-4年', summary: '嵌入式硬件与原理图/PCB' },
  { title: '嵌入式软件开发工程师', location: '深圳', salaryMin: 18, salaryMax: 35, experience: '2-4年', summary: '嵌入式驱动与实时系统' },
  { title: 'Linux BSP工程师', location: '深圳', salaryMin: 20, salaryMax: 40, experience: '3-5年', summary: 'Linux BSP 与板级支持' },
  { title: '机器人结构专家', location: '深圳', salaryMin: 40, salaryMax: 70, experience: '5年以上', summary: '人形/机械臂结构设计与量产' },
  { title: '机械结构设计工程师', location: '深圳', salaryMin: 20, salaryMax: 40, experience: '2-5年', summary: '机械结构设计与仿真' },
  { title: 'NPI工程师', location: '深圳', salaryMin: 12, salaryMax: 24, experience: '2-4年', summary: '新产品导入与试产' },
  { title: '产品经理', location: '北京/深圳', salaryMin: 25, salaryMax: 45, experience: '3-5年', summary: '机器人/具身智能产品规划' },
  { title: '机器人感知算法实习生', location: '深圳', description: '300-600元/天', experience: '应届', summary: '参与视觉/多模态感知算法研发' },
  { title: '具身智能前沿算法实习生', location: '北京', description: '300-500元/天', experience: '应届', summary: '具身大模型/RL 方向研究与实现' },
  { title: '大模型交互技术开发实习生', location: '北京', description: '300-600元/天', experience: '应届', summary: '大模型与机器人交互系统开发' },
  { title: '软件产品实习生', location: '深圳', description: '200-400元/天', experience: '应届', summary: '产品与工具链功能开发' },
  { title: '强化学习算法实习生', location: '深圳', description: '300-500元/天', experience: '应届', summary: '强化学习策略与仿真' },
  { title: '运控算法实习生', location: '深圳', description: '300-500元/天', experience: '应届', summary: '运控与轨迹规划算法' },
  { title: 'HR', location: '深圳', salaryMin: 10, salaryMax: 15, experience: '2-4年', summary: '招聘与人才运营' },
  { title: '财务主管', location: '深圳', salaryMin: 15, salaryMax: 25, experience: '3-5年', summary: '财务核算与预算管理' },
  { title: '往来会计', location: '深圳', salaryMin: 8, salaryMax: 12, experience: '2-4年', summary: '往来与日常核算' },
  { title: '测试工程师', location: '深圳', salaryMin: 15, salaryMax: 30, experience: '2-4年', summary: '机器人系统与算法测试' },
  { title: '系统集成工程师', location: '深圳', salaryMin: 18, salaryMax: 35, experience: '2-4年', summary: '整机集成与联调' },
  { title: '仿真工程师', location: '深圳', salaryMin: 20, salaryMax: 40, experience: '2-5年', summary: '仿真环境与物理引擎' },
  { title: 'SLAM算法工程师', location: '深圳', salaryMin: 25, salaryMax: 50, experience: '2-5年', summary: 'SLAM 与建图定位' },
  { title: '多模态算法工程师', location: '北京/深圳', salaryMin: 28, salaryMax: 55, experience: '2-5年', summary: '多模态理解与具身决策' },
  { title: '机器人规划算法工程师', location: '深圳', salaryMin: 25, salaryMax: 45, experience: '2-4年', summary: '运动规划与碰撞检测' },
  { title: '电气工程师', location: '深圳', salaryMin: 18, salaryMax: 35, experience: '2-4年', summary: '电气与线束设计' },
  { title: '项目管理', location: '深圳', salaryMin: 20, salaryMax: 35, experience: '3-5年', summary: '研发项目管理与交付' },
  { title: '供应链工程师', location: '深圳', salaryMin: 15, salaryMax: 28, experience: '2-4年', summary: '供应商与物料管理' },
];

export async function syncLimXJobs(): Promise<SyncLimXJobsResult> {
  try {
    logger.info('开始同步逐际动力岗位...');
    const total = LIMX_JOBS.length;
    let successCount = 0;

    for (const row of LIMX_JOBS) {
      try {
        const descParts: string[] = [];
        if (row.summary) descParts.push(row.summary);
        if (row.description) descParts.push(row.description);
        descParts.push(`岗位类型: ${row.description ? '全职/实习' : '全职'}`);
        descParts.push(`申请链接: ${LIMX_CAREER_URL}`);
        const description = descParts.join('\n\n');
        const salaryMin = row.salaryMin ?? null;
        const salaryMax = row.salaryMax ?? null;

        const existing = await prisma.job.findFirst({
          where: {
            title: row.title,
            company: COMPANY,
          },
        });

        if (existing) {
          await prisma.job.update({
            where: { id: existing.id },
            data: {
              location: row.location,
              salaryMin,
              salaryMax,
              description,
              experience: row.experience ?? undefined,
              status: 'open',
              updatedAt: new Date(),
              applyUrl: LIMX_CAREER_URL,
            },
          });
        } else {
          await prisma.job.create({
            data: {
              title: row.title,
              company: COMPANY,
              location: row.location,
              salaryMin,
              salaryMax,
              description,
              requirements: '详见官网职位描述',
              status: 'open',
              viewCount: 0,
              favoriteCount: 0,
              experience: row.experience ?? undefined,
              applyUrl: LIMX_CAREER_URL,
            },
          });
        }
        successCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`逐际动力岗位入库失败: ${row.title}`, { message: msg });
      }
    }

    logger.info(`逐际动力岗位同步完成: 成功 ${successCount}/${total}`);
    return {
      success: true,
      synced: successCount,
      errors: total - successCount,
      total,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('逐际动力岗位同步失败', { message });
    return {
      success: false,
      synced: 0,
      errors: LIMX_JOBS.length,
      total: LIMX_JOBS.length,
      message: `逐际动力岗位同步失败: ${message}`,
    };
  }
}
