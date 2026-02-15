/**
 * 数据库种子数据
 * 用于初始化开发环境数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // 创建超级管理员
  const adminUser = await prisma.user.upsert({
    where: { username: 'limx' },
    update: {},
    create: {
      username: 'limx',
      email: 'limx-admin@embodiedpulse.com',
      passwordHash: '$2a$10$Bo1W1FDHrQ6El8QAe/1WgON/6kR.Ep5/7neecIscSkLuPrQFMOfUq', // limx123456
      level: 10,
      points: 0,
      bio: '超级管理员',
    },
  });
  console.log('✓ 创建超级管理员:', adminUser.username, '(', adminUser.email, ')');

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: '$2a$10$YourHashedPasswordHere', // bcrypt hash of 'password123'
      level: 1,
      points: 0,
    },
  });
  console.log('✓ 创建测试用户:', testUser.username);

  // 创建示例论文
  const papers = await Promise.all([
    prisma.paper.create({
      data: {
        title: 'Embodied AI: A Survey of Recent Advances',
        authors: JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']),
        abstract: 'This paper presents a comprehensive survey of recent advances in embodied artificial intelligence...',
        arxivId: '2401.00001',
        publishedDate: new Date('2024-01-15'),
        citationCount: 150,
        venue: 'ICRA 2024',
        categories: JSON.stringify(['cs.RO', 'cs.AI']),
        viewCount: 1200,
        favoriteCount: 230,
        shareCount: 45,
      },
    }),
    prisma.paper.create({
      data: {
        title: 'Deep Reinforcement Learning for Robot Manipulation',
        authors: JSON.stringify(['Alice Chen', 'David Lee']),
        abstract: 'We propose a novel deep reinforcement learning approach for robot manipulation tasks...',
        arxivId: '2401.00002',
        publishedDate: new Date('2024-01-10'),
        citationCount: 85,
        venue: 'IROS 2024',
        categories: JSON.stringify(['cs.RO', 'cs.LG']),
        viewCount: 800,
        favoriteCount: 150,
        shareCount: 30,
      },
    }),
    prisma.paper.create({
      data: {
        title: 'Vision-Language Models for Robotics',
        authors: JSON.stringify(['Sarah Wilson', 'Mike Brown']),
        abstract: 'This work explores the application of vision-language models in robotics...',
        publishedDate: new Date('2024-01-05'),
        citationCount: 120,
        venue: 'CoRL 2024',
        categories: JSON.stringify(['cs.RO', 'cs.CV']),
        viewCount: 950,
        favoriteCount: 180,
        shareCount: 25,
      },
    }),
  ]);
  console.log(`✓ 创建 ${papers.length} 篇示例论文`);

  // 创建示例视频
  const videos = await Promise.all([
    prisma.video.create({
      data: {
        platform: 'bilibili',
        videoId: 'BV1xx411c7mD',
        title: '具身智能入门教程 - 第1集',
        description: '这是一个具身智能的入门教程系列...',
        coverUrl: 'https://via.placeholder.com/320x180',
        duration: 1234,
        uploader: 'AI学习者',
        uploaderId: 'UP123456',
        publishedDate: new Date('2024-01-12'),
        playCount: 50000,
        likeCount: 2300,
        viewCount: 1500,
        favoriteCount: 800,
        tags: JSON.stringify(['教程', '入门', '机器人']),
      },
    }),
    prisma.video.create({
      data: {
        platform: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        title: 'Robot Learning Demo - Stanford',
        description: 'Demo of our latest robot learning system...',
        coverUrl: 'https://via.placeholder.com/320x180',
        duration: 856,
        uploader: 'Stanford AI Lab',
        publishedDate: new Date('2024-01-08'),
        playCount: 120000,
        likeCount: 5600,
        viewCount: 2000,
        favoriteCount: 1200,
        tags: JSON.stringify(['demo', 'research']),
      },
    }),
  ]);
  console.log(`✓ 创建 ${videos.length} 个示例视频`);

  // 创建示例Banner
  const banners = await Promise.all([
    prisma.banner.create({
      data: {
        title: '具身智能精选内容',
        imageUrl: 'https://via.placeholder.com/1200x400',
        linkUrl: '/',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.banner.create({
      data: {
        title: 'HuggingFace模型专区',
        imageUrl: 'https://via.placeholder.com/1200x400',
        linkUrl: '/huggingface',
        sortOrder: 2,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ 创建 ${banners.length} 个示例Banner`);

  // 创建示例GitHub项目
  const repos = await Promise.all([
    prisma.githubRepo.create({
      data: {
        repoId: BigInt(123456789),
        fullName: 'example/embodied-ai-toolkit',
        name: 'embodied-ai-toolkit',
        description: 'A comprehensive toolkit for embodied AI research',
        owner: 'example',
        language: 'Python',
        starsCount: 1200,
        forksCount: 350,
        issuesCount: 45,
        topics: JSON.stringify(['robotics', 'ai', 'pytorch']),
        createdDate: new Date('2023-06-15'),
        updatedDate: new Date('2024-01-14'),
        viewCount: 800,
        favoriteCount: 200,
      },
    }),
    prisma.githubRepo.create({
      data: {
        repoId: BigInt(987654321),
        fullName: 'ai-lab/robot-learning',
        name: 'robot-learning',
        description: 'State-of-the-art robot learning algorithms',
        owner: 'ai-lab',
        language: 'Python',
        starsCount: 3500,
        forksCount: 890,
        issuesCount: 120,
        topics: JSON.stringify(['reinforcement-learning', 'robotics']),
        createdDate: new Date('2022-03-20'),
        updatedDate: new Date('2024-01-13'),
        viewCount: 1500,
        favoriteCount: 450,
      },
    }),
  ]);
  console.log(`✓ 创建 ${repos.length} 个示例GitHub项目`);

  // 创建示例Hugging Face模型
  const hfModels = await Promise.all([
    prisma.huggingFaceModel.create({
      data: {
        hfId: 'openai/whisper-large-v3',
        fullName: 'openai/whisper-large-v3',
        name: 'whisper-large-v3',
        author: 'openai',
        description: 'A large-scale speech recognition model optimized for accuracy.',
        license: 'Apache-2.0',
        task: 'speech-recognition',
        tags: JSON.stringify(['asr', 'speech', 'whisper']),
        downloads: 520000,
        likes: 9800,
        viewCount: 1500,
        favoriteCount: 320,
        shareCount: 45,
        lastModified: new Date('2024-01-12'),
      },
    }),
    prisma.huggingFaceModel.create({
      data: {
        hfId: 'meta-llama/Meta-Llama-3-8B-Instruct',
        fullName: 'meta-llama/Meta-Llama-3-8B-Instruct',
        name: 'Meta-Llama-3-8B-Instruct',
        author: 'meta-llama',
        description: 'Llama 3 8B instruction-tuned model.',
        license: 'custom',
        task: 'text-generation',
        tags: JSON.stringify(['llm', 'instruct', 'chat']),
        downloads: 860000,
        likes: 14200,
        viewCount: 2100,
        favoriteCount: 520,
        shareCount: 90,
        lastModified: new Date('2024-01-10'),
      },
    }),
  ]);
  console.log(`✓ 创建 ${hfModels.length} 个示例HuggingFace模型`);

  // 创建示例岗位
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: '具身智能算法工程师',
        company: 'AI创新科技',
        companyLogo: 'https://via.placeholder.com/100',
        location: '北京·海淀',
        salaryMin: 30,
        salaryMax: 50,
        experience: '3-5年',
        education: '本科及以上',
        description: '负责具身智能算法的研发和优化...',
        requirements: '1. 熟悉深度学习和强化学习\n2. 有机器人相关经验\n3. 熟练使用PyTorch',
        benefits: '五险一金、弹性工作、年终奖',
        tags: JSON.stringify(['深度学习', '机器人', 'Python']),
        status: 'open',
        viewCount: 520,
        favoriteCount: 85,
        applyCount: 12,
      },
    }),
    prisma.job.create({
      data: {
        title: '机器人视觉研究员',
        company: '智能机器人实验室',
        location: '上海·浦东',
        salaryMin: 25,
        salaryMax: 40,
        experience: '2-4年',
        education: '硕士及以上',
        description: '从事机器人视觉感知算法研究...',
        requirements: '1. 计算机视觉背景\n2. 熟悉OpenCV、PCL\n3. 有SLAM经验优先',
        tags: JSON.stringify(['计算机视觉', 'SLAM', 'C++']),
        status: 'open',
        viewCount: 380,
        favoriteCount: 60,
        applyCount: 8,
      },
    }),
  ]);
  console.log(`✓ 创建 ${jobs.length} 个示例岗位`);

  // 创建示例帖子
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: testUser.id,
        contentType: 'discussion',
        title: '大家都在用什么机器人仿真平台?',
        content: '最近在做机器人仿真,想了解一下大家都在用什么平台? Gazebo还是PyBullet? 或者有其他推荐吗?',
        tags: JSON.stringify(['仿真', '机器人', '讨论']),
        viewCount: 250,
        likeCount: 15,
        commentCount: 8,
        shareCount: 3,
      },
    }),
    prisma.post.create({
      data: {
        userId: testUser.id,
        contentType: 'experience',
        title: '分享一下我的强化学习踩坑经验',
        content: '最近在做机器人的强化学习训练,遇到了一些问题,总结了一些经验分享给大家...',
        tags: JSON.stringify(['强化学习', '经验分享']),
        viewCount: 180,
        likeCount: 22,
        commentCount: 5,
        shareCount: 7,
      },
    }),
  ]);
  console.log(`✓ 创建 ${posts.length} 个示例帖子`);

  console.log('✅ 种子数据初始化完成!');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
