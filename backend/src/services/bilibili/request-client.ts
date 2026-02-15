import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Credential } from './credential';
import { BilibiliAPIError, BilibiliRateLimitError, RequestConfig } from './types';
import { logger } from '../../utils/logger';
import { BilibiliCookieManager } from '../bilibili-cookie-manager.service';
import { addWBISign } from '../../utils/bilibili-wbi';
import { getBilibiliRateLimiter, BilibiliRateLimiter } from '../../utils/rate-limiter';

export class BilibiliRequestClient {
  private axiosInstance: AxiosInstance;
  private credential: Credential;
  private defaultConfig: RequestConfig;
  private rateLimiter: BilibiliRateLimiter;

  constructor(credential?: Credential, config?: RequestConfig) {
    this.credential = credential || new Credential();
    this.defaultConfig = {
      timeout: config?.timeout || 15000,
      retries: config?.retries || 3,
      retryDelay: config?.retryDelay || 2000,
      useCredential: config?.useCredential !== false,
      enableWBI: config?.enableWBI !== false,
    };
    this.rateLimiter = getBilibiliRateLimiter();

    this.axiosInstance = axios.create({
      baseURL: 'https://api.bilibili.com',
      timeout: this.defaultConfig.timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((config) => {
      config.headers = this.buildHeaders(config);
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        const retryConfig = config as any;
        if (!retryConfig || retryConfig.__retryCount === undefined) {
          return Promise.reject(error);
        }

        const retryCount: number = (retryConfig.__retryCount as number) || 0;
        const maxRetries: number = this.defaultConfig?.retries || 3;
        if (retryCount >= maxRetries) {
          return Promise.reject(error);
        }

        retryConfig.__retryCount = retryCount + 1;

        if (error.response && error.response.status === 412) {
          const currentRetryCount: number = retryConfig.__retryCount || 0;
          const retryDelay: number = this.defaultConfig.retryDelay || 2000;
          logger.warn(`Bilibili API 412错误，第${currentRetryCount}次重试...`);
          await this.delay(retryDelay * currentRetryCount);
          return this.axiosInstance(retryConfig);
        }

        if (error.response && error.response.status >= 500) {
          const currentRetryCount: number = retryConfig.__retryCount || 0;
          const retryDelay: number = this.defaultConfig.retryDelay || 2000;
          logger.warn(`Bilibili API ${error.response.status}错误，第${currentRetryCount}次重试...`);
          await this.delay(retryDelay);
          return this.axiosInstance(retryConfig);
        }

        return Promise.reject(error);
      }
    );
  }

  private buildHeaders(config: AxiosRequestConfig): any {
    const headers: any = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://www.bilibili.com',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Ch-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-UA-Mobile': '?0',
      'Sec-Ch-UA-Platform': '"macOS"',
    };

    if (this.defaultConfig.useCredential) {
      const cookie = BilibiliCookieManager.getActiveCookie();
      if (cookie) {
        headers['Cookie'] = cookie;
      } else if ((this.credential as any).cookies) {
        headers['Cookie'] = (this.credential as any).cookies;
      } else if (this.credential.hasCredential()) {
        headers['Cookie'] = this.credential.toCookie();
      }
    }

    return headers;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<T> {
    try {
      await this.rateLimiter.waitWithJitter();
      
      let finalParams = params || {};
      
      const wbiEnabled = config?.enableWBI !== false && this.defaultConfig.enableWBI;
      if (wbiEnabled && finalParams && typeof finalParams === 'object') {
        try {
          finalParams = await addWBISign(finalParams);
        } catch (error) {
          logger.warn('添加WBI签名失败，继续请求:', error);
        }
      }

      const response: AxiosResponse = await this.axiosInstance.get(url, {
        params: finalParams,
        ...config,
        __retryCount: 0,
      } as any);

      if (response.data?.code === -412) {
        this.rateLimiter.recordRateLimit();
        throw new BilibiliRateLimitError('Bilibili API rate limit exceeded');
      }

      if (response.data?.code === -101) {
        this.rateLimiter.recordFailure(new BilibiliAPIError('Bilibili authentication failed', -101));
        throw new BilibiliAPIError('Bilibili authentication failed', -101);
      }

      if (response.data?.code !== 0 && response.data?.code !== undefined) {
        this.rateLimiter.recordFailure();
        throw new BilibiliAPIError(
          response.data.message || 'Bilibili API error',
          response.data.code,
          response.status
        );
      }

      this.rateLimiter.recordSuccess();
      return response.data.data;
    } catch (error: any) {
      if (error instanceof BilibiliAPIError) {
        if (!(error instanceof BilibiliRateLimitError)) {
          this.rateLimiter.recordFailure(error);
        }
        throw error;
      }

      if (error.response?.status === 412) {
        this.rateLimiter.recordRateLimit();
        throw new BilibiliRateLimitError('Bilibili API rate limit exceeded');
      }

      this.rateLimiter.recordFailure(error);
      throw new BilibiliAPIError(
        error.message || 'Unknown error',
        -1,
        error.response?.status
      );
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse = await this.axiosInstance.post(url, data, {
        ...config,
        __retryCount: 0,
      } as any);

      if (response.data?.code === -412) {
        throw new BilibiliRateLimitError('Bilibili API rate limit exceeded');
      }

      if (response.data?.code !== 0 && response.data?.code !== undefined) {
        throw new BilibiliAPIError(
          response.data.message || 'Bilibili API error',
          response.data.code,
          response.status
        );
      }

      return response.data.data;
    } catch (error: any) {
      if (error instanceof BilibiliAPIError) {
        throw error;
      }

      if (error.response?.status === 412) {
        throw new BilibiliRateLimitError('Bilibili API rate limit exceeded');
      }

      throw new BilibiliAPIError(
        error.message || 'Unknown error',
        -1,
        error.response?.status
      );
    }
  }

  setCredential(credential: Credential): void {
    this.credential = credential;
  }

  getCredential(): Credential {
    return this.credential;
  }
}
