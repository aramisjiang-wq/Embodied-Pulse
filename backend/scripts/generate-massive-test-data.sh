#!/bin/bash
# 大规模测试数据生成脚本（修复版3）
# 用途：生成大量测试数据，每个至少1000条

echo "🚀 开始生成大规模测试数据"
echo "目标：每个数据源至少1000条"
echo ""

cd /Users/dong/Documents/Product/Embodied/backend

# 先备份
echo "📦 备份数据库..."
./scripts/backup-db.sh

echo ""
echo "📊 开始生成测试数据..."

# 生成1000篇论文
echo "生成1000篇论文..."
node -e "
const { PrismaClient } = require('@prisma/client');
const userPrisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function generatePapers() {
  console.log('开始生成论文...');
  const categories = ['cs.RO', 'cs.AI', 'cs.CV', 'cs.LG'];
  const keywords = ['embodied AI', 'robotics', 'computer vision', 'reinforcement learning', 'machine learning'];
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      await userPrisma.paper.create({
        data: {
          arxivId: \`arxiv.\${i}.\${Date.now()}\`,
          title: \`Test Paper \${i}: Advances in \${keyword}\`,
          authors: JSON.stringify([ \`Author \${i}\`, \`Co-Author \${i + 1}\` ]),
          abstract: \`This paper presents novel approaches to \${keyword}. We demonstrate significant improvements over baseline methods through extensive experimentation.\`,
          pdfUrl: \`https://arxiv.org/abs/arxiv.\${i}\`,
          publishedDate: date,
          citationCount: Math.floor(Math.random() * 1000),
          venue: 'arXiv',
          categories: JSON.stringify([category]),
          viewCount: Math.floor(Math.random() * 10000),
          favoriteCount: Math.floor(Math.random() * 500),
          shareCount: Math.floor(Math.random() * 200),
        }
      });
      
      if (i % 100 === 0) {
        console.log(\`  已生成 \${i} 篇论文\`);
      }
    } catch (e) {
      console.log(\`  生成第 \${i} 篇论文失败: \${e.message}\`);
    }
  }
  
  console.log(\`✓ 已生成 1000 篇论文\`);
}

generatePapers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "生成1000个GitHub项目..."
node -e "
const { PrismaClient } = require('@prisma/client');
const userPrisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function generateRepos() {
  console.log('开始生成GitHub项目...');
  const topics = ['robotics', 'embodied-ai', 'reinforcement-learning', 'computer-vision', 'machine-learning'];
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      await userPrisma.githubRepo.create({
        data: {
          repoId: i,
          fullName: \`test-repo-\${i}\`,
          name: \`test-repo-\${i}\`,
          description: \`A repository for \${topic} research and development.\`,
          url: \`https://github.com/test/test-repo-\${i}\`,
          starsCount: Math.floor(Math.random() * 10000),
          forksCount: Math.floor(Math.random() * 5000),
          openIssuesCount: Math.floor(Math.random() * 100),
          language: 'Python',
          topics: JSON.stringify([topic]),
          updatedAt: date,
          viewCount: Math.floor(Math.random() * 10000),
          favoriteCount: Math.floor(Math.random() * 500),
          shareCount: Math.floor(Math.random() * 200),
        }
      });
      
      if (i % 100 === 0) {
        console.log(\`  已生成 \${i} 个GitHub项目\`);
      }
    } catch (e) {
      console.log(\`  生成第 \${i} 个GitHub项目失败: \${e.message}\`);
    }
  }
  
  console.log(\`✓ 已生成 1000 个GitHub项目\`);
}

generateRepos().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "生成1000个HuggingFace模型..."
node -e "
const { PrismaClient } = require('@prisma/client');
const userPrisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function generateModels() {
  console.log('开始生成HuggingFace模型...');
  const tasks = ['robotics', 'reinforcement-learning', 'computer-vision', 'image-to-text', 'object-detection'];
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      await userPrisma.huggingFaceModel.create({
        data: {
          modelId: \`test-model-\${i}\`,
          author: \`test-author-\${i}\`,
          description: \`A model for \${task} tasks.\`,
          task: task,
          library: 'pytorch',
          downloads: Math.floor(Math.random() * 100000),
          likes: Math.floor(Math.random() * 10000),
          lastModified: date,
          viewCount: Math.floor(Math.random() * 10000),
          favoriteCount: Math.floor(Math.random() * 500),
          shareCount: Math.floor(Math.random() * 200),
        }
      });
      
      if (i % 100 === 0) {
        console.log(\`  已生成 \${i} 个HuggingFace模型\`);
      }
    } catch (e) {
      console.log(\`  生成第 \${i} 个HuggingFace模型失败: \${e.message}\`);
    }
  }
  
  console.log(\`✓ 已生成 1000 个HuggingFace模型\`);
}

generateModels().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "生成1000个视频..."
node -e "
const { PrismaClient } = require('@prisma/client');
const userPrisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function generateVideos() {
  console.log('开始生成视频...');
  const keywords = ['具身智能', '机器人', '人工智能', '计算机视觉', '强化学习'];
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      await userPrisma.video.create({
        data: {
          platform: 'bilibili',
          videoId: \`test_video_\${i}\`,
          bvid: \`test_video_\${i}\`,
          title: \`Test Video \${i}: \${keyword} Tutorial\`,
          description: \`This video covers fundamentals of \${keyword}.\`,
          coverUrl: \`https://example.com/thumb\${i}.jpg\`,
          duration: Math.floor(Math.random() * 3600),
          uploader: \`uploader\${i}\`,
          uploaderId: \`uploader_id_\${i}\`,
          publishedDate: date,
          playCount: Math.floor(Math.random() * 100000),
          likeCount: Math.floor(Math.random() * 10000),
          viewCount: Math.floor(Math.random() * 10000),
          favoriteCount: Math.floor(Math.random() * 500),
          shareCount: Math.floor(Math.random() * 200),
        }
      });
      
      if (i % 100 === 0) {
        console.log(\`  已生成 \${i} 个视频\`);
      }
    } catch (e) {
      console.log(\`  生成第 \${i} 个视频失败: \${e.message}\`);
    }
  }
  
  console.log(\`✓ 已生成 1000 个视频\`);
}

generateVideos().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "生成1000条新闻..."
node -e "
const { PrismaClient } = require('@prisma/client');
const userPrisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function generateNews() {
  console.log('开始生成新闻...');
  const platforms = ['techcrunch', 'theverge', 'venturebeat', 'arstechnica', 'engadget'];
  const keywords = ['AI', 'robotics', 'machine learning', 'computer vision', 'embodied AI'];
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      await userPrisma.news.create({
        data: {
          platform: platform,
          title: \`News \${i}: Breakthrough in \${keyword}\`,
          url: \`https://example.com/news/\${i}\`,
          description: \`A significant breakthrough in \${keyword} has been announced.\`,
          publishedDate: date,
          score: Math.floor(Math.random() * 100),
          viewCount: Math.floor(Math.random() * 10000),
          favoriteCount: Math.floor(Math.random() * 500),
          shareCount: Math.floor(Math.random() * 200),
        }
      });
      
      if (i % 100 === 0) {
        console.log(\`  已生成 \${i} 条新闻\`);
      }
    } catch (e) {
      console.log(\`  生成第 \${i} 条新闻失败: \${e.message}\`);
    }
  }
  
  console.log(\`✓ 已生成 1000 条新闻\`);
}

generateNews().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "生成1000个岗位..."
node -e "
const { PrismaClient } = require('@prisma/client');
const userPrisma = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function generateJobs() {
  console.log('开始生成岗位...');
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'OpenAI', 'Tesla', 'NVIDIA', 'Boston Dynamics'];
  const locations = ['San Francisco', 'New York', 'London', 'Beijing', 'Tokyo', 'Shanghai'];
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      await userPrisma.job.create({
        data: {
          title: \`\${company} is hiring: AI Engineer \${i}\`,
          company: company,
          location: location,
          salaryMin: 100000,
          salaryMax: 200000,
          description: \`We are looking for an experienced AI engineer to join our team.\`,
          requirements: '5+ years of experience in AI/ML',
          status: 'open',
          viewCount: Math.floor(Math.random() * 10000),
          favoriteCount: Math.floor(Math.random() * 500),
        }
      });
      
      if (i % 100 === 0) {
        console.log(\`  已生成 \${i} 个岗位\`);
      }
    } catch (e) {
      console.log(\`  生成第 \${i} 个岗位失败: \${e.message}\`);
    }
  }
  
  console.log(\`✓ 已生成 1000 个岗位\`);
}

generateJobs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "📊 数据生成完成！"
echo "当前数据统计："
sqlite3 prisma/dev.db "SELECT 'papers: ' || COUNT(*) FROM papers UNION SELECT 'videos: ' || COUNT(*) FROM videos UNION SELECT 'repos: ' || COUNT(*) FROM github_repos UNION SELECT 'models: ' || COUNT(*) FROM huggingface_models UNION SELECT 'news: ' || COUNT(*) FROM news UNION SELECT 'jobs: ' || COUNT(*) FROM jobs;"

echo ""
echo "📦 再次备份数据库..."
./scripts/backup-db.sh

echo ""
echo "✅ 大规模数据生成完成！"
