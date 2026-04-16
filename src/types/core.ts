/**
 * OpenClaw 核心类型定义
 * 企业级类型安全系统
 */

// ==================== 基础类型 ====================

/** 通用结果类型 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** 异步结果类型 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/** 可选值类型 */
export type Optional<T> = T | null | undefined;

/** 非空类型 */
export type NonNullable<T> = T extends null | undefined ? never : T;

// ==================== 错误类型 ====================

/** 错误分类 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
  CONFIGURATION = 'CONFIGURATION',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE'
}

/** 错误严重程度 */
export enum ErrorSeverity {
  LOW = 'LOW',        // 可忽略的错误
  MEDIUM = 'MEDIUM',  // 需要记录但可继续
  HIGH = 'HIGH',      // 需要立即关注
  CRITICAL = 'CRITICAL' // 系统不可用
}

/** 标准化错误接口 */
export interface StandardError {
  name: string;
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any> | undefined;
  stack?: string | undefined;
  cause?: Error | undefined;
}

/** 错误创建选项 */
export interface ErrorOptions {
  code: string;
  category: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  cause?: Error;
}

// ==================== 技能系统类型 ====================

/** 技能类型 */
export enum SkillType {
  PROMPT = 'prompt',
  COMMAND = 'command',
  TOOL = 'tool',
  CUSTOM = 'custom'
}

/** 技能定义 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  version: string;
  author?: string;
  dependencies?: string[];
  configSchema?: Record<string, any>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

/** 技能执行上下文 */
export interface SkillExecutionContext {
  skillId: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  input: Record<string, any>;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

/** 技能执行结果 */
export interface SkillExecutionResult {
  success: boolean;
  output?: any;
  error?: StandardError;
  executionTime: number;
  tokensUsed?: number;
  metadata?: Record<string, any>;
}

// ==================== 记忆系统类型 ====================

/** 记忆层级 */
export enum MemoryLayer {
  HOT = 'hot',    // 热层：当前会话
  WARM = 'warm',  // 温层：近期记忆
  COLD = 'cold'   // 冷层：长期记忆
}

/** 记忆条目 */
export interface MemoryEntry {
  id: string;
  content: string;
  layer: MemoryLayer;
  timestamp: Date;
  expiresAt?: Date;
  tags: string[];
  metadata: Record<string, any>;
  embedding?: number[];
}

/** 记忆查询选项 */
export interface MemoryQueryOptions {
  query: string;
  layer?: MemoryLayer;
  limit?: number;
  threshold?: number;
  includeEmbeddings?: boolean;
}

// ==================== VCP 系统类型 ====================

/** 语义标签 */
export interface SemanticTag {
  id: string;
  name: string;
  description?: string;
  category: string;
  weight: number;
  metadata?: Record<string, any>;
}

/** 上下文快照 */
export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  tokens: number;
  content: string;
  compressionLevel: number;
  tags: SemanticTag[];
  metadata: Record<string, any>;
}

/** 变量定义 */
export interface VariableDefinition {
  name: string;
  type: string;
  value: any;
  description?: string;
  scope: string;
  mutable: boolean;
  validationRules?: ValidationRule[];
}

// ==================== 验证系统类型 ====================

/** 验证规则 */
export interface ValidationRule {
  type: string;
  params?: Record<string, any>;
  message?: string;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/** 验证错误 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
}

/** 验证警告 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

// ==================== 工具函数类型 ====================

/** 配置验证函数 */
export type ConfigValidator<T> = (config: any) => Result<T, ValidationError[]>;

/** 技能执行函数 */
export type SkillExecutor = (
  context: SkillExecutionContext
) => Promise<SkillExecutionResult>;

/** 错误处理函数 */
export type ErrorHandler = (error: StandardError) => void;

/** 日志记录函数 */
export type Logger = {
  debug: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, error?: Error, meta?: any) => void;
};

// ==================== 工具类型 ====================

/** 深度只读类型 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** 深度可选类型 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** 深度必需类型 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/** 从联合类型中提取特定类型 */
export type ExtractByType<T, U> = T extends { type: U } ? T : never;

/** 确保非空数组 */
export type NonEmptyArray<T> = [T, ...T[]];

/** 异步迭代器 */
export type AsyncIterable<T> = {
  [Symbol.asyncIterator](): AsyncIterator<T>;
};

// ==================== 导出所有类型 ====================

export * from './errors';