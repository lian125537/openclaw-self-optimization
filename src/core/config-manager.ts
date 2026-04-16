/**
 * OpenClaw配置管理器
 * TypeScript化配置管理，基于Claude企业级标准
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  OpenClawConfig,
  createDefaultConfig,
  validateConfig,
  ValidationResult,
  SessionConfig,
  createDefaultSessionConfig,
  ToolDefinition,
  validateToolParameters
} from '../types/openclaw-core-complete';

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: OpenClawConfig;
  private configPath: string;
  private sessions: Map<string, SessionConfig> = new Map();
  private tools: Map<string, ToolDefinition> = new Map();
  
  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = this.loadConfig();
    this.validateAndFixConfig();
  }
  
  /**
   * 获取默认配置路径
   */
  private getDefaultConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    return path.join(homeDir, '.openclaw', 'openclaw.json');
  }
  
  /**
   * 加载配置
   */
  private loadConfig(): OpenClawConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(configData);
        
        // 合并默认配置和加载的配置
        const defaultConfig = createDefaultConfig();
        return this.deepMerge(defaultConfig, loadedConfig);
      } else {
        console.log(`配置文件不存在，创建默认配置: ${this.configPath}`);
        const defaultConfig = createDefaultConfig();
        this.saveConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error) {
      console.error(`加载配置失败: ${error.message}`);
      console.log('使用默认配置');
      return createDefaultConfig();
    }
  }
  
  /**
   * 验证并修复配置
   */
  private validateAndFixConfig(): void {
    const validation = validateConfig(this.config);
    
    if (!validation.valid) {
      console.error('配置验证失败:');
      validation.errors.forEach(error => console.error(`  ❌ ${error}`));
      
      // 尝试自动修复
      this.autoFixConfig();
      
      // 重新验证
      const revalidation = validateConfig(this.config);
      if (!revalidation.valid) {
        throw new Error('配置验证失败且无法自动修复');
      }
    }
    
    if (validation.warnings.length > 0) {
      console.warn('配置警告:');
      validation.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
    }
    
    console.log('✅ 配置验证通过');
  }
  
  /**
   * 自动修复配置
   */
  private autoFixConfig(): void {
    console.log('尝试自动修复配置...');
    
    // 修复Gateway token
    if (!this.config.gateway.auth.token && this.config.gateway.auth.mode === 'token') {
      const token = this.generateSecureToken();
      this.config.gateway.auth.token = token;
      console.log(`  🔧 生成Gateway token: ${token.substring(0, 10)}...`);
    }
    
    // 修复默认模型
    if (!this.config.models.default) {
      this.config.models.default = 'deepseek-chat';
      console.log('  🔧 设置默认模型: deepseek-chat');
    }
    
    // 确保默认模型存在
    const defaultModelExists = this.config.models.configurations.some(
      model => model.id === this.config.models.default
    );
    
    if (!defaultModelExists) {
      this.config.models.configurations.push({
        id: 'deepseek-chat',
        provider: 'deepseek',
        name: 'DeepSeek Chat',
        contextWindow: 128000,
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0
      });
      console.log('  🔧 添加默认模型配置');
    }
    
    // 保存修复后的配置
    this.saveConfig(this.config);
  }
  
  /**
   * 生成安全token
   */
  private generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64');
  }
  
  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }
  
  /**
   * 检查是否为对象
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  /**
   * 保存配置
   */
  saveConfig(config?: OpenClawConfig): void {
    try {
      const configToSave = config || this.config;
      
      // 确保目录存在
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // 保存配置
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(configToSave, null, 2),
        'utf8'
      );
      
      console.log(`✅ 配置已保存: ${this.configPath}`);
    } catch (error) {
      console.error(`保存配置失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 获取配置
   */
  getConfig(): OpenClawConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(updates: Partial<OpenClawConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    this.validateAndFixConfig();
    this.saveConfig();
  }
  
  /**
   * 获取配置值
   */
  get<T = any>(path: string): T | undefined {
    const parts = path.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  /**
   * 设置配置值
   */
  set(path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    
    let current: any = this.config;
    for (const part of parts) {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[lastPart] = value;
    this.saveConfig();
  }
  
  /**
   * 创建会话配置
   */
  createSessionConfig(sessionId: string, overrides?: Partial<SessionConfig>): SessionConfig {
    const defaultConfig = createDefaultSessionConfig(sessionId);
    const mergedConfig = overrides 
      ? this.deepMerge(defaultConfig, overrides)
      : defaultConfig;
    
    this.sessions.set(sessionId, mergedConfig);
    return mergedConfig;
  }
  
  /**
   * 获取会话配置
   */
  getSessionConfig(sessionId: string): SessionConfig | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * 更新会话配置
   */
  updateSessionConfig(sessionId: string, updates: Partial<SessionConfig>): void {
    const currentConfig = this.sessions.get(sessionId);
    if (currentConfig) {
      const updatedConfig = this.deepMerge(currentConfig, updates);
      this.sessions.set(sessionId, updatedConfig);
    }
  }
  
  /**
   * 删除会话配置
   */
  deleteSessionConfig(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  /**
   * 注册工具
   */
  registerTool(toolDefinition: ToolDefinition): void {
    // 验证工具定义
    const validation = this.validateToolDefinition(toolDefinition);
    if (!validation.valid) {
      throw new Error(`工具验证失败: ${validation.errors.join(', ')}`);
    }
    
    this.tools.set(toolDefinition.id, toolDefinition);
    console.log(`✅ 注册工具: ${toolDefinition.name} (${toolDefinition.id})`);
  }
  
  /**
   * 验证工具定义
   */
  private validateToolDefinition(toolDefinition: ToolDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查必需字段
    if (!toolDefinition.id) {
      errors.push('工具ID不能为空');
    }
    
    if (!toolDefinition.name) {
      errors.push('工具名称不能为空');
    }
    
    if (!toolDefinition.description) {
      warnings.push('工具描述为空');
    }
    
    // 检查参数定义
    if (!toolDefinition.parameters || typeof toolDefinition.parameters !== 'object') {
      errors.push('工具参数定义无效');
    }
    
    // 检查返回值定义
    if (!toolDefinition.returns) {
      errors.push('工具返回值定义不能为空');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * 获取工具定义
   */
  getToolDefinition(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }
  
  /**
   * 获取所有工具定义
   */
  getAllToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * 验证工具调用
   */
  validateToolCall(toolId: string, parameters: any): ValidationResult {
    const toolDefinition = this.getToolDefinition(toolId);
    if (!toolDefinition) {
      return {
        valid: false,
        errors: [`工具未找到: ${toolId}`],
        warnings: []
      };
    }
    
    return validateToolParameters(toolDefinition, parameters);
  }
  
  /**
   * 导出配置
   */
  exportConfig(): string {
    return JSON.stringify({
      config: this.config,
      sessions: Array.from(this.sessions.entries()),
      tools: Array.from(this.tools.values())
    }, null, 2);
  }
  
  /**
   * 导入配置
   */
  importConfig(configData: string): void {
    try {
      const imported = JSON.parse(configData);
      
      if (imported.config) {
        this.config = this.deepMerge(createDefaultConfig(), imported.config);
      }
      
      if (imported.sessions && Array.isArray(imported.sessions)) {
        this.sessions = new Map(imported.sessions);
      }
      
      if (imported.tools && Array.isArray(imported.tools)) {
        this.tools = new Map(imported.tools.map((tool: ToolDefinition) => [tool.id, tool]));
      }
      
      this.validateAndFixConfig();
      this.saveConfig();
      
      console.log('✅ 配置导入成功');
    } catch (error) {
      console.error(`导入配置失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    this.config = createDefaultConfig();
    this.sessions.clear();
    this.tools.clear();
    this.saveConfig();
    console.log('✅ 配置已重置为默认值');
  }
  
  /**
   * 获取配置统计
   */
  getStats(): {
    configSize: number;
    sessionCount: number;
    toolCount: number;
    validation: ValidationResult;
  } {
    const configStr = JSON.stringify(this.config);
    
    return {
      configSize: configStr.length,
      sessionCount: this.sessions.size,
      toolCount: this.tools.size,
      validation: validateConfig(this.config)
    };
  }
}

/**
 * 创建配置管理器实例
 */
export function createConfigManager(configPath?: string): ConfigManager {
  return new ConfigManager(configPath);
}

/**
 * 快速测试
 */
export async function testConfigManager(): Promise<void> {
  console.log('🧪 测试配置管理器...\n');
  
  const configManager = createConfigManager();
  
  try {
    // 1. 测试获取配置
    console.log('1. 测试获取配置...');
    const config = configManager.getConfig();
    console.log(`   默认模型: ${config.models.default}`);
    console.log(`   Gateway端口: ${config.gateway.network.port}`);
    
    // 2. 测试更新配置
    console.log('\n2. 测试更新配置...');
    configManager.updateConfig({
      logging: {
        level: 'debug' as any
      }
    });
    
    const updatedLevel = configManager.get<string>('logging.level');
    console.log(`   日志级别已更新: ${updatedLevel}`);
    
    // 3. 测试会话配置
    console.log('\n3. 测试会话配置...');
    const sessionId = 'test-session-' + Date.now();
    const sessionConfig = configManager.createSessionConfig(sessionId, {
      model: {
        temperature: 0.5
      }
    });
    
    console.log(`   创建会话: ${sessionConfig.id}`);
    console.log(`   模型温度: ${sessionConfig.model.temperature}`);
    
    // 4. 测试工具注册
    console.log('\n4. 测试工具注册...');
    const testTool: ToolDefinition = {
      id: 'test-tool',
      name: '测试工具',
      description: '用于测试的工具',
      category: 'other' as any,
      permission: 'user' as any,
      parameters: {
        input: {
          type: 'string',
          required: true,
          description: '输入文本'
        }
      },
      returns: {
        type: 'string',
        description: '处理结果'
      },
      security: {
        requiresSandbox: false,
        networkAccess: {
          allowed: false
        },
        filesystemAccess: {
          allowed: false
        }
      },
      execution: {
        timeout: 5000,
        retry: {
          enabled: false,
          attempts: 0,
          delay: 0
        },
        concurrency: {
          enabled: false,
          max: 1
        }
      },
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    configManager.registerTool(testTool);
    console.log(`   工具已注册: ${testTool.name}`);
    
    // 5. 测试工具验证
    console.log('\n5. 测试工具验证...');
    const validation = configManager.validateToolCall('test-tool', {
      input: '测试输入'
    });
    
    console.log(`   验证结果: ${validation.valid ? '✅ 通过' : '❌ 失败'}`);
    if (!validation.valid) {
      validation.errors.forEach(error => console.log(`     错误: ${error}`));
    }
    
    // 6. 测试配置统计
    console.log('\n6. 测试配置统计...');
    const stats = configManager.getStats();
    console.log(`   配置大小: ${stats.configSize} 字节`);
    console.log(`   会话数量: ${stats.sessionCount}`);
    console.log(`   工具数量: ${stats.toolCount}`);
    console.log(`   配置验证: ${stats.validation.valid ? '✅ 有效' : '❌ 无效'}`);
    
    console.log('\n🎉 配置管理器测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 如果直接运行，执行测试
if (require.main === module) {
  testConfigManager().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}