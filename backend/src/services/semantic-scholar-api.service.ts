import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface SemanticScholarConfig {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  retryDelay: number;
}

export interface PaperDetails {
  paperId: string;
  externalIds?: {
    ArXiv?: string;
    DOI?: string;
    CorpusId?: number;
  };
  title: string;
  abstract?: string;
  authors: Array<{
    authorId: string;
    name: string;
  }>;
  year?: number;
  venue?: string;
  citationCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
  };
  fieldsOfStudy?: string[];
  publicationTypes?: string[];
  publicationDate?: string;
  tldr?: string;
  relatedPapers?: Array<{
    paperId: string;
    title: string;
  }>;
  doi?: string;
  pmid?: string;
}

export class SemanticScholarApiClient {
  private client: AxiosInstance;
  private config: SemanticScholarConfig;

  constructor(config: SemanticScholarConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (config.apiKey) {
      this.client.defaults.headers.common['x-api-key'] = config.apiKey;
    }
  }

  async getPaperDetails(arxivId: string, fields: string[] = []): Promise<PaperDetails | null> {
    const defaultFields = [
      'paperId',
      'externalIds',
      'title',
      'abstract',
      'authors',
      'year',
      'venue',
      'citationCount',
      'influentialCitationCount',
      'isOpenAccess',
      'openAccessPdf',
      'fieldsOfStudy',
      'publicationTypes',
      'publicationDate',
      'tldr',
      'relatedPapers',
      'doi',
      'pmid',
    ];

    const requestedFields = fields.length > 0 ? fields : defaultFields;
    const fieldsParam = requestedFields.join(',');

    return this.withRetry(async () => {
      try {
        const response = await this.client.get(`/paper/ARXIV:${arxivId}`, {
          params: { fields: fieldsParam },
        });

        logger.info('Semantic Scholar API request successful', {
          arxivId,
          status: response.status,
        });

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            logger.warn('Paper not found in Semantic Scholar', { arxivId });
            return null;
          }
          if (error.response?.status === 429) {
            logger.warn('Rate limit exceeded, backing off');
            throw new Error('Rate limit exceeded');
          }
        }
        throw error;
      }
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        logger.info(`Retrying operation (attempt ${retryCount + 1}/${this.config.maxRetries})`, {
          delay,
        });
        await this.sleep(delay);
        return this.withRetry(operation, retryCount + 1);
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createSemanticScholarClient(): SemanticScholarApiClient {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || '';
  
  return new SemanticScholarApiClient({
    apiKey,
    baseUrl: 'https://api.semanticscholar.org/graph/v1',
    maxRetries: 3,
    retryDelay: 1000,
  });
}
