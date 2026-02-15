const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../prisma/user.db');
const db = new sqlite3.Database(dbPath);

console.log('检查 github_repos 表结构...\n');

db.all("PRAGMA table_info(github_repos)", [], (err, rows) => {
  if (err) {
    console.error('错误:', err);
    return;
  }

  console.log('当前表字段:');
  console.table(rows);

  const hasRepoId = rows.some(row => row.name === 'repo_id');
  const hasOwner = rows.some(row => row.name === 'owner');
  const hasIssuesCount = rows.some(row => row.name === 'issues_count');
  const hasTopics = rows.some(row => row.name === 'topics');
  const hasCreatedDate = rows.some(row => row.name === 'created_date');

  console.log('\n缺失字段检查:');
  console.log('repo_id:', hasRepoId ? '✅ 存在' : '❌ 缺失');
  console.log('owner:', hasOwner ? '✅ 存在' : '❌ 缺失');
  console.log('issues_count:', hasIssuesCount ? '✅ 存在' : '❌ 缺失');
  console.log('topics:', hasTopics ? '✅ 存在' : '❌ 缺失');
  console.log('created_date:', hasCreatedDate ? '✅ 存在' : '❌ 缺失');

  if (!hasRepoId || !hasOwner || !hasIssuesCount || !hasTopics || !hasCreatedDate) {
    console.log('\n⚠️  需要执行数据库迁移！');
  } else {
    console.log('\n✅ 所有字段都存在');
  }

  db.close();
});
