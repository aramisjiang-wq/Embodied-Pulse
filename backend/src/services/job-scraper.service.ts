/**
 * 招聘信息爬虫服务
 * 用于从不同数据源抓取招聘信息
 */

import { logger } from '../utils/logger';
import { getEnabledDataSources, JobDataSourceConfig } from '../config/job-data-sources';
import { delay } from '../utils/helpers';

export interface JobData {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  source: string;
  sourceUrl?: string;
  postedAt?: Date;
  tags?: string[];
}

export interface ScrapingResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  jobs: JobData[];
  error?: string;
  duration: number;
}

export class JobScraper {
  private sources: JobDataSourceConfig[];

  constructor() {
    this.sources = getEnabledDataSources();
  }

  async scrapeAllSources(): Promise<ScrapingResult[]> {
    logger.info(`开始从 ${this.sources.length} 个数据源抓取招聘信息`);
    const results: ScrapingResult[] = [];

    for (const source of this.sources) {
      const result = await this.scrapeSource(source);
      results.push(result);

      if (source.rateLimit) {
        await delay(source.rateLimit.delayBetweenRequests);
      }
    }

    const totalJobs = results.reduce((sum, r) => sum + r.jobs.length, 0);
    const successCount = results.filter(r => r.success).length;

    logger.info(`抓取完成: 成功 ${successCount}/${results.length} 个数据源，共 ${totalJobs} 条招聘信息`);

    return results;
  }

  async scrapeSource(source: JobDataSourceConfig): Promise<ScrapingResult> {
    const startTime = Date.now();
    logger.info(`开始抓取数据源: ${source.name} (${source.id})`);

    try {
      let jobs: JobData[] = [];

      switch (source.type) {
        case 'api':
          jobs = await this.scrapeApi(source);
          break;
        case 'scraper':
          jobs = await this.scrapeWeb(source);
          break;
        case 'rss':
          jobs = await this.scrapeRss(source);
          break;
        default:
          throw new Error(`未知的数据源类型: ${source.type}`);
      }

      const duration = Date.now() - startTime;
      logger.info(`成功抓取 ${source.name}: ${jobs.length} 条招聘信息，耗时 ${duration}ms`);

      return {
        sourceId: source.id,
        sourceName: source.name,
        success: true,
        jobs,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`抓取 ${source.name} 失败:`, error);

      return {
        sourceId: source.id,
        sourceName: source.name,
        success: false,
        jobs: [],
        error: error.message,
        duration,
      };
    }
  }

  private async scrapeApi(source: JobDataSourceConfig): Promise<JobData[]> {
    logger.info(`使用API方式抓取: ${source.name}`);
    
    const jobs: JobData[] = [];
    const { baseUrl, searchEndpoint, headers, keywords } = source.config;

    for (const keyword of keywords) {
      try {
        const url = `${baseUrl}${searchEndpoint}?description=${encodeURIComponent(keyword)}`;
        
        const response = await fetch(url, {
          headers: headers || {},
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const parsedJobs = this.parseApiResponse(data, source.id, keyword);
        jobs.push(...parsedJobs);

        if (source.rateLimit) {
          await delay(source.rateLimit.delayBetweenRequests);
        }
      } catch (error: any) {
        logger.warn(`抓取关键词 "${keyword}" 失败:`, error.message);
      }
    }

    return jobs;
  }

  private async scrapeWeb(source: JobDataSourceConfig): Promise<JobData[]> {
    logger.info(`使用网页抓取方式抓取: ${source.name}`);
    
    const jobs: JobData[] = [];
    const { baseUrl, searchEndpoint, headers, keywords } = source.config;

    for (const keyword of keywords) {
      try {
        const url = `${baseUrl}${searchEndpoint}?q=${encodeURIComponent(keyword)}`;
        
        const response = await fetch(url, {
          headers: headers || {},
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const parsedJobs = this.parseHtmlResponse(html, source.id, keyword, url);
        jobs.push(...parsedJobs);

        if (source.rateLimit) {
          await delay(source.rateLimit.delayBetweenRequests);
        }
      } catch (error: any) {
        logger.warn(`抓取关键词 "${keyword}" 失败:`, error.message);
      }
    }

    return jobs;
  }

  private async scrapeRss(source: JobDataSourceConfig): Promise<JobData[]> {
    logger.info(`使用RSS方式抓取: ${source.name}`);
    
    const jobs: JobData[] = [];
    const { baseUrl, searchEndpoint, headers } = source.config;

    try {
      const url = `${baseUrl}${searchEndpoint}`;
      
      const response = await fetch(url, {
        headers: headers || {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xml = await response.text();
      const parsedJobs = this.parseRssResponse(xml, source.id);
      jobs.push(...parsedJobs);
    } catch (error: any) {
      logger.warn(`RSS抓取失败:`, error.message);
    }

    return jobs;
  }

  private parseApiResponse(data: any, sourceId: string, keyword: string): JobData[] {
    const jobs: JobData[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        const job: JobData = {
          title: item.title || item.position || '',
          company: item.company || item.organization || '',
          location: item.location || '',
          description: item.description || item.description_html || '',
          requirements: item.requirements || '',
          source: sourceId,
          sourceUrl: item.url || item.link || item.apply_url || '',
          tags: [keyword],
        };

        if (job.title && job.company) {
          jobs.push(job);
        }
      }
    }

    return jobs;
  }

  private parseHtmlResponse(html: string, sourceId: string, keyword: string, url: string): JobData[] {
    const jobs: JobData[] = [];

    try {
      if (sourceId === 'linkedin') {
        return this.parseLinkedInJobs(html, keyword);
      } else if (sourceId === 'indeed') {
        return this.parseIndeedJobs(html, keyword);
      } else if (sourceId === 'glassdoor') {
        return this.parseGlassdoorJobs(html, keyword);
      } else if (sourceId === 'arxiv-jobs') {
        return this.parseArxivJobs(html, keyword);
      } else if (sourceId === 'researchgate') {
        return this.parseResearchGateJobs(html, keyword);
      }
    } catch (error: any) {
      logger.warn(`解析HTML失败 (${sourceId}):`, error.message);
    }

    return jobs;
  }

  private parseRssResponse(xml: string, sourceId: string): JobData[] {
    const jobs: JobData[] = [];
    
    try {
      const titleRegex = /<title>(.*?)<\/title>/g;
      const linkRegex = /<link>(.*?)<\/link>/g;
      const descriptionRegex = /<description>(.*?)<\/description>/g;

      const titles = [...xml.matchAll(titleRegex)].map(m => m[1]);
      const links = [...xml.matchAll(linkRegex)].map(m => m[1]);
      const descriptions = [...xml.matchAll(descriptionRegex)].map(m => m[1]);

      for (let i = 0; i < titles.length; i++) {
        const job: JobData = {
          title: titles[i] || '',
          company: sourceId,
          description: descriptions[i] || '',
          source: sourceId,
          sourceUrl: links[i] || '',
        };

        if (job.title) {
          jobs.push(job);
        }
      }
    } catch (error: any) {
      logger.warn(`解析RSS失败:`, error.message);
    }

    return jobs;
  }

  private parseLinkedInJobs(html: string, keyword: string): JobData[] {
    const jobs: JobData[] = [];

    try {
      const jobCardRegex = /<div[^>]*class="[^"]*job-card[^"]*"[^>]*>(.*?)<\/div>/gs;
      const matches = [...html.matchAll(jobCardRegex)];

      for (const match of matches) {
        const cardHtml = match[1];
        
        const titleMatch = cardHtml.match(/<h3[^>]*>(.*?)<\/h3>/);
        const companyMatch = cardHtml.match(/<h4[^>]*>(.*?)<\/h4>/);
        const locationMatch = cardHtml.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/);

        if (titleMatch && companyMatch) {
          jobs.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            company: companyMatch[1].replace(/<[^>]*>/g, '').trim(),
            location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            source: 'linkedin',
            tags: [keyword],
          });
        }
      }
    } catch (error: any) {
      logger.warn('解析LinkedIn职位失败:', error.message);
    }

    return jobs;
  }

  private parseIndeedJobs(html: string, keyword: string): JobData[] {
    const jobs: JobData[] = [];

    try {
      const jobCardRegex = /<div[^>]*class="[^"]*job_seen_beacon[^"]*"[^>]*>(.*?)<\/div>/gs;
      const matches = [...html.matchAll(jobCardRegex)];

      for (const match of matches) {
        const cardHtml = match[1];
        
        const titleMatch = cardHtml.match(/<h2[^>]*>(.*?)<\/h2>/);
        const companyMatch = cardHtml.match(/<span[^>]*data-testid="company-name"[^>]*>(.*?)<\/span>/);
        const locationMatch = cardHtml.match(/<div[^>]*data-testid="text-location"[^>]*>(.*?)<\/div>/);

        if (titleMatch && companyMatch) {
          jobs.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            company: companyMatch[1].replace(/<[^>]*>/g, '').trim(),
            location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            source: 'indeed',
            tags: [keyword],
          });
        }
      }
    } catch (error: any) {
      logger.warn('解析Indeed职位失败:', error.message);
    }

    return jobs;
  }

  private parseGlassdoorJobs(html: string, keyword: string): JobData[] {
    const jobs: JobData[] = [];

    try {
      const jobCardRegex = /<li[^>]*class="[^"]*JobCard[^"]*"[^>]*>(.*?)<\/li>/gs;
      const matches = [...html.matchAll(jobCardRegex)];

      for (const match of matches) {
        const cardHtml = match[1];
        
        const titleMatch = cardHtml.match(/<a[^>]*class="[^"]*JobTitle[^"]*"[^>]*>(.*?)<\/a>/);
        const companyMatch = cardHtml.match(/<span[^>]*class="[^"]*EmployerName[^"]*"[^>]*>(.*?)<\/span>/);
        const locationMatch = cardHtml.match(/<span[^>]*class="[^"]*Location[^"]*"[^>]*>(.*?)<\/span>/);

        if (titleMatch && companyMatch) {
          jobs.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            company: companyMatch[1].replace(/<[^>]*>/g, '').trim(),
            location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            source: 'glassdoor',
            tags: [keyword],
          });
        }
      }
    } catch (error: any) {
      logger.warn('解析Glassdoor职位失败:', error.message);
    }

    return jobs;
  }

  private parseArxivJobs(html: string, keyword: string): JobData[] {
    const jobs: JobData[] = [];

    try {
      const dtRegex = /<dt>(.*?)<\/dt>/gs;
      const ddRegex = /<dd>(.*?)<\/dd>/gs;
      
      const titles = [...html.matchAll(dtRegex)].map(m => m[1]);
      const descriptions = [...html.matchAll(ddRegex)].map(m => m[1]);

      for (let i = 0; i < titles.length; i++) {
        const titleMatch = titles[i].match(/<a[^>]*>(.*?)<\/a>/);
        
        if (titleMatch) {
          const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          
          if (title.toLowerCase().includes('job') || title.toLowerCase().includes('position') || title.toLowerCase().includes('hiring')) {
            jobs.push({
              title: title,
              company: 'ArXiv',
              description: descriptions[i] || '',
              source: 'arxiv-jobs',
              tags: [keyword],
            });
          }
        }
      }
    } catch (error: any) {
      logger.warn('解析ArXiv职位失败:', error.message);
    }

    return jobs;
  }

  private parseResearchGateJobs(html: string, keyword: string): JobData[] {
    const jobs: JobData[] = [];

    try {
      const jobCardRegex = /<div[^>]*class="[^"]*job-item[^"]*"[^>]*>(.*?)<\/div>/gs;
      const matches = [...html.matchAll(jobCardRegex)];

      for (const match of matches) {
        const cardHtml = match[1];
        
        const titleMatch = cardHtml.match(/<h3[^>]*>(.*?)<\/h3>/);
        const companyMatch = cardHtml.match(/<span[^>]*class="[^"]*institution[^"]*"[^>]*>(.*?)<\/span>/);

        if (titleMatch && companyMatch) {
          jobs.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            company: companyMatch[1].replace(/<[^>]*>/g, '').trim(),
            source: 'researchgate',
            tags: [keyword],
          });
        }
      }
    } catch (error: any) {
      logger.warn('解析ResearchGate职位失败:', error.message);
    }

    return jobs;
  }
}

export default JobScraper;
