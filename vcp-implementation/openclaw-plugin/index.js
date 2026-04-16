/**
 * VCP Coordinator Plugin for OpenClaw
 * 
 * This plugin integrates the VCP Coordinator system into OpenClaw,
 * providing advanced semantic coordination and context management.
 */

import { VCPCoordinator } from '../src/index.js';

export class VCPCoordinatorPlugin {
  /**
   * Plugin constructor
   * @param {Object} gateway - OpenClaw gateway instance
   * @param {Object} config - Plugin configuration
   */
  constructor(gateway, config = {}) {
    console.log('🚀 VCP Coordinator Plugin 初始化...');
    
    this.gateway = gateway;
    this.config = {
      enabled: true,
      debug: false,
      contextMaxTokens: 120000,
      autoManagement: true,
      ...config
    };
    
    // Initialize VCP Coordinator
    this.vcpCoordinator = new VCPCoordinator({
      debug: this.config.debug,
      contextMaxTokens: this.config.contextMaxTokens,
      dataDir: './data/vcp'
    });
    
    // Register plugin capabilities
    this.capabilities = {
      agent: true,
      memory: true,
      semantic: true,
      coordination: true
    };
    
    console.log('✅ VCP Coordinator Plugin 初始化完成');
  }
  
  /**
   * Start the plugin
   */
  async start() {
    if (!this.config.enabled) {
      console.log('⚠️  VCP Coordinator Plugin 已禁用');
      return;
    }
    
    console.log('🚀 启动 VCP Coordinator Plugin...');
    
    try {
      // Start VCP Coordinator
      this.vcpCoordinator.start();
      
      // Register message handler
      this.gateway.on('message', this.handleMessage.bind(this));
      
      // Register command handler
      this.gateway.on('command', this.handleCommand.bind(this));
      
      console.log('✅ VCP Coordinator Plugin 启动完成');
      console.log('📊 系统状态:', this.getStatus());
      
    } catch (error) {
      console.error('❌ VCP Coordinator Plugin 启动失败:', error);
      throw error;
    }
  }
  
  /**
   * Stop the plugin
   */
  async stop() {
    console.log('🛑 停止 VCP Coordinator Plugin...');
    
    try {
      // Stop VCP Coordinator
      this.vcpCoordinator.stop();
      
      console.log('✅ VCP Coordinator Plugin 已停止');
      
    } catch (error) {
      console.error('❌ VCP Coordinator Plugin 停止失败:', error);
    }
  }
  
  /**
   * Handle incoming messages
   * @param {Object} message - Message object
   * @returns {Promise<Object>} Response
   */
  async handleMessage(message) {
    if (!this.config.enabled) {
      return null;
    }
    
    const startTime = Date.now();
    
    try {
      console.log(`📨 处理消息: ${message.text?.substring(0, 50)}...`);
      
      // Process message with VCP Coordinator
      const result = await this.vcpCoordinator.processTask(message.text, {
        source: 'openclaw',
        userId: message.userId,
        channel: message.channel
      });
      
      // Enhance response with OpenClaw context
      const response = this.enhanceResponse(result, message);
      
      const duration = Date.now() - startTime;
      console.log(`✅ 消息处理完成: ${duration}ms`);
      
      return response;
      
    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      
      // Fallback response
      return {
        text: `抱歉，处理消息时遇到错误: ${error.message}`,
        error: true,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Handle commands
   * @param {Object} command - Command object
   * @returns {Promise<Object>} Command result
   */
  async handleCommand(command) {
    if (!this.config.enabled) {
      return { success: false, message: 'VCP Coordinator 已禁用' };
    }
    
    console.log(`⚡ 处理命令: ${command.name}`);
    
    try {
      switch (command.name) {
        case 'vcp-status':
          return await this.handleStatusCommand(command);
          
        case 'vcp-reset':
          return await this.handleResetCommand(command);
          
        case 'vcp-stats':
          return await this.handleStatsCommand(command);
          
        case 'vcp-help':
          return await this.handleHelpCommand(command);
          
        default:
          return {
            success: false,
            message: `未知命令: ${command.name}`,
            availableCommands: ['vcp-status', 'vcp-reset', 'vcp-stats', 'vcp-help']
          };
      }
    } catch (error) {
      console.error(`❌ 命令处理失败 ${command.name}:`, error);
      return {
        success: false,
        message: `命令处理失败: ${error.message}`,
        error: error.toString()
      };
    }
  }
  
  /**
   * Handle status command
   */
  async handleStatusCommand(command) {
    const status = this.getStatus();
    
    return {
      success: true,
      message: 'VCP Coordinator 状态',
      data: status
    };
  }
  
  /**
   * Handle reset command
   */
  async handleResetCommand(command) {
    const reason = command.args?.reason || 'manual';
    
    this.vcpCoordinator.resetContext(reason);
    
    return {
      success: true,
      message: `上下文已重置 (原因: ${reason})`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Handle stats command
   */
  async handleStatsCommand(command) {
    const status = this.vcpCoordinator.getStatus();
    
    return {
      success: true,
      message: 'VCP Coordinator 统计',
      data: {
        tasksProcessed: status.stats.tasksProcessed,
        errors: status.stats.errors,
        variables: status.stats.variables,
        groups: status.stats.groups,
        semanticTags: status.stats.semanticTags,
        semanticResources: status.stats.semanticResources,
        contextUsage: status.context.tokens.percentage,
        uptime: status.uptime
      }
    };
  }
  
  /**
   * Handle help command
   */
  async handleHelpCommand(command) {
    return {
      success: true,
      message: 'VCP Coordinator 命令帮助',
      commands: {
        'vcp-status': '查看 VCP Coordinator 状态',
        'vcp-reset [reason]': '重置上下文 (可选原因)',
        'vcp-stats': '查看统计信息',
        'vcp-help': '显示此帮助信息'
      },
      capabilities: this.capabilities
    };
  }
  
  /**
   * Enhance VCP response with OpenClaw context
   */
  enhanceResponse(vcpResult, originalMessage) {
    return {
      text: vcpResult.analysis?.response || '已处理您的请求',
      analysis: vcpResult.analysis,
      context: {
        tokens: vcpResult.contextStatus?.tokens,
        recommendations: vcpResult.contextStatus?.recommendations || []
      },
      relatedResources: vcpResult.relatedResources,
      metadata: {
        taskId: vcpResult.taskId,
        duration: vcpResult.duration,
        timestamp: vcpResult.timestamp,
        vcpVersion: '0.1.0'
      },
      originalMessageId: originalMessage.id
    };
  }
  
  /**
   * Get plugin status
   */
  getStatus() {
    const vcpStatus = this.vcpCoordinator.getStatus();
    
    return {
      enabled: this.config.enabled,
      debug: this.config.debug,
      vcp: {
        isRunning: vcpStatus.isRunning,
        uptime: vcpStatus.uptime,
        tasksProcessed: vcpStatus.stats.tasksProcessed
      },
      config: {
        contextMaxTokens: this.config.contextMaxTokens,
        autoManagement: this.config.autoManagement
      },
      capabilities: this.capabilities,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get plugin configuration schema
   */
  static getConfigSchema() {
    return {
      enabled: {
        type: 'boolean',
        default: true,
        description: '启用 VCP Coordinator'
      },
      debug: {
        type: 'boolean',
        default: false,
        description: '启用调试日志'
      },
      contextMaxTokens: {
        type: 'number',
        default: 120000,
        description: '最大上下文token数'
      },
      autoManagement: {
        type: 'boolean',
        default: true,
        description: '启用自动上下文管理'
      }
    };
  }
}

// Plugin metadata
export const plugin = {
  id: 'vcp-coordinator',
  name: 'VCP Coordinator',
  version: '0.1.0',
  description: 'Advanced semantic coordination system with variable context protocol',
  author: 'Steve Jobs 🍎',
  capabilities: ['agent', 'memory', 'semantic', 'coordination'],
  configSchema: VCPCoordinatorPlugin.getConfigSchema()
};

// Default export
export default VCPCoordinatorPlugin;