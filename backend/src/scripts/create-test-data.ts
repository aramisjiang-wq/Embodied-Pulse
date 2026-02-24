import userPrisma from '../config/database.user';

const TEST_PAPERS = [
  {
    arxivId: '2601.16215',
    title: 'High-resolution neutron diffraction determination of noncollinear antiferromagnetic order in the honeycomb magnetoelectric Fe$_{4}$Nb$_{2}$O$_{9}$',
    authors: JSON.stringify(['Raktim Datta', 'Kapil Kumar', 'S. L. Chaplot', 'S. K. Mishra']),
    abstract: 'We report high-resolution neutron diffraction studies of the honeycomb magnetoelectric Fe4Nb2O9, revealing a noncollinear antiferromagnetic order below TN = 89 K.',
    pdfUrl: 'https://arxiv.org/pdf/2601.16215.pdf',
    publishedDate: new Date('2026-01-20'),
    citationCount: 15,
    venue: 'Physical Review B',
    categories: JSON.stringify(['cond-mat.mtrl-sci', 'cond-mat.str-el']),
  },
  {
    arxivId: '2601.16216',
    title: 'Embodied AI: A Comprehensive Survey of Robotics and Machine Learning Integration',
    authors: JSON.stringify(['John Smith', 'Jane Doe', 'Michael Brown']),
    abstract: 'This paper provides a comprehensive survey of embodied artificial intelligence, focusing on the integration of robotics and machine learning systems.',
    pdfUrl: 'https://arxiv.org/pdf/2601.16216.pdf',
    publishedDate: new Date('2026-01-19'),
    citationCount: 42,
    venue: 'arXiv preprint',
    categories: JSON.stringify(['cs.RO', 'cs.AI', 'cs.LG']),
  },
  {
    arxivId: '2601.16208',
    title: 'Vision-Language Models for Embodied Intelligence: A Review',
    authors: JSON.stringify(['Alice Wang', 'Bob Chen', 'Carol Liu']),
    abstract: 'We review recent advances in vision-language models and their applications to embodied intelligence tasks such as robotic manipulation and navigation.',
    pdfUrl: 'https://arxiv.org/pdf/2601.16208.pdf',
    publishedDate: new Date('2026-01-18'),
    citationCount: 28,
    venue: 'CVPR 2025',
    categories: JSON.stringify(['cs.CV', 'cs.RO', 'cs.AI']),
  },
  {
    arxivId: '2601.16202',
    title: 'Sim-to-Real Transfer Learning for Robotic Grasping',
    authors: JSON.stringify(['David Lee', 'Emma Wilson', 'Frank Miller']),
    abstract: 'This work presents a novel approach for sim-to-real transfer learning in robotic grasping tasks, achieving state-of-the-art performance.',
    pdfUrl: 'https://arxiv.org/pdf/2601.16202.pdf',
    publishedDate: new Date('2026-01-17'),
    citationCount: 35,
    venue: 'ICRA 2025',
    categories: JSON.stringify(['cs.RO', 'cs.LG', 'cs.AI']),
  },
  {
    arxivId: '2601.16195',
    title: 'Multi-Modal Learning for Embodied Agents',
    authors: JSON.stringify(['Grace Kim', 'Henry Park', 'Iris Johnson']),
    abstract: 'We propose a multi-modal learning framework for embodied agents that integrates vision, language, and action representations.',
    pdfUrl: 'https://arxiv.org/pdf/2601.16195.pdf',
    publishedDate: new Date('2026-01-16'),
    citationCount: 19,
    venue: 'NeurIPS 2025',
    categories: JSON.stringify(['cs.AI', 'cs.LG', 'cs.CV']),
  },
];

const TEST_REPOS = [
  {
    repo_id: String(123456789),
    name: 'gym',
    fullName: 'openai/gym',
    owner: 'openai',
    description: 'A toolkit for developing and comparing reinforcement learning algorithms.',
    language: 'Python',
    stars_count: 34567,
    forks_count: 8901,
    issues_count: 234,
    topics: JSON.stringify(['reinforcement-learning', 'machine-learning', 'ai']),
    created_date: new Date('2016-04-27'),
    updated_date: new Date('2024-01-15'),
  },
  {
    repo_id: String(987654321),
    name: 'tensorflow',
    fullName: 'tensorflow/tensorflow',
    owner: 'tensorflow',
    description: 'An Open Source Machine Learning Framework for Everyone',
    language: 'C++',
    stars_count: 182345,
    forks_count: 89765,
    issues_count: 4567,
    topics: JSON.stringify(['machine-learning', 'deep-learning', 'tensorflow']),
    created_date: new Date('2015-11-09'),
    updated_date: new Date('2024-01-14'),
  },
  {
    repo_id: String(456789123),
    name: 'pytorch',
    fullName: 'pytorch/pytorch',
    owner: 'pytorch',
    description: 'Tensors and Dynamic neural networks in Python with strong GPU acceleration',
    language: 'Python',
    stars_count: 78901,
    forks_count: 23456,
    issues_count: 1234,
    topics: JSON.stringify(['deep-learning', 'pytorch', 'machine-learning']),
    created_date: new Date('2016-09-01'),
    updated_date: new Date('2024-01-13'),
  },
  {
    repoId: String(789012345),
    fullName: 'huggingface/transformers',
    name: 'transformers',
    owner: 'huggingface',
    description: 'Transformers: State-of-the-art Machine Learning for Jax, PyTorch and TensorFlow',
    language: 'Python',
    starsCount: 145678,
    forksCount: 34567,
    issuesCount: 3456,
    topics: JSON.stringify(['nlp', 'transformers', 'pytorch', 'tensorflow']),
    createdDate: new Date('2019-02-01'),
    updatedDate: new Date('2024-01-12'),
  },
  {
    repoId: String(234567890),
    fullName: 'microsoft/semantic-kernel',
    name: 'semantic-kernel',
    owner: 'microsoft',
    description: 'Integrate cutting-edge LLM technology quickly and easily into your apps',
    language: 'C#',
    starsCount: 23456,
    forksCount: 4567,
    issuesCount: 234,
    topics: JSON.stringify(['llm', 'ai', 'csharp', 'semantic-kernel']),
    createdDate: new Date('2023-02-28'),
    updatedDate: new Date('2024-01-11'),
  },
];

const TEST_JOBS = [
  {
    title: 'Senior Robotics Engineer - Embodied AI',
    company: 'TechCorp AI',
    companyLogo: 'https://example.com/logo.png',
    location: 'San Francisco, CA',
    salaryMin: 150000,
    salaryMax: 200000,
    experience: '5+ years',
    education: 'PhD preferred',
    description: 'We are looking for a senior robotics engineer to work on embodied AI projects including robotic manipulation and navigation.',
    requirements: 'Experience with ROS, Python, C++, and machine learning frameworks.',
    benefits: 'Competitive salary, equity, remote work options',
    applyUrl: 'https://example.com/apply/123',
    tags: JSON.stringify(['robotics', 'embodied-ai', 'machine-learning']),
    status: 'open',
  },
  {
    title: 'Machine Learning Engineer - Computer Vision',
    company: 'VisionAI Labs',
    companyLogo: 'https://example.com/logo2.png',
    location: 'New York, NY',
    salaryMin: 120000,
    salaryMax: 160000,
    experience: '3+ years',
    education: 'Masters or PhD',
    description: 'Join our team to develop cutting-edge computer vision systems for robotic applications.',
    requirements: 'Strong background in deep learning, computer vision, and PyTorch.',
    benefits: 'Health insurance, 401k, flexible hours',
    applyUrl: 'https://example.com/apply/456',
    tags: JSON.stringify(['computer-vision', 'deep-learning', 'pytorch']),
    status: 'open',
  },
  {
    title: 'Research Scientist - Embodied Intelligence',
    company: 'DeepMind Research',
    companyLogo: 'https://example.com/logo3.png',
    location: 'London, UK',
    salaryMin: 180000,
    salaryMax: 250000,
    experience: '3+ years',
    education: 'PhD required',
    description: 'Conduct research on embodied intelligence, focusing on sim-to-real transfer and multi-modal learning.',
    requirements: 'Strong publication record, experience with reinforcement learning and robotics.',
    benefits: 'Competitive salary, research resources, conference attendance',
    applyUrl: 'https://example.com/apply/789',
    tags: JSON.stringify(['research', 'reinforcement-learning', 'robotics']),
    status: 'open',
  },
  {
    title: 'AI Engineer - Autonomous Systems',
    company: 'AutoTech Inc',
    companyLogo: 'https://example.com/logo4.png',
    location: 'Seattle, WA',
    salaryMin: 140000,
    salaryMax: 190000,
    experience: '4+ years',
    education: 'Bachelors or Masters',
    description: 'Develop AI systems for autonomous vehicles and robotic platforms.',
    requirements: 'Experience with autonomous systems, computer vision, and control theory.',
    benefits: 'Stock options, health benefits, remote work',
    applyUrl: 'https://example.com/apply/012',
    tags: JSON.stringify(['autonomous-systems', 'ai', 'robotics']),
    status: 'open',
  },
  {
    title: 'Robotics Software Engineer',
    company: 'RobotX Solutions',
    companyLogo: 'https://example.com/logo5.png',
    location: 'Boston, MA',
    salaryMin: 130000,
    salaryMax: 170000,
    experience: '3+ years',
    education: 'Masters preferred',
    description: 'Design and implement software for robotic systems, including perception, planning, and control.',
    requirements: 'Proficiency in ROS, C++, Python, and robotic simulation tools.',
    benefits: 'Competitive salary, professional development, flexible work',
    applyUrl: 'https://example.com/apply/345',
    tags: JSON.stringify(['ros', 'robotics', 'software-engineering']),
    status: 'open',
  },
];

async function main() {
  try {
    console.log('开始创建测试数据...\n');

    let papersCreated = 0;
    let reposCreated = 0;
    let jobsCreated = 0;

    for (const paper of TEST_PAPERS) {
      try {
        await userPrisma.paper.create({ data: paper });
        papersCreated++;
        console.log(`✓ 创建论文: ${paper.title.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`- 跳过已存在: ${paper.arxivId}`);
        } else {
          console.error(`✗ 创建失败: ${paper.arxivId}`, error.message);
        }
      }
    }

    for (const repo of TEST_REPOS) {
      try {
        await userPrisma.githubRepo.create({ data: repo as any });
        reposCreated++;
        console.log(`✓ 创建仓库: ${repo.fullName}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`- 跳过已存在: ${repo.fullName}`);
        } else {
          console.error(`✗ 创建失败: ${repo.fullName}`, error.message);
        }
      }
    }

    for (const job of TEST_JOBS) {
      try {
        await userPrisma.job.create({ data: job });
        jobsCreated++;
        console.log(`✓ 创建岗位: ${job.title.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`- 跳过已存在: ${job.title}`);
        } else {
          console.error(`✗ 创建失败: ${job.title}`, error.message);
        }
      }
    }

    console.log(`\n完成！`);
    console.log(`论文: ${papersCreated}个`);
    console.log(`GitHub仓库: ${reposCreated}个`);
    console.log(`岗位: ${jobsCreated}个`);
  } catch (error) {
    console.error('创建失败:', error);
  } finally {
    await userPrisma.$disconnect();
  }
}

main();
