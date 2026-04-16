/**
 * 混合错误处理系统
 * 结合我们的错误处理管道和Claude的错误分类系统
 */

import { 
  ErrorFactory, 
  ErrorPipelineImpl, 
  createDefaultErrorPipeline,
  normalizeError,
  ErrorMiddlewareContext
} from '../utils/error-handler';

import {
  ClaudeCorePortingAdapter,
  createClaudeCorePorting,
  DEFAULT_CLAUDE_OPTIONS,
  ClaudeErrorClassification,
  ClaudeCorePortingOptions
} from './claude-adapter';

import {
  StandardError,
  ErrorCategory,
  ErrorSeverity,
  CommonErrorCode,
  OpenClawErrorCode
} from '../types/errors';

/**
 * 混合错误处理管道
 * 结合我们的管道和Claude的错误分类
 */
export class HybridErrorPipeline extends ErrorPipelineImpl {
  private claudeAdapter: ClaudeCorePortingAdapter | null = null;
  private claudeOptions: ClaudeCorePortingOptions;
  
  constructor(claudeOptions?: Partial<ClaudeCorePortingOptions>) {
    super();
    
    // 合并Claude配置
    this.claudeOptions = {
      ...DEFAULT_CLAUDE_OPTIONS,
      ...claudeOptions
    };
    
    // 初始化Claude适配器（延迟）
    this.initializeClaudeAdapter();
  }
  
  /**
   * 初始化Claude适配器
   */
  private async initializeClaudeAdapter(): Promise<void> {
    try {
      this.claudeAdapter = createClaudeCorePorting(this.claudeOptions);
      await this.claudeAdapter.initialize();
      console.log('✅ Claude错误分类系统初始化完成');
    } catch (error) {
      console.warn('⚠️  Claude错误分类系统初始化失败，将使用基础错误处理:', error);
      this.claudeAdapter = null;
    }
  }
  
  /**
   * 处理错误（增强版）
   */
  async handle(error: StandardError, context: ErrorMiddlewareContext): Promise<void> {
    // 1. 使用Claude进行智能错误分类（如果可用）
    let claudeClassification: ClaudeErrorClassification | null = null;
    
    if (this.claudeAdapter) {
      try {
        claudeClassification = await this.claudeAdapter.classifyError(error);
        
        // 增强错误信息
        error = this.enhanceErrorWithClaudeClassification(error, claudeClassification);
        
        // 记录Claude分类结果
        console.log('🧠 Claude错误分类:', {
          errorCode: error.code,
          claudeType: claudeClassification.errorType?.name,
          confidence: claudeClassification.confidence,
          suggestedActions: claudeClassification.suggestedActions
        });
      } catch (claudeError) {
        console.warn('⚠️  Claude错误分类失败，使用基础处理:', claudeError);
      }
    }
    
    // 2. 根据Claude分类结果调整处理策略
    if (claudeClassification) {
      await this.applyClaudeRecoveryStrategies(error, claudeClassification, context);
    }
    
    // 3. 调用父类的基础管道处理
    await super.handle(error, context);
    
    // 4. 记录混合处理结果
    this.logHybridHandlingResult(error, claudeClassification, context);
  }
  
  /**
   * 使用Claude分类增强错误信息
   */
  private enhanceErrorWithClaudeClassification(
    error: StandardError, 
    classification: ClaudeErrorClassification
  ): StandardError {
    // 创建增强的错误对象
    const enhancedError = { ...error } as any;
    
    // 添加Claude分类元数据
    enhancedError.claudeMetadata = {
      classification: classification.errorType,
      confidence: classification.confidence,
      suggestedActions: classification.suggestedActions,
      recoverySteps: classification.recoverySteps,
      autoRecoverable: classification.errorType?.autoRecoverable || false
    };
    
    // 根据Claude分类调整错误严重程度
    if (classification.errorType) {
      const severityMap: Record<string, ErrorSeverity> = {
        'low': ErrorSeverity.LOW,
        'medium': ErrorSeverity.MEDIUM,
        'high': ErrorSeverity.HIGH,
        'critical': ErrorSeverity.CRITICAL
      };
      
      const claudeSeverity = classification.errorType.severity;
      if (severityMap[claudeSeverity]) {
        enhancedError.severity = severityMap[claudeSeverity];
      }
    }
    
    // 添加恢复建议到上下文
    if (!enhancedError.context) {
      enhancedError.context = {};
    }
    
    enhancedError.context.claudeRecoveryAdvice = classification.recoverySteps;
    enhancedError.context.claudeSuggestedActions = classification.suggestedActions;
    
    return enhancedError;
  }
  
  /**
   * 应用Claude恢复策略
   */
  private async applyClaudeRecoveryStrategies(
    error: StandardError,
    classification: ClaudeErrorClassification,
    context: ErrorMiddlewareContext
  ): Promise<void> {
    const { errorType, suggestedActions, recoverySteps } = classification;
    
    if (!errorType || !errorType.autoRecoverable) {
      return;
    }
    
    console.log('🔄 尝试Claude自动恢复策略:', {
      errorCode: error.code,
      recoverySteps: recoverySteps.slice(0, 3) // 只显示前3个步骤
    });
    
    // 根据错误类型应用不同的恢复策略
    switch (errorType.category) {
      case 'network':
        await this.handleNetworkErrorRecovery(error, context);
        break;
        
      case 'validation':
        await this.handleValidationErrorRecovery(error, context);
        break;
        
      case 'performance':
        await this.handlePerformanceErrorRecovery(error, context);
        break;
        
      default:
        // 通用恢复策略
        await this.handleGenericErrorRecovery(error, context);
    }
  }
  
  /**
   * 处理网络错误恢复
   */
  private async handleNetworkErrorRecovery(error: StandardError, context: ErrorMiddlewareContext): Promise<void> {
    console.log('🌐 网络错误恢复策略:', {
      operation: context.operation,
      suggestedActions: ['重试连接', '检查网络配置', '使用备用端点']
    });
    
    // 这里可以实现具体的网络恢复逻辑
    // 例如：重试连接、切换端点、降级服务等
  }
  
  /**
   * 处理验证错误恢复
   */
  private async handleValidationErrorRecovery(error: StandardError, context: ErrorMiddlewareContext): Promise<void> {
    console.log('✅ 验证错误恢复策略:', {
      operation: context.operation,
      suggestedActions: ['验证输入数据', '提供默认值', '提示用户修正']
    });
    
    // 这里可以实现具体的验证恢复逻辑
    // 例如：数据清洗、默认值填充、用户提示等
  }
  
  /**
   * 处理性能错误恢复
   */
  private async handlePerformanceErrorRecovery(error: StandardError, context: ErrorMiddlewareContext): Promise<void> {
    console.log('⚡ 性能错误恢复策略:', {
      operation: context.operation,
      suggestedActions: ['优化查询', '启用缓存', '降低复杂度']
    });
    
    // 这里可以实现具体的性能恢复逻辑
    // 例如：查询优化、缓存启用、复杂度降低等
  }
  
  /**
   * 处理通用错误恢复
   */
  private async handleGenericErrorRecovery(error: StandardError, context: ErrorMiddlewareContext): Promise<void> {
    console.log('🔧 通用错误恢复策略:', {
      operation: context.operation,
      suggestedActions: ['记录错误', '通知管理员', '尝试备用方案']
    });
    
    // 通用恢复逻辑
    // 例如：错误记录、管理员通知、备用方案尝试等
  }
  
  /**
   * 记录混合处理结果
   */
  private logHybridHandlingResult(
    error: StandardError, 
    claudeClassification: ClaudeErrorClassification | null,
    context: ErrorMiddlewareContext
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      operation: context.operation,
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        category: error.category
      },
      claudeClassification: claudeClassification ? {
        type: claudeClassification.errorType?.name,
        confidence: claudeClassification.confidence,
        autoRecoverable: claudeClassification.errorType?.autoRecoverable
      } : null,
      handlingMethod: claudeClassification ? 'hybrid' : 'basic',
      recoveryAttempted: !!claudeClassification?.errorType?.autoRecoverable
    };
    
    console.log('📊 混合错误处理结果:', logEntry);
  }
  
  /**
   * 获取Claude适配器状态
   */
  getClaudeAdapterStatus(): { initialized: boolean; health: any } {
    if (!this.claudeAdapter) {
      return { initialized: false, health: null };
    }
    
    try {
      const health = this.claudeAdapter.getHealthStatus();
      return { initialized: true, health };
    } catch (error) {
      return { initialized: false, health: { error: error.message } };
    }
  }
  
  /**
   * 重新初始化Claude适配器
   */
  async reinitializeClaudeAdapter(options?: Partial<ClaudeCorePortingOptions>): Promise<void> {
    if (this.claudeAdapter) {
      try {
        await this.claudeAdapter.shutdown();
      } catch (error) {
        console.warn('关闭现有Claude适配器失败:', error);
      }
    }
    
    if (options) {
      this.claudeOptions = { ...this.claudeOptions, ...options };
    }
    
    await this.initializeClaudeAdapter();
  }
}

/**
 * 创建默认混合错误处理管道
 */
export function createDefaultHybridErrorPipeline(
  claudeOptions?: Partial<ClaudeCorePortingOptions>
): HybridErrorPipeline {
  const pipeline = new HybridErrorPipeline(claudeOptions);
  
  // 可以在这里添加额外的中间件
  // pipeline.use(customMiddleware);
  
  return pipeline;
}

/**
 * 包装函数，使用混合错误处理
 */
export function withHybridErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Omit<ErrorMiddlewareContext, 'requestId' | 'timestamp'>,
  claudeOptions?: Partial<ClaudeCorePortingOptions>
): (...args: T) => Promise<R> {
  const pipeline = createDefaultHybridErrorPipeline(claudeOptions);
  
  return async (...args: T): Promise<R> => {
    const requestId = `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      
      // 通过混合管道处理错误
      await pipeline.handle(normalizedError, fullContext);
      
      // 重新抛出错误
      throw normalizedError;
    }
  };
}

/**
 * 测试混合错误处理
 */
export async function testHybridErrorHandling(): Promise<void> {
  console.log('🧪 测试混合错误处理系统...');
  
  const pipeline = createDefaultHybridErrorPipeline();
  
  // 测试各种错误类型
  const testErrors = [
    ErrorFactory.network('网络连接超时', { endpoint: 'https://api.example.com' }),
    ErrorFactory.validation('输入验证失败', { field: 'email', value: 'invalid' }),
    ErrorFactory.system('内存不足', { usage: '95%', limit: '80%' }),
    ErrorFactory.openclaw(OpenClawErrorCode.WEBSOCKET_ERROR_1006, 'WebSocket连接异常')
  ];
  
  for (const error of testErrors) {
    const context: ErrorMiddlewareContext = {
      requestId: `test_${Date.now()}`,
      timestamp: new Date(),
      operation: 'test.hybridErrorHandling'
    };
    
    console.log(`\n📋 测试错误: ${error.code}`);
    console.log(`   消息: ${error.message}`);
    
    try {
      await pipeline.handle(error, context);
      console.log('✅ 错误处理完成');
    } catch (handlingError) {
      console.error('❌ 错误处理失败:', handlingError);
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 混合错误处理测试完成！');
  
  // 显示Claude适配器状态
  const claudeStatus = pipeline.getClaudeAdapterStatus();
  console.log('📊 Claude适配器状态:', claudeStatus);
}