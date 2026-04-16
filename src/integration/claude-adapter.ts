/**
 * ClaudeCorePorting TypeScript适配器
 * 将JavaScript的Claude核心组件包装为TypeScript接口
 */

import * as path from 'path';
import { 
  IClaudeCorePorting,
  ClaudeCorePortingOptions,
  ClaudeErrorClassification,
  ContextCompressionOptions,
  CompressionResult,
  ContentSafetyCheck,
  UserIntent,
  ToolSafetyCheck,
  CodeExecutionResult,
  ToolValidationResult,
  MemoryRetrievalOptions,
  MemoryRetrievalResult
} from '../types/claude';

// 动态导入JavaScript模块
const claudeCorePath = path.join(__dirname, '../../claude-core-porting/src/index.js');

/**
 * ClaudeCorePorting TypeScript包装器
 */
export class ClaudeCorePortingAdapter implements IClaudeCorePorting {
  private claudeCore: any;
  private isInitialized: boolean = false;
  
  constructor(private options: ClaudeCorePortingOptions) {
    // 延迟初始化
  }
  
  /**
   * 初始化Claude核心组件
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // 动态导入JavaScript模块
      const { ClaudeCorePorting, OpenClawAdapter } = require(claudeCorePath);
      
      // 初始化核心组件
      this.claudeCore = new ClaudeCorePorting(this.options);
      
      // 调用初始化方法（如果存在）
      if (typeof this.claudeCore.initialize === 'function') {
        await this.claudeCore.initialize();
      }
      
      this.isInitialized = true;
      console.log('✅ ClaudeCorePorting 初始化完成');
    } catch (error) {
      console.error('❌ ClaudeCorePorting 初始化失败:', error);
      throw new Error(`ClaudeCorePorting初始化失败: ${error.message}`);
    }
  }
  
  /**
   * 关闭Claude核心组件
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      // 调用关闭方法（如果存在）
      if (typeof this.claudeCore.shutdown === 'function') {
        await this.claudeCore.shutdown();
      }
      
      this.isInitialized = false;
      this.claudeCore = null;
      console.log('✅ ClaudeCorePorting 已关闭');
    } catch (error) {
      console.error('❌ ClaudeCorePorting 关闭失败:', error);
      throw new Error(`ClaudeCorePorting关闭失败: ${error.message}`);
    }
  }
  
  /**
   * 错误分类
   */
  async classifyError(error: any): Promise<ClaudeErrorClassification> {
    await this.ensureInitialized();
    
    try {
      // 调用JavaScript模块的方法
      const result = await this.claudeCore.classifyError(error);
      
      // 转换为TypeScript类型
      return {
        errorType: result.errorType,
        confidence: result.confidence || 0.8,
        suggestedActions: result.suggestedActions || [],
        recoverySteps: result.recoverySteps || [],
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('❌ 错误分类失败:', error);
      throw new Error(`错误分类失败: ${error.message}`);
    }
  }
  
  /**
   * 错误处理
   */
  async handleError(error: any, context?: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      return await this.claudeCore.handleError(error, context);
    } catch (error) {
      console.error('❌ 错误处理失败:', error);
      throw new Error(`错误处理失败: ${error.message}`);
    }
  }
  
  /**
   * 上下文压缩
   */
  async compressContext(context: any, options?: ContextCompressionOptions): Promise<CompressionResult> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.compressContext(context, options);
      
      return {
        originalTokens: result.originalTokens || 0,
        compressedTokens: result.compressedTokens || 0,
        compressionRatio: result.compressionRatio || 0,
        qualityScore: result.qualityScore || 0,
        strategiesUsed: result.strategiesUsed || [],
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('❌ 上下文压缩失败:', error);
      throw new Error(`上下文压缩失败: ${error.message}`);
    }
  }
  
  /**
   * 上下文解压缩
   */
  async decompressContext(compressed: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      return await this.claudeCore.decompressContext(compressed);
    } catch (error) {
      console.error('❌ 上下文解压缩失败:', error);
      throw new Error(`上下文解压缩失败: ${error.message}`);
    }
  }
  
  /**
   * 内容安全检查
   */
  async checkContentSafety(content: string): Promise<ContentSafetyCheck> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.checkContentSafety(content);
      
      return {
        isSafe: result.isSafe || true,
        riskLevel: result.riskLevel || 'none',
        flaggedCategories: result.flaggedCategories || [],
        confidence: result.confidence || 1.0,
        recommendations: result.recommendations || [],
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('❌ 内容安全检查失败:', error);
      throw new Error(`内容安全检查失败: ${error.message}`);
    }
  }
  
  /**
   * 意图分类
   */
  async classifyIntent(input: string): Promise<UserIntent> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.classifyIntent(input);
      
      // 映射到TypeScript枚举
      const intentMap: Record<string, UserIntent> = {
        'information': UserIntent.INFORMATION,
        'creation': UserIntent.CREATION,
        'analysis': UserIntent.ANALYSIS,
        'automation': UserIntent.AUTOMATION,
        'debugging': UserIntent.DEBUGGING,
        'malicious': UserIntent.MALICIOUS,
        'unknown': UserIntent.UNKNOWN
      };
      
      return intentMap[result] || UserIntent.UNKNOWN;
    } catch (error) {
      console.error('❌ 意图分类失败:', error);
      throw new Error(`意图分类失败: ${error.message}`);
    }
  }
  
  /**
   * 工具调用安全检查
   */
  async validateToolCall(toolName: string, parameters: any): Promise<ToolSafetyCheck> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.validateToolCall(toolName, parameters);
      
      return {
        toolName: result.toolName || toolName,
        isAllowed: result.isAllowed || true,
        riskAssessment: result.riskAssessment || 'safe',
        requiredPermissions: result.requiredPermissions || [],
        usageLimits: result.usageLimits || {
          maxCallsPerMinute: 60,
          maxCallsPerHour: 3600,
          maxConcurrent: 10
        },
        validationRules: result.validationRules || []
      };
    } catch (error) {
      console.error('❌ 工具安全检查失败:', error);
      throw new Error(`工具安全检查失败: ${error.message}`);
    }
  }
  
  /**
   * 代码执行
   */
  async executeCode(code: string, language: string, environment?: any): Promise<CodeExecutionResult> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.executeCode(code, language, environment);
      
      return {
        success: result.success || false,
        output: result.output || '',
        error: result.error,
        executionTimeMs: result.executionTimeMs || 0,
        memoryUsedMB: result.memoryUsedMB || 0,
        exitCode: result.exitCode || 0,
        logs: result.logs || [],
        securityViolations: result.securityViolations || []
      };
    } catch (error) {
      console.error('❌ 代码执行失败:', error);
      throw new Error(`代码执行失败: ${error.message}`);
    }
  }
  
  /**
   * 工具参数验证
   */
  async validateToolParameters(toolName: string, parameters: any): Promise<ToolValidationResult> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.validateToolParameters(toolName, parameters);
      
      return {
        isValid: result.isValid || true,
        errors: result.errors || [],
        warnings: result.warnings || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error('❌ 工具参数验证失败:', error);
      throw new Error(`工具参数验证失败: ${error.message}`);
    }
  }
  
  /**
   * 记忆检索
   */
  async retrieveMemories(query: string, options?: MemoryRetrievalOptions): Promise<MemoryRetrievalResult> {
    await this.ensureInitialized();
    
    try {
      const result = await this.claudeCore.retrieveMemories(query, options);
      
      return {
        memories: result.memories || [],
        relevanceScores: result.relevanceScores || [],
        retrievalTimeMs: result.retrievalTimeMs || 0,
        strategyUsed: result.strategyUsed || 'semantic',
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('❌ 记忆检索失败:', error);
      throw new Error(`记忆检索失败: ${error.message}`);
    }
  }
  
  /**
   * 注册工具
   */
  async registerTool(toolDefinition: any): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.claudeCore.registerTool(toolDefinition);
    } catch (error) {
      console.error('❌ 工具注册失败:', error);
      throw new Error(`工具注册失败: ${error.message}`);
    }
  }
  
  /**
   * 取消注册工具
   */
  async unregisterTool(toolName: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.claudeCore.unregisterTool(toolName);
    } catch (error) {
      console.error('❌ 工具取消注册失败:', error);
      throw new Error(`工具取消注册失败: ${error.message}`);
    }
  }
  
  /**
   * 获取指标
   */
  async getMetrics(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      return await this.claudeCore.getMetrics();
    } catch (error) {
      console.error('❌ 获取指标失败:', error);
      throw new Error(`获取指标失败: ${error.message}`);
    }
  }
  
  /**
   * 获取健康状态
   */
  async getHealthStatus(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      return await this.claudeCore.getHealthStatus();
    } catch (error) {
      console.error('❌ 获取健康状态失败:', error);
      throw new Error(`获取健康状态失败: ${error.message}`);
    }
  }
  
  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  /**
   * 获取原始Claude核心实例（用于高级操作）
   */
  getRawClaudeCore(): any {
    if (!this.isInitialized) {
      throw new Error('ClaudeCorePorting未初始化');
    }
    return this.claudeCore;
  }
}

/**
 * 创建ClaudeCorePorting适配器
 */
export function createClaudeCorePorting(options: ClaudeCorePortingOptions): ClaudeCorePortingAdapter {
  return new ClaudeCorePortingAdapter(options);
}

/**
 * 默认配置
 */
export const DEFAULT_CLAUDE_OPTIONS: ClaudeCorePortingOptions = {
  enableErrorClassification: true,
  enableContextCompression: true,
  enableSafetyGuardrails: true,
  enableCodeSandbox: true,
  enableToolValidation: true,
  enableMemoryRetrieval: true,
  logLevel: 'info',
  enableMetrics: true,
  enableDebugMode: false,
  
  errorClassificationOptions: {
    model: 'default',
    confidenceThreshold: 0.7,
    enableAutoRecovery: true
  },
  
  safetyGuardrailsOptions: {
    securityLevel: 'moderate',
    enableContentFiltering: true,
    enableIntentClassification: true,
    enableToolSafetyValidation: true
  },
  
  codeSandboxOptions: {
    defaultEnvironment: {
      id: 'nodejs-basic',
      type: 'nodejs',
      resources: {
        maxMemoryMB: 512,
        maxCPUTimeMs: 5000,
        maxExecutionTimeMs: 10000,
        diskQuotaMB: 100,
        networkAccess: false,
        fileSystemAccess: false
      },
      isolationLevel: 'partial',
      allowedAPIs: ['console', 'Date', 'Math', 'JSON'],
      blockedAPIs: ['process', 'require', 'fs', 'child_process']
    },
    maxConcurrentExecutions: 5,
    enableResourceLimits: true
  }
};