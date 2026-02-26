
import userPrisma from './src/config/database.user';

async function main() {
  console.log('=== Checking DailyNews in user database ===');
  try {
    const news = await userPrisma.dailyNews.findMany();
    console.log(`Found ${news.length} DailyNews items:`);
    news.forEach(item => {
      console.log(`  - ${item.id}: ${item.title} (pinned: ${item.isPinned})`);
    });
  } catch (e) {
    console.error('Error:', e);
  }

  await userPrisma.$disconnect();
}

main().catch(console.error);
