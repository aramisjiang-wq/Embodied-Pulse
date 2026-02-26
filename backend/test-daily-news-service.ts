
import { dailyNewsService } from './src/services/daily-news.service';

async function main() {
  console.log('Testing dailyNewsService...');
  
  try {
    const result = await dailyNewsService.findAll({ page: 1, size: 20 });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

main();
