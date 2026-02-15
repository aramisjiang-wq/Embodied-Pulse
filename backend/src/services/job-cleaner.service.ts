/**
 * 招聘信息数据清洗和结构化处理服务
 * 用于清洗、去重、标准化招聘数据
 */

import { logger } from '../utils/logger';
import { JobData } from './job-scraper.service';
import adminPrisma from '../config/database.admin';

export interface CleanedJobData {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  status: string;
  source: string;
  sourceUrl?: string;
  tags?: string;
}

export class JobDataCleaner {
  private salaryKeywords = [
    'k', 'k$', 'k usd', 'k usd/year', 'k/year',
    'm', 'm$', 'm usd', 'm usd/year', 'm/year',
    'usd', 'usd/year', '$', '$/year',
    'cny', 'cny/year', '¥', '¥/year',
    'eur', 'eur/year', '€', '€/year',
  ];

  private locationKeywords = [
    'remote', 'hybrid', 'on-site', 'onsite',
    'united states', 'usa', 'us',
    'china', 'cn',
    'europe', 'uk', 'germany', 'france',
    'asia', 'japan', 'singapore',
  ];

  private companyStopWords = [
    'inc', 'llc', 'ltd', 'corp', 'corporation',
    'co', 'company', 'gmbh', 'pte', 'pte ltd',
  ];

  async cleanJobs(jobs: JobData[]): Promise<CleanedJobData[]> {
    logger.info(`开始清洗 ${jobs.length} 条招聘数据`);
    
    const cleanedJobs: CleanedJobData[] = [];

    for (const job of jobs) {
      try {
        const cleaned = await this.cleanJob(job);
        if (cleaned) {
          cleanedJobs.push(cleaned);
        }
      } catch (error: any) {
        logger.warn(`清洗职位失败: ${job.title}`, error.message);
      }
    }

    logger.info(`清洗完成，有效数据: ${cleanedJobs.length} 条`);
    return cleanedJobs;
  }

  private async cleanJob(job: JobData): Promise<CleanedJobData | null> {
    if (!job.title || !job.company) {
      return null;
    }

    const cleaned: CleanedJobData = {
      title: this.cleanTitle(job.title),
      company: this.cleanCompany(job.company),
      location: this.cleanLocation(job.location),
      salaryMin: this.extractSalaryMin(job.description),
      salaryMax: this.extractSalaryMax(job.description),
      description: this.cleanDescription(job.description),
      requirements: this.cleanRequirements(job.requirements),
      status: 'open',
      source: job.source,
      sourceUrl: job.sourceUrl,
      tags: this.cleanTags(job.tags),
    };

    return cleaned;
  }

  private cleanTitle(title: string): string {
    let cleaned = title.trim();
    
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/[^\w\s\-.,\/()]/g, '');
    
    const maxLength = 200;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...';
    }

    return cleaned;
  }

  private cleanCompany(company: string): string {
    let cleaned = company.trim();
    
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/[^\w\s\-.,]/g, '');
    
    const maxLength = 100;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    return cleaned;
  }

  private cleanLocation(location?: string): string | undefined {
    if (!location) {
      return undefined;
    }

    let cleaned = location.trim();
    
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/[^\w\s\-.,]/g, '');
    
    const maxLength = 100;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    return cleaned || undefined;
  }

  private extractSalaryMin(description?: string): number | undefined {
    if (!description) {
      return undefined;
    }

    const salaryPatterns = [
      /(\d+)k\s*-\s*(\d+)k/i,
      /\$\s*(\d+),?\d*\s*-\s*\$\s*(\d+),?\d*/i,
      /(\d+),?\d*\s*-\s*(\d+),?\d*\s*usd/i,
      /(\d+)k\s*-\s*\$\s*(\d+)k/i,
    ];

    for (const pattern of salaryPatterns) {
      const match = description.match(pattern);
      if (match) {
        const minSalary = parseInt(match[1].replace(/,/g, ''));
        return minSalary * 1000;
      }
    }

    return undefined;
  }

  private extractSalaryMax(description?: string): number | undefined {
    if (!description) {
      return undefined;
    }

    const salaryPatterns = [
      /(\d+)k\s*-\s*(\d+)k/i,
      /\$\s*(\d+),?\d*\s*-\s*\$\s*(\d+),?\d*/i,
      /(\d+),?\d*\s*-\s*(\d+),?\d*\s*usd/i,
      /(\d+)k\s*-\s*\$\s*(\d+)k/i,
    ];

    for (const pattern of salaryPatterns) {
      const match = description.match(pattern);
      if (match) {
        const maxSalary = parseInt(match[2].replace(/,/g, ''));
        return maxSalary * 1000;
      }
    }

    return undefined;
  }

  private cleanDescription(description?: string): string | undefined {
    if (!description) {
      return undefined;
    }

    let cleaned = description.trim();
    
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    
    const maxLength = 5000;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...';
    }

    return cleaned || undefined;
  }

  private cleanRequirements(requirements?: string): string | undefined {
    if (!requirements) {
      return undefined;
    }

    let cleaned = requirements.trim();
    
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    const maxLength = 2000;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...';
    }

    return cleaned || undefined;
  }

  private cleanTags(tags?: string[]): string | undefined {
    if (!tags || tags.length === 0) {
      return undefined;
    }

    const uniqueTags = [...new Set(tags.map(tag => tag.trim()))];
    const validTags = uniqueTags.filter(tag => tag.length > 0 && tag.length <= 50);

    if (validTags.length === 0) {
      return undefined;
    }

    return JSON.stringify(validTags);
  }

  async deduplicateJobs(jobs: CleanedJobData[]): Promise<CleanedJobData[]> {
    logger.info(`开始去重，处理 ${jobs.length} 条数据`);
    
    const uniqueJobs: CleanedJobData[] = [];
    const seen = new Set<string>();

    for (const job of jobs) {
      const key = this.generateJobKey(job);
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    logger.info(`去重完成，剩余 ${uniqueJobs.length} 条数据`);
    return uniqueJobs;
  }

  private generateJobKey(job: CleanedJobData): string {
    const normalizedTitle = job.title.toLowerCase().replace(/\s+/g, '');
    const normalizedCompany = job.company.toLowerCase().replace(/\s+/g, '');
    const normalizedLocation = (job.location || '').toLowerCase().replace(/\s+/g, '');
    
    return `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;
  }

  async removeExistingJobs(jobs: CleanedJobData[]): Promise<CleanedJobData[]> {
    logger.info(`开始过滤已存在的职位，处理 ${jobs.length} 条数据`);
    
    const newJobs: CleanedJobData[] = [];

    for (const job of jobs) {
      try {
        const existing = await adminPrisma.jobs.findFirst({
          where: {
            title: job.title,
            company: job.company,
            location: job.location || null,
          },
        });

        if (!existing) {
          newJobs.push(job);
        }
      } catch (error: any) {
        logger.warn(`检查职位是否存在失败: ${job.title}`, error.message);
        newJobs.push(job);
      }
    }

    logger.info(`过滤完成，新增 ${newJobs.length} 条数据`);
    return newJobs;
  }

  async saveJobs(jobs: CleanedJobData[]): Promise<number> {
    logger.info(`开始保存 ${jobs.length} 条招聘数据到数据库`);
    
    let savedCount = 0;

    for (const job of jobs) {
      try {
        await adminPrisma.jobs.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            salary_min: job.salaryMin,
            salary_max: job.salaryMax,
            description: job.description,
            requirements: job.requirements,
            status: job.status,
            tags: job.tags,
          } as any,
        });

        savedCount++;
      } catch (error: any) {
        if (error.code !== 'P2002') {
          logger.warn(`保存职位失败: ${job.title}`, error.message);
        }
      }
    }

    logger.info(`保存完成，成功保存 ${savedCount} 条数据`);
    return savedCount;
  }

  async processJobs(jobs: JobData[]): Promise<{
    cleaned: number;
    deduplicated: number;
    filtered: number;
    saved: number;
  }> {
    const cleaned = await this.cleanJobs(jobs);
    const deduplicated = await this.deduplicateJobs(cleaned);
    const filtered = await this.removeExistingJobs(deduplicated);
    const saved = await this.saveJobs(filtered);

    return {
      cleaned: cleaned.length,
      deduplicated: deduplicated.length,
      filtered: filtered.length,
      saved,
    };
  }
}

export default JobDataCleaner;
