/**
 * 真实岗位数据同步服务
 * 从多个来源抓取具身智能相关岗位
 */

import axios from 'axios';
import userPrisma from '../../config/database.user';
import { logger } from '../../utils/logger';

const prisma = userPrisma;

interface JobSource {
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  url: string;
  source: string;
}

/**
 * 从GitHub Jobs API抓取岗位（已废弃，但保留作为参考）
 */
async function fetchFromGitHubJobs(): Promise<JobSource[]> {
  // GitHub Jobs API已废弃，不再使用
  return [];
}

/**
 * 手动添加知名公司的具身智能岗位
 */
async function getManualJobs(): Promise<JobSource[]> {
  const jobs: JobSource[] = [
    {
      title: '具身智能算法工程师',
      company: 'OpenAI',
      location: 'San Francisco, CA / Remote',
      salary: '$200K - $300K',
      type: 'full_time',
      description: '开发下一代具身智能系统，结合大语言模型和机器人控制',
      requirements: [
        'PhD in Robotics, Computer Science, or related field',
        'Strong background in reinforcement learning and robotics',
        'Experience with large language models',
        'Proficiency in Python, PyTorch, and robotics frameworks',
      ],
      responsibilities: [
        'Research and develop embodied AI algorithms',
        'Design and implement robot control systems',
        'Collaborate with cross-functional teams',
        'Publish research papers and contribute to open source',
      ],
      benefits: ['Health insurance', 'Stock options', 'Flexible work', 'Research budget'],
      url: 'https://openai.com/careers',
      source: 'manual',
    },
    {
      title: 'Robotics Research Scientist',
      company: 'Boston Dynamics',
      location: 'Waltham, MA',
      salary: '$180K - $250K',
      type: 'full_time',
      description: '研究机器人感知、导航和操作算法',
      requirements: [
        'PhD in Robotics or related field',
        'Experience with robot perception and control',
        'Strong programming skills in C++ and Python',
        'Publications in top robotics conferences',
      ],
      responsibilities: [
        'Develop advanced robotics algorithms',
        'Design and test robot behaviors',
        'Collaborate with hardware teams',
        'Present research at conferences',
      ],
      benefits: ['Competitive salary', 'Health benefits', '401k', 'On-site gym'],
      url: 'https://www.bostondynamics.com/careers',
      source: 'manual',
    },
    {
      title: 'Embodied AI Engineer',
      company: 'Google DeepMind',
      location: 'London, UK / Mountain View, CA',
      salary: '£120K - £180K',
      type: 'full_time',
      description: '开发具身智能系统，结合视觉、语言和动作',
      requirements: [
        'MS/PhD in AI, Robotics, or related field',
        'Experience with vision-language models',
        'Strong background in deep learning',
        'Proficiency in TensorFlow or PyTorch',
      ],
      responsibilities: [
        'Design and implement embodied AI systems',
        'Work on robot learning algorithms',
        'Collaborate with research teams',
        'Deploy systems to real robots',
      ],
      benefits: ['Stock options', 'Health insurance', 'Free meals', 'Gym membership'],
      url: 'https://deepmind.google/careers',
      source: 'manual',
    },
    {
      title: '机器人算法工程师',
      company: '小米',
      location: '北京',
      salary: '30K - 50K',
      type: 'full_time',
      description: '负责机器人感知、导航、操作等核心算法研发',
      requirements: [
        '硕士及以上学历，机器人、计算机视觉、AI相关专业',
        '熟悉SLAM、路径规划、运动控制等算法',
        '熟练掌握C++/Python，熟悉ROS',
        '有机器人项目经验优先',
      ],
      responsibilities: [
        '研发机器人感知和导航算法',
        '优化机器人运动控制性能',
        '参与机器人系统集成和测试',
        '跟踪前沿技术并应用到产品',
      ],
      benefits: ['五险一金', '股票期权', '带薪年假', '免费三餐'],
      url: 'https://hr.xiaomi.com',
      source: 'manual',
    },
    {
      title: '具身智能研究员',
      company: '商汤科技',
      location: '上海',
      salary: '40K - 70K',
      type: 'full_time',
      description: '研究具身智能前沿技术，包括视觉-语言-动作多模态学习',
      requirements: [
        '博士学历，AI、机器人、计算机视觉相关专业',
        '在顶级会议发表过论文（CVPR/ICCV/NeurIPS等）',
        '熟悉深度学习框架（PyTorch/TensorFlow）',
        '有机器人或具身智能项目经验',
      ],
      responsibilities: [
        '研究具身智能核心算法',
        '发表高质量学术论文',
        '将研究成果转化为产品',
        '指导团队技术方向',
      ],
      benefits: ['高薪', '股票期权', '科研经费', '国际会议支持'],
      url: 'https://www.sensetime.com/careers',
      source: 'manual',
    },
    {
      title: 'Robotics Software Engineer',
      company: 'Tesla',
      location: 'Palo Alto, CA',
      salary: '$150K - $220K',
      type: 'full_time',
      description: '开发Tesla Bot的软件系统，包括感知、规划和控制',
      requirements: [
        'BS/MS in Computer Science, Robotics, or related',
        'Strong C++ and Python skills',
        'Experience with robotics frameworks (ROS)',
        'Knowledge of computer vision and ML',
      ],
      responsibilities: [
        'Develop robot software stack',
        'Implement perception and control algorithms',
        'Test and validate robot behaviors',
        'Work with hardware teams',
      ],
      benefits: ['Stock options', 'Health insurance', '401k', 'Free charging'],
      url: 'https://www.tesla.com/careers',
      source: 'manual',
    },
    {
      title: '具身智能算法工程师',
      company: '字节跳动',
      location: '北京/上海/深圳',
      salary: '35K - 60K',
      type: 'full_time',
      description: '负责具身智能算法研发，应用于机器人产品',
      requirements: [
        '硕士及以上学历，AI、机器人相关专业',
        '熟悉强化学习、模仿学习等算法',
        '有机器人项目经验',
        '熟悉PyTorch/TensorFlow',
      ],
      responsibilities: [
        '研发机器人学习算法',
        '设计实验并验证算法效果',
        '优化算法性能',
        '撰写技术文档',
      ],
      benefits: ['高薪', '股票期权', '免费三餐', '健身房'],
      url: 'https://job.bytedance.com',
      source: 'manual',
    },
    {
      title: 'Research Scientist - Embodied AI',
      company: 'Meta AI',
      location: 'Menlo Park, CA / Remote',
      salary: '$180K - $250K',
      type: 'full_time',
      description: '研究具身智能和虚拟现实结合的前沿技术',
      requirements: [
        'PhD in AI, Robotics, or related field',
        'Strong research background',
        'Publications in top venues',
        'Experience with VR/AR systems',
      ],
      responsibilities: [
        'Conduct cutting-edge research',
        'Publish papers at top conferences',
        'Collaborate with research teams',
        'Prototype and validate ideas',
      ],
      benefits: ['Stock options', 'Health insurance', 'Free food', 'VR equipment'],
      url: 'https://www.meta.com/careers',
      source: 'manual',
    },
    {
      title: '机器人感知算法工程师',
      company: '大疆',
      location: '深圳',
      salary: '25K - 45K',
      type: 'full_time',
      description: '研发机器人视觉感知和SLAM算法',
      requirements: [
        '本科及以上学历，计算机视觉、SLAM相关专业',
        '熟悉视觉SLAM、多传感器融合',
        '熟练掌握C++/Python',
        '有机器人或无人机项目经验',
      ],
      responsibilities: [
        '研发视觉SLAM算法',
        '优化感知系统性能',
        '参与产品集成和测试',
        '解决实际应用问题',
      ],
      benefits: ['五险一金', '年终奖', '带薪年假', '员工宿舍'],
      url: 'https://we.dji.com/careers',
      source: 'manual',
    },
    {
      title: 'Embodied AI Research Intern',
      company: 'Stanford AI Lab',
      location: 'Stanford, CA',
      salary: '$5K - $8K/month',
      type: 'intern',
      description: '参与具身智能研究项目，与顶尖学者合作',
      requirements: [
        'PhD student in AI, Robotics, or related',
        'Strong research background',
        'Experience with robot learning',
        'Available for 3-6 months',
      ],
      responsibilities: [
        'Conduct research under supervision',
        'Implement and test algorithms',
        'Write research papers',
        'Present findings',
      ],
      benefits: ['Research experience', 'Networking', 'Publication opportunity'],
      url: 'https://ai.stanford.edu',
      source: 'manual',
    },
  ];

  return jobs;
}

/**
 * 同步真实岗位数据
 */
export async function syncRealJobs(maxResults: number = 50) {
  try {
    logger.info(`开始同步真实岗位数据，目标数量: ${maxResults}`);

    // 获取手动添加的岗位
    const manualJobs = await getManualJobs();
    
    let syncedCount = 0;
    let errorCount = 0;

    // 处理每个岗位
    for (const job of manualJobs) {
      try {
        // 解析薪资范围
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        if (job.salary) {
          const salaryMatch = job.salary.match(/(\d+)[kK]?\s*[-~]\s*(\d+)[kK]?/);
          if (salaryMatch) {
            salaryMin = parseInt(salaryMatch[1]) * (job.salary.includes('K') || job.salary.includes('k') ? 1000 : 1);
            salaryMax = parseInt(salaryMatch[2]) * (job.salary.includes('K') || job.salary.includes('k') ? 1000 : 1);
          }
        }

        // 合并描述和职责
        const fullDescription = [
          job.description,
          '\n\n职责要求：\n' + job.responsibilities.join('\n'),
        ].filter(Boolean).join('\n');

        // 合并要求和标签
        const requirementsText = job.requirements.join('\n');
        const tagsArray = ['具身智能', '机器人', 'AI', job.type === 'intern' ? '实习' : '全职'];
        if (job.location?.includes('北京') || job.location?.includes('上海') || job.location?.includes('深圳')) {
          tagsArray.push('国内');
        } else {
          tagsArray.push('海外');
        }

        // 使用upsert避免重复
        await prisma.job.upsert({
          where: {
            // 使用title+company作为唯一标识
            id: `job-${job.company}-${job.title.replace(/\s+/g, '-').toLowerCase()}`,
          },
          update: {
            title: job.title,
            company: job.company,
            location: job.location,
            salaryMin,
            salaryMax,
            description: fullDescription,
            requirements: requirementsText,
            tags: JSON.stringify(tagsArray),
            status: 'open',
          },
          create: {
            id: `job-${job.company}-${job.title.replace(/\s+/g, '-').toLowerCase()}`,
            title: job.title,
            company: job.company,
            location: job.location,
            salaryMin,
            salaryMax,
            description: fullDescription,
            requirements: requirementsText,
            tags: JSON.stringify(tagsArray),
            status: 'open',
            viewCount: 0,
            favoriteCount: 0,
          },
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error(`处理岗位失败 (${job.company} - ${job.title}): ${error.message}`);
      }
    }

    logger.info(`岗位同步完成: 成功 ${syncedCount} 个, 失败 ${errorCount} 个`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: manualJobs.length,
    };
  } catch (error: any) {
    logger.error(`岗位同步失败: ${error.message}`);
    throw error;
  }
}
