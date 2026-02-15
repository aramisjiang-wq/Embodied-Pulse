type Environment = 'development' | 'staging' | 'production';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

interface EnvConfig {
  [key: string]: {
    baseUrl: string;
    timeout: number;
    retries: number;
    debug: boolean;
    fallbackUrl: string;
  };
}

const ENV_CONFIGS: EnvConfig = {
  development: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000,
    retries: 3,
    debug: true,
    fallbackUrl: 'http://localhost:3001',
  },
  staging: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://api.staging.embodiedpulse.com',
    timeout: 30000,
    retries: 2,
    debug: true,
    fallbackUrl: 'http://api.staging.embodiedpulse.com',
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.embodiedpulse.com',
    timeout: 30000,
    retries: 1,
    debug: false,
    fallbackUrl: 'https://api.embodiedpulse.com',
  },
};

export function detectEnvironment(): Environment {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  const hostname = window.location.hostname;

  if (hostname.includes('staging') || hostname.includes('pre')) {
    return 'staging';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }

  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function getApiConfig(): ApiConfig {
  const env = detectEnvironment();
  const envConfig = ENV_CONFIGS[env];
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

  return {
    baseUrl: configuredUrl || envConfig.baseUrl,
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || String(envConfig.timeout), 10),
    retries: parseInt(process.env.NEXT_PUBLIC_API_RETRIES || String(envConfig.retries), 10),
    debug: process.env.NEXT_PUBLIC_API_DEBUG === 'true' || envConfig.debug,
  };
}

export function getFallbackUrl(): string {
  const env = detectEnvironment();
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  return configuredUrl || ENV_CONFIGS[env].fallbackUrl;
}

export function isDevelopment(): boolean {
  return detectEnvironment() === 'development';
}

export function isProduction(): boolean {
  return detectEnvironment() === 'production';
}

export function isStaging(): boolean {
  return detectEnvironment() === 'staging';
}

export const API_CONFIG = getApiConfig();
