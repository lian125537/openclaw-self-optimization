/**
 * OpenClaw核心类型定义
 * 基于Claude企业级架构标准优化
 */

// ==================== 基础类型 ====================

/** OpenClaw配置选项 */
export interface OpenClawConfig {
  /** Gateway配置 */
  gateway: {
    /** 认证模式 */
    auth: {
      mode: 'none' | 'token' | 'oauth';
      token?: string;
      oauth?: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
      };
    };
    
    /** 网络配置 */
    network: {
      port: number;
      host: string;
      cors: {
        enabled: boolean;
        origins: string[];
      };
      rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
      };
    };
    
    /** 安全配置 */
    security: {
      ssl: {
        enabled: boolean;
        certPath?: string;
        keyPath?: string;
      };
      headers: {
        [key: string]: string;
      };
      ipWhitelist: string[];
    };
  };
  
  /** 模型配置 */
  models: {
    /** 默认模型 */
    default: string;
    
    /** 模型提供者 */
    providers: Array<{
      id: string;
      type: 'openai' | 'anthropic' | 'minimax' | 'deepseek' | 'siliconflow' | 'custom';
      apiKey?: string;
      baseUrl?: string;
      timeout: number;
      retry: {
        attempts: number;
        delay: number;
      };
    }>;
    
    /** 模型配置 */
    configurations: Array<{
      id: string;
      provider: string;
      name: string;
      contextWindow: number;
      maxTokens: number;
      temperature: number;
      topP: number;
      frequencyPenalty: number;
      presencePenalty: number;
    }>;
  };
  
  /** 会话配置 */
  sessions: {
    /** 会话管理 */
    management: {
      maxSessions: number;
      sessionTimeout: number;
      cleanupInterval: number;
      persistence: {
        enabled: boolean;
        storagePath: string;
        backupInterval: number;
      };
    };
    
    /** 上下文管理 */
    context: {
      maxTokens: number;
      compression: {
        enabled: boolean;
        strategy: 'summarization' | 'extraction' | 'truncation';
        targetRatio: number;
      };
      memory: {
        enabled: boolean;
        type: 'vector' | 'fulltext' | 'hybrid';
        embeddingModel?: string;
      };
    };
  };
  
  /** 工具配置 */
  tools: {
    /** 工具注册 */
    registry: {
      enabled: boolean;
      autoDiscovery: boolean;
      validation: {
        enabled: boolean;
        strict: boolean;
      };
    };
    
    /** 工具安全 */
    security: {
      sandbox: {
        enabled: boolean;
        isolationLevel: 'none' | 'partial' | 'full';
        resourceLimits: {
          memoryMB: number;
          cpuTimeMs: number;
          executionTimeMs: number;
        };
      };
      permissions: {
        enabled: boolean;
        defaultLevel: 'user' | 'admin' | 'system';
        overrideRules: Array<{
          tool: string;
          permission: string;
          condition?: any;
        }>;
      };
    };
  };
  
  /** 插件配置 */
  plugins: {
    /** 插件管理 */
    management: {
      enabled: boolean;
      autoLoad: boolean;
      hotReload: boolean;
      validation: {
        enabled: boolean;
        signatureCheck: boolean;
      };
    };
    
    /** 插件配置 */
    configurations: Array<{
      id: string;
      name: string;
      version: string;
      enabled: boolean;
      config: any;
    }>;
  };
  
  /** 日志配置 */
  logging: {
    /** 日志级别 */
    level: 'debug' | 'info' | 'warn' | 'error';
    
    /** 输出目标 */
    targets: Array<{
      type: 'console' | 'file' | 'syslog' | 'elasticsearch';
      config: any;
    }>;
    
    /** 日志格式 */
    format: {
      timestamp: boolean;
      level: boolean;
      label: boolean;
      message: boolean;
      metadata: boolean;
    };
  };
  
  /** 监控配置 */
  monitoring: {
    /** 健康检查 */
    health: {
      enabled: boolean;
      interval: number;
      endpoints: string[];
    };
    
    /** 指标收集 */
    metrics: {
      enabled: boolean;
      interval: number;
      exporters: Array<{
        type: 'prometheus' | 'statsd' | 'console';
        config: any;
      }>;
    };
    
    /** 告警 */
    alerts: {
      enabled: boolean;
      rules: Array<{
        id: string;
        condition: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        actions: string[];
      }>;
    };
  };
}

// ==================== 会话类型 ====================

/** 会话状态 */
export enum SessionState {
  /** 活跃 */
  ACTIVE = 'active',
  
  /** 闲置 */
  IDLE = 'idle',
  
  /** 等待 */
  WAITING = 'waiting',
  
  /** 错误 */
  ERROR = 'error',
  
  /** 完成 */
  COMPLETED = 'completed',
  
  /** 已终止 */
  TERMINATED = 'terminated'
}

/** 会话类型 */
export enum SessionType {
  /** 主会话 */
  MAIN = 'main',
  
  /** 子代理 */
  SUBAGENT = 'subagent',
  
  /** ACP会话 */
  ACP = 'acp',
  
  /** 隔离会话 */
  ISOLATED = 'isolated',
  
  /** 持久会话 */
  PERSISTENT = 'persistent'
}

/** 会话配置 */
export interface SessionConfig {
  /** 会话ID */
  id: string;
  
  /** 会话类型 */
  type: SessionType;
  
  /** 模型配置 */
  model: {
    id: string;
    provider: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  };
  
  /** 工具配置 */
  tools: {
    enabled: boolean;
    allowed: string[];
    denied: string[];
    requireApproval: string[];
  };
  
  /** 上下文配置 */
  context: {
    maxTokens: number;
    compression: {
      enabled: boolean;
      strategy: 'auto' | 'manual';
    };
    memory: {
      enabled: boolean;
      retrieval: 'auto' | 'manual' | 'none';
    };
  };
  
  /** 安全配置 */
  security: {
    level: 'low' | 'medium' | 'high';
    contentFilter: boolean;
    toolValidation: boolean;
    rateLimit: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };
}

/** 会话消息 */
export interface SessionMessage {
  /** 消息ID */
  id: string;
  
  /** 角色 */
  role: 'user' | 'assistant' | 'system' | 'tool';
  
  /** 内容 */
  content: string;
  
  /** 时间戳 */
  timestamp: Date;
  
  /** 元数据 */
  metadata?: {
    /** 工具调用 */
    toolCalls?: Array<{
      id: string;
      name: string;
      arguments: any;
    }>;
    
    /** 工具响应 */
    toolResponses?: Array<{
      toolCallId: string;
      content: any;
    }>;
    
    /** 模型信息 */
    model?: string;
    
    /** 使用情况 */
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    
    /** 其他元数据 */
    [key: string]: any;
  };
}

/** 会话状态 */
export interface SessionStatus {
  /** 会话ID */
  id: string;
  
  /** 状态 */
  state: SessionState;
  
  /** 配置 */
  config: SessionConfig;
  
  /** 统计信息 */
  statistics: {
    /** 消息数量 */
    messageCount: number;
    
    /** Token使用 */
    tokenUsage: {
      total: number;
      prompt: number;
      completion: number;
    };
    
    /** 工具调用 */
    toolCalls: {
      total: number;
      successful: number;
      failed: number;
    };
    
    /** 持续时间 */
    duration: {
      startedAt: Date;
      lastActivity: Date;
      totalSeconds: number;
    };
  };
  
  /** 资源使用 */
  resources: {
    /** 内存使用 */
    memory: {
      used: number;
      max: number;
      percentage: number;
    };
    
    /** CPU使用 */
    cpu: {
      usage: number;
      threads: number;
    };
    
    /** 网络 */
    network: {
      requests: number;
      bytesSent: number;
      bytesReceived: number;
    };
  };
  
  /** 错误信息 */
  errors?: Array<{
    id: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

// ==================== 工具类型 ====================

/** 工具类别 */
export enum ToolCategory {
  /** 文件操作 */
  FILE = 'file',
  
  /** 系统命令 */
  SYSTEM = 'system',
  
  /** 网络操作 */
  NETWORK = 'network',
  
  /** 数据库 */
  DATABASE = 'database',
  
  /** API调用 */
  API = 'api',
  
  /** 数据处理 */
  DATA = 'data',
  
  /** 工具管理 */
  MANAGEMENT = 'management',
  
  /** 其他 */
  OTHER = 'other'
}

/** 工具权限级别 */
export enum ToolPermission {
  /** 用户级别 */
  USER = 'user',
  
  /** 管理员级别 */
  ADMIN = 'admin',
  
  /** 系统级别 */
  SYSTEM = 'system',
  
  /** 需要批准 */
  APPROVAL_REQUIRED = 'approval_required'
}

/** 工具定义 */
export interface ToolDefinition {
  /** 工具ID */
  id: string;
  
  /** 工具名称 */
  name: string;
  
  /** 工具描述 */
  description: string;
  
  /** 工具类别 */
  category: ToolCategory;
  
  /** 权限级别 */
  permission: ToolPermission;
  
  /** 参数定义 */
  parameters: {
    [key: string]: {
      /** 参数类型 */
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      
      /** 是否必需 */
      required: boolean;
      
      /** 描述 */
      description: string;
      
      /** 默认值 */
      default?: any;
      
      /** 验证规则 */
      validation?: {
        /** 正则表达式 */
        pattern?: string;
        
        /** 最小值 */
        min?: number;
        
        /** 最大值 */
        max?: number;
        
        /** 允许的值 */
        enum?: any[];
        
        /** 自定义验证函数 */
        validator?: string;
      };
    };
  };
  
  /** 返回值定义 */
  returns: {
    /** 返回类型 */
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'void';
    
    /** 描述 */
    description: string;
  };
  
  /** 安全配置 */
  security: {
    /** 是否需要沙盒 */
    requiresSandbox: boolean;
    
    /** 资源限制 */
    resourceLimits?: {
      /** 最大内存(MB) */
      maxMemoryMB: number;
      
      /** 最大执行时间(ms) */
      maxExecutionTimeMs: number;
      
      /** 最大CPU时间(ms) */
      maxCpuTimeMs: number;
    };
    
    /** 网络访问 */
    networkAccess: {
      allowed: boolean;
      domains?: string[];
    };
    
    /** 文件系统访问 */
    filesystemAccess: {
      allowed: boolean;
      paths?: string[];
      readOnly?: boolean;
    };
  };
  
  /** 执行配置 */
  execution: {
    /** 超时时间(ms) */
    timeout: number;
    
    /** 重试配置 */
    retry: {
      enabled: boolean;
      attempts: number;
      delay: number;
    };
    
    /** 并发限制 */
    concurrency: {
      enabled: boolean;
      max: number;
    };
  };
  
  /** 元数据 */
  metadata?: {
    /** 版本 */
    version: string;
    
    /** 作者 */
    author?: string;
    
    /** 创建时间 */
    createdAt: Date;
    
    /** 更新时间 */
    updatedAt: Date;
    
    /** 标签 */
    tags?: string[];
  };
}

/** 工具调用请求 */
export interface ToolCallRequest {
  /** 调用ID */
  id: string;
  
  /** 工具ID */
  toolId: string;
  
  /** 参数 */
  parameters: any;
  
  /** 会话ID */
  sessionId: string;
  
  /** 用户ID */
  userId?: string;
  
  /** 元数据 */
  metadata?: {
    /** 优先级 */
    priority?: 'low' | 'normal' | 'high' | 'critical';
    
    /** 跟踪信息 */
    traceId?: string;
    
    /** 父调用ID */
    parentCallId?: string;
    
    /** 其他元数据 */
    [key: string]: any;
  };
}

/** 工具调用响应 */
export interface ToolCallResponse {
  /** 调用ID */
  id: string;
  
  /** 工具ID */
  toolId: string;
  
  /** 成功状态 */
  success: boolean;
  
  /** 结果 */
  result?: any;
  
  /** 错误信息 */
  error?: {
    /** 错误代码 */
    code: string;
    
    /** 错误消息 */
    message: string;
    
    /** 错误详情 */
    details?: any;
    
    /** 可恢复 */
    recoverable: boolean;
  };
  
  /** 执行信息 */
  execution: {
    /** 开始时间 */
    startedAt: Date;
    
    /** 结束时间 */
    endedAt: Date;
    
    /** 执行时间(ms) */
    duration: number;
    
    /** 资源使用 */
    resources?: {
      /** 内存使用(MB) */
      memoryUsedMB: number;
      
      /** CPU使用率 */
      cpuUsage: number;
    };
  };
  
  /** 元数据 */
  metadata?: {
    /** 警告 */
    warnings?: string[];
    
    /** 建议 */
    suggestions?: string[];
    
    /** 其他元数据 */
    [key: string]: any;
  };
}

// ==================== 插件类型 ====================

/** 插件类型 */
export enum PluginType {
  /** 工具插件 */
  TOOL = 'tool',
  
  /** 模型插件 */
  MODEL = 'model',
  
  /** 存储插件 */
  STORAGE = 'storage',
  
  /** 认证插件 */
  AUTH = 'auth',
  
  /** 监控插件 */
  MONITORING = 'monitoring',
  
  /** 集成插件 */
  INTEGRATION = 'integration',
  
  /** 自定义插件 */
  CUSTOM = 'custom'
}

/** 插件定义 */
export interface PluginDefinition {
  /** 插件ID */
  id: string;
  
  /** 插件名称 */
  name: string;
  
  /** 插件类型 */
  type: PluginType;
  
  /** 版本 */
  version: string;
  
  /** 描述 */
  description: string;
  
  /** 作者 */
  author: string;
  
  /** 许可证 */
  license: string;
  
  /** 依赖 */
  dependencies?: Array<{
    /** 依赖ID */
    id: string;
    
    /** 版本范围 */
    version: string;
  }>;
  
  /** 配置定义 */
  configSchema?: any;
  
  /** 生命周期钩子 */
  hooks?: {
    /** 初始化 */
    initialize?: string;
    
    /** 启动 */
    start?: string;
    
    /** 停止 */
    stop?: string;
    
    /** 清理 */
    cleanup?: string;
  };
  
  /** 导出 */
  exports?: {
    /** 工具 */
    tools?: string[];
    
    /** 模型 */
    models?: string[];
    
    /** 中间件 */
    middlewares?: string[];
    
    /** 路由 */
    routes?: string[];
    
    /** 事件处理器 */
    eventHandlers?: string[];
  };
}

/** 插件状态 */
export interface PluginStatus {
  /** 插件ID */
  id: string;
  
  /** 状态 */
  state: 'installed' | 'enabled' | 'disabled' | 'error';
  
  /** 版本 */
  version: string;
  
  /** 配置 */
  config: any;
  
  /** 统计信息 */
  statistics?: {
    /** 使用次数 */
    usageCount: number;
    
    /** 最后使用时间 */
    lastUsed: Date;
    
    /** 错误次数 */
    errorCount: number;
  };
  
  /** 错误信息 */
  error?: {
    /** 错误代码 */
    code: string;
    
    /** 错误消息 */
    message: string;
    
    /** 堆栈跟踪 */
    stack?: string;
    
    /** 发生时间 */
    timestamp: Date;
  };
}

// ==================== 事件类型 ====================

/** 事件类型 */
export enum EventType {
  /** 会话事件 */
  SESSION_CREATED = 'session.created',
  SESSION_UPDATED = 'session.updated',
  SESSION_DELETED = 'session.deleted',
  SESSION_ERROR = 'session.error',
  
