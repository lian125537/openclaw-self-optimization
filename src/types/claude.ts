/**
 * ClaudeCorePorting 类型定义
 * Claude 4.6 企业级核心架构类型
 */

// ==================== 错误分类系统类型 ====================

/** 错误严重程度 */
export enum ClaudeErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/** 错误分类 */
export enum ClaudeErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

/** 错误类型定义 */
export interface ClaudeErrorType {
  code: string;
  name: string;
  description: string;
  category: ClaudeErrorCategory;
  severity: ClaudeErrorSeverity;
  recoveryAdvice: string[];
  autoRecoverable: boolean;
  requiresHumanIntervention: boolean;
}

/** 错误分类结果 */
export interface ClaudeErrorClassification {
  errorType: ClaudeErrorType;
  confidence: number; // 0-1
  suggestedActions: string[];
  recoverySteps: string[];
  metadata: Record<string, any>;
}

/** 错误处理选项 */
export interface ClaudeErrorHandlingOptions {
  enableAutoRecovery: boolean;
  enableLogging: boolean;
  enableMonitoring: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  fallbackStrategies: string[];
}

// ==================== 上下文压缩系统类型 ====================

/** 压缩策略 */
export enum CompressionStrategy {
  SUMMARIZATION = 'summarization',
  EXTRACTION = 'extraction',
  PRUNING = 'pruning',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding'
}

/** 上下文压缩选项 */
export interface ContextCompressionOptions {
  targetTokenCount: number;
  preserveImportantInfo: boolean;
  maintainConversationFlow: boolean;
  strategies: CompressionStrategy[];
  qualityThreshold: number; // 0-1
}

/** 压缩结果 */
export interface CompressionResult {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  qualityScore: number;
  strategiesUsed: CompressionStrategy[];
  metadata: Record<string, any>;
}

// ==================== 安全护栏系统类型 ====================

/** 安全级别 */
export enum SecurityLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  PARANOID = 'paranoid'
}

/** 用户意图分类 */
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

/** 工具调用安全检查 */
export interface ToolSafetyCheck {
  toolName: string;
  isAllowed: boolean;
  riskAssessment: 'safe' | 'caution' | 'dangerous' | 'blocked';
  requiredPermissions: string[];
  usageLimits: {
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
    maxConcurrent: number;
  };
  validationRules: string[];
}

// ==================== 代码沙盒系统类型 ====================

/** 沙盒执行环境 */
export interface SandboxEnvironment {
  id: string;
  type: 'nodejs' | 'python' | 'bash' | 'custom';
  resources: {
    maxMemoryMB: number;
    maxCPUTimeMs: number;
    maxExecutionTimeMs: number;
    diskQuotaMB: number;
    networkAccess: boolean;
    fileSystemAccess: boolean;
  };
  isolationLevel: 'none' | 'partial' | 'full';
  allowedAPIs: string[];
  blockedAPIs: string[];
}

/** 代码执行结果 */
export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  memoryUsedMB: number;
  exitCode: number;
  logs: string[];
  securityViolations: string[];
}

// ==================== 工具验证系统类型 ====================

/** 工具参数验证规则 */
export interface ToolParameterValidationRule {
  name: string;
  type: string;
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  customValidator?: (value: any) => boolean;
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

// ==================== 记忆检索系统类型 ====================

/** 记忆检索选项 */
export interface MemoryRetrievalOptions {
  query: string;
  limit: number;
  threshold: number;
  includeContext: boolean;
  includeMetadata: boolean;
  retrievalStrategy: 'semantic' | 'keyword' | 'hybrid' | 'temporal';
}

/** 记忆检索结果 */
export interface MemoryRetrievalResult {
  memories: MemoryEntry[];
  relevanceScores: number[];
  retrievalTimeMs: number;
  strategyUsed: string;
  metadata: Record<string, any>;
}

/** 记忆条目 */
export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: Date;
  tags: string[];
  embedding?: number[];
  metadata: Record<string, any>;
}

// ==================== 核心配置类型 ====================

/** ClaudeCorePorting 配置选项 */
export interface ClaudeCorePortingOptions {
  // 错误分类配置
  enableErrorClassification: boolean;
  errorClassificationOptions?: {
    model?: string;
    confidenceThreshold?: number;
    enableAutoRecovery?: boolean;
  };
  
  // 上下文压缩配置
  enableContextCompression: boolean;
  contextCompressionOptions?: ContextCompressionOptions;
  
  // 安全护栏配置
  enableSafetyGuardrails: boolean;
  safetyGuardrailsOptions?: {
    securityLevel: SecurityLevel;
    enableContentFiltering: boolean;
    enableIntentClassification: boolean;
    enableToolSafetyValidation: boolean;
  };
  
  // 代码沙盒配置
  enableCodeSandbox: boolean;
  codeSandboxOptions?: {
    defaultEnvironment: SandboxEnvironment;
    maxConcurrentExecutions: number;
    enableResourceLimits: boolean;
  };
  
  // 工具验证配置
  enableToolValidation: boolean;
  toolValidationOptions?: {
    strictMode: boolean;
    enableParameterValidation: boolean;
    enablePermissionChecking: boolean;
  };
  
  // 记忆检索配置
  enableMemoryRetrieval: boolean;
  memoryRetrievalOptions?: MemoryRetrievalOptions;
  
  // 通用配置
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableDebugMode: boolean;
}

/** OpenClaw适配器配置 */
export interface OpenClawAdapterOptions {
  gatewayUrl: string;
  gatewayToken: string;
  sessionId?: string;
  userId?: string;
  timeoutMs: number;
  retryAttempts: number;
  enableWebSocket: boolean;
}

// ==================== 核心类类型 ====================

/** ClaudeCorePorting 主类接口 */
export interface IClaudeCorePorting {
  // 初始化方法
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // 错误处理方法
  classifyError(error: any): Promise<ClaudeErrorClassification>;
  handleError(error: any, context?: any): Promise<any>;
  
  // 上下文处理方法
  compressContext(context: any, options?: ContextCompressionOptions): Promise<CompressionResult>;
  decompressContext(compressed: any): Promise<any>;
  
  // 安全检查方法
  checkContentSafety(content: string): Promise<ContentSafetyCheck>;
  classifyIntent(input: string): Promise<UserIntent>;
  validateToolCall(toolName: string, parameters: any): Promise<ToolSafetyCheck>;
  
  // 代码执行方法
  executeCode(code: string, language: string, environment?: SandboxEnvironment): Promise<CodeExecutionResult>;
  
  // 工具验证方法
  validateToolParameters(toolName: string, parameters: any): Promise<ToolValidationResult>;
  
  // 记忆检索方法
  retrieveMemories(query: string, options?: MemoryRetrievalOptions): Promise<MemoryRetrievalResult>;
  
  // 工具注册方法
  registerTool(toolDefinition: any): Promise<void>;
  unregisterTool(toolName: string): Promise<void>;
  
  // 状态监控方法
  getMetrics(): Promise<any>;
  getHealthStatus(): Promise<any>;
}

/** OpenClaw适配器接口 */
export interface IOpenClawAdapter {
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // 消息处理
  sendMessage(message: any): Promise<any>;
  receiveMessage(): Promise<any>;
  
  // 工具调用
  callTool(toolName: string, parameters: any): Promise<any>;
  
  // 会话管理
  createSession(options?: any): Promise<string>;
  closeSession(sessionId: string): Promise<void>;
  
  // 状态查询
  getSessionStatus(sessionId: string): Promise<any>;
  getSystemStatus(): Promise<any>;
}

// ==================== 导出所有类型 ====================

// 所有类型都已经在定义时导出
// 这里不需要重复导出