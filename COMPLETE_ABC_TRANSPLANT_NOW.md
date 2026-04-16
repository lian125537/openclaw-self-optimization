/**
 * API包装器 - TypeScript版
 * 统一API接口、错误处理、重试机制、类型安全
 */

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryableStatusCodes: number[];
  };
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: T;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: ApiRequest;
  timestamp: Date;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
  config: ApiRequest;
  response?: ApiResponse;
  isRetryable: boolean;
}

export class ApiWrapper {
  private config: Required<ApiConfig>;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  
  constructor(config: ApiConfig) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retry: {
        maxRetries: config.retry?.maxRetries || 3,
        baseDelay: config.retry?.baseDelay || 1000,
        maxDelay: config.retry?.maxDelay || 30000,
        retryableStatusCodes: config.retry?.retryableStatusCodes || [429, 503, 504]
      },
      cache: {
        enabled: config.cache?.enabled || false,
        ttl: config.cache?.ttl || 300000 // 5分钟
      }
    };
    
    console.log('🚀 API包装器初始化完成');
  }
  
  async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    
    // 检查缓存
    if (this.config.cache.enabled && request.method === 'GET' && request.cacheKey) {
      const cached = this.getFromCache<T>(request.cacheKey);
      if (cached) {
        console.log(`✅ 缓存命中: ${request.url}`);
        return cached;
      }
    }
    
    // 执行请求（带重试）
    const response = await this.executeWithRetry<T>(request);
    
    // 缓存响应
    if (this.config.cache.enabled && request.method === 'GET' && request.cacheKey) {
      this.setCache(request.cacheKey, response, request.cacheTTL || this.config.cache.ttl);
    }
    
    const duration = Date.now() - startTime;
    console.log(`📡 API请求完成: ${request.method} ${request.url} (${duration}ms)`);
    
    return response;
  }
  
  async get<T = any>(url: string, config?: Omit<ApiRequest, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config
    });
  }
  
  async post<T = any>(url: string, data?: any, config?: Omit<ApiRequest, 'method' | 'url' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }
  
  async put<T = any>(url: string, data?: any, config?: Omit<ApiRequest, 'method' | 'url' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }
  
  async delete<T = any>(url: string, config?: Omit<ApiRequest, 'method' | 'url'>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }
  
  private async executeWithRetry<T>(request: ApiRequest, attempt = 0): Promise<ApiResponse<T>> {
    try {
      const fullUrl = this.buildFullUrl(request.url);
      const headers = this.buildHeaders(request.headers);
      
      // 模拟API调用
      const response = await this.mockApiCall<T>(request, fullUrl, headers);
      
      return {
        data: response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: request,
        timestamp: new Date()
      };
      
    } catch (error) {
      const apiError = error as ApiError;
      
      // 检查是否应该重试
      const shouldRetry = attempt < this.config.retry.maxRetries && 
        (apiError.isRetryable || 
         (apiError.status && this.config.retry.retryableStatusCodes.includes(apiError.status)));
      
      if (shouldRetry) {
        const delay = this.calculateRetryDelay(attempt);
        console.log(`⏳ 重试请求 (${attempt + 1}/${this.config.retry.maxRetries}): ${request.url} (等待 ${delay}ms)`);
        
        await this.sleep(delay);
        return this.executeWithRetry<T>(request, attempt + 1);
      }
      
      throw apiError;
    }
  }
  
  private buildFullUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.config.baseURL}${url}`;
  }
  
  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...extraHeaders
    };
  }
  
  private async mockApiCall<T>(request: ApiRequest, url: string, headers: Record<string, string>): Promise<T> {
    // 模拟网络延迟
    await this.sleep(100 + Math.random() * 200);
    
    // 模拟成功率
    const successRate = 0.95; // 95%成功率
    if (Math.random() > successRate) {
      const error = new Error(`API请求失败: ${request.method} ${url}`) as ApiError;
      error.code = 'API_ERROR';
      error.status = Math.random() > 0.5 ? 429 : 503;
      error.config = request;
      error.isRetryable = true;
      throw error;
    }
    
    // 返回模拟数据
    return this.generateMockResponse<T>(request);
  }
  
  private generateMockResponse<T>(request: ApiRequest): T {
    const baseResponse = {
      id: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // 根据请求类型生成不同的响应
    switch (request.method) {
      case 'GET':
        return {
          ...baseResponse,
          data: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            name: `项目 ${i + 1}`,
            status: ['active', 'pending', 'completed'][i % 3]
          })),
          total: 5,
          page: 1,
          pageSize: 10
        } as T;
        
      case 'POST':
        return {
          ...baseResponse,
          success: true,
          createdId: Math.floor(Math.random() * 1000),
          message: '创建成功'
        } as T;
        
      case 'PUT':
        return {
          ...baseResponse,
          success: true,
          updatedId: request.data?.id || Math.floor(Math.random() * 1000),
          message: '更新成功'
        } as T;
        
      case 'DELETE':
        return {
          ...baseResponse,
          success: true,
          deletedId: request.data?.id || Math.floor(Math.random() * 1000),
          message: '删除成功'
        } as T;
        
      default:
        return baseResponse as T;
    }
  }
  
  private calculateRetryDelay(attempt: number): number {
    const delay = this.config.retry.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.config.retry.maxDelay);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  private setCache(key: string, response: ApiResponse, ttl: number): void {
    this.cache.set(key, {
      data: response,
      expires: Date.now() + ttl
    });
  }
  
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 API缓存已清空');
  }
  
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出工厂函数
export function createApiWrapper(config: ApiConfig) {
  return new ApiWrapper(config);
}

// 导出类型
export type {
  ApiConfig,
  ApiRequest,
  ApiResponse,
  ApiError
};