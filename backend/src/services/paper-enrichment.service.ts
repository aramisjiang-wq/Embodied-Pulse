import { SemanticScholarApiClient, PaperDetails } from './semantic-scholar-api.service';
import { SemanticScholarTransformer } from './semantic-scholar-transformer.service';
import userPrismaAny from '../config/database.user';
import { logger } from '../utils/logger';

const userPrisma = userPrismaAny as any;

export interface EnrichmentResult {
  success: boolean;
  paperId: string;
  arxivId: string;
  error?: string;
  metadata?: any;
}

export class PaperEnrichmentService {
  private apiClient: SemanticScholarApiClient;
  private transformer: SemanticScholarTransformer;

  constructor(apiKey: string) {
    this.apiClient = new SemanticScholarApiClient({
      apiKey,
      baseUrl: 'https://api.semanticscholar.org/graph/v1',
      maxRetries: 3,
      retryDelay: 1000,
    });

    this.transformer = new SemanticScholarTransformer();
  }

  async enrichPaper(arxivId: string): Promise<EnrichmentResult> {
    try {
      logger.info('Starting paper enrichment', { arxivId });

      const paper = await userPrisma.paper.findUnique({
        where: { arxivId },
      });

      if (!paper) {
        return {
          success: false,
          paperId: '',
          arxivId,
          error: 'Paper not found in database',
        };
      }

      const apiData = await this.apiClient.getPaperDetails(arxivId);

      if (!apiData) {
        await this.markPaperAsFailed(paper.id, 'Paper not found in Semantic Scholar');
        return {
          success: false,
          paperId: paper.id,
          arxivId,
          error: 'Paper not found in Semantic Scholar',
        };
      }

      const metadata = this.transformer.transformToDbModel(apiData);

      await userPrisma.paper.update({
        where: { id: paper.id },
        data: metadata,
      });

      logger.info('Paper enrichment completed successfully', {
        paperId: paper.id,
        arxivId,
        citationCount: apiData.citationCount,
        influentialCitationCount: apiData.influentialCitationCount,
      });

      return {
        success: true,
        paperId: paper.id,
        arxivId,
        metadata,
      };
    } catch (error) {
      logger.error('Paper enrichment failed', {
        arxivId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        paperId: '',
        arxivId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async enrichBatch(arxivIds: string[]): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    for (const arxivId of arxivIds) {
      const result = await this.enrichPaper(arxivId);
      results.push(result);

      await this.sleep(100);
    }

    return results;
  }

  async enrichPapersNeedingUpdate(daysSinceLastUpdate = 30): Promise<EnrichmentResult[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastUpdate);

    const papers = await userPrisma.paper.findMany({
      where: {
        OR: [
          { lastEnrichmentDate: null },
          { lastEnrichmentDate: { lt: cutoffDate } },
          { enrichmentStatus: 'pending' },
          { enrichmentStatus: 'failed' },
        ],
        arxivId: { not: null },
      },
      select: {
        id: true,
        arxivId: true,
      },
      take: 100,
    });

    logger.info(`Found ${papers.length} papers needing enrichment`);

    const arxivIds = papers.map((p: any) => p.arxivId!).filter(Boolean);
    return this.enrichBatch(arxivIds);
  }

  async getEnrichmentStatus(arxivId: string): Promise<any> {
    const paper = await userPrisma.paper.findUnique({
      where: { arxivId },
      select: {
        arxivId: true,
        enrichmentStatus: true,
        lastEnrichmentDate: true,
        enrichmentRetryCount: true,
        enrichmentError: true,
      },
    });

    return paper;
  }

  async getDataQualityMetrics(): Promise<any> {
    const totalPapers = await userPrisma.paper.count();
    const enrichedPapers = await userPrisma.paper.count({
      where: { semanticScholarId: { not: null } },
    });

    const fields = [
      'citationCount',
      'influentialCitationCount',
      'isOpenAccess',
      'openAccessPdfUrl',
      'publicationDate',
      'fieldsOfStudy',
      'publicationTypes',
      'tldr',
      'relatedPaperIds',
      'doi',
      'pmid',
    ];

    const fieldCompleteness: any = {};

    for (const field of fields) {
      const present = await userPrisma.paper.count({
        where: { [field]: { not: null } },
      });
      const missing = totalPapers - present;
      fieldCompleteness[field] = {
        present,
        missing,
        completenessRate: totalPapers > 0 ? (present / totalPapers) * 100 : 0,
      };
    }

    const dataQuality = {
      valid: await userPrisma.paper.count({
        where: { enrichmentStatus: 'completed' },
      }),
      warnings: await userPrisma.paper.count({
        where: { enrichmentError: { contains: 'warning' } },
      }),
      errors: await userPrisma.paper.count({
        where: { enrichmentStatus: 'failed' },
      }),
    };

    return {
      totalPapers,
      enrichedPapers,
      completenessRate: totalPapers > 0 ? (enrichedPapers / totalPapers) * 100 : 0,
      fieldCompleteness,
      dataQuality,
    };
  }

  private async markPaperAsFailed(paperId: string, error: string): Promise<void> {
    await userPrisma.paper.update({
      where: { id: paperId },
      data: {
        enrichmentStatus: 'failed',
        enrichmentError: error,
        enrichmentRetryCount: { increment: 1 },
      },
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createPaperEnrichmentService(): PaperEnrichmentService {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || '';
  return new PaperEnrichmentService(apiKey);
}
