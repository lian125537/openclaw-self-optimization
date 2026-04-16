/**
 * OpenClaw Gateway 与 Claude 集成
 * 生产环境集成配置和启动器
 */

import { ClaudeCorePortingAdapter, createClaudeCorePorting, DEFAULT_CLAUDE_OPTIONS } from './claude-adapter';
import { createDefaultHybridErrorPipeline, HybridErrorPipeline } from './hybrid-error-handler';
import { ClaudeCorePortingOptions } from '../types/claude';

/**
 * OpenClaw Gateway 集成管理器
 */
export class OpenClawGatewayIntegration {
  private claudeAdapter: ClaudeCorePortingAdapter | null = null;
  private errorPipeline: HybridErrorPipeline | null = null;
  private isIntegrated: boolean = false;

  constructor(
    private gatewayConfig: GatewayIntegrationConfig,
    private claudeOptions?: Partial<ClaudeCorePortingOptions>
  ) {}

  /**
   * 初始化集成
   */
  async initialize(): Promise<void> {
    if (this.isIntegrated) {
      return;
    }

    console.log('🚀 初始化 OpenClaw Gateway 与 Claude 集成...');

    try {
      // 1. 初始化Claude适配器
      await this.initializeClaudeAdapter();

      // 2. 初始化混合错误处理管道
      await this.initializeErrorPipeline();

      // 3. 注册Gateway工具
      await this.registerGatewayTools();

      // 4. 配置安全护栏
      await this.configureSafetyGuardrails();

      // 5. 启动监控
      await this.startMonitoring();

      this.isIntegrated = true;
      console.log('✅ OpenClaw Gateway 与 Claude 集成完成');
    } catch (error) {
      console.error('❌ OpenClaw Gateway 集成失败:', error);
      throw new Error(`Gateway集成失败: ${error.message}`);
    }
  }

  /**
   * 关闭集成
   */
  async shutdown(): Promise<void> {
    if (!this.isIntegrated) {
      return;
    }

    console.log('🛑 关闭 OpenClaw Gateway 与 Claude 集成...');

    try {
      // 1. 关闭Claude适配器
      if (this.claudeAdapter) {
        await this.claudeAdapter.shutdown();
      }

      // 2. 清理资源
      await this.cleanupResources();

      this.isIntegrated = false;
      this.claudeAdapter = null;
      this.errorPipeline = null;

      console.log('✅ OpenClaw Gateway 集成已关闭');
    } catch (error) {
      console.error('❌ 关闭集成失败:', error);
      throw new Error(`关闭集成失败: ${error.message}`);
    }
  }

  /**
   * 处理Gateway消息(增强版)
   */
  async processMessage(message: GatewayMessage): Promise<GatewayResponse> {
    await this.ensureIntegrated();

    const startTime = Date.now();
    const requestId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. 安全检查
      const safetyCheck = await this.checkMessageSafety(message);
      if (!safetyCheck.isSafe) {
        return this.createSafetyBlockedResponse(message, safetyCheck);
      }

      // 2. 意图分类
      const intent = await this.classifyMessageIntent(message);

      // 3. 上下文压缩(如果消息过长)
      const processedMessage = await this.compressMessageIfNeeded(message);

      // 4. 工具调用验证(如果包含工具调用)
      if (processedMessage.toolCalls && processedMessage.toolCalls.length > 0) {
        const toolValidation = await this.validateToolCalls(processedMessage.toolCalls);
        if (!toolValidation.isValid) {
          return this.createToolValidationFailedResponse(message, toolValidation);
        }
      }

      // 5. 处理消息(实际业务逻辑)
      const response = await this.handleMessage(processedMessage, intent);

      // 6. 输出安全检查
      const outputSafetyCheck = await this.checkOutputSafety(response);
      if (!outputSafetyCheck.isSafe) {
        return this.createOutputSafetyBlockedResponse(response, outputSafetyCheck);
      }

      // 7. 记录处理结果
      await this.logMessageProcessing({
        requestId,
        message,
        response,
        intent,
        processingTime: Date.now() - startTime,
        safetyChecks: {
          input: safetyCheck,
          output: outputSafetyCheck
        }
      });

      return response;
    } catch (error) {
      // 使用混合错误处理管道处理错误
      await this.handleProcessingError(error, {
        requestId,
        timestamp: new Date(),
        operation: 'gateway.message.process',
        userId: message.userId as any,
        sessionId: message.sessionId as any
      });

      // 返回错误响应
      return this.createErrorResponse(message, error);
    }
  }

  /**
   * 执行工具调用(安全版)
   */
  async executeToolCall(toolCall: ToolCall): Promise<ToolCallResult> {
    await this.ensureIntegrated();

    try {
      // 1. 工具安全检查
      const safetyCheck = await this.claudeAdapter!.validateToolCall(toolCall.name, toolCall.parameters);
      if (!safetyCheck.isAllowed) {
        throw new Error(`工具调用被安全策略阻止: ${toolCall.name}`);
      }

      // 2. 参数验证
      const validationResult = await this.claudeAdapter!.validateToolParameters(toolCall.name, toolCall.parameters);
      if (!validationResult.isValid) {
        throw new Error(`工具参数验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // 3. 代码沙盒执行(如果是代码执行工具)
      if (this.isCodeExecutionTool(toolCall.name)) {
        return await this.executeCodeInSandbox(toolCall);
      }

      // 4. 普通工具执行
      return await this.executeRegularTool(toolCall);
    } catch (error) {
      // 错误处理
      await this.handleToolError(error, toolCall);
      throw error;
    }
  }

  /**
   * 获取集成状态
   */
  getIntegrationStatus(): IntegrationStatus {
    return {
      integrated: this.isIntegrated,
      claudeAdapter: this.claudeAdapter ? {
        initialized: true,
        health: this.claudeAdapter.getHealthStatus()
      } : { initialized: false, health: null },
      errorPipeline: this.errorPipeline ? {
        initialized: true,
        claudeEnabled: this.errorPipeline.getClaudeAdapterStatus().initialized
      } : { initialized: false, claudeEnabled: false },
      gatewayConfig: this.gatewayConfig,
      timestamp: new Date()
    };
  }

  // ==================== 私有方法 ====================

  private async initializeClaudeAdapter(): Promise<void> {
    const options: ClaudeCorePortingOptions = {
      ...DEFAULT_CLAUDE_OPTIONS,
      ...this.claudeOptions,
      // 生产环境特定配置
      safetyGuardrailsOptions: {
        securityLevel: 'high' as any, // 生产环境使用高级安全
        enableContentFiltering: true,
        enableIntentClassification: true,
        enableToolSafetyValidation: true
      },
      codeSandboxOptions: {
        ...DEFAULT_CLAUDE_OPTIONS.codeSandboxOptions!,
        maxConcurrentExecutions: 10, // 生产环境增加并发数
        enableResourceLimits: true
      }
    };

    this.claudeAdapter = createClaudeCorePorting(options);
    await this.claudeAdapter.initialize();
  }

  private async initializeErrorPipeline(): Promise<void> {
    this.errorPipeline = createDefaultHybridErrorPipeline(this.claudeOptions);
  }

  private async registerGatewayTools(): Promise<void> {
    if (!this.claudeAdapter) {
      return;
    }

    // 注册OpenClaw Gateway标准工具
    const gatewayTools = [
      {
        name: 'openclaw_file_read',
        description: '读取文件内容',
        parameters: {
          path: { type: 'string', required: true },
          encoding: { type: 'string', required: false, default: 'utf8' }
        },
        permissions: ['file.read'],
        safetyLevel: 'medium'
      },
      {
        name: 'openclaw_file_write',
        description: '写入文件内容',
        parameters: {
          path: { type: 'string', required: true },
          content: { type: 'string', required: true },
          encoding: { type: 'string', required: false, default: 'utf8' }
        },
        permissions: ['file.write'],
        safetyLevel: 'high'
      },
      {
        name: 'openclaw_exec',
        description: '执行系统命令',
        parameters: {
          command: { type: 'string', required: true },
          args: { type: 'array', required: false, default: [] },
          timeout: { type: 'number', required: false, default: 30000 }
        },
        permissions: ['system.execute'],
        safetyLevel: 'critical',
        requiresSandbox: true
      }
    ];

    for (const tool of gatewayTools) {
      await this.claudeAdapter.registerTool(tool);
    }
  }

  private async configureSafetyGuardrails(): Promise<void> {
    // 配置生产环境安全策略
    console.log('🛡️  配置生产环境安全护栏...');

    // 这里可以配置具体的安全规则
    // 例如:IP限制、速率限制、敏感操作监控等
  }

  private async startMonitoring(): Promise<void> {
    console.log('📊 启动集成监控...');

    // 启动性能监控
    setInterval(async () => {
      if (this.claudeAdapter) {
        try {
          const metrics = await this.claudeAdapter.getMetrics();
          this.logMetrics(metrics);
        } catch (error) {
          console.warn('获取监控指标失败:', error);
        }
      }
    }, 60000); // 每分钟收集一次指标
  }

  private async ensureIntegrated(): Promise<void> {
    if (!this.isIntegrated) {
      await this.initialize();
    }
  }

  private async checkMessageSafety(message: GatewayMessage): Promise<ContentSafetyCheck> {
    if (!this.claudeAdapter) {
      return { isSafe: true, riskLevel: 'none', flaggedCategories: [], confidence: 1.0, recommendations: [], metadata: {} };
    }

    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    return await this.claudeAdapter.checkContentSafety(content);
  }

  private async classifyMessageIntent(message: GatewayMessage): Promise<UserIntent> {
    if (!this.claudeAdapter) {
      return UserIntent.UNKNOWN;
    }

    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    return await this.claudeAdapter.classifyIntent(content);
  }

  private async compressMessageIfNeeded(message: GatewayMessage): Promise<GatewayMessage> {
    if (!this.claudeAdapter) {
      return message;
    }

    // 如果消息内容过长,进行压缩
    const contentStr = JSON.stringify(message.content);
    if (contentStr.length > 10000) { // 10KB阈值
      console.log('📦 压缩长消息...');

      const compressionResult = await this.claudeAdapter.compressContext(message.content, {
        targetTokenCount: 1000,
        preserveImportantInfo: true,
        maintainConversationFlow: true,
        strategies: ['summarization' as any, 'extraction' as any],
        qualityThreshold: 0.8
      });

      return {
        ...message,
        content: compressionResult, // 压缩后的内容
        metadata: {
          ...message.metadata,
          compressed: true,
          compressionRatio: compressionResult.compressionRatio,
          originalSize: contentStr.length
        }
      };
    }

    return message;
  }

  private async validateToolCalls(toolCalls: ToolCall[]): Promise<ToolValidationResult> {
    if (!this.claudeAdapter) {
      return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }

    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.claudeAdapter.validateToolParameters(toolCall.name, toolCall.parameters);

      if (!result.isValid) {
        allErrors.push(...result.errors);
      }

      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: []
    };
  }

  private async handleMessage(message: GatewayMessage, intent: UserIntent): Promise<GatewayResponse> {
    // 这里是实际的消息处理逻辑
    // 可以根据意图分类进行不同的处理

    switch (intent) {
      case UserIntent.INFORMATION:
        return await this.handleInformationRequest(message);
      case UserIntent.CREATION:
        return await this.handleCreationRequest(message);
      case UserIntent.ANALYSIS:
        return await this.handleAnalysisRequest(message);
      case UserIntent.AUTOMATION:
        return await this.handleAutomationRequest(message);
      default:
        return await this.handleGenericRequest(message);
    }
  }

  private async checkOutputSafety(response: GatewayResponse): Promise<ContentSafetyCheck> {
    if (!this.claudeAdapter) {
      return { isSafe: true, riskLevel: 'none', flaggedCategories: [], confidence: 1.0, recommendations: [], metadata: {} };
    }

    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    return await this.claudeAdapter.checkContentSafety(content);
  }

  private async handleProcessingError(error: any, context: ErrorMiddlewareContext): Promise<void> {
    if (this.errorPipeline) {
      await this.errorPipeline.handle(normalizeError(error), context);
    } else {
      console.error('处理错误时错误管道未初始化:', error);
    }
  }

  private async handleToolError(error: any, toolCall: ToolCall): Promise<void> {
    const context: ErrorMiddlewareContext = {
      requestId: `tool_${Date.now()}`,
      timestamp: new Date(),
      operation: `tool.${toolCall.name}`,
      metadata: { toolCall }
    };

    await this.handleProcessingError(error, context);
  }

  private isCodeExecutionTool(toolName: string): boolean {
    const codeTools = ['openclaw_exec', 'execute_code', 'run_script', 'eval'];
    return codeTools.includes(toolName);
  }

  private async executeCodeInSandbox(toolCall: ToolCall): Promise<ToolCallResult> {
    if (!this.claudeAdapter) {
      throw new Error('Claude适配器未初始化');
    }

    const code = toolCall.parameters['command'] || toolCall.parameters['code'];
    const language = toolCall.parameters['language'] || 'javascript';

    const result = await this.claudeAdapter.executeCode(code, language);

    return {
      success: result.success,
      output: result.output,
      error: result.error || '',
      executionTime: result.executionTimeMs,
      metadata: {
        sandboxed: true,
        memoryUsed: result.memoryUsedMB,
        securityViolations: result.securityViolations
      }
    };
  }

  private async executeRegularTool(toolCall: ToolCall): Promise<ToolCallResult> {
    // 这里实现普通工具的执行逻辑
    // 实际项目中会调用具体的工具实现

    return {
      success: true,
      output: `工具 ${toolCall.name} 执行成功`,
      executionTime: 100,
      metadata: { executed: true }
    };
  }

  private async logMessageProcessing(logData: MessageProcessingLog): Promise<void> {
    // 这里实现日志记录逻辑
    console.log('📝 消息处理日志:', {
      requestId: logData.requestId,
      intent: logData.intent,
      processingTime: logData.processingTime,
      safetyChecks: logData.safetyChecks
    });
  }

  private logMetrics(metrics: any): void {
    // 这里实现指标记录逻辑
    console.log('📈 系统指标:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
  }

  private async cleanupResources(): Promise<void> {
    // 清理资源
    console.log('🧹 清理集成资源...');
  }

  // ==================== 响应创建方法 ====================

  private createSafetyBlockedResponse(_message: GatewayMessage, safetyCheck: ContentSafetyCheck): GatewayResponse {
    return {
      success: false,
      content: {
        error: '消息被安全策略阻止',
        reason: safetyCheck.flaggedCategories.join(', '),
        recommendations: safetyCheck.recommendations
      },
      metadata: {
        safetyBlocked: true,
        riskLevel: safetyCheck.riskLevel,
        confidence: safetyCheck.confidence
      }
    };
  }

  private createToolValidationFailedResponse(_message: GatewayMessage, validation: ToolValidationResult): GatewayResponse {
    return {
      success: false,
      content: {
        error: '工具调用验证失败',
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message)
      },
      metadata: {
        validationFailed: true,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      }
    };
  }

  private createOutputSafetyBlockedResponse(response: GatewayResponse, safetyCheck: ContentSafetyCheck): GatewayResponse {
    return {
      success: false,
      content: {
        error: '输出被安全策略阻止',
        originalResponse: response.content,
        safetyReasons: safetyCheck.flaggedCategories
      },
      metadata: {
        outputSafetyBlocked: true,
        riskLevel: safetyCheck.riskLevel
      }
    };
  }

  private createErrorResponse(_message: GatewayMessage, error: any): GatewayResponse {
    return {
      success: false,
      content: {
        error: '消息处理失败',
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      metadata: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    };
  }

  private async handleInformationRequest(_message: GatewayMessage): Promise<GatewayResponse> {
    return {
      success: true,
      content: { message: '信息请求处理完成' },
      metadata: { intent: 'information', processed: true }
    };
  }

  private async handleCreationRequest(_message: GatewayMessage): Promise<GatewayResponse> {
    return {
      success: true,
      content: { message: '创建请求处理完成' },
      metadata: { intent: 'creation', processed: true }
    };
  }

  private async handleAnalysisRequest(_message: GatewayMessage): Promise<GatewayResponse> {
    return {
      success: true,
      content: { message: '分析请求处理完成' },
      metadata: { intent: 'analysis', processed: true }
    };
  }

  private async handleAutomationRequest(_message: GatewayMessage): Promise<GatewayResponse> {
    return {
      success: true,
      content: { message: '自动化请求处理完成' },
      metadata: { intent: 'automation', processed: true }
    };
  }

  private async handleGenericRequest(_message: GatewayMessage): Promise<GatewayResponse> {
    return {
      success: true,
      content: { message: '通用请求处理完成' },
      metadata: { intent: 'generic', processed: true }
    };
  }
}

// ==================== 类型定义 ====================

/** Gateway集成配置 */
export interface GatewayIntegrationConfig {
  gatewayUrl: string;
  gatewayToken: string;
  sessionId?: string;
  userId?: string;
  timeoutMs: number;
  retryAttempts: number;
  enableWebSocket: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  enableMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/** Gateway消息 */
export interface GatewayMessage {
  id: string;
  content: any;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
}

/** Gateway响应 */
export interface GatewayResponse {
  success: boolean;
  content: any;
  metadata?: Record<string, any>;
}

/** 工具调用 */
export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
  id?: string;
}

/** 工具调用结果 */
export interface ToolCallResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

/** 集成状态 */
export interface IntegrationStatus {
  integrated: boolean;
  claudeAdapter: {
    initialized: boolean;
    health: any;
  };
  errorPipeline: {
    initialized: boolean;
    claudeEnabled: boolean;
  };
  gatewayConfig: GatewayIntegrationConfig;
  timestamp: Date;
}

/** 消息处理日志 */
export interface MessageProcessingLog {
  requestId: string;
  message: GatewayMessage;
  response: GatewayResponse;
  intent: UserIntent;
  processingTime: number;
  safetyChecks: {
    input: ContentSafetyCheck;
    output: ContentSafetyCheck;
  };
}

/** 用户意图 */
export enum UserIntent {
  INFORMATION = 'information',
  CREATION = 'creation',
  ANALYSIS = 'analysis',
  AUTOMATION = 'automation',
  DEBUGGING = 'debugging',
  MALICIOUS = 'malicious',
  UNKNOWN = 'unknown'
}

/** 内容安全检查结果 */
export interface ContentSafetyCheck {
  isSafe: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  flaggedCategories: string[];
  confidence: number;
  recommendations: string[];
  metadata: Record<string, any>;
}

/** 工具验证结果 */
export interface ToolValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

/** 验证错误 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

/** 验证警告 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

/** 错误处理中间件上下文 */
export interface ErrorMiddlewareContext {
  requestId: string;
  timestamp: Date;
  operation: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// ==================== 工具函数 ====================

/** 规范化错误 */
function normalizeError(error: any): StandardError {
  // 简化的错误规范化函数
  // 实际项目中应该使用完整的错误规范化
  return {
    name: error.name || 'Error',
    message: error.message || String(error),
    code: error.code || 'UNKNOWN_ERROR',
    category: 'system' as any,
    severity: 'high' as any,
    timestamp: new Date(),
    context: { originalError: error }
  };
}

/** 标准错误接口 */
interface StandardError {
  name: string;
  message: string;
  code: string;
  category: any;
  severity: any;
  timestamp: Date;
  context?: Record<string, any>;
}

// ==================== 默认配置 ====================

/** 默认Gateway集成配置 */
export const DEFAULT_GATEWAY_CONFIG: GatewayIntegrationConfig = {
  gatewayUrl: 'http://localhost:30000',
  gatewayToken: '',
  timeoutMs: 30000,
  retryAttempts: 3,
  enableWebSocket: true,
  securityLevel: 'high',
  enableMonitoring: true,
  logLevel: 'info'
};

/**
 * 创建默认的Gateway集成管理器
 */
export function createDefaultGatewayIntegration(
  config?: Partial<GatewayIntegrationConfig>,
  claudeOptions?: Partial<ClaudeCorePortingOptions>
): OpenClawGatewayIntegration {
  const fullConfig: GatewayIntegrationConfig = {
    ...DEFAULT_GATEWAY_CONFIG,
    ...config
  };

  return new OpenClawGatewayIntegration(fullConfig, claudeOptions);
}

/**
 * 快速启动Gateway集成
 */
export async function quickStartGatewayIntegration(
  gatewayUrl: string,
  gatewayToken: string
): Promise<OpenClawGatewayIntegration> {
  console.log('🚀 快速启动 OpenClaw Gateway 集成...');

  const integration = createDefaultGatewayIntegration({
    gatewayUrl,
    gatewayToken
  });

  await integration.initialize();

  // 显示集成状态
  const status = integration.getIntegrationStatus();
  console.log('✅ Gateway集成状态:', {
    integrated: status.integrated,
    claudeInitialized: status.claudeAdapter.initialized,
    errorPipelineInitialized: status.errorPipeline.initialized
  });

  return integration;
}