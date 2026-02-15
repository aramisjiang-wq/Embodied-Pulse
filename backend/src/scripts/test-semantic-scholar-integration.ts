import { PaperEnrichmentService } from '../services/paper-enrichment.service';
import { logger } from '../utils/logger';

async function main() {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;

  if (!apiKey) {
    console.error('SEMANTIC_SCHOLAR_API_KEY environment variable is required');
    console.error('Please set it in your .env file:');
    console.error('SEMANTIC_SCHOLAR_API_KEY=your_api_key_here');
    process.exit(1);
  }

  const enrichmentService = new PaperEnrichmentService(apiKey);

  const testArxivIds = [
    '2301.07041',
    '2203.02155',
    '2106.14801',
  ];

  console.log('Testing Semantic Scholar integration with sample papers...');
  console.log(`Test papers: ${testArxivIds.join(', ')}`);
  console.log('');

  try {
    const results = await enrichmentService.enrichBatch(testArxivIds);

    console.log('\nResults:');
    console.log('='.repeat(80));
    
    results.forEach((result, index) => {
      console.log(`\n[${index + 1}] ${result.arxivId}`);
      console.log('-'.repeat(80));
      
      if (result.success) {
        console.log(`✓ Status: Successfully enriched`);
        console.log(`  - Paper ID: ${result.paperId}`);
        console.log(`  - Citation Count: ${result.metadata?.citationCount || 'N/A'}`);
        console.log(`  - Influential Citations: ${result.metadata?.influentialCitationCount || 'N/A'}`);
        console.log(`  - Open Access: ${result.metadata?.isOpenAccess ? 'Yes' : 'No'}`);
        console.log(`  - Fields of Study: ${result.metadata?.fieldsOfStudy || 'N/A'}`);
        console.log(`  - Publication Types: ${result.metadata?.publicationTypes || 'N/A'}`);
        console.log(`  - Venue Type: ${result.metadata?.venueType || 'N/A'}`);
        console.log(`  - Journal: ${result.metadata?.journalName || 'N/A'}`);
        console.log(`  - Conference: ${result.metadata?.conferenceName || 'N/A'}`);
        console.log(`  - DOI: ${result.metadata?.doi || 'N/A'}`);
        console.log(`  - PMID: ${result.metadata?.pmid || 'N/A'}`);
        console.log(`  - TL;DR: ${result.metadata?.tldr ? result.metadata.tldr.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`  - Related Papers: ${result.metadata?.relatedPaperIds ? result.metadata.relatedPaperIds.split(',').length : 0}`);
      } else {
        console.log(`✗ Status: Failed`);
        console.log(`  - Error: ${result.error}`);
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(80));
    console.log('Summary:');
    console.log(`  Total papers: ${results.length}`);
    console.log(`  Successful: ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`);
    console.log(`  Failed: ${failureCount} (${((failureCount / results.length) * 100).toFixed(1)}%)`);

    if (successCount === results.length) {
      console.log('\n✓ All papers enriched successfully!');
    } else if (successCount > 0) {
      console.log('\n⚠ Some papers failed to enrich. Check the errors above.');
    } else {
      console.log('\n✗ All papers failed to enrich. Check your API key and network connection.');
    }
  } catch (error) {
    logger.error('Script execution failed', { error });
    console.error('\n✗ Script execution failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Script execution failed', { error });
  process.exit(1);
});
