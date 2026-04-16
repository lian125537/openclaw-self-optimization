#!/usr/bin/env node

/**
 * 优化所有Claude源码移植项目
 * TypeScript化 + 生产就绪优化
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始优化所有Claude源码移植项目...\n');

// ==================== 优化函数 ====================

/**
 * 优化ClaudeCorePorting项目
 */
function optimizeClaudeCorePorting() {
  console.log('1. 🔧 优化 ClaudeCorePorting 项目...');
  
  const projectPath = './claude-core-porting';
  if (!fs.existsSync(projectPath)) {
    console.log('   ⚠️  项目不存在，跳过');
    return;
  }
  
  // 创建types目录
  const typesPath = path.join(projectPath, 'types');
  if (!fs.existsSync(typesPath)) {
    fs.mkdirSync(typesPath, { recursive: true });
  }
  
  // 创建核心类型定义
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
  console.log('   ✅ 创建: types/core-types.ts');
  
  // 创建TypeScript适配器
  const adapterContent = `/**
 * ClaudeCorePorting TypeScript适配器
 */

import { ClaudeCoreConfig, DEFAULT_CONFIG } from './types/core-types';

export class ClaudeCorePortingAdapter {
  private config: ClaudeCoreConfig;
  private isInitialized = false;
  private core: any;
  
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
}

export function createClaudeCorePorting(config?: Partial<ClaudeCoreConfig>) {
  return new ClaudeCorePortingAdapter(config);
}
`;
  
  fs.writeFileSync(path.join(projectPath, 'claude-adapter.ts'), adapterContent);
  console.log('   ✅ 创建: claude-adapter.ts');
  
  console.log('   ✅ ClaudeCorePorting优化完成\n');
}

/**
 * 优化Hooks系统
 */
function optimizeHooksSystem() {
  console.log('2. 🔧 优化 Hooks 系统...');
  
  const projectPath = './hooks/claude-integration';
  if (!fs.existsSync(projectPath)) {
    console.log('   ⚠️  项目不存在，跳过');
    return;
  }
  
  // 创建types目录
  const typesPath = path.join(projectPath, 'types');
  if (!fs.existsSync(typesPath)) {
    fs.mkdirSync(typesPath, { recursive: true });
  }
  
  // 创建Hook类型定义
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

export const DEFAULT_HOOK_CONFIG: HookConfig = {
  name: '',
  enabled: true,
  priority: 0,
  timeout: 5000
};
`;
  
  fs.writeFileSync(path.join(typesPath, 'hook-types.ts'), hookTypes);
  console.log('   ✅ 创建: types/hook-types.ts');
  
  // 创建TypeScript化的Hook处理器
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

export function createHookProcessor() {
  return new ClaudeHookProcessor();
}
`;
  
  fs.writeFileSync(path.join(projectPath, 'hook-processor.ts'), handlerContent);
  console.log('   ✅ 创建: hook-processor.ts');
  
  console.log('   ✅ Hooks系统优化完成\n');
}

/**
 * 优化Claude技能系统
 */
function optimizeClaudeSkills() {
  console.log('3. 🔧 优化 Claude 技能系统...');
  
  const projectPath = './skills-dev/skills/claude';
  if (!fs.existsSync(projectPath)) {
    console.log('   ⚠️  项目不存在，跳过');
    return;
  }
  
  // 创建types目录
  const typesPath = path.join(projectPath, 'types');
  if (!fs.existsSync(typesPath)) {
    fs.mkdirSync(typesPath, { recursive: true });
  }
  
  // 创建技能类型定义
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
  console.log('   ✅ 创建: types/skill-types.ts');
  
  // 获取所有技能文件
  const skillFiles = fs.readdirSync(projectPath).filter(file => 
    file.endsWith('.js') && file !== 'types'
  );
  
  console.log(`   📁 找到 ${skillFiles.length} 个技能文件`);
  
  // 为每个技能创建TypeScript包装器
  for (const skillFile of skillFiles) {
    const skillName = path.basename(skillFile, '.js');
    const tsFileName = `${skillName}.ts`;
    const tsFilePath = path.join(projectPath, tsFileName);
    
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
}

export function create${skillName.charAt(0).toUpperCase() + skillName.slice(1)}Skill(config?: Partial<SkillConfig>) {
  return new ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}Skill(config);
}
`;
    
    fs.writeFileSync(tsFilePath, tsContent);
    console.log(`   ✅ 创建: ${tsFileName}`);
  }
  
  // 创建技能管理器
  const managerContent = `/**
 * Claude技能管理器 - TypeScript版
 */

import { SkillConfig, SkillContext, SkillResult } from './types/skill-types';

export class ClaudeSkillManager {
  private skills: Map<string, any> = new Map();
  private isInitialized = false;
  
  constructor() {}
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 初始化Claude技能管理器...');
    
    // 自动加载所有TypeScript技能
    const skillFiles = [
      ${skillFiles.map(file => {
        const skillName = path.basename(file, '.js');
        return `'${skillName}'`;
      }).join(',\n      ')}
    ];
    
    for (const skillName of skillFiles) {
      try {
        const skillModule = require(\`./\${skillName}.ts\`);
        const createFunction = skillModule[\`create\${skillName.charAt(0).toUpperCase() + skillName.slice(1)}Skill\`];
        
        if (createFunction) {
          const skill = createFunction();
          this.skills.set(skillName, skill);
          console.log(\`✅ 加载技能: \${skillName}\`);
        }
      } catch (error) {
        console.warn(\`无法加载技能 \${skillName}:\`, error.message);
      }
    }
    
    this.isInitialized = true;
    console.log(\`✅ Claude技能管理器初始化完成，加载 \${this.skills.size} 个技能\`);
  }
  
  async execute(skillName: string, params: any, context: SkillContext): Promise<SkillResult> {
    await this.ensureInitialized();
    
    const skill = this.skills.get(skillName);
    if (!skill) {
      return {
        success: false,
        error: {
          code: 'SKILL_NOT_FOUND',
          message: \`技能未找到: \${skillName}\`,
          details: \`可用技能: \${Array.from(this.skills.keys()).join(', ')}\`
        },
        executionTime: 0
      };
    }
    
    return await skill.execute(params, context);
  }
  
  getSkills(): string[] {
    return Array.from(this.skills.keys());
  }
  
  getSkillConfig(skillName: string): SkillConfig | undefined {
    const skill = this.skills.get(skillName);
    return skill?.getConfig();
  }
  
  async shutdown(): Promise<void> {
    this.skills.clear();
    this.isInitialized = false;
    console.log('✅ Claude技能管理器已关闭');
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export function createSkillManager() {
  return new ClaudeSkillManager();
}
`;
  
  fs.writeFileSync(path.join(projectPath, 'skill-manager.ts'), managerContent);
  console.log('   ✅ 创建: skill-manager.ts');
  
  console.log('   ✅ Claude技能系统优化完成\n');
}

/**
 * 创建统一的生产集成
 */
function createProductionIntegration() {
  console.log('4. 🔧 创建统一的生产集成...');
  
  const