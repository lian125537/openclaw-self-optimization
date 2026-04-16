/**
 * OpenClaw会话管理器
 * TypeScript化会话管理，基于Claude企业级标准
 */

import {
  SessionConfig,
  SessionStatus,
  SessionState,
  SessionType,
  SessionMessage,
  ToolCallRequest,
  ToolCallResponse,
  createToolCallResponse,
  createErrorResponse
} from '../types/openclaw-core-complete';

import { ConfigManager } from './config-manager';

/**
 * 会话管理器
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }
  
  /**
   * 创建会话
   */
  createSession(
    sessionId: string,
    type: SessionType = SessionType.MAIN,
    overrides?: Partial<SessionConfig>
  ): Session {
    // 检查会话是否已存在
    if (this.sessions.has(sessionId)) {
      throw new Error(`会话已存在: ${sessionId}`);
    }
    
    // 创建会话配置
    const sessionConfig = this.configManager.createSessionConfig(sessionId, {
      type,
      ...overrides
    });
    
    // 创建会话实例
    const session = new Session(sessionId, sessionConfig, this.configManager);
    this.sessions.set(sessionId, session);
    
    console.log(`✅ 创建会话: ${sessionId} (${type})`);
    return session;
  }
  
  /**
   * 获取会话
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * 获取所有会话
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * 获取会话状态
   */
  getSessionStatus(sessionId: string): SessionStatus | undefined {
    const session = this.getSession(sessionId);
    return session?.getStatus();
  }
  
  /**
   * 获取所有会话状态
   */
  getAllSessionStatuses(): SessionStatus[] {
    return this.getAllSessions().map(session => session.getStatus());
  }
  
  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<SessionConfig>): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }
    
    session.updateConfig(updates);
    this.configManager.updateSessionConfig(sessionId, updates);
    return true;
  }
  
  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }
    
    // 清理会话资源
    session.cleanup();
    
    // 从管理器移除
    this.sessions.delete(sessionId);
    
    // 从配置管理器移除
    this.configManager.deleteSessionConfig(sessionId);
    
    console.log(`🗑️  删除会话: ${sessionId}`);
    return true;
  }
  
  /**
   * 清理闲置会话
   */
  cleanupIdleSessions(timeoutMs: number = 3600000): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const status = session.getStatus();
      const lastActivity = status.statistics.duration.lastActivity.getTime();
      const idleTime = now - lastActivity;
      
      if (idleTime > timeoutMs && status.state === SessionState.IDLE) {
        this.deleteSession(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理 ${cleanedCount} 个闲置会话`);
    }
    
    return cleanedCount;
  }
  
  /**
   * 获取会话统计
   */
  getSessionStats(): {
    total: number;
    byType: Record<SessionType, number>;
    byState: Record<SessionState, number>;
    activeCount: number;
    errorCount: number;
  } {
    const stats = {
      total: this.sessions.size,
      byType: {} as Record<SessionType, number>,
      byState: {} as Record<SessionState, number>,
      activeCount: 0,
      errorCount: 0
    };
    
    // 初始化计数
    Object.values(SessionType).forEach(type => {
      stats.byType[type] = 0;
    });
    
    Object.values(SessionState).forEach(state => {
      stats.byState[state] = 0;
    });
    
    // 统计会话
    for (const session of this.sessions.values()) {
      const status = session.getStatus();
      
      stats.byType[status.config.type]++;
      stats.byState[status.state]++;
      
      if (status.state === SessionState.ACTIVE) {
        stats.activeCount++;
      }
      
      if (status.state === SessionState.ERROR) {
        stats.errorCount++;
      }
    }
    
    return stats;
  }
  
  /**
   * 导出会话数据
   */
  exportSessions(): Record<string, any> {
    const exportData: Record<string, any> = {};
    
    for (const [sessionId, session] of this.sessions.entries()) {
      exportData[sessionId] = session.export();
    }
    
    return exportData;
  }
  
  /**
   * 导入会话数据
   */
  importSessions(sessionData: Record<string, any>): void {
    let importedCount = 0;
    
    for (const [sessionId, data] of Object.entries(sessionData)) {
      try {
        // 检查会话是否已存在
        if (this.sessions.has(sessionId)) {
          console.warn(`会话已存在，跳过导入: ${sessionId}`);
          continue;
        }
        
        // 创建会话
        const session = Session.fromExport(data, this.configManager);
        this.sessions.set(sessionId, session);
        importedCount++;
        
      } catch (error) {
        console.error(`导入会话失败 ${sessionId}:`, error.message);
      }
    }
    
    console.log(`✅ 导入 ${importedCount} 个会话`);
  }
  
  /**
   * 重置所有会话
   */
  resetAllSessions(): void {
    const sessionCount = this.sessions.size;
    
    // 清理所有会话
    for (const session of this.sessions.values()) {
      session.cleanup();
    }
    
    // 清空会话映射
    this.sessions.clear();
    
    console.log(`🔄 重置所有会话 (${sessionCount} 个)`);
  }
}

/**
 * 会话类
 */
export class Session {
  private id: string;
  private config: SessionConfig;
  private configManager: ConfigManager;
  
  private state: SessionState = SessionState.ACTIVE;
  private messages: SessionMessage[] = [];
  private toolCalls: ToolCallRequest[] = [];
  private toolResponses: ToolCallResponse[] = [];
  private errors: Array<{ id: string; message: string; timestamp: Date; resolved: boolean }> = [];
  
  private statistics = {
    messageCount: 0,
    tokenUsage: {
      total: 0,
      prompt: 0,
      completion: 0
    },
    toolCalls: {
      total: 0,
      successful: 0,
      failed: 0
    },
    duration: {
      startedAt: new Date(),
      lastActivity: new Date(),
      totalSeconds: 0
    }
  };
  
  constructor(id: string, config: SessionConfig, configManager: ConfigManager) {
    this.id = id;
    this.config = config;
    this.configManager = configManager;
  }
  
  /**
   * 获取会话ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * 获取会话配置
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(updates: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...updates };
    this.updateActivity();
  }
  
  /**
   * 获取会话状态
   */
  getStatus(): SessionStatus {
    this.updateStatistics();
    
    return {
      id: this.id,
      state: this.state,
      config: this.config,
      statistics: { ...this.statistics },
      resources: this.getResourceUsage(),
      errors: this.errors.length > 0 ? [...this.errors] : undefined
    };
  }
  
  /**
   * 获取资源使用情况
   */
  private getResourceUsage(): any {
    // 这里可以实现实际的资源监控
    // 暂时返回模拟数据
    return {
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        max: 512,
        percentage: (process.memoryUsage().heapUsed / 1024 / 1024 / 512) * 100
      },
      cpu: {
        usage: 0, // 需要实际监控
        threads: 1
      },
      network: {
        requests: this.toolCalls.length,
        bytesSent: 0,
        bytesReceived: 0
      }
    };
  }
  
  /**
   * 更新统计信息
   */
  private updateStatistics(): void {
    const now = new Date();
    const startedAt = this.statistics.duration.startedAt;
    
    this.statistics.duration.totalSeconds = Math.floor(
      (now.getTime() - startedAt.getTime()) / 1000
    );
    this.statistics.duration.lastActivity = now;
    
    this.statistics.messageCount = this.messages.length;
    this.statistics.toolCalls.total = this.toolCalls.length;
    this.statistics.toolCalls.successful = this.toolResponses.filter(r => r.success).length;
    this.statistics.toolCalls.failed = this.toolResponses.filter(r => !r.success).length;
  }
  
  /**
   * 更新活动时间
   */
  private updateActivity(): void {
    this.statistics.duration.lastActivity = new Date();
  }
  
  /**
   * 添加消息
   */
  addMessage(message: SessionMessage): void {
    this.messages.push(message);
    this.updateActivity();
    
    // 更新Token使用统计
    if (message.metadata?.usage) {
      const usage = message.metadata.usage;
      this.statistics.tokenUsage.total += usage.totalTokens;
      this.statistics.tokenUsage.prompt += usage.promptTokens;
      this.statistics.tokenUsage.completion += usage.completionTokens;
    }
  }
  
  /**
   * 获取消息历史
   */
  getMessages(limit?: number): SessionMessage[] {
    if (limit && limit > 0) {
      return this.messages.slice(-limit);
    }
    return [...this.messages];
  }
  
  /**
   * 清除消息历史
   */
  clearMessages(): void {
    this.messages = [];
    this.updateActivity();
  }
  
  /**
   * 执行工具调用
   */
  async executeToolCall(toolCall: ToolCallRequest): Promise<ToolCallResponse> {
    // 验证工具调用
    const validation = this.configManager.validateToolCall(toolCall.toolId, toolCall.parameters);
    if (!validation.valid) {
      const errorResponse = createErrorResponse(
        toolCall,
        'VALIDATION_FAILED',
        `工具调用验证失败: ${validation.errors.join(', ')}`
      );
      this.toolResponses.push(errorResponse);
      return errorResponse;
    }
    
    // 检查工具权限
    const toolDefinition = this.configManager.getToolDefinition(toolCall.toolId);
    if (!toolDefinition) {
      const errorResponse = createErrorResponse(
        toolCall,
        'TOOL_NOT_FOUND',
        `工具未找到: ${toolCall.toolId}`
      );
      this.toolResponses.push(errorResponse);
      return errorResponse;
    }
    
    // 检查是否需要批准
    if (this.config.tools.requireApproval.includes(toolCall.toolId)) {
      const errorResponse = createErrorResponse(
        toolCall,
        'APPROVAL_REQUIRED',
        `工具调用需要批准: ${toolCall.toolId}`
      );
      this.toolResponses.push(errorResponse);
      return errorResponse;
    }
    
    // 记录工具调用
    this.toolCalls.push(toolCall);
    this.updateActivity();
    
    // 这里应该实际执行工具调用
    // 暂时返回模拟响应
    const startTime = Date.now();
    
    try {
      // 模拟工具执行
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const executionTime = Date.now() - startTime;
      const response = createToolCallResponse(
        toolCall,
        true,
        { result: '工具执行成功（模拟）' },
        undefined,
        executionTime
      );
      
      this.toolResponses.push(response);
      return response;
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorResponse = createToolCallResponse(
        toolCall,
        false,
        undefined,
        {
          code: 'EXECUTION_ERROR',
          message: error.message,
          details: error.stack,
          recoverable: true
        },
        executionTime
      );
      
      this.toolResponses.push(errorResponse);
      return errorResponse;
    }
  }
  
  /**
   * 获取工具调用历史
   */
  getToolCallHistory(limit?: number): Array<{ request: ToolCallRequest; response: ToolCallResponse }> {
    const history: Array<{ request: ToolCallRequest; response: ToolCallResponse }> = [];
    
    // 匹配请求和响应
    for (let i = 0; i < Math.min(this.toolCalls.length, this.toolResponses.length); i++) {
      if (this.toolCalls[i].id === this.toolResponses[i].id) {
        history.push({
          request: this.toolCalls[i],
          response: this.toolResponses[i]
        });
      }
    }
    
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    
    return history;
  }
  
  /**
   * 添加错误
   */
  addError(error: { message: string; resolved?: boolean }): void {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.errors.push({
      id: errorId,
      message: error.message,
      timestamp: new Date(),
      resolved: error.resolved || false
    });
    
    this.state = SessionState.ERROR;
    this.updateActivity();
  }
  
  /**
   * 解决错误
   */
  resolveError(errorId: string): boolean {
    const errorIndex = this.errors.findIndex(err => err.id === errorId);
    if (errorIndex === -1) {
      return false;
    }
    
    this.errors[errorIndex].resolved = true;
    
    // 如果没有未解决的错误，恢复状态
    const hasUnresolvedErrors = this.errors.some(err => !err.resolved);
    if (!hasUnresolvedErrors) {
      this.state = SessionState.ACTIVE;
    }
    
    this.updateActivity();
    return true;
  }
  
  /**
   * 获取错误列表
   */
  getErrors(includeResolved: boolean = false): typeof this.errors {
    if (includeResolved) {
      return [...this.errors];
    }
    return this.errors.filter(err => !err.resolved);
  }
  
  /**
   * 设置会话状态
   */
  setState(state: SessionState): void {
    this.state = state;
    this.updateActivity();
  }
  
  /**
   * 导出会话数据
   */
  export(): any {
    return {
      id: this.id,
      config: this.config,
      state: this.state,
      messages: this.messages,
      toolCalls: this.toolCalls,
      toolResponses: this.toolResponses,
      errors: this.errors,
      statistics: this.statistics,
      exportedAt: new Date()
    };
  }
  
  /**
   * 从导出数据创建会话
   */
  static fromExport(data: any, configManager: ConfigManager): Session {
    const session = new Session(data.id, data.config, configManager);
    
    session.state = data.state;
    session.messages = data.messages || [];
    session.toolCalls = data.toolCalls || [];
    session.toolResponses = data.toolResponses || [];
    session.errors = data.errors || [];
    session.statistics = data.statistics || session.statistics;
    
    // 更新活动时间
    session.statistics.duration.lastActivity = new Date();
    
    return session;
  }
  
  /**
   * 清理会话资源
   */
  cleanup(): void {
    // 清理消息历史
    this.messages = [];
    this.toolCalls = [];
    this.toolResponses = [];
    this.errors = [];
    
    // 重置统计
    this.statistics = {
      messageCount: 0,
      tokenUsage: {
        total: 0,
        prompt: 0,
        completion: 0
      },
      toolCalls: {
        total: 0,
        successful: 0,
        failed: 0
      },
      duration: {
        startedAt: new Date(),
        lastActivity: new Date(),
        totalSeconds: 0
      }
    };
    
    this.state = SessionState.TERMINATED;
    
    console.log(`🧹 清理会话资源: ${this.id}`);
  }
}

/**
 * 创建会话管理器
 */
export function createSessionManager(configManager: ConfigManager): SessionManager {
  return new SessionManager(configManager);
}

/**
 * 快速测试
 */
export async function testSessionManager(): Promise<void> {
  console.log('🧪 测试会话管理器...\n');
  
  const configManager = new (require('./config-manager').ConfigManager)();
  const sessionManager = createSessionManager(configManager);
  
  try {
    // 1. 创建会话
    console.log('1. 创建会话...');
    const session1 = sessionManager.createSession('test-session-1', SessionType.MAIN, {
      model: {
        temperature: 0.5
      }
    });
    
    console.log(`   创建会话: ${session1.getId()}`);
    console.log(`   模型温度: ${session1.getConfig().model.temperature}`);
    
    // 2. 添加消息
    console.log('\n2. 添加消息...');
    const message: SessionMessage = {
      id: 'msg_1',
      role: 'user',
      content: '你好，请帮我分析数据',
      timestamp: new Date(),
      metadata: {
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        }
      }
    };
    
    session1.addMessage(message);
    console.log(`   添加消息: ${message.content.substring(0, 20)}...`);
    
    // 3. 执行工具调用
    console.log('\n3. 执行工具调用...');
    const toolCall: ToolCallRequest = {
      id: 'tool_1',
      toolId: 'test-tool',
      parameters: { input: '测试输入' },
      sessionId: session1.getId()
    };
    
    const toolResponse = await session1.executeToolCall(toolCall);
    console.log(`   工具调用结果: ${toolResponse.success ? '✅ 成功' : '❌ 失败'}`);
    
    // 4. 获取会话状态
    console.log('\n4. 获取会话状态...');
    const status = session1.getStatus();
    console.log(`   会话状态: ${status.state}`);
    console.log(`   消息数量: ${status.statistics.messageCount}`);
    console.log(`   Token使用: ${status.statistics.tokenUsage.total}`);
    
    // 5. 测试错误处理
    console.log('\n5. 测试错误处理...');
    session1.addError({ message: '测试错误', resolved: false });
    
    const errors = session1.getErrors();
    console.log(`   未解决错误: ${errors.length}`);
    
    // 解决错误
    if (errors.length > 0) {
      session1.resolveError(errors[0].id);
      console.log(`   已解决错误: ${errors[0].id}`);
    }
    
    // 6. 测试会话管理器统计
    console.log('\n6. 测试会话管理器统计...');
    const stats = sessionManager.getSessionStats();
    console.log(`   总会话数: ${stats.total}`);
    console.log(`   活跃会话: ${stats.activeCount}`);
    console.log(`   错误会话: ${stats.errorCount}`);
    
    // 7. 清理会话
    console.log('\n7. 清理会话...');
    const deleted = sessionManager.deleteSession(session1.getId());
    console.log(`   删除结果: ${deleted ? '✅ 成功' : '❌ 失败'}`);
    
    console.log('\n🎉 会话管理器测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 如果直接运行，执行测试
if (require.main === module) {
  testSessionManager().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}