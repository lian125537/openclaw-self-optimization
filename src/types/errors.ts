/**
 * 错误处理系统类型定义
 * 企业级错误处理体系
 */

import { ErrorCategory, ErrorSeverity, StandardError, ErrorOptions } from './core';

// ==================== 错误代码定义 ====================

/** 通用错误代码 */
export enum CommonErrorCode {
  // 验证错误
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  
  // 网络错误
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_UNREACHABLE = 'NETWORK_UNREACHABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // 认证授权错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // 业务错误
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // 外部服务错误
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE'
}

/** OpenClaw特定错误代码 */
export enum OpenClawErrorCode {
  // Gateway错误
  GATEWAY_NOT_RUNNING = 'GATEWAY_NOT_RUNNING',
  GATEWAY_CONNECTION_FAILED = 'GATEWAY_CONNECTION_FAILED',
  WEBSOCKET_ERROR_1006 = 'WEBSOCKET_ERROR_1006',
  
  // 技能错误
  SKILL_NOT_FOUND = 'SKILL_NOT_FOUND',
  SKILL_EXECUTION_FAILED = 'SKILL_EXECUTION_FAILED',
  SKILL_VALIDATION_FAILED = 'SKILL_VALIDATION_FAILED',
  
  // 记忆错误
  MEMORY_INDEX_FAILED = 'MEMORY_INDEX_FAILED',
  MEMORY_SEARCH_FAILED = 'MEMORY_SEARCH_FAILED',
  EMBEDDING_UNAVAILABLE = 'EMBEDDING_UNAVAILABLE',
  
  // 模型错误
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  MODEL_RATE_LIMITED = 'MODEL_RATE_LIMITED',
  MODEL_INVALID_RESPONSE = 'MODEL_INVALID_RESPONSE',
  
  // 配置错误
  CONFIG_VALIDATION_FAILED = 'CONFIG_VALIDATION_FAILED',
  CONFIG_MISSING_REQUIRED = 'CONFIG_MISSING_REQUIRED',
  CONFIG_INVALID_VALUE = 'CONFIG_INVALID_VALUE'
}

// ==================== 错误工厂类型 ====================

/** 错误创建函数 */
export type ErrorFactory = (options: {
  code: string;
  message: string;
  category: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  cause?: Error;
}) => StandardError;

/** 错误映射规则 */
export interface ErrorMappingRule {
  match: (error: any) => boolean;
  transform: (error: any) => StandardError;
}

/** 错误恢复策略 */
export interface ErrorRecoveryStrategy {
  canRetry: (error: StandardError) => boolean;
  maxRetries: number;
  backoffMs: number;
  fallback?: () => any;
}

// ==================== 错误处理中间件类型 ====================

/** 错误处理中间件上下文 */
export interface ErrorMiddlewareContext {
  requestId: string;
  timestamp: Date;
  operation: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/** 错误处理中间件函数 */
export type ErrorMiddleware = (
  error: StandardError,
  context: ErrorMiddlewareContext
) => Promise<void> | void;

/** 错误处理管道 */
export interface ErrorPipeline {
  use(middleware: ErrorMiddleware): ErrorPipeline;
  handle(error: StandardError, context: ErrorMiddlewareContext): Promise<void>;
}

// ==================== 错误监控类型 ====================

/** 错误统计 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<string, number>;
  lastErrorTime: Date;
  errorRate: number; // 错误/分钟
}

/** 错误告警规则 */
export interface ErrorAlertRule {
  id: string;
  condition: (stats: ErrorStatistics) => boolean;
  severity: ErrorSeverity;
  message: string;
  actions: string[]; // 'email', 'slack', 'pagerduty', etc.
  cooldownMs: number;
}

/** 错误报告 */
export interface ErrorReport {
  summary: ErrorStatistics;
  recentErrors: StandardError[];
  topErrorPatterns: ErrorPattern[];
  recommendations: string[];
}

/** 错误模式 */
export interface ErrorPattern {
  pattern: string;
  frequency: number;
  examples: StandardError[];
  rootCause?: string;
  suggestedFix?: string;
}

// ==================== 工具函数类型 ====================

/** 错误规范化函数 */
export type ErrorNormalizer = (error: any) => StandardError;

/** 错误分类器 */
export type ErrorClassifier = (error: StandardError) => {
  category: ErrorCategory;
  severity: ErrorSeverity;
  actionable: boolean;
};

/** 错误记录器 */
export type ErrorLogger = (error: StandardError, context?: any) => void;

// ==================== 导出 ====================

export {
  ErrorCategory,
  ErrorSeverity,
  StandardError,
  ErrorOptions
};