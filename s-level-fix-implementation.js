#!/usr/bin/env node

/**
 * S级问题修复实现 - 阶段1: 错误监控和自动恢复系统
 * 解决OpenClaw框架S1和S2问题
 */

console.log('🚀 开始实施S级问题修复 - 阶段1: 错误监控和自动恢复系统\n');

// ==================== 核心组件 ====================

/**
 * 错误分类器 - 识别可重试错误
 */
class ErrorClassifier {
  static RETRYABLE_CODES = [2064, 429, 503];
  static RETRYABLE_MESSAGES = [
    'rate limit',
    'too many requests',
    'service unavailable',
    'timeout',
    'connection'
  ];
  
  /**
   * 检查错误是否可重试
   */
  static isRetryable(error) {
    if (!error) return false;
    
    // 检查错误码
    if (error.code && this.RETRYABLE_CODES.includes(error.code)) {
      return true;
    }
    
    // 检查错误消息
    const errorMessage = error.message?.toLowerCase() || '';
    for (const msg of this.RETRYABLE_MESSAGES) {
      if (errorMessage.includes(msg)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取错误分类
   */
  static classify(error) {
    if (!error) return 'unknown';
    
    if (error.code === 2064) return 'session_rate_limit';
    if (error.code === 429) return 'rate_limit';
    if (error.code === 503) return 'service_unavailable';
    
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes('rate limit')) return 'rate_limit';
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('connection')) return 'network';
    
    return 'unknown';
  }
}

/**
 * 指数退避重试管理器
 */
class ExponentialBackoffRetry {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000, // 1秒
      maxDelay: config.maxDelay || 30000,  // 30秒
      factor: config.factor || 2,          // 指数因子
      jitter: config.jitter !== false,     // 默认启用抖动
      ...config
    };
    
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalDelay: 0
    };
  }
  
  /**
   * 执行带重试的操作
   */
  async withRetry(operation, context = {}) {
    let lastError = null;
    let attempt = 0;
    
    for (attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      this.stats.totalAttempts++;
      
      try {
        const result = await operation();
        
        if (attempt > 0) {
          this.stats.successfulRetries++;
          console.log(`✅ 重试成功 (第${attempt}次重试)`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // 检查是否可重试
        if (!ErrorClassifier.isRetryable(error) || attempt === this.config.maxRetries) {
          if (attempt > 0) {
            this.stats.failedRetries++;
            console.log(`❌ 重试失败 (第${attempt}次重试后放弃):`, error.message);
          }
          throw error;
        }
        
        // 计算延迟并等待
        const delay = this.calculateDelay(attempt);
        this.stats.totalDelay += delay;
        
        console.log(`⏳ 重试等待 (第${attempt + 1}次重试, ${delay}ms):`, error.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  /**
   * 计算退避延迟
   */
  calculateDelay(attempt) {
    // 指数退避: baseDelay * factor^attempt
    let delay = this.config.baseDelay * Math.pow(this.config.factor, attempt);
    
    // 添加抖动防止同步重试
    if (this.config.jitter) {
      const jitter = 0.5 + Math.random() * 0.5; // 0.5到1.0之间的随机因子
      delay = delay * jitter;
    }
    
    // 限制最大延迟
    return Math.min(delay, this.config.maxDelay);
  }
  
  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      avgDelayPerRetry: this.stats.totalAttempts > 0 
        ? this.stats.totalDelay / this.stats.totalAttempts 
        : 0,
      successRate: this.stats.totalAttempts > 0
        ? (this.stats.successfulRetries / this.stats.totalAttempts) * 100
        : 0
    };
  }
}

/**
 * 并发任务管理器 - 防止event loop阻塞
 */
class ConcurrentTaskManager {
  constructor(config = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 4,
      queueLimit: config.queueLimit || 100,
      priorityEnabled: config.priorityEnabled !== false,
      ...config
    };
    
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.isProcessing = false;
    
    this.stats = {
      totalSubmitted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      maxQueueSize: 0,
      maxConcurrency: 0,
      avgWaitTime: 0,
      waitTimes: []
    };
  }
  
  /**
   * 提交任务
   */
  async submit(task) {
    const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const priority = task.priority || 0;
    const startTime = Date.now();
    
    this.stats.totalSubmitted++;
    
    return new Promise((resolve, reject) => {
      const wrappedTask = {
        id: taskId,
        originalTask: task,
        priority,
        startTime,
        execute: async () => {
          try {
            const result = await task.execute();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        onComplete: (result) => {
          const endTime = Date.now();
          const waitTime = endTime - startTime;
          this.stats.waitTimes.push(waitTime);
          this.stats.avgWaitTime = this.stats.waitTimes.reduce((a, b) => a + b, 0) / this.stats.waitTimes.length;
          this.stats.totalCompleted++;
        },
        onError: (error) => {
          this.stats.totalFailed++;
        }
      };
      
      // 检查队列限制
      if (this.taskQueue.length >= this.config.queueLimit) {
        const error = new Error(`任务队列已满 (限制: ${this.config.queueLimit})`);
        reject(error);
        return;
      }
      
      // 添加到队列
      this.taskQueue.push(wrappedTask);
      
      // 按优先级排序
      if (this.config.priorityEnabled) {
        this.taskQueue.sort((a, b) => b.priority - a.priority);
      }
      
      // 更新队列统计
      this.stats.maxQueueSize = Math.max(this.stats.maxQueueSize, this.taskQueue.length);
      
      // 开始处理队列
      this.processQueue();
    });
  }
  
  /**
   * 处理任务队列
   */
  async processQueue() {
    if (this.isProcessing || this.activeTasks.size >= this.config.maxConcurrent) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.activeTasks.size < this.config.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (!task) break;
        
        this.activeTasks.set(task.id, task);
        this.stats.maxConcurrency = Math.max(this.stats.maxConcurrency, this.activeTasks.size);
        
        // 执行任务
        task.execute()
          .then(result => {
            task.onComplete?.(result);
          })
          .catch(error => {
            task.onError?.(error);
          })
          .finally(() => {
            this.activeTasks.delete(task.id);
            this.processQueue();
          });
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * 获取系统状态
   */
  getStatus() {
    return {
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      maxConcurrent: this.config.maxConcurrent,
      isProcessing: this.isProcessing,
      stats: this.getStats()
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      completionRate: this.stats.totalSubmitted > 0
        ? (this.stats.totalCompleted / this.stats.totalSubmitted) * 100
        : 0,
      failureRate: this.stats.totalSubmitted > 0
        ? (this.stats.totalFailed / this.stats.totalSubmitted) * 100
        : 0,
      currentLoad: (this.activeTasks.size / this.config.maxConcurrent) * 100
    };
  }
  
  /**
   * 清理任务
   */
  clearQueue() {
    this.taskQueue = [];
    console.log('🧹 任务队列已清理');
  }
}

/**
 * 错误监控仪表板
 */
class ErrorDashboard {
  constructor() {
    this.errorStats = new Map();
    this.retryStats = new Map();
    this.concurrencyStats = [];
    this.startTime = Date.now();
    
    // 定期清理旧数据
    setInterval(() => this.cleanupOldData(), 60000); // 每分钟清理一次
  }
  
  /**
   * 记录错误
   */
  recordError(error, context = {}) {
    const errorType = ErrorClassifier.classify(error);
    const timestamp = Date.now();
    
    // 更新错误统计
    if (!this.errorStats.has(errorType)) {
      this.errorStats.set(errorType, { count: 0, lastOccurred: timestamp, contexts: [] });
    }
    
    const stats = this.errorStats.get(errorType);
    stats.count++;
    stats.lastOccurred = timestamp;
    stats.contexts.push({
      timestamp,
      message: error.message,
      code: error.code,
      ...context
    });
    
    // 限制上下文数量
    if (stats.contexts.length > 100) {
      stats.contexts = stats.contexts.slice(-50);
    }
    
    console.log(`📊 错误记录: ${errorType} (总计: ${stats.count})`);
    
    // 检查是否需要告警
    this.checkAlerts(errorType, stats);
  }
  
  /**
   * 记录重试统计
   */
  recordRetry(attempt, success, delay, errorType) {
    const key = `${errorType}-${attempt}`;
    
    if (!this.retryStats.has(key)) {
      this.retryStats.set(key, { attempts: 0, successes: 0, totalDelay: 0 });
    }
    
    const stats = this.retryStats.get(key);
    stats.attempts++;
    if (success) stats.successes++;
    stats.totalDelay += delay;
  }
  
  /**
   * 记录并发统计
   */
  recordConcurrency(activeTasks, queuedTasks) {
    this.concurrencyStats.push({
      timestamp: Date.now(),
      activeTasks,
      queuedTasks,
      load: (activeTasks / 4) * 100 // 假设最大并发为4
    });
    
    // 限制统计数量
    if (this.concurrencyStats.length > 1000) {
      this.concurrencyStats = this.concurrencyStats.slice(-500);
    }
  }
  
  /**
   * 检查告警
   */
  checkAlerts(errorType, stats) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // 检查最近1分钟的错误频率
    const recentErrors = stats.contexts.filter(ctx => ctx.timestamp > oneMinuteAgo);
    
    if (recentErrors.length >= 10) {
      console.warn(`🚨 告警: ${errorType}错误在1分钟内出现${recentErrors.length}次`);
      // 这里可以添加通知逻辑
    }
    
    if (stats.count >= 100) {
      console.warn(`🚨 告警: ${errorType}错误总计达到${stats.count}次`);
    }
  }
  
  /**
   * 清理旧数据
   */
  cleanupOldData() {
    const oneHourAgo = Date.now() - 3600000;
    
    // 清理错误统计
    for (const [errorType, stats] of this.errorStats.entries()) {
      stats.contexts = stats.contexts.filter(ctx => ctx.timestamp > oneHourAgo);
      if (stats.contexts.length === 0 && stats.lastOccurred < oneHourAgo) {
        this.errorStats.delete(errorType);
      }
    }
    
    // 清理并发统计
    this.concurrencyStats = this.concurrencyStats.filter(stat => stat.timestamp > oneHourAgo);
    
    console.log('🧹 监控数据已清理 (保留最近1小时)');
  }
  
  /**
   * 生成报告
   */
  generateReport() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = (uptime / 3600000).toFixed(2);
    
    const errorSummary = {};
    for (const [errorType, stats] of this.errorStats.entries()) {
      errorSummary[errorType] = {
        count: stats.count,
        lastOccurred: new Date(stats.lastOccurred).toISOString()
      };
    }
    
    const concurrencySummary = this.concurrencyStats.length > 0 ? {
      avgActiveTasks: this.concurrencyStats.reduce((sum, stat) => sum + stat.activeTasks, 0) / this.concurrencyStats.length,
      maxActiveTasks: Math.max(...this.concurrencyStats.map(stat => stat.activeTasks)),
      avgLoad: this.concurrencyStats.reduce((sum, stat) => sum + stat.load, 0) / this.concurrencyStats.length
    } : {};
    
    return {
      timestamp: new Date().toISOString(),
      uptime: `${uptimeHours}小时`,
      errorSummary,
      concurrencySummary,
      totalErrors: Array.from(this.errorStats.values()).reduce((sum, stats) => sum + stats.count, 0)
    };
  }
}

// ==================== 集成层 ====================

/**
 * OpenClaw S级问题修复集成
 */
class OpenClawSLevelFix {
  constructor() {
    console.log('🚀 初始化OpenClaw S级问题修复系统...');
    
    // 初始化组件
    this.errorClassifier = new ErrorClassifier();
    this.retryManager = new ExponentialBackoffRetry({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      factor: 2,
      jitter: true
    });
    
    this.taskManager = new ConcurrentTaskManager({
      maxConcurrent: 4,
      queueLimit: 100,
      priorityEnabled: true
    });
    
    this.dashboard = new ErrorDashboard();
    
    // 启动监控
    this.startMonitoring();
    
    console.log('✅ OpenClaw S级问题修复系统初始化完成');
  }
  
  /**
   * 启动监控
   */
  startMonitoring() {
    // 定期记录并发状态
    setInterval(() => {
      const status = this.taskManager.getStatus();
      this.dashboard.recordConcurrency(status.activeTasks, status.queuedTasks);
    }, 5000); // 每5秒记录一次
    
    // 定期生成报告
    setInterval(() => {
      const report = this.dashboard.generateReport();
      console.log('📈 系统状态报告:', JSON.stringify(report, null, 2));
    }, 30000); // 每30秒生成一次报告
    
    console.log('👁️ 监控系统已启动');
  }
  
  /**
   * 包装API调用，添加重试机制
   */
  async callWithRetry(apiCall, context = {}) {
    try {
      return await this.retryManager.withRetry(apiCall, context);
    } catch (error) {
      // 记录错误
      this.dashboard.recordError(error, context);
      
      // 记录重试统计
      const errorType = ErrorClassifier.classify(error);
      this.dashboard.recordRetry(
        this.retryManager.stats.totalAttempts - 1,
        false,
        0,
        errorType
      );
      
      throw error;
    }
  }
  
  /**
   * 提交任务到并发管理器
   */
  async submitTask(task) {
    return await this.taskManager.submit(task);
  }
  
  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      retryStats: this.retryManager.getStats(),
      taskManagerStatus: this.taskManager.getStatus(),
      dashboardReport: this.dashboard.generateReport(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 模拟测试
   */
  async runTest() {
    console.log('\n🧪 开始S级问题修复系统测试...');
    
    // 测试1: 重试机制
    console.log('\n1. 测试重试机制...');
    let attemptCount = 0;
    const failingApi = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw { code: 429, message: 'Rate limit exceeded' };
      }
      return 'API调用成功';
    };
    
    try {
      const result = await this.call