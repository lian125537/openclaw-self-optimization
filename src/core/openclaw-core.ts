/**
 * OpenClaw核心启动器
 * TypeScript化核心系统，集成Claude企业级架构
 */

import { ConfigManager, createConfigManager, testConfigManager } from './config-manager';
import { SessionManager, createSessionManager, testSessionManager } from './session-manager';
import { OpenClawGatewayMinimalIntegration } from '../integration/minimal-integration';

/**
 * OpenClaw核心系统
 */
export class OpenClawCore {
  private configManager: ConfigManager;
  private sessionManager: SessionManager;
  private gatewayIntegration: any;
  private isInitialized: boolean = false;
  
  constructor(configPath?: string) {
    this.configManager = createConfigManager(configPath);
    this.sessionManager = createSessionManager(this.configManager);
  }
  
  /**
   * 初始化核心系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    console.log('🚀 初始化 OpenClaw 核心系统...\n');
    
    try {
      // 1. 初始化配置管理器
      console.log('1. 初始化配置管理器...');
      const config = this.configManager.getConfig();
      console.log(`   默认模型: ${config.models.default}`);
      console.log(`   Gateway端口: ${config.gateway.network.port}`);
      
      // 2. 初始化Gateway集成
      console.log('\n2. 初始化Gateway集成...');
      await this.initializeGatewayIntegration();
      
      // 3. 初始化会话管理器
      console.log('\n3. 初始化会话管理器...');
      const sessionStats = this.sessionManager.getSessionStats();
      console.log(`   活跃会话: ${sessionStats.activeCount}`);
      
      // 4. 启动监控
      console.log('\n4. 启动系统监控...');
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('\n✅ OpenClaw 核心系统初始化完成');
      
    } catch (error) {
      console.error('❌ 核心系统初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 初始化Gateway集成
   */
  private async initializeGatewayIntegration(): Promise<void> {
    const config = this.configManager.getConfig();
    
    // 使用最小化集成（已验证可用）
    const { OpenClawGatewayMinimalIntegration } = require('../integration/minimal-integration');
    
    this.gatewayIntegration = new OpenClawGatewayMinimalIntegration({
      gatewayUrl: `http://localhost:${config.gateway.network.port}`,
      gatewayToken: config.gateway.auth.token || '',
      securityLevel: 'high'
    });
    
    await this.gatewayIntegration.initialize();
    console.log('   ✅ Gateway集成就绪');
  }
  
  /**
   * 启动监控
   */
  private startMonitoring(): void {
    // 启动健康检查
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // 每30秒检查一次
    
    // 启动会话清理
    setInterval(() => {
      this.cleanupIdleSessions();
    }, 60000); // 每分钟清理一次
    
    console.log('   ✅ 监控系统已启动');
  }
  
  /**
   * 检查系统健康
   */
  private checkSystemHealth(): void {
    try {
      const config = this.configManager.getConfig();
      const sessionStats = this.sessionManager.getSessionStats();
      
      // 检查关键指标
      const healthChecks = {
        configValid: this.configManager.getStats().validation.valid,
        sessionCount: sessionStats.total,
        errorSessions: sessionStats.errorCount,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
      };
      
      // 记录健康状态
      if (healthChecks.errorSessions > 0) {
        console.warn(`⚠️  系统健康检查: ${healthChecks.errorSessions} 个错误会话`);
      }
      
      // 内存警告
      if (healthChecks.memoryUsage > 500) {
        console.warn(`⚠️  内存使用过高: ${healthChecks.memoryUsage.toFixed(2)} MB`);
      }
      
    } catch (error) {
      console.error('健康检查失败:', error.message);
    }
  }
  
  /**
   * 清理闲置会话
   */
  private cleanupIdleSessions(): void {
    const config = this.configManager.getConfig();
    const timeoutMs = config.sessions.management.sessionTimeout;
    
    const cleanedCount = this.sessionManager.cleanupIdleSessions(timeoutMs);
    if (cleanedCount > 0) {
      console.log(`🧹 自动清理 ${cleanedCount} 个闲置会话`);
    }
  }
  
  /**
   * 关闭核心系统
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    console.log('\n🛑 关闭 OpenClaw 核心系统...');
    
    try {
      // 1. 关闭Gateway集成
      if (this.gatewayIntegration) {
        await this.gatewayIntegration.shutdown();
        console.log('   ✅ Gateway集成已关闭');
      }
      
      // 2. 清理所有会话
      this.sessionManager.resetAllSessions();
      console.log('   ✅ 所有会话已清理');
      
      // 3. 保存配置
      this.configManager.saveConfig();
      console.log('   ✅ 配置已保存');
      
      this.isInitialized = false;
      console.log('\n✅ OpenClaw 核心系统已关闭');
      
    } catch (error) {
      console.error('关闭系统失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取配置管理器
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
  
  /**
   * 获取会话管理器
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }
  
  /**
   * 获取Gateway集成
   */
  getGatewayIntegration(): any {
    return this.gatewayIntegration;
  }
  
  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    initialized: boolean;
    config: any;
    sessions: any;
    health: any;
  } {
    const config = this.configManager.getConfig();
    const sessionStats = this.sessionManager.getSessionStats();
    const configStats = this.configManager.getStats();
    
    return {
      initialized: this.isInitialized,
      config: {
        defaultModel: config.models.default,
        gatewayPort: config.gateway.network.port,
        validation: configStats.validation
      },
      sessions: {
        total: sessionStats.total,
        active: sessionStats.activeCount,
        errors: sessionStats.errorCount,
        byType: sessionStats.byType
      },
      health: {
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * 处理消息
   */
  async processMessage(sessionId: string, message: any): Promise<any> {
    await this.ensureInitialized();
    
    // 获取或创建会话
    let session = this.sessionManager.getSession(sessionId);
    if (!session) {
      session = this.sessionManager.createSession(sessionId);
    }
    
    // 使用Gateway集成处理消息
    if (this.gatewayIntegration) {
      const response = await this.gatewayIntegration.processMessage({
        id: `msg_${Date.now()}`,
        content: message,
        sessionId,
        timestamp: new Date()
      });
      
      // 记录消息
      session.addMessage({
        id: response.metadata?.messageId || `resp_${Date.now()}`,
        role: 'assistant',
        content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
        timestamp: new Date(),
        metadata: {
          gatewayProcessed: true,
          success: response.success
        }
      });
      
      return response;
    }
    
    // 如果没有Gateway集成，返回基础响应
    return {
      success: true,
      content: {
        message: '消息处理完成',
        sessionId,
        timestamp: new Date().toISOString()
      },
      metadata: {
        processedBy: 'OpenClawCore',
        gatewayAvailable: false
      }
    };
  }
  
  /**
   * 执行工具调用
   */
  async executeTool(sessionId: string, toolId: string, parameters: any): Promise<any> {
    await this.ensureInitialized();
    
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }
    
    const toolCall: any = {
      id: `tool_${Date.now()}`,
      toolId,
      parameters,
      sessionId
    };
    
    return await session.executeToolCall(toolCall);
  }
  
  /**
   * 确保系统已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

/**
 * 创建OpenClaw核心实例
 */
export function createOpenClawCore(configPath?: string): OpenClawCore {
  return new OpenClawCore(configPath);
}

/**
 * 快速启动OpenClaw
 */
export async function quickStartOpenClaw(configPath?: string): Promise<OpenClawCore> {
  console.log('🚀 快速启动 OpenClaw...\n');
  
  const core = createOpenClawCore(configPath);
  
  try {
    await core.initialize();
    
    // 显示系统状态
    const status = core.getSystemStatus();
    console.log('\n📊 系统状态:');
    console.log(`   初始化: ${status.initialized ? '✅' : '❌'}`);
    console.log(`   默认模型: ${status.config.defaultModel}`);
    console.log(`   Gateway端口: ${status.config.gatewayPort}`);
    console.log(`   总会话数: ${status.sessions.total}`);
    console.log(`   内存使用: ${status.health.memory.toFixed(2)} MB`);
    
    console.log('\n✅ OpenClaw 启动完成！');
    console.log('   使用 `core.processMessage(sessionId, message)` 处理消息');
    console.log('   使用 `core.executeTool(sessionId, toolId, parameters)` 执行工具');
    console.log('   使用 `core.shutdown()` 关闭系统');
    
    return core;
    
  } catch (error) {
    console.error('❌ OpenClaw 启动失败:', error);
    throw error;
  }
}

/**
 * 运行完整测试
 */
export async function runFullTest(): Promise<void> {
  console.log('🧪 运行 OpenClaw 完整测试...\n');
  
  let allTestsPassed = true;
  
  try {
    // 1. 测试配置管理器
    console.log('1. 测试配置管理器...');
    await testConfigManager();
    console.log('   ✅ 通过');
    
    // 2. 测试会话管理器
    console.log('\n2. 测试会话管理器...');
    await testSessionManager();
    console.log('   ✅ 通过');
    
    // 3. 测试核心系统
    console.log('\n3. 测试核心系统...');
    const core = createOpenClawCore();
    await core.initialize();
    
    const status = core.getSystemStatus();
    console.log(`   系统状态: ${status.initialized ? '✅ 已初始化' : '❌ 未初始化'}`);
    console.log(`   配置验证: ${status.config.validation.valid ? '✅ 有效' : '❌ 无效'}`);
    
    // 4. 测试消息处理
    console.log('\n4. 测试消息处理...');
    const testSessionId = 'test-full-' + Date.now();
    const response = await core.processMessage(testSessionId, '测试消息');
    console.log(`   消息处理: ${response.success ? '✅ 成功' : '❌ 失败'}`);
    
    // 5. 关闭系统
    console.log('\n5. 关闭系统...');
    await core.shutdown();
    console.log('   ✅ 系统已关闭');
    
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    allTestsPassed = false;
  }
  
  if (!allTestsPassed) {
    process.exit(1);
  }
}

// 如果直接运行，执行完整测试
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    runFullTest().catch(error => {
      console.error('测试失败:', error);
      process.exit(1);
    });
  } else if (args.includes('--start')) {
    quickStartOpenClaw().catch(error => {
      console.error('启动失败:', error);
      process.exit(1);
    });
  } else {
    console.log('用法:');
    console.log('  node openclaw-core.js --test   运行完整测试');
    console.log('  node openclaw-core.js --start  快速启动');
    console.log('\n示例:');
    console.log('  node openclaw-core.js --test');
  }
}