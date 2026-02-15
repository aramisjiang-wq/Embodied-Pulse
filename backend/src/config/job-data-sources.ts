/**
 * 招聘信息数据源配置
 * 定义不同招聘网站的数据源配置
 */

export interface JobDataSourceConfig {
  id: string;
  name: string;
  type: 'api' | 'scraper' | 'rss';
  enabled: boolean;
  priority: number;
  config: {
    baseUrl?: string;
    searchEndpoint?: string;
    headers?: Record<string, string>;
    keywords: string[];
    location?: string;
    experience?: string[];
    salaryRange?: { min?: number; max?: number };
  };
  rateLimit?: {
    requestsPerMinute: number;
    delayBetweenRequests: number;
  };
}

export const JOB_DATA_SOURCES: JobDataSourceConfig[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    type: 'scraper',
    enabled: true,
    priority: 100,
    config: {
      baseUrl: 'https://www.linkedin.com',
      searchEndpoint: '/jobs/search',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      keywords: [
        'embodied AI',
        'embodied intelligence',
        'embodied robotics',
        'robotics engineer',
        'computer vision',
        'machine learning',
        'deep learning',
        'AI research',
        'robotics research',
        'autonomous systems',
        'perception engineer',
        'control systems',
        'SLAM',
        'navigation',
        'manipulation',
        'grasping',
      ],
      location: 'United States',
      experience: ['Entry level', 'Mid-Senior level', 'Director', 'Executive'],
    },
    rateLimit: {
      requestsPerMinute: 10,
      delayBetweenRequests: 6000,
    },
  },
  {
    id: 'indeed',
    name: 'Indeed',
    type: 'scraper',
    enabled: true,
    priority: 90,
    config: {
      baseUrl: 'https://www.indeed.com',
      searchEndpoint: '/jobs',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      keywords: [
        'embodied AI',
        'embodied intelligence',
        'robotics engineer',
        'computer vision engineer',
        'machine learning engineer',
        'AI researcher',
        'robotics researcher',
        'autonomous vehicle',
        'self-driving',
        'perception engineer',
        'robotics software',
      ],
      location: 'United States',
    },
    rateLimit: {
      requestsPerMinute: 15,
      delayBetweenRequests: 4000,
    },
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    type: 'scraper',
    enabled: true,
    priority: 85,
    config: {
      baseUrl: 'https://www.glassdoor.com',
      searchEndpoint: '/Job/jobs.htm',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      keywords: [
        'embodied AI',
        'robotics engineer',
        'computer vision',
        'machine learning',
        'AI research',
        'robotics',
        'autonomous',
        'perception',
      ],
      location: 'United States',
    },
    rateLimit: {
      requestsPerMinute: 12,
      delayBetweenRequests: 5000,
    },
  },
  {
    id: 'github',
    name: 'GitHub Jobs',
    type: 'api',
    enabled: true,
    priority: 80,
    config: {
      baseUrl: 'https://jobs.github.com',
      searchEndpoint: '/positions.json',
      headers: {
        'Accept': 'application/json',
      },
      keywords: [
        'robotics',
        'computer vision',
        'machine learning',
        'AI',
        'autonomous',
        'perception',
        'control',
      ],
    },
    rateLimit: {
      requestsPerMinute: 30,
      delayBetweenRequests: 2000,
    },
  },
  {
    id: 'arxiv-jobs',
    name: 'ArXiv Jobs',
    type: 'scraper',
    enabled: true,
    priority: 75,
    config: {
      baseUrl: 'https://arxiv.org',
      searchEndpoint: '/list/cs.RO',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      keywords: [
        'embodied',
        'robotics',
        'computer vision',
        'machine learning',
        'AI',
      ],
    },
    rateLimit: {
      requestsPerMinute: 20,
      delayBetweenRequests: 3000,
    },
  },
  {
    id: 'researchgate',
    name: 'ResearchGate Jobs',
    type: 'scraper',
    enabled: true,
    priority: 70,
    config: {
      baseUrl: 'https://www.researchgate.net',
      searchEndpoint: '/job',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      keywords: [
        'embodied AI',
        'robotics',
        'computer vision',
        'machine learning',
        'AI research',
      ],
    },
    rateLimit: {
      requestsPerMinute: 15,
      delayBetweenRequests: 4000,
    },
  },
];

export function getEnabledDataSources(): JobDataSourceConfig[] {
  return JOB_DATA_SOURCES.filter(source => source.enabled)
    .sort((a, b) => b.priority - a.priority);
}

export function getDataSourceById(id: string): JobDataSourceConfig | undefined {
  return JOB_DATA_SOURCES.find(source => source.id === id);
}
