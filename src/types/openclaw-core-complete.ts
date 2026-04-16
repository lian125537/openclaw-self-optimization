/**
 * OpenClaw核心类型定义 - 完整版
 * 基于Claude企业级架构标准优化
 */

// ==================== 配置类型 ====================

/** OpenClaw配置选项 */
export interface OpenClawConfig {
  gateway: GatewayConfig;
  models: ModelsConfig;
  sessions: SessionsConfig;
  tools: ToolsConfig;
  plugins: PluginsConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
}

/** Gateway配置 */
export interface GatewayConfig {
  auth: AuthConfig;
  network: NetworkConfig;
  security: SecurityConfig;
}

/** 认证配置 */
export interface AuthConfig {
  mode: 'none' | 'token' | 'oauth';
  token?: string;
  oauth?: OAuthConfig;
}

/** OAuth配置 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** 网络配置 */
export interface NetworkConfig {
  port: number;
  host: string;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
}

/** CORS配置 */
export interface CorsConfig {
  enabled: boolean;
  origins: string[];
}

/** 速率限制配置 */
export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
}

/** 安全配置 */
export interface SecurityConfig {
  ssl: SSLConfig;
  headers: Record<string, string>;
  ipWhitelist: string[];
}

/** SSL配置 */
export interface SSLConfig {
  enabled: boolean;
  certPath?: string;
  keyPath?: string;
}

// ==================== 模型配置 ====================

/** 模型配置 */
export interface ModelsConfig {
  default: string;
  providers: ModelProvider[];
  configurations: ModelConfiguration[];
}

/** 模型提供者 */
export interface ModelProvider {
  id: string;
  type: 'openai' | 'anthropic' | 'minimax' | 'deepseek' | 'siliconflow' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  timeout: number;
  retry: RetryConfig;
}

/** 重试配置 */
export interface RetryConfig {
  attempts: number;
  delay: number;
}

/** 模型配置项 */
export interface ModelConfiguration {
  id: string;
  provider: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// ==================== 会话配置 ====================

/** 会话配置 */
export interface SessionsConfig {
  management: SessionManagementConfig;
  context: SessionContextConfig;
}

/** 会话管理配置 */
export interface SessionManagementConfig {
  maxSessions: number;
  sessionTimeout: number;
  cleanupInterval: number;
  persistence: PersistenceConfig;
}

/** 持久化配置 */
export interface PersistenceConfig {
  enabled: boolean;
  storagePath: string;
  backupInterval: number;
}

/** 会话上下文配置 */
export interface SessionContextConfig {
  maxTokens: number;
  compression: CompressionConfig;
  memory: MemoryConfig;
}

/** 压缩配置 */
export interface CompressionConfig {
  enabled: boolean;
  strategy: 'summarization' | 'extraction' | 'truncation';
  targetRatio: number;
}

/** 记忆配置 */
export interface MemoryConfig {
  enabled: boolean;
  type: 'vector' | 'fulltext' | 'hybrid';
  embeddingModel?: string;
}

// ==================== 工具配置 ====================

/** 工具配置 */
export interface ToolsConfig {
  registry: ToolRegistryConfig;
  security: ToolSecurityConfig;
}

/** 工具注册配置 */
export interface ToolRegistryConfig {
  enabled: boolean;
  autoDiscovery: boolean;
  validation: ValidationConfig;
}

/** 验证配置 */
export interface ValidationConfig {
  enabled: boolean;
  strict: boolean;
}

/** 工具安全配置 */
export interface ToolSecurityConfig {
  sandbox: SandboxConfig;
  permissions: PermissionsConfig;
}

/** 沙盒配置 */
export interface SandboxConfig {
  enabled: boolean;
  isolationLevel: 'none' | 'partial' | 'full';
  resourceLimits: ResourceLimits;
}

/** 资源限制 */
export interface ResourceLimits {
  memoryMB: number;
  cpuTimeMs: number;
  executionTimeMs: number;
}

/** 权限配置 */
export interface PermissionsConfig {
  enabled: boolean;
  defaultLevel: 'user' | 'admin' | 'system';
  overrideRules: PermissionRule[];
}

/** 权限规则 */
export interface PermissionRule {
  tool: string;
  permission: string;
  condition?: any;
}

// ==================== 插件配置 ====================

/** 插件配置 */
export interface PluginsConfig {
  management: PluginManagementConfig;
  configurations: PluginConfiguration[];
}

/** 插件管理配置 */
export interface PluginManagementConfig {
  enabled: boolean;
  autoLoad: boolean;
  hotReload: boolean;
  validation: PluginValidationConfig;
}

/** 插件验证配置 */
export interface PluginValidationConfig {
  enabled: boolean;
  signatureCheck: boolean;
}

/** 插件配置项 */
export interface PluginConfiguration {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  config: any;
}

// ==================== 日志配置 ====================

/** 日志配置 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  targets: LogTarget[];
  format: LogFormat;
}

/** 日志目标 */
export interface LogTarget {
  type: 'console' | 'file' | 'syslog' | 'elasticsearch';
  config: any;
}

/** 日志格式 */
export interface LogFormat {
  timestamp: boolean;
  level: boolean;
  label: boolean;
  message: boolean;
  metadata: boolean;
}

// ==================== 监控配置 ====================

/** 监控配置 */
export interface MonitoringConfig {
  health: HealthConfig;
  metrics: MetricsConfig;
  alerts: AlertsConfig;
}

/** 健康检查配置 */
export interface HealthConfig {
  enabled: boolean;
  interval: number;
  endpoints: string[];
}

/** 指标配置 */
export interface MetricsConfig {
  enabled: boolean;
  interval: number;
  exporters: MetricsExporter[];
}

/** 指标导出器 */
export interface MetricsExporter {
  type: 'prometheus' | 'statsd' | 'console';
  config: any;
}

/** 告警配置 */
export interface AlertsConfig {
  enabled: boolean;
  rules: AlertRule[];
}

/** 告警规则 */
export interface AlertRule {
  id: string;
  condition: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actions: string[];
}

// ==================== 会话类型 ====================

/** 会话状态 */
export enum SessionState {
  ACTIVE = 'active',
  IDLE = 'idle',
  WAITING = 'waiting',
  ERROR = 'error',
  COMPLETED = 'completed',
  TERMINATED = 'terminated'
}

/** 会话类型 */
export enum SessionType {
  MAIN = 'main',
  SUBAGENT = 'subagent',
  ACP = 'acp',
  ISOLATED = 'isolated',
  PERSISTENT = 'persistent'
}

/** 会话配置 */
export interface SessionConfig {
  id: string;
  type: SessionType;
  model: SessionModelConfig;
  tools: SessionToolsConfig;
  context: SessionContextConfig;
  security: SessionSecurityConfig;
}

/** 会话模型配置 */
export interface SessionModelConfig {
  id: string;
  provider: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/** 会话工具配置 */
export interface SessionToolsConfig {
  enabled: boolean;
  allowed: string[];
  denied: string[];
  requireApproval: string[];
}

/** 会话安全配置 */
export interface SessionSecurityConfig {
  level: 'low' | 'medium' | 'high';
  contentFilter: boolean;
  toolValidation: boolean;
  rateLimit: SessionRateLimitConfig;
}

/** 会话速率限制配置 */
export interface SessionRateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
}

/** 会话消息 */
export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: SessionMessageMetadata;
}

/** 会话消息元数据 */
export interface SessionMessageMetadata {
  toolCalls?: ToolCall[];
  toolResponses?: ToolResponse[];
  model?: string;
  usage?: TokenUsage;
  [key: string]: any;
}

/** 工具调用 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

/** 工具响应 */
export interface ToolResponse {
  toolCallId: string;
  content: any;
}

/** Token使用情况 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** 会话状态 */
export interface SessionStatus {
  id: string;
  state: SessionState;
  config: SessionConfig;
  statistics: SessionStatistics;
  resources: SessionResources;
  errors?: SessionError[];
}

/** 会话统计 */
export interface SessionStatistics {
  messageCount: number;
  tokenUsage: TokenUsage;
  toolCalls: ToolCallStatistics;
  duration: SessionDuration;
}

/** 工具调用统计 */
export interface ToolCallStatistics {
  total: number;
  successful: number;
  failed: number;
}

/** 会话持续时间 */
export interface SessionDuration {
  startedAt: Date;
  lastActivity: Date;
  totalSeconds: number;
}

/** 会话资源 */
export interface SessionResources {
  memory: MemoryUsage;
  cpu: CpuUsage;
  network: NetworkUsage;
}

/** 内存使用 */
export interface MemoryUsage {
  used: number;
  max: number;
  percentage: number;
}

/** CPU使用 */
export interface CpuUsage {
  usage: number;
  threads: number;
}

/** 网络使用 */
export interface NetworkUsage {
  requests: number;
  bytesSent: number;
  bytesReceived: number;
}

/** 会话错误 */
export interface SessionError {
  id: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

// ==================== 工具类型 ====================

/** 工具类别 */
export enum ToolCategory {
  FILE = 'file',
  SYSTEM = 'system',
  NETWORK = 'network',
  DATABASE = 'database',
  API = 'api',
  DATA = 'data',
  MANAGEMENT = 'management',
  OTHER = 'other'
}

/** 工具权限级别 */
export enum ToolPermission {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
  APPROVAL_REQUIRED = 'approval_required'
}

/** 工具定义 */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  permission: ToolPermission;
  parameters: ToolParameters;
  returns: ToolReturns;
  security: ToolSecurity;
  execution: ToolExecution;
  metadata?: ToolMetadata;
}

/** 工具参数 */
export interface ToolParameters {
  [key: string]: ToolParameter;
}

/** 工具参数定义 */
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
  validation?: ParameterValidation;
}

/** 参数验证 */
export interface ParameterValidation {
  pattern?: string;
  min?: number;
  max?: number;
  enum?: any[];
  validator?: string;
}

/** 工具返回值 */
export interface ToolReturns {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'void';
  description: string;
}

/** 工具安全配置 */
export interface ToolSecurity {
  requiresSandbox: boolean;
  resourceLimits?: ResourceLimits;
  networkAccess: NetworkAccessConfig;
  filesystemAccess: FilesystemAccessConfig;
}

/** 网络访问配置 */
export interface NetworkAccessConfig {
  allowed: boolean;
  domains?: string[];
}

/** 文件系统访问配置 */
export interface FilesystemAccessConfig {
  allowed: boolean;
  paths?: string[];
  readOnly?: boolean;
}

/** 工具执行配置 */
export interface ToolExecution {
  timeout: number;
  retry: ToolRetryConfig;
  concurrency: ConcurrencyConfig;
}

/** 工具重试配置 */
export interface ToolRetryConfig {
  enabled: boolean;
  attempts: number;
  delay: number;
}

/** 并发配置 */
export interface ConcurrencyConfig {
  enabled: boolean;
  max: number;
}

/** 工具元数据 */
export interface ToolMetadata {
  version: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

/** 工具调用请求 */
export interface ToolCallRequest {
  id: string;
  toolId: string;
  parameters: any;
  sessionId: string;
  userId?: string;
  metadata?: ToolCallMetadata;
}

/** 工具调用元数据 */
export interface ToolCallMetadata {
  priority?: 'low' | 'normal' | 'high' | 'critical';
  traceId?: string;
  parentCallId?: string;
  [key: string]: any;
}

/** 工具调用响应 */
export interface ToolCallResponse {
  id: string;
  toolId: string;
  success: boolean;
  result?: any;
  error?: ToolCallError;
  execution: ToolExecutionInfo;
  metadata?: ToolResponseMetadata;
}

/** 工具调用错误 */
export interface ToolCallError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

/** 工具执行信息 */
export interface ToolExecutionInfo {
  startedAt: Date;
  endedAt: Date;
  duration: number;
  resources?: ExecutionResources;
}

/** 执行资源 */
export interface ExecutionResources {
  memoryUsedMB: number;
  cpuUsage: number;
}

/** 工具响应元数据 */
export interface ToolResponseMetadata {
  warnings?: string[];
  suggestions?: string[];
  [key: string]: any;
}

// ==================== 实用函数 ====================

/** 创建默认配置 */
export function createDefaultConfig(): OpenClawConfig {
  return {
    gateway: {
      auth: {
        mode: 'token',
        token: ''
      },
      network: {
        port: 30000,
        host: '0.0.0.0',
        cors: {
          enabled: true,
          origins: ['*']
        },
        rateLimit: {
          enabled: true,
          windowMs: 60000,
          maxRequests: 100
        }
      },
      security: {
        ssl: {
          enabled: false
        },
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        },
        ipWhitelist: []
      }
    },
    models: {
      default: 'deepseek/deepseek-chat',
      providers: [
        {
          id: 'deepseek',
          type: 'deepseek',
          apiKey: '',
          baseUrl: 'https://api.deepseek.com/v1',
          timeout: 30000,
          retry: {
            attempts: 3,
            delay: 1000
          }
        }
      ],
      configurations: [
        {
          id: 'deepseek-chat',
          provider: 'deepseek',
          name: 'DeepSeek Chat',
          contextWindow: 128000,
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      ]
    },
    sessions: {
      management: {
        maxSessions: 100,
        sessionTimeout: 3600000,
        cleanupInterval: 300000,
        persistence: {
          enabled: true,
          storagePath: './sessions',
          backupInterval: 86400000
        }
      },
      context: {
        maxTokens: 32000,
        compression: {
          enabled: true,
          strategy: 'summarization',
          targetRatio: 0.5
        },
        memory: {
          enabled: true,
          type: 'hybrid',
          embeddingModel: 'text-embedding-3-small'
        }
      }
    },
    tools: {
      registry: {
        enabled: true,
        autoDiscovery: true,
        validation: {
          enabled: true,
          strict: true
        }
      },
      security: {
        sandbox: {
          enabled: true,
          isolationLevel: 'partial',
          resourceLimits: {
            memoryMB: 512,
            cpuTimeMs: 5000,
            executionTimeMs: 10000
          }
        },
        permissions: {
          enabled: true,
          defaultLevel: 'user',
          overrideRules: []
        }
      }
    },
    plugins: {
      management: {
        enabled: true,
        autoLoad: true,
        hotReload: false,
        validation: {
          enabled: true,
          signatureCheck: false
        }
      },
      configurations: []
    },
    logging: {
      level: 'info',
      targets: [
        {
          type: 'console',
          config: {}
        }
      ],
      format: {
        timestamp: true,
        level: true,
        label: true,
        message: true,
        metadata: true
      }
    },
    monitoring: {
      health: {
        enabled: true,
        interval: 30000,
        endpoints: ['/health', '/metrics']
      },
      metrics: {
        enabled: true,
        interval: 60000,
        exporters: [
          {
            type: 'console',
            config: {}
          }
        ]
      },
      alerts: {
        enabled: true,
        rules: [
          {
            id: 'high-error-rate',
            condition: 'error_rate > 0.1',
            severity: 'error',
            actions: ['log', 'notify']
          }
        ]
      }
    }
  };
}

/** 验证配置 */
export function validateConfig(config: OpenClawConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证Gateway配置
  if (!config.gateway.auth.token && config.gateway.auth.mode === 'token') {
    warnings.push('Gateway token未设置，建议在生产环境中设置token');
  }
  
  // 验证模型配置
  if (!config.models.default) {
    errors.push('未设置默认模型');
  }
  
  const defaultModelExists = config.models.configurations.some(
    model => model.id === config.models.default
  );
  
  if (!defaultModelExists) {
    errors.push(`默认模型 ${config.models.default} 不存在于模型配置中`);
  }
  
  // 验证会话配置
  if (config.sessions.context.maxTokens > 128000) {
    warnings.push('上下文最大Token数设置过高，可能影响性能');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** 创建默认会话配置 */
export function createDefaultSessionConfig(sessionId: string): SessionConfig {
  return {
    id: sessionId,
    type: SessionType.MAIN,
    model: {
      id: 'deepseek-chat',
      provider: 'deepseek',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4096
    },
    tools: {
      enabled: true,
      allowed: ['read', 'write', 'exec', 'process', 'message'],
      denied: [],
      requireApproval: ['exec', 'write']
    },
    context: {
      maxTokens: 32000,
      compression: {
        enabled: true,
        strategy: 'auto'
      },
      memory: {
        enabled: true,
        retrieval: 'auto'
      }
    },
    security: {
      level: 'medium',
      contentFilter: true,
      toolValidation: true,
      rateLimit: {
        enabled: true,
        requestsPerMinute: 60
      }
    }
  };
}

/** 检查工具权限 */
export function checkToolPermission(
  toolId: string,
  permission: ToolPermission,
  userLevel: 'user' | 'admin' | 'system'
): boolean {
  const permissionLevels = {
    user: 1,
    admin: 2,
    system: 3,
    approval_required: 4
  };
  
  const userLevelValue = permissionLevels[userLevel];
  const requiredLevelValue = permissionLevels[permission];
  
  // 如果权限级别是approval_required，需要特殊处理
  if (permission === ToolPermission.APPROVAL_REQUIRED) {
    return false; // 需要额外批准
  }
  
  return userLevelValue >= requiredLevelValue;
}

/** 验证工具参数 */
export function validateToolParameters(
  toolDefinition: ToolDefinition,
  parameters: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查必需参数
  for (const [paramName, paramDef] of Object.entries(toolDefinition.parameters)) {
    if (paramDef.required && (parameters[paramName] === undefined || parameters[paramName] === null)) {
      errors.push(`必需参数缺失: ${paramName}`);
    }
  }
  
  // 检查参数类型
  for (const [paramName, paramValue] of Object.entries(parameters)) {
    const paramDef = toolDefinition.parameters[paramName];
    if (!paramDef) {
      warnings.push(`未知参数: ${paramName}`);
      continue;
    }
    
    // 类型检查
    const typeValid = checkParameterType(paramDef.type, paramValue);
    if (!typeValid) {
      errors.push(`参数 ${paramName} 类型不匹配，期望 ${paramDef.type}，实际 ${typeof paramValue}`);
    }
    
    // 验证规则检查
    if (paramDef.validation) {
      const validationErrors = validateParameter(paramValue, paramDef.validation);
      errors.push(...validationErrors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/** 检查参数类型 */
function checkParameterType(expectedType: string, value: any): boolean {
  if (value === undefined || value === null) return true;
  
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && !Array.isArray(value);
    default:
      return true;
  }
}

/** 验证参数 */
function validateParameter(value: any, validation: ParameterValidation): string[] {
  const errors: string[] = [];
  
  if (validation.pattern && typeof value === 'string') {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      errors.push(`值不符合模式: ${validation.pattern}`);
    }
  }
  
  if (validation.min !== undefined && typeof value === 'number') {
    if (value < validation.min) {
      errors.push(`值小于最小值: ${validation.min}`);
    }
  }
  
  if (validation.max !== undefined && typeof value === 'number') {
    if (value > validation.max) {
      errors.push(`值大于最大值: ${validation.max}`);
    }
  }
  
  if (validation.enum && validation.enum.length > 0) {
    if (!validation.enum.includes(value)) {
      errors.push(`值不在允许的范围内: ${validation.enum.join(', ')}`);
    }
  }
  
  return errors;
}

/** 创建工具调用响应 */
export function createToolCallResponse(
  request: ToolCallRequest,
  success: boolean,
  result?: any,
  error?: ToolCallError,
  executionTime?: number
): ToolCallResponse {
  const now = new Date();
  const startedAt = new Date(now.getTime() - (executionTime || 0));
  
  return {
    id: request.id,
    toolId: request.toolId,
    success,
    result,
    error,
    execution: {
      startedAt,
      endedAt: now,
      duration: executionTime || 0
    },
    metadata: {
      sessionId: request.sessionId,
      userId: request.userId,
      timestamp: now
    }
  };
}

/** 创建错误响应 */
export function createErrorResponse(
  request: ToolCallRequest,
  errorCode: string,
  errorMessage: string,
  details?: any
): ToolCallResponse {
  return createToolCallResponse(
    request,
    false,
    undefined,
    {
      code: errorCode,
      message: errorMessage,
      details,
      recoverable: true
    },
    0
  );
}

// ==================== 导出 ====================

export {
  // 配置
  OpenClawConfig,
  GatewayConfig,
  AuthConfig,
  OAuthConfig,
  NetworkConfig,
  CorsConfig,
  RateLimitConfig,
  SecurityConfig,
  SSLConfig,
  ModelsConfig,
  ModelProvider,
  RetryConfig,
  ModelConfiguration,
  SessionsConfig,
  SessionManagementConfig,
  PersistenceConfig,
  SessionContextConfig,
  CompressionConfig,
  MemoryConfig,
  ToolsConfig,
  ToolRegistryConfig,
  ValidationConfig,
  ToolSecurityConfig,
  SandboxConfig,
  ResourceLimits,
  PermissionsConfig,
  PermissionRule,
  PluginsConfig,
  PluginManagementConfig,
  PluginValidationConfig,
  PluginConfiguration,
  LoggingConfig,
  LogTarget,
  LogFormat,
  MonitoringConfig,
  HealthConfig,
  MetricsConfig,
  MetricsExporter,
  AlertsConfig,
  AlertRule,
  
  // 会话
  SessionState,
  SessionType,
  SessionConfig,
  SessionModelConfig,
  SessionToolsConfig,
  SessionSecurityConfig,
  SessionRateLimitConfig,
  SessionMessage,
  SessionMessageMetadata,
  ToolCall,
  ToolResponse,
  TokenUsage,
  SessionStatus,
  SessionStatistics,
  ToolCallStatistics,
  SessionDuration,
  SessionResources,
  MemoryUsage,
  CpuUsage,
  NetworkUsage,
  SessionError,
  
  // 工具
  ToolCategory,
  ToolPermission,
  ToolDefinition,
  ToolParameters,
  ToolParameter,
  ParameterValidation,
  ToolReturns,
  ToolSecurity,
  NetworkAccessConfig,
  FilesystemAccessConfig,
  ToolExecution,
  ToolRetryConfig,
  ConcurrencyConfig,
  ToolMetadata,
  ToolCallRequest,
  ToolCallMetadata,
  ToolCallResponse,
  ToolCallError,
  ToolExecutionInfo,
  ExecutionResources,
  ToolResponseMetadata,
  
  // 实用函数
  createDefaultConfig,
  validateConfig,
  ValidationResult,
  createDefaultSessionConfig,
  checkToolPermission,
  validateToolParameters,
  createToolCallResponse,
  createErrorResponse
};
