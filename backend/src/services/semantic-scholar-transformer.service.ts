import { PaperDetails } from './semantic-scholar-api.service';
import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SemanticScholarTransformer {
  transformToDbModel(apiData: PaperDetails): any {
    const validation = this.validatePaperData(apiData);
    
    if (!validation.isValid) {
      logger.error('Invalid paper data from Semantic Scholar', {
        paperId: apiData.paperId,
        errors: validation.errors,
      });
      throw new Error(`Invalid paper data: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      logger.warn('Paper data validation warnings', {
        paperId: apiData.paperId,
        warnings: validation.warnings,
      });
    }

    return {
      semanticScholarId: apiData.paperId,
      influentialCitationCount: apiData.influentialCitationCount || 0,
      isOpenAccess: apiData.isOpenAccess || false,
      openAccessPdfUrl: apiData.openAccessPdf?.url || null,
      fieldsOfStudy: apiData.fieldsOfStudy?.join(',') || null,
      publicationTypes: apiData.publicationTypes?.join(',') || null,
      tldr: apiData.tldr || null,
      relatedPaperIds: apiData.relatedPapers?.map(p => p.paperId).join(',') || null,
      venueType: this.extractVenueType(apiData),
      journalName: this.extractJournalName(apiData),
      conferenceName: this.extractConferenceName(apiData),
      volume: null,
      issue: null,
      pages: null,
      doi: apiData.doi || null,
      pmid: apiData.pmid || null,
      lastEnrichmentDate: new Date(),
      enrichmentStatus: 'completed',
      enrichmentError: null,
      enrichmentRetryCount: 0,
    };
  }

  validatePaperData(data: PaperDetails): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.paperId) {
      errors.push('Missing paperId');
    }

    if (!data.title) {
      errors.push('Missing title');
    }

    if (data.citationCount !== undefined && data.citationCount < 0) {
      errors.push('Invalid citationCount (must be >= 0)');
    }

    if (data.influentialCitationCount !== undefined && data.influentialCitationCount < 0) {
      errors.push('Invalid influentialCitationCount (must be >= 0)');
    }

    if (data.influentialCitationCount !== undefined && 
        data.citationCount !== undefined && 
        data.influentialCitationCount > data.citationCount) {
      warnings.push('influentialCitationCount exceeds citationCount');
    }

    if (data.openAccessPdf?.url && !this.isValidUrl(data.openAccessPdf.url)) {
      errors.push('Invalid openAccessPdf URL');
    }

    if (data.doi && !this.isValidDoi(data.doi)) {
      warnings.push('Invalid DOI format');
    }

    if (data.pmid && !this.isValidPmid(data.pmid)) {
      warnings.push('Invalid PMID format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private extractVenueType(data: PaperDetails): string | null {
    if (!data.publicationTypes || data.publicationTypes.length === 0) {
      return null;
    }

    const typeMap: Record<string, string> = {
      'JournalArticle': 'journal',
      'Conference': 'conference',
      'Review': 'review',
      'Book': 'book',
      'Thesis': 'thesis',
    };

    return typeMap[data.publicationTypes[0]] || null;
  }

  private extractJournalName(data: PaperDetails): string | null {
    if (!data.venue) {
      return null;
    }

    const venueType = this.extractVenueType(data);
    if (venueType === 'journal') {
      return data.venue;
    }

    return null;
  }

  private extractConferenceName(data: PaperDetails): string | null {
    if (!data.venue) {
      return null;
    }

    const venueType = this.extractVenueType(data);
    if (venueType === 'conference') {
      return data.venue;
    }

    return null;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDoi(doi: string): boolean {
    return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(doi);
  }

  private isValidPmid(pmid: string): boolean {
    return /^\d+$/.test(pmid);
  }
}
