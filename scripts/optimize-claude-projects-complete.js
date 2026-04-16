#!/usr/bin/env node

/**
 * Claude源码移植项目优化器 - 完整版
 * 统一TypeScript化 + 生产就绪优化
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Claude源码移植项目优化器\n');

// ==================== 配置 ====================

const PROJECTS_TO_OPTIMIZE = [
  {
    name: 'ClaudeCorePorting',
    path: './claude-core-porting',
    type: 'core-architecture',
    files: 50,
    priority: 'critical'
  },
  {
    name: 'Hooks系统',
    path: './hooks/claude-integration',
    type: 'integration',
    files: 3,
    priority: 'high'
  },
  {
    name: 'Claude技能系统',
    path: './skills-dev/skills/claude',
    type: 'skills',
    files: 13,
    priority: 'medium'
  }
];

// ==================== 核心优化函数 ====================

/**
 * 优化ClaudeCorePorting项目
 */
function optimizeClaudeCorePorting() {
  console.log('🔧 优化 ClaudeCorePorting...');
  
  const projectPath = './claude-core-porting';
  const typesPath = path.join(projectPath, 'types');
  
  // 创建types目录
  if (!fs.existsSync(typesPath)) {
    fs.mkdirSync(typesPath, { recursive: true });
  }
  
  // 1. 创建核心类型定义
  const coreTypes = `/**
 * ClaudeCorePorting 核心类型定义
 */

export interface ClaudeCoreConfig {
  errorClassification: {
    enabled: boolean;
    model: string;
    confidenceThreshold: number;
    enableAutoRecovery: boolean;
  };
  
  contextCompression: {
    enabled: boolean;
    targetCompressionRatio: number;
    compressionStrategy: 'balanced' | 'aggressive' | 'conservative';
    preserveToolCalls: boolean;
    preserveCodeBlocks: boolean;
  };
  
  safetyGuardrails: {
    enabled: boolean;
    securityLevel: 'low' | 'medium' | 'high';
    enableContentFiltering: boolean;
    enableIntentClassification: boolean;
    enableToolSafetyValidation: boolean;
  };
  
  codeSandbox: {
    enabled: boolean;
    defaultEnvironment: string;
    maxConcurrentExecutions: number;
    enableResourceLimits: boolean;
  };
}

export interface ClaudeError {
  code: string;
  message: string;
  category: 'network' | 'validation' | 'system' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoRecoverable: boolean;
  timestamp: Date;
}

export const DEFAULT_CONFIG: ClaudeCoreConfig = {
  errorClassification: {
    enabled: true,
    model: 'default',
    confidenceThreshold: 0.7,
    enableAutoRecovery: true
  },
  contextCompression: {
    enabled: true,
    targetCompressionRatio: 0.5,
    compressionStrategy: 'balanced',
    preserveToolCalls: true,
    preserveCodeBlocks: true
  },
  safetyGuardrails: {
    enabled: true,
    securityLevel: 'medium',
    enableContentFiltering: true,
    enableIntentClassification: true,
    enableToolSafetyValidation: true
  },
  codeSandbox: {
    enabled: true,
    defaultEnvironment: 'nodejs-basic',
    maxConcurrentExecutions: 5,
    enableResourceLimits: true
  }
};
`;
  
  fs.writeFileSync(path.join(typesPath, 'core-types.ts'), coreTypes);
  
  // 2. 创建TypeScript适配器
  const adapterPath = path.join(projectPath, 'claude-adapter.ts');
  const adapterContent = `/**
 * ClaudeCorePorting TypeScript适配器
 */

import { ClaudeCoreConfig, DEFAULT_CONFIG, ClaudeError } from './types/core-types';

export class ClaudeCorePortingAdapter {
  private config: ClaudeCoreConfig;
  private isInitialized = false;
  
  constructor(config?: Partial<ClaudeCoreConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 初始化ClaudeCorePorting...');
    
    // 动态加载JavaScript模块
    const { ClaudeCorePorting } = require('./src/index.js');
    this.core = new ClaudeCorePorting(this.config);
    
    if (typeof this.core.initialize === 'function') {
      await this.core.initialize();
    }
    
    this.isInitialized = true;
    console.log('✅ ClaudeCorePorting初始化完成');
  }
  
  async classifyError(error: any): Promise<any> {
    await this.ensureInitialized();
    return await this.core.classifyError(error);
  }
  
  async checkContentSafety(content: string): Promise<any> {
    await this.ensureInitialized();
    return await this.core.checkContentSafety(content);
  }
  
  async compressContext(context: any, options?: any): Promise<any> {
    await this.ensureInitialized();
    return await this.core.compressContext(context, options);
  }
  
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;
    
    if (typeof this.core.shutdown === 'function') {
      await this.core.shutdown();
    }
    
    this.isInitialized = false;
    console.log('✅ ClaudeCorePorting已关闭');
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  private core: any;
}

export function createClaudeCorePorting(config?: Partial<ClaudeCoreConfig>): ClaudeCorePortingAdapter {
  return new ClaudeCorePortingAdapter(config);
}
`;
  
  fs.writeFileSync(adapterPath, adapterContent);
  
  // 3. 创建测试文件
  const testPath = path.join(projectPath, 'claude-adapter.test.ts');
  const testContent = `/**
 * ClaudeCorePorting适配器测试
 */

import { createClaudeCorePorting } from './claude-adapter';

describe('ClaudeCorePortingAdapter', () => {
  let adapter: any;
  
  beforeEach(() => {
    adapter = createClaudeCorePorting({
      errorClassification: { enabled: true },
      safetyGuardrails: { enabled: true }
    });
  });
  
  afterEach(async () => {
    if (adapter) {
      await adapter.shutdown();
    }
  });
  
  test('初始化成功', async () => {
    await adapter.initialize();
    expect(adapter).toBeDefined();
  });
  
  test('错误分类', async () => {
    await adapter.initialize();
    const error = new Error('测试错误');
    const classification = await adapter.classifyError(error);
    expect(classification).toBeDefined();
  });
  
  test('内容安全检查', async () => {
    await adapter.initialize();
    const safetyCheck = await adapter.checkContentSafety('安全内容');
    expect(safetyCheck.isSafe).toBe(true);
  });
});
`;
  
  fs.writeFileSync(testPath, testContent);
  
  console.log('✅ ClaudeCorePorting优化完成');
  console.log('   创建: types/core-types.ts');
  console.log('   创建: claude-adapter.ts');
  console.log('   创建: claude-adapter.test.ts\n');
}

/**
 * 优化Hooks系统
 */
function optimizeHooksSystem() {
  console.log('🔧 优化 Hooks系统...');
  
  const projectPath = './hooks/claude-integration';
  const typesPath = path.join(projectPath, 'types');
  
  // 创建types目录
  if (!fs.existsSync(typesPath)) {
    fs.mkdirSync(typesPath, { recursive: true });
  }
  
  // 1. 创建Hook类型定义
  const hookTypes = `/**
 * Claude Hooks系统类型定义
 */

export interface HookConfig {
  name: string;
  enabled: boolean;
  priority: number;
  timeout: number;
}

export interface HookContext {
  requestId: string;
  sessionId?: string;
  userId?: string;
  operation: string;
  input: any;
  metadata?: Record<string, any>;
}

export interface HookResult {
  success: boolean;
  output?: any;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  executionTime: number;
}

export interface HookHandler {
  (context: HookContext): Promise<HookResult>;
}

export interface HookRegistry {
  register(hookName: string, handler: HookHandler, config?: Partial<HookConfig>): void;
  unregister(hookName: string): void;
  execute(hookName: string, context: HookContext): Promise<HookResult>;
  getHooks(): string[];
}

export const DEFAULT_HOOK_CONFIG: HookConfig = {
  name: '',
  enabled: true,
  priority: 0,
  timeout: 5000
};
`;
  
  fs.writeFileSync(path.join(typesPath, 'hook-types.ts'), hookTypes);
  
  // 2. 创建TypeScript化的Hook处理器
  const handlerPath = path.join(projectPath, 'hook-processor.ts');
  const handlerContent = `/**
 * Claude Hook处理器 - TypeScript版
 */

import { HookConfig, HookContext, HookResult, HookHandler, DEFAULT_HOOK_CONFIG } from './types/hook-types';

export class ClaudeHookProcessor {
  private hooks: Map<string, { handler: HookHandler; config: HookConfig }> = new Map();
  private isInitialized = false;
  
  constructor() {}
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 初始化Claude Hook处理器...');
    
    // 加载现有的JavaScript处理器
    try {
      const { handler } = require('./handler.js');
      this.register('claude-integration', handler, {
        name: 'claude-integration',
        priority: 100
      });
    } catch (error) {
      console.warn('无法加载现有handler:', error.message);
    }
    
    this.isInitialized = true;
    console.log('✅ Claude Hook处理器初始化完成');
  }
  
  register(hookName: string, handler: HookHandler, config?: Partial<HookConfig>): void {
    const fullConfig: HookConfig = {
      ...DEFAULT_HOOK_CONFIG,
      name: hookName,
      ...config
    };
    
    this.hooks.set(hookName, { handler, config: fullConfig });
    console.log(\`✅ 注册Hook: \${hookName} (优先级: \${fullConfig.priority})\`);
  }
  
  unregister(hookName: string): void {
    this.hooks.delete(hookName);
    console.log(\`🗑️  取消注册Hook: \${hookName}\`);
  }
  
  async execute(hookName: string, context: HookContext): Promise<HookResult> {
    await this.ensureInitialized();
    
    const hook = this.hooks.get(hookName);
    if (!hook) {
      return {
        success: false,
        error: {
          code: 'HOOK_NOT_FOUND',
          message: \`Hook未找到: \${hookName}\`,
          recoverable: true
        },
        executionTime: 0
      };
    }
    
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        hook.handler(context),
        new Promise<HookResult>((_, reject) =>
          setTimeout(() => reject(new Error(\`Hook执行超时: \${hookName}\`)), hook.config.timeout)
        )
      ]);
      
      const executionTime = Date.now() - startTime;
      
      return {
        ...result,
        executionTime
      };
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: {
          code: 'HOOK_EXECUTION_ERROR',
          message: error.message,
          recoverable: true
        },
        executionTime
      };
    }
  }
  
  getHooks(): string[] {
    return Array.from(this.hooks.keys());
  }
  
  async shutdown(): Promise<void> {
    this.hooks.clear();
    this.isInitialized = false;
    console.log('✅ Claude Hook处理器已关闭');
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export function createHookProcessor(): ClaudeHookProcessor {
  return new ClaudeHookProcessor();
}
`;
  
  fs.writeFileSync(handlerPath, handlerContent);
  
  console.log('✅ Hooks系统优化完成');
  console.log('   创建: types/hook-types.ts');
  console.log('   创建: hook-processor.ts\n');
}

/**
 * 优化Claude技能系统
 */
function optimizeClaudeSkills() {
  console.log('🔧 优化 Claude技能系统...');
  
  const projectPath = './skills-dev/skills/claude';
  const typesPath = path.join(projectPath, 'types');
  
  // 创建types目录
  if (!fs.existsSync(typesPath)) {
    fs.mkdirSync(typesPath, { recursive: true });
  }
  
  // 1. 创建技能类型定义
  const skillTypes = `/**
 * Claude技能系统类型定义
 */

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  category: 'utility' | 'development' | 'analysis' | 'automation';
  permission: 'user' | 'admin' | 'system';
  timeout: number;
  requiresApproval: boolean;
}

export interface SkillContext {
  sessionId: string;
  requestId: string;
  userId?: string;
  tools: {
    read?: (path: string) => Promise<string>;
    write?: (path: string, content: string) => Promise<void>;
    exec?: (command: string) => Promise<string>;
  };
}

export interface SkillResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime: number;
}

export interface SkillFunction {
  (params: any, context: SkillContext): Promise<SkillResult>;
}

export interface SkillDefinition {
  config: SkillConfig;
  execute: SkillFunction;
  validate?: (params: any) => ValidationResult;
  help?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SkillRegistry {
  register(skill: SkillDefinition): void;
  unregister(skillId: string): void;
  getSkill(skillId: string): SkillDefinition | undefined;
  getAllSkills(): SkillDefinition[];
  execute(skillId: string, params: any, context: SkillContext): Promise<SkillResult>;
}

export const DEFAULT_SKILL_CONFIG: SkillConfig = {
  id: '',
  name: '',
  description: '',
  version: '1.0.0',
  enabled: true,
  category: 'utility',
  permission: 'user',
  timeout: 30000,
  requiresApproval: false
};
`;
  
  fs.writeFileSync(path.join(typesPath, 'skill-types.ts'), skillTypes);
  
  // 2. 为每个技能创建TypeScript包装器
  const skillFiles = fs.readdirSync(projectPath).filter(file => file.endsWith('.js'));
  
  for (const skillFile of skillFiles) {
    if (skillFile === 'types') continue;
    
    const skillName = path.basename(skillFile, '.js');
    const tsFilePath = path.join(projectPath, `${skillName}.ts`);
    
    // 读取原始JavaScript技能
    const jsContent = fs.readFileSync(path.join(projectPath, skillFile), 'utf8');
    
    // 创建TypeScript包装器
    const tsContent = `/**
 * ${skillName} - TypeScript包装器
 * 原始JavaScript技能: ${skillFile}
 */

import { SkillConfig, SkillContext, SkillResult, DEFAULT_SKILL_CONFIG } from './types/skill-types';

export class ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}Skill {
  private config: SkillConfig;
  
  constructor(config?: Partial<SkillConfig>) {
    this.config = {
      ...DEFAULT_SKILL_CONFIG,
      id: '${skillName}',
      name: '${skillName}',
      description: 'Claude技能: ${skillName}',
      ...config
    };
  }
  
  async execute(params: any, context: SkillContext): Promise<SkillResult> {
    const startTime = Date.now();
    
    try {
      // 动态加载JavaScript技能
      const skillModule = require('./${skillFile}');
      const skillFunction = skillModule.default || skillModule;
      
      // 执行技能
      const result = await skillFunction(params, context);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        executionTime
      };
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: {
          code: 'SKILL_EXECUTION_ERROR',
          message: error.message,
          details: error.stack
        },
        executionTime
      };
    }
  }
  
  getConfig(): SkillConfig {
    return { ...this.config };
  }
  
  validate(params: any): { valid: boolean; errors: string[]; warnings: string[] } {
    // 基础验证
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!params) {
      errors.push('参数不能为空');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  getHelp(): string {
    return \`
${skillName}技能帮助文档

功能: 执行${skillName}操作
参数: 参考原始JavaScript技能
示例: 使用原始技能示例
\`;
  }
}

export function create${skillName.charAt(0).toUpperCase() + skillName.slice(1)}Skill(config?: Partial<SkillConfig>) {
  return new ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}Skill(config);
}
