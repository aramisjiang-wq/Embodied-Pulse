const { PrismaClient } = require('../../node_modules/.prisma/client-user');
const bcrypt = require('bcryptjs');

const userPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.USER_DATABASE_URL || 'file:./prisma/prisma/dev.db',
    },
  },
});

async function generateTestData() {
  console.log('开始生成测试数据...');

  try {
    let userCount = 0;
    let paperCount = 0;
    let repoCount = 0;
    let videoCount = 0;
    let postCount = 0;
    let commentCount = 0;

    console.log('检查数据库连接...');
    await userPrisma.$connect();
    console.log('数据库连接成功');

    for (let i = 1; i <= 100; i++) {
      const passwordHash = await bcrypt.hash('Test@123456', 10);

      try {
        const user = await userPrisma.user.create({
          data: {
            userNumber: `TEST${String(i).padStart(4, '0')}`,
            username: `testuser${i}`,
            email: `testuser${i}@example.com`,
            passwordHash,
            level: Math.floor(Math.random() * 5) + 1,
            points: Math.floor(Math.random() * 1000),
            isVip: Math.random() > 0.9,
            isActive: true,
          },
        });

        userCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`用户 testuser${i} 已存在，跳过`);
        } else {
          throw error;
        }
      }

      if (i % 10 === 0) {
        console.log(`已生成 ${userCount} 个测试用户`);
      }
    }

    console.log('✅ 生成100个测试用户');

    const languages = ['Python', 'JavaScript', 'TypeScript', 'C++', 'Go', 'Rust', 'Java'];

    for (let i = 1; i <= 100; i++) {
      try {
        await userPrisma.githubRepo.create({
          data: {
            repoId: 1000000 + i,
            name: `test-repo-${i}`,
            fullName: `testuser/test-repo-${i}`,
            description: `Test repository ${i} for embodied AI research`,
            language: languages[Math.floor(Math.random() * languages.length)],
            starsCount: Math.floor(Math.random() * 10000),
            forksCount: Math.floor(Math.random() * 1000),
            issuesCount: Math.floor(Math.random() * 100),
            createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            updatedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });

        repoCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`GitHub项目 test-repo-${i} 已存在，跳过`);
        } else {
          throw error;
        }
      }

      if (i % 10 === 0) {
        console.log(`已生成 ${repoCount} 个测试GitHub项目`);
      }
    }

    console.log('✅ 生成100个测试GitHub项目');

    const categories = ['Computer Vision', 'Robotics', 'NLP', 'Reinforcement Learning', 'Control'];

    for (let i = 1; i <= 100; i++) {
      try {
        await userPrisma.paper.create({
          data: {
            title: `Test Paper ${i}: Advances in Embodied AI`,
            authors: JSON.stringify([`Author ${i}`, `Co-Author ${i + 1}`]),
            abstract: `This paper presents novel approaches to embodied AI systems, focusing on ${categories[Math.floor(Math.random() * categories.length)]}. We demonstrate significant improvements over baseline methods through extensive experimentation.`,
            arxivId: `arxiv.${i}.${Date.now()}`,
            publishedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            citationCount: Math.floor(Math.random() * 100),
            viewCount: Math.floor(Math.random() * 1000),
            favoriteCount: Math.floor(Math.random() * 100),
          },
        });

        paperCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`论文 ${i} 已存在，跳过`);
        } else {
          throw error;
        }
      }

      if (i % 10 === 0) {
        console.log(`已生成 ${paperCount} 篇测试论文`);
      }
    }

    console.log('✅ 生成100篇测试论文');

    const platforms = ['bilibili', 'youtube'];
    const keywords = ['具身智能', '机器人', 'AI', '深度学习', '强化学习'];

    for (let i = 1; i <= 100; i++) {
      try {
        await userPrisma.video.create({
          data: {
            title: `Test Video ${i}: Embodied AI Tutorial`,
            description: `This video covers fundamentals of embodied AI and robotics.`,
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            videoId: `test_video_${i}`,
            uploader: `uploader${i}`,
            uploaderId: `uploader_id_${i}`,
            viewCount: Math.floor(Math.random() * 10000),
            likeCount: Math.floor(Math.random() * 1000),
            publishedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            coverUrl: `https://example.com/thumb${i}.jpg`,
          },
        });

        videoCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`视频 ${i} 已存在，跳过`);
        } else {
          throw error;
        }
      }

      if (i % 10 === 0) {
        console.log(`已生成 ${videoCount} 个测试视频`);
      }
    }

    console.log('✅ 生成100个测试视频');

    const users = await userPrisma.user.findMany({ take: 50 });

    for (let i = 0; i < 50; i++) {
      const user = users[i];
      if (!user) continue;

      try {
        await userPrisma.post.create({
          data: {
            userId: user.id,
            contentType: 'discussion',
            contentId: `test_content_${i}`,
            title: `Test Post ${i + 1}: Discussion on Embodied AI`,
            content: `This is a test post discussing various aspects of embodied AI, including robotics, computer vision, and reinforcement learning. ${keywords[Math.floor(Math.random() * keywords.length)]}`,
            viewCount: Math.floor(Math.random() * 500),
            likeCount: Math.floor(Math.random() * 100),
            commentCount: Math.floor(Math.random() * 50),
          },
        });

        postCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`帖子 ${i + 1} 已存在，跳过`);
        } else {
          throw error;
        }
      }

      if (i % 10 === 0) {
        console.log(`已生成 ${postCount} 个测试帖子`);
      }
    }

    console.log('✅ 生成50个测试帖子');

    const posts = await userPrisma.post.findMany({ take: 50 });

    for (let i = 0; i < 200; i++) {
      const post = posts[i % posts.length];
      const user = users[i % users.length];
      if (!post || !user) continue;

      try {
        await userPrisma.comment.create({
          data: {
            postId: post.id,
            userId: user.id,
            content: `Test comment ${i + 1}: This is an interesting point about embodied AI systems.`,
            likeCount: Math.floor(Math.random() * 20),
          },
        });

        commentCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`评论 ${i + 1} 已存在，跳过`);
        } else {
          throw error;
        }
      }

      if (i % 50 === 0) {
        console.log(`已生成 ${commentCount} 条测试评论`);
      }
    }

    console.log('✅ 生成200条测试评论');

    console.log('\n测试数据生成完成！');
    console.log(`总计：`);
    console.log(`- 用户：${userCount} 个`);
    console.log(`- 论文：${paperCount} 篇`);
    console.log(`- GitHub项目：${repoCount} 个`);
    console.log(`- 视频：${videoCount} 个`);
    console.log(`- 帖子：${postCount} 个`);
    console.log(`- 评论：${commentCount} 条`);

  } catch (error) {
    console.error('生成测试数据时出错：', error);
  } finally {
    await userPrisma.$disconnect();
  }
}

generateTestData();
