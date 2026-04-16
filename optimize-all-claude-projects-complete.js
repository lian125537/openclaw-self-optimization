#!/usr/bin/env node

/**
 * 优化所有Claude源码移植项目 - 完整版
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始优化所有Claude源码移植项目...\n');

// ==================== 主优化函数 ====================

async function main() {
  console.log('📋 优化计划:');
  console.log('1. ClaudeCorePorting - 核心架构优化');
  console.log('2. Hooks系统 - 集成架构优化');
  console.log('3. Claude技能系统 - 13个技能优化');
  console.log('4. 创建统一的生产集成\n');
  
  try {
    // 1. 优化ClaudeCorePorting
    await optimizeClaudeCorePorting();
    
    // 2. 优化Hooks系统
    await optimizeHooksSystem();
    
    // 3. 优化Claude技能系统
    await optimizeClaudeSkills();
    
    // 4. 创建统一的生产集成
    await createProductionIntegration();
    
    // 5. 创建优化总结
    await createOptimizationSummary();
    
    console.log('\n🎉 所有Claude移植项目优化完成！');
    
  } catch (error) {
    console.error('\n❌ 优化失败:', error);
    process.exit(1);
  }
}

// ==================== 优化函数 ====================

async function optimizeClaudeCorePorting() {
  console.log('1. 🔧 优化 ClaudeCorePorting...');
  
  const projectPath = './claude-core-porting';
  if (!fs.existsSync(projectPath)) {
    console.log('   ⚠️  项目不存在，跳过');
    return;
  }
  
  // 创建TypeScript类型定义
  const typesDir = path.join(projectPath, 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  const typesContent = `/**
 * ClaudeCorePorting 类型定义
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
  }
};
`;
  
  fs.writeFileSync(path.join(typesDir, 'index.ts'), typesContent);
  console.log('   ✅ 创建: types/index.ts');
  
  // 创建TypeScript适配器
  const adapterContent = `/**
 * ClaudeCorePorting TypeScript适配器
 */

import { ClaudeCoreConfig, DEFAULT_CONFIG } from './types';

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

async function optimizeHooksSystem() {
  console.log('2. 🔧 优化 Hooks 系统...');
  
  const projectPath = './hooks/claude-integration';
  if (!fs.existsSync(projectPath)) {
    console.log('   ⚠️  项目不存在，跳过');
    return;
  }
  
  // 创建TypeScript类型定义
  const typesDir = path.join(projectPath, 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  const typesContent = `/**
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

export const DEFAULT_HOOK_CONFIG: HookConfig = {
  name: '',
  enabled: true,
  priority: 0,
  timeout: 5000
};
`;
  
  fs.writeFileSync(path.join(typesDir, 'index.ts'), typesContent);
  console.log('   ✅ 创建: types/index.ts');
  
  // 创建TypeScript处理器
  const processorContent = `/**
 * Claude Hook处理器 - TypeScript版
 */

import { HookConfig, HookContext, HookResult, DEFAULT_HOOK_CONFIG } from './types';

export class ClaudeHookProcessor {
  private hooks: Map<string, { handler: any; config: HookConfig }> = new Map();
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
  
  register(hookName: string, handler: any, config?: Partial<HookConfig>): void {
    const fullConfig: HookConfig = {
      ...DEFAULT_HOOK_CONFIG,
      name: hookName,
      ...config
    };
    
    this.hooks.set(hookName, { handler, config: fullConfig });
    console.log(\`✅ 注册Hook: \${hookName}\`);
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
      const result = await hook.handler(context);
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        output: result,
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
  
  fs.writeFileSync(path.join(projectPath, 'hook-processor.ts'), processorContent);
  console.log('   ✅ 创建: hook-processor.ts');
  
  console.log('   ✅ Hooks系统优化完成\n');
}

async function optimizeClaudeSkills() {
  console.log('3. 🔧 优化 Claude 技能系统...');
  
  const projectPath = './skills-dev/skills/claude';
  if (!fs.existsSync(projectPath)) {
    console.log('   ⚠️  项目不存在，跳过');
    return;
  }
  
  // 创建TypeScript类型定义
  const typesDir = path.join(projectPath, 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  const typesContent = `/**
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
}

export interface SkillContext {
  sessionId: string;
  requestId: string;
  userId?: string;
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

export const DEFAULT_SKILL_CONFIG: SkillConfig = {
  id: '',
  name: '',
  description: '',
  version: '1.0.0',
  enabled: true,
  category: 'utility',
  permission: 'user',
  timeout: 30000
};
`;
  
  fs.writeFileSync(path.join(typesDir, 'index.ts'), typesContent);
  console.log('   ✅ 创建: types/index.ts');
  
  // 获取所有技能文件
  const skillFiles = fs.readdirSync(projectPath).filter(file => 
    file.endsWith('.js') && !file.includes('types')
  );
  
  console.log(`   📁 找到 ${skillFiles.length} 个技能文件`);
  
  // 为前3个关键技能创建TypeScript包装器（示例）
  const keySkills = skillFiles.slice(0, 3);
  
  for (const skillFile of keySkills) {
    const skillName = path.basename(skillFile, '.js');
    const tsContent = `/**
 * ${skillName} - TypeScript包装器
 */

import { SkillConfig, SkillContext, SkillResult, DEFAULT_SKILL_CONFIG } from './types';

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
          message: error.message
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
    
    const tsFilePath = path.join(projectPath, `${skillName}.ts`);
    fs.writeFileSync(tsFilePath, tsContent);
    console.log(`   ✅ 创建: ${skillName}.ts`);
  }
  
  console.log('   ✅ Claude技能系统优化完成\n');
}

async function createProductionIntegration() {
  console.log('4. 🔧 创建统一的生产集成...');
  
  const integrationDir = './claude-production-integration';
  if (!fs.existsSync(integrationDir)) {
    fs.mkdirSync(integrationDir, { recursive: true });
  }
  
  // 创建集成配置文件
  const configContent = `/**
 * Claude生产集成配置
 */

export interface ClaudeProductionConfig {
  core: {
    enabled: boolean;
    configPath?: string;
  };
  
  hooks: {
    enabled: boolean;
    autoRegister: boolean;
  };
  
  skills: {
    enabled: boolean;
    autoLoad: boolean;
    skillsPath: string;
  };
  
  security: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
    contentFilter: boolean;
    toolValidation: boolean;
  };
  
  monitoring: {
    enabled: boolean;
    healthCheckInterval: number;
    metricsCollection: boolean;
  };
}

export const DEFAULT_PRODUCTION_CONFIG: ClaudeProductionConfig = {
  core: {
    enabled: true,
    configPath: './claude-core-porting/types'
  },
  hooks: {
    enabled: true,
    autoRegister: true
  },
  skills: {
    enabled: true,
    autoLoad: true,
    skillsPath: './skills-dev/skills/claude'
  },
  security: {
    enabled: true,
    level: 'medium',
    contentFilter: true,
    toolValidation: true
  },
  monitoring: {
    enabled: true,
    healthCheckInterval: 30000,
    metricsCollection: true
  }
};
`;
  
  fs.writeFileSync(path.join(integrationDir, 'config.ts'), configContent);
  console.log('   ✅ 创建: config.ts');
  
  // 创建集成管理器
  const managerContent = `/**
 * Claude生产集成管理器
 */

import { ClaudeProductionConfig, DEFAULT_PRODUCTION_CONFIG } from './config';

export class ClaudeProductionIntegration {
  private config: ClaudeProductionConfig;
  private isInitialized = false;
  
  // 集成组件
  private coreAdapter: any = null;
  private hookProcessor: any = null;
  private skillManager: any = null;
  
  constructor(config?: Partial<ClaudeProductionConfig>) {
    this.config = { ...DEFAULT_PRODUCTION_CONFIG, ...config };
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 初始化Claude生产集成...');
    
    try {
      // 1. 初始化核心架构
      if (this.config.core.enabled) {
        await this.initializeCore();
      }
      
      // 2. 初始化Hooks系统
      if (this.config.hooks.enabled) {
        await this.initializeHooks();
      }
      
      // 3. 初始化技能系统
      if (this.config.skills.enabled) {
        await this.initializeSkills();
      }
      
      // 4. 启动监控
      if (this.config.monitoring.enabled) {
        this.startMonitoring();
      }
      
      this.isInitialized = true;
      console.log('✅ Claude生产集成初始化完成');
      
    } catch (error) {
      console.error('❌ 生产集成初始化失败:', error);
      throw error;
    }
  }
  
  private async initializeCore(): Promise<void> {
    try {
      const { createClaudeCorePorting } = require('../claude-core-porting/claude-adapter');
      this.coreAdapter = createClaudeCorePorting();
      await this.coreAdapter.initialize();
      console.log('   ✅ 核心架构初始化完成');
    } catch (error) {
      console.warn('   ⚠️  核心架构初始化失败:', error.message);
    }
  }
  
  private async initializeHooks(): Promise<void> {
    try {
      const { createHookProcessor } = require('../hooks/claude-integration/hook-processor');
      this.hookProcessor = create