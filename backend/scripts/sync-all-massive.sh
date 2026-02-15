#!/bin/bash
# 大规模数据同步脚本
# 用途：同步所有数据，每个至少1000条

echo "🚀 开始大规模数据同步"
echo "目标：每个数据源至少1000条"
echo ""

cd /Users/dong/Documents/Product/Embodied/backend

# 先备份
echo "📦 备份数据库..."
./scripts/backup-db.sh

echo ""
echo "📊 开始同步数据..."

# 1. 同步arXiv论文（多个分类，每个500篇，共2000篇）
echo "1/6 同步arXiv论文（目标：2000篇）..."
node -e "
const { syncArxivPapers } = require('./dist/services/sync/arxiv.sync.js');
const formatArxivDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return \`\${year}\${month}\${day}\${hours}\${minutes}\${seconds}\`;
};
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
const startDate = formatArxivDate(oneYearAgo);
const endDate = formatArxivDate(new Date());
const categories = ['cs.RO', 'cs.AI', 'cs.CV', 'cs.LG'];
(async () => {
  let total = 0;
  for (const cat of categories) {
    try {
      const result = await syncArxivPapers(\`cat:\${cat}\`, 500, startDate, endDate);
      total += result.synced;
      console.log(\`  ✓ \${cat}: \${result.synced} 篇\`);
    } catch (e) {
      console.log(\`  ✗ \${cat}: 失败\`);
    }
  }
  console.log(\`  总计: \${total} 篇\`);
})();
"

echo ""
echo "2/6 同步GitHub项目（目标：1000个）..."
node -e "
const { syncGithubRepos } = require('./dist/services/sync/github.sync.js');
(async () => {
  try {
    const result = await syncGithubRepos('embodied-ai', 1000);
    console.log(\`  ✓ GitHub项目: \${result.synced} 个\`);
  } catch (e) {
    console.log(\`  ✗ GitHub项目: 失败 - \${e.message}\`);
  }
})();
"

echo ""
echo "3/6 同步HuggingFace模型（目标：1000个）..."
node -e "
const { syncHuggingFaceModels } = require('./dist/services/sync/huggingface.sync.js');
(async () => {
  try {
    const result = await syncHuggingFaceModels('robotics', 1000);
    console.log(\`  ✓ HuggingFace模型: \${result.synced} 个\`);
  } catch (e) {
    console.log(\`  ✗ HuggingFace模型: 失败 - \${e.message}\`);
  }
})();
"

echo ""
echo "4/6 同步Bilibili视频（目标：1000个）..."
node -e "
const { syncBilibiliVideos } = require('./dist/services/sync/bilibili.sync.js');
(async () => {
  try {
    const result = await syncBilibiliVideos(1000);
    console.log(\`  ✓ Bilibili视频: \${result.synced} 个\`);
  } catch (e) {
    console.log(\`  ✗ Bilibili视频: 失败 - \${e.message}\`);
  }
})();
"

echo ""
echo "5/6 同步科技新闻（目标：1000条）..."
node -e "
const { syncTechNews } = require('./dist/services/sync/tech-news.sync.js');
(async () => {
  try {
    const result = await syncTechNews(1000);
    console.log(\`  ✓ 科技新闻: \${result.synced} 条\`);
  } catch (e) {
    console.log(\`  ✗ 科技新闻: 失败 - \${e.message}\`);
  }
})();
"

echo ""
echo "6/6 同步GitHub岗位（目标：1000个）..."
node -e "
const { syncJobsFromGithub } = require('./dist/services/sync/jobs.sync.js');
(async () => {
  try {
    const result = await syncJobsFromGithub();
    console.log(\`  ✓ GitHub岗位: \${result.synced} 个\`);
  } catch (e) {
    console.log(\`  ✗ GitHub岗位: 失败 - \${e.message}\`);
  }
})();
"

echo ""
echo "📊 数据同步完成！"
echo "当前数据统计："
sqlite3 prisma/dev.db "SELECT 'papers: ' || COUNT(*) FROM papers UNION SELECT 'videos: ' || COUNT(*) FROM videos UNION SELECT 'repos: ' || COUNT(*) FROM github_repos UNION SELECT 'models: ' || COUNT(*) FROM huggingface_models UNION SELECT 'news: ' || COUNT(*) FROM news UNION SELECT 'jobs: ' || COUNT(*) FROM jobs;"

echo ""
echo "📦 再次备份数据库..."
./scripts/backup-db.sh

echo ""
echo "✅ 大规模数据同步完成！"
