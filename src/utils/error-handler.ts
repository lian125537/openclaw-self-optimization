/**
 * 企业级错误处理中间件
 * 统一错误处理、恢复、监控
 */

import { 
  StandardError, 
  ErrorCategory, 
  ErrorSeverity,
  CommonErrorCode,
  OpenClawErrorCode,
  ErrorMiddleware,
  ErrorMiddlewareContext,
  ErrorPipeline,
  ErrorStatistics,
  ErrorAlertRule
} from '../types/errors';

// ==================== 错误工厂 ====================

/**
 * 创建标准化错误
 */
export class ErrorFactory {
  static create(options: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
    cause?: Error;
  }): StandardError {
    const error = new Error(options.message) as StandardError;
    
    error.code = options.code;
    error.category = options.category;
    error.severity = options.severity || ErrorSeverity.MEDIUM;
    error.timestamp = new Date();
    error.context = options.context;
    error.cause = options.cause;
    
    // 保留原始堆栈
    // Error.captureStackTrace 在Node.js中可用，但在TypeScript类型中不存在
    // 使用类型断言绕过类型检查
    const errorConstructor = Error as any;
    if (errorConstructor.captureStackTrace) {
      errorConstructor.captureStackTrace(error, ErrorFactory.create);
    }
    
    return error;
  }

  /**
   * 创建验证错误
   */
  static validation(
    message: string, 
    context?: Record<string, any>,
    cause?: Error
  ): StandardError {
    return this.create({
      code: CommonErrorCode.VALIDATION_FAILED,
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      context: context as any,
      cause: cause as any
    });
  }

  /**
   * 创建网络错误
   */
  static network(
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ): StandardError {
    return this.create({
      code: CommonErrorCode.NETWORK_TIMEOUT,
      message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      context: context as any,
      cause: cause as any
    });
  }

  /**
   * 创建认证错误
   */
  static authentication(
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ): StandardError {
    return this.create({
      code: CommonErrorCode.UNAUTHORIZED,
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      context: context as any,
      cause: cause as any
    });
  }

  /**
   * 创建系统错误
   */
  static system(
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ): StandardError {
    return this.create({
      code: CommonErrorCode.INTERNAL_ERROR,
      message,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      context: context as any,
      cause: cause as any
    });
  }

  /**
   * 创建OpenClaw特定错误
   */
  static openclaw(
    code: OpenClawErrorCode,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ): StandardError {
    return this.create({
      code,
      message,
      category: ErrorCategory.SYSTEM,
      severity: this.getOpenClawErrorSeverity(code),
      context: context as any,
      cause: cause as any
    });
  }

  /**
   * 根据错误代码获取严重程度
   */
  private static getOpenClawErrorSeverity(code: OpenClawErrorCode): ErrorSeverity {
    const severityMap: Record<OpenClawErrorCode, ErrorSeverity> = {
      [OpenClawErrorCode.GATEWAY_NOT_RUNNING]: ErrorSeverity.CRITICAL,
      [OpenClawErrorCode.GATEWAY_CONNECTION_FAILED]: ErrorSeverity.HIGH,
      [OpenClawErrorCode.WEBSOCKET_ERROR_1006]: ErrorSeverity.HIGH,
      [OpenClawErrorCode.SKILL_NOT_FOUND]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.SKILL_EXECUTION_FAILED]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.SKILL_VALIDATION_FAILED]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.MEMORY_INDEX_FAILED]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.MEMORY_SEARCH_FAILED]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.EMBEDDING_UNAVAILABLE]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.MODEL_UNAVAILABLE]: ErrorSeverity.HIGH,
      [OpenClawErrorCode.MODEL_RATE_LIMITED]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.MODEL_INVALID_RESPONSE]: ErrorSeverity.MEDIUM,
      [OpenClawErrorCode.CONFIG_VALIDATION_FAILED]: ErrorSeverity.HIGH,
      [OpenClawErrorCode.CONFIG_MISSING_REQUIRED]: ErrorSeverity.HIGH,
      [OpenClawErrorCode.CONFIG_INVALID_VALUE]: ErrorSeverity.MEDIUM
    };

    return severityMap[code] || ErrorSeverity.MEDIUM;
  }
}

// ==================== 错误处理管道 ====================

/**
 * 错误处理管道实现
 */
export class ErrorPipelineImpl implements ErrorPipeline {
  private middlewares: ErrorMiddleware[] = [];
  private statistics: ErrorStatistics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    errorsByCode: {},
    lastErrorTime: new Date(),
    errorRate: 0
  };
  private alertRules: ErrorAlertRule[] = [];

  use(middleware: ErrorMiddleware): ErrorPipeline {
    this.middlewares.push(middleware);
    return this;
  }

  async handle(error: StandardError, context: ErrorMiddlewareContext): Promise<void> {
    // 更新统计
    this.updateStatistics(error);
    
    // 执行中间件链
    for (const middleware of this.middlewares) {
      try {
        await middleware(error, context);
      } catch (middlewareError) {
        console.error('Error middleware failed:', middlewareError);
      }
    }
    
    // 检查告警规则
    this.checkAlerts();
  }

  /**
   * 更新错误统计
   */
  private updateStatistics(error: StandardError): void {
    this.statistics.totalErrors++;
    
    // 按分类统计
    this.statistics.errorsByCategory[error.category] = 
      (this.statistics.errorsByCategory[error.category] || 0) + 1;
    
    // 按严重程度统计
    this.statistics.errorsBySeverity[error.severity] = 
      (this.statistics.errorsBySeverity[error.severity] || 0) + 1;
    
    // 按错误代码统计
    this.statistics.errorsByCode[error.code] = 
      (this.statistics.errorsByCode[error.code] || 0) + 1;
    
    this.statistics.lastErrorTime = new Date();
    
    // 计算错误率（简化版）
    // 这里需要更复杂的实现来准确计算错误率
  }

  /**
   * 检查告警规则
   */
  private checkAlerts(): void {
    for (const rule of this.alertRules) {
      if (rule.condition(this.statistics)) {
        this.triggerAlert(rule);
      }
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(rule: ErrorAlertRule): void {
    console.warn(`🚨 错误告警: ${rule.message}`, {
      severity: rule.severity,
      statistics: this.statistics
    });
    
    // 这里可以集成实际的告警系统
    // 如发送邮件、Slack消息、调用Webhook等
  }

  /**
   * 获取错误统计报告
   */
  getStatistics(): ErrorStatistics {
    return { ...this.statistics };
  }

  /**
   * 添加告警规则
   */
  addAlertRule(rule: ErrorAlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * 重置统计
   */
  resetStatistics(): void {
    this.statistics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCode: {},
      lastErrorTime: new Date(),
      errorRate: 0
    };
  }
}

// ==================== 预定义中间件 ====================

/**
 * 日志记录中间件
 */
export const loggingMiddleware: ErrorMiddleware = async (error, context) => {
  const logEntry = {
    timestamp: error.timestamp.toISOString(),
    requestId: context.requestId,
    operation: context.operation,
    error: {
      code: error.code,
      message: error.message,
      category: error.category,
      severity: error.severity,
      stack: error.stack
    },
    context: {
      userId: context.userId,
      sessionId: context.sessionId,
      ...context.metadata,
      ...error.context
    }
  };

  // 根据严重程度选择日志级别
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      console.error('❌ 严重错误:', logEntry);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('⚠️  警告错误:', logEntry);
      break;
    case ErrorSeverity.LOW:
      console.info('ℹ️  信息错误:', logEntry);
      break;
  }
};

/**
 * 错误恢复中间件
 */
export const recoveryMiddleware: ErrorMiddleware = async (error) => {
  // 根据错误类型尝试恢复
  switch (error.category) {
    case ErrorCategory.NETWORK:
      // 网络错误可以重试
      console.log('尝试网络错误恢复...');
      break;
      
    case ErrorCategory.VALIDATION:
      // 验证错误通常无法自动恢复
      console.log('验证错误，需要用户干预');
      break;
      
    case ErrorCategory.AUTHENTICATION:
      // 认证错误需要重新认证
      console.log('认证错误，需要重新登录');
      break;
      
    default:
      // 其他错误记录但不尝试恢复
      break;
  }
};

/**
 * 监控上报中间件
 */
export const monitoringMiddleware: ErrorMiddleware = async (error, context) => {
  // 这里可以集成监控系统如 Sentry, Datadog 等
  const monitoringData = {
    error_code: error.code,
    error_message: error.message,
    error_category: error.category,
    error_severity: error.severity,
    request_id: context.requestId,
    operation: context.operation,
    timestamp: error.timestamp.toISOString(),
    user_id: context.userId,
    session_id: context.sessionId
  };

  // 模拟发送到监控系统
  console.log('📊 发送到监控系统:', monitoringData);
};

/**
 * 错误通知中间件
 */
export const notificationMiddleware: ErrorMiddleware = async (error, context) => {
  // 只通知严重错误
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    const notification = {
      title: `🚨 ${error.severity} 错误告警`,
      message: `${error.code}: ${error.message}`,
      details: {
        operation: context.operation,
        timestamp: error.timestamp.toISOString(),
        context: error.context
      }
    };

    console.log('📢 发送错误通知:', notification);
    
    // 这里可以集成通知系统如 Slack, Email, SMS 等
  }
};

// ==================== 工具函数 ====================

/**
 * 创建默认错误处理管道
 */
export function createDefaultErrorPipeline(): ErrorPipeline {
  const pipeline = new ErrorPipelineImpl();
  
  // 添加预定义中间件
  pipeline
    .use(loggingMiddleware)
    .use(recoveryMiddleware)
    .use(monitoringMiddleware)
    .use(notificationMiddleware);
  
  // 添加默认告警规则
  pipeline.addAlertRule({
    id: 'high-error-rate',
    condition: (stats) => stats.totalErrors > 100 && stats.errorRate > 10,
    severity: ErrorSeverity.HIGH,
    message: '错误率过高',
    actions: ['slack', 'email'],
    cooldownMs: 5 * 60 * 1000 // 5分钟冷却
  });
  
  pipeline.addAlertRule({
    id: 'critical-errors',
    condition: (stats) => (stats.errorsBySeverity[ErrorSeverity.CRITICAL] || 0) > 5,
    severity: ErrorSeverity.CRITICAL,
    message: '严重错误数量过多',
    actions: ['pagerduty', 'slack'],
    cooldownMs: 15 * 60 * 1000 // 15分钟冷却
  });
  
  return pipeline;
}

/**
 * 包装异步函数，自动处理错误
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Omit<ErrorMiddlewareContext, 'requestId' | 'timestamp'>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullContext: ErrorMiddlewareContext = {
      ...context,
      requestId,
      timestamp: new Date()
    };
    
    try {
      return await fn(...args);
    } catch (error) {
      // 规范化错误
      const normalizedError = normalizeError(error);
      
      // 通过管道处理错误
      const pipeline = createDefaultErrorPipeline();
      await pipeline.handle(normalizedError, fullContext);
      
      // 重新抛出错误（或者返回错误结果，根据业务需求）
      throw normalizedError;
    }
  };
}

/**
 * 规范化任意错误为 StandardError
 */
export function normalizeError(error: any): StandardError {
  if (isStandardError(error)) {
    return error;
  }
  
  // 尝试从错误中提取信息
  const message = error?.message || String(error);
  const code = error?.code || CommonErrorCode.INTERNAL_ERROR;
  
  return ErrorFactory.create({
    code,
    message,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    context: { originalError: error },
    cause: error instanceof Error ? error : undefined as any
  });
}

/**
 * 检查是否为 StandardError
 */
export function isStandardError(error: any): error is StandardError {
  return (
    error instanceof Error &&
    'code' in error &&
    'category' in error &&
    'severity' in error &&
    'timestamp' in error
  );
}

// ==================== 导出 ====================

export default {
  ErrorFactory,
  ErrorPipelineImpl,
  createDefaultErrorPipeline,
  withErrorHandling,
  normalizeError,
  isStandardError,
  loggingMiddleware,
  recoveryMiddleware,
  monitoringMiddleware,
  notificationMiddleware
};