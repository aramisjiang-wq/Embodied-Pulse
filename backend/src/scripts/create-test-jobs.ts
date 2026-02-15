import userPrisma from '../config/database.user';

const TEST_JOBS = [
  {
    title: '高级机器学习工程师',
    company: '北京智谱AI科技有限公司',
    location: '北京',
    salaryMin: 30000,
    salaryMax: 50000,
    description: '我们正在寻找经验丰富的高级机器学习工程师，加入我们的具身智能研究团队。您将负责设计和实现先进的机器学习模型，推动具身智能技术的发展。',
    requirements: '• 5年以上机器学习或深度学习相关工作经验\n• 精通PyTorch或TensorFlow\n• 有大规模模型训练经验者优先\n• 发表过顶级会议论文者优先',
    status: 'open',
  },
  {
    title: '具身智能算法研究员',
    company: '上海人工智能实验室',
    location: '上海',
    salaryMin: 40000,
    salaryMax: 80000,
    description: '加入我们的具身智能算法研究团队，开展前沿的机器人感知、规划和控制算法研究。您将与世界顶尖的研究人员合作，推动具身智能领域的技术突破。',
    requirements: '• 博士学位，计算机科学、人工智能或相关专业\n• 在机器人学、强化学习或计算机视觉领域有深入研究\n• 有机器人系统开发经验者优先\n• 优秀的英文读写能力',
    status: 'open',
  },
  {
    title: '前端开发工程师（AI产品）',
    company: '深圳商汤科技有限公司',
    location: '深圳',
    salaryMin: 20000,
    salaryMax: 40000,
    description: '我们正在寻找有热情的前端开发工程师，参与AI产品的开发工作。您将负责构建高质量的用户界面，为AI研究成果提供优秀的产品展示平台。',
    requirements: '• 3年以上前端开发经验\n• 精通React或Vue框架\n• 有数据可视化或大屏展示开发经验者优先\n• 对AI技术有浓厚兴趣',
    status: 'open',
  },
  {
    title: '后端开发工程师',
    company: '杭州阿里云智能',
    location: '杭州',
    salaryMin: 25000,
    salaryMax: 45000,
    description: '加入阿里云智能团队，参与大规模AI服务平台的后端开发。您将负责设计高可用、高性能的后端系统，支持各类AI应用的部署和运行。',
    requirements: '• 3年以上后端开发经验\n• 精通Node.js、Python或Go语言\n• 有分布式系统或云计算经验者优先\n• 熟悉Kubernetes和微服务架构',
    status: 'open',
  },
  {
    title: '机器人控制工程师',
    company: '东莞大疆创新',
    location: '东莞',
    salaryMin: 25000,
    salaryMax: 50000,
    description: '参与下一代智能机器人的控制系统开发。您将负责机器人运动控制、路径规划和自主导航算法的研发工作。',
    requirements: '• 3年以上机器人控制开发经验\n• 精通C++和ROS机器人操作系统\n• 有电机控制和传感器融合经验者优先\n• 机械工程或自动化专业背景',
    status: 'open',
  },
  {
    title: '数据工程师',
    company: '广州云从科技',
    location: '广州',
    salaryMin: 18000,
    salaryMax: 35000,
    description: '加入数据工程团队，负责AI训练数据的采集、清洗和管理。您将构建高效的数据管道，支持各类AI模型的训练需求。',
    requirements: '• 2年以上数据工程经验\n• 精通SQL和Python数据处理\n• 有大数据平台（Spark、Hadoop）经验者优先\n• 熟悉数据标注和质量控制流程',
    status: 'open',
  },
  {
    title: 'CV算法工程师（3D视觉）',
    company: '北京旷视科技',
    location: '北京',
    salaryMin: 30000,
    salaryMax: 60000,
    description: '参与3D视觉算法的研发工作，为智能机器人提供环境感知能力。您将负责立体视觉、点云处理和三维重建等算法的开发。',
    requirements: '• 3年以上计算机视觉算法开发经验\n• 精通C++和OpenCV\n• 有3D视觉或SLAM经验者优先\n• 扎实的数学基础（线性代数、几何）',
    status: 'open',
  },
  {
    title: 'NLP算法工程师',
    company: '北京百川智能',
    location: '北京',
    salaryMin: 35000,
    salaryMax: 70000,
    description: '加入NLP团队，参与大语言模型的研发和优化工作。您将负责模型训练、微调和推理优化，提升模型的性能和用户体验。',
    requirements: '• 3年以上NLP算法经验\n• 精通Transformer架构和预训练模型\n• 有大模型训练或推理优化经验者优先\n• 熟悉PyTorch和分布式训练',
    status: 'open',
  },
  {
    title: '嵌入式软件工程师',
    company: '成都纵横自动化',
    location: '成都',
    salaryMin: 20000,
    salaryMax: 40000,
    description: '参与智能硬件产品的嵌入式软件开发。您将负责在资源受限的嵌入式平台上实现AI算法，实现边缘智能。',
    requirements: '• 3年以上嵌入式开发经验\n• 精通C/C++和RTOS系统\n• 有AI模型部署（TensorFlow Lite、ONNX）经验者优先\n• 熟悉ARM架构和嵌入式Linux',
    status: 'open',
  },
  {
    title: '产品经理（AI方向）',
    company: '上海依图科技',
    location: '上海',
    salaryMin: 25000,
    salaryMax: 50000,
    description: '加入AI产品团队，负责智能产品的规划和设计。您需要深入理解AI技术能力，将其转化为优秀的产品方案。',
    requirements: '• 3年以上产品经理经验\n• 有AI或技术类产品经验者优先\n• 优秀的需求分析和产品设计能力\n• 良好的跨团队协作和沟通能力',
    status: 'open',
  },
];

async function main() {
  try {
    console.log('开始创建测试Jobs数据...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const jobData of TEST_JOBS) {
      try {
        await userPrisma.job.create({
          data: jobData,
        });
        createdCount++;
        console.log(`✓ 创建职位: ${jobData.title} @ ${jobData.company}`);
      } catch (error: any) {
        console.error(`✗ 创建失败: ${jobData.title}`, error.message);
      }
    }

    console.log(`\n完成！`);
    console.log(`创建: ${createdCount}个职位`);
    console.log(`跳过: ${skippedCount}个`);
    console.log(`总计: ${TEST_JOBS.length}个`);
  } catch (error) {
    console.error('创建失败:', error);
  }
}

main();
