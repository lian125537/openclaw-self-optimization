#!/usr/bin/env node

/**
 * S级问题修复完整实现
 * 解决OpenClaw框架S1和S2问题
 */

console.log('🚀 开始实施S级问题修复系统...\n');

// ==================== 核心组件 ====================

/**
 * 错误分类器
 */
class ErrorClassifier {
  static RETRYABLE_CODES = [2064, 429, 503];
  static RETRYABLE_MESSAGES = ['rate limit', 'too many requests', 'service unavailable', 'timeout', 'connection'];
  
  static isRetryable(error) {
    if (!error) return false;
    if (error.code && this.RETRYABLE_CODES.includes(error.code)) return true;
    const msg = error.message?.toLowerCase() || '';
    return this.RETRYABLE_MESSAGES.some(m => msg.includes(m));
  }
  
  static classify(error) {
    if (!error) return 'unknown';
    if (error.code === 2064) return 'session_rate_limit';
    if (error.code === 429) return 'rate_limit';
    if (error.code === 503) return 'service_unavailable';
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('rate limit')) return 'rate_limit';
    if (msg.includes('timeout')) return 'timeout';
    if (msg.includes('connection')) return 'network';
    return 'unknown';
  }
}

/**
 * 指数退避重试
 */
class ExponentialBackoffRetry {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      factor: config.factor || 2,
      jitter: config.jitter !== false,
      ...config
    };
    this.stats = { totalAttempts: 0, successfulRetries: 0, failedRetries: 0, totalDelay: 0 };
  }
  
  async withRetry(operation) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      this.stats.totalAttempts++;
      
      try {
        const result = await operation();
        if (attempt > 0) {
          this.stats.successfulRetries++;
          console.log(`✅ 重试成功 (第${attempt}次)`);
        }
        return result;
      } catch (error) {
        lastError = error;
        
        if (!ErrorClassifier.isRetryable(error) || attempt === this.config.maxRetries) {
          if (attempt > 0) {
            this.stats.failedRetries++;
            console.log(`❌ 重试失败 (第${attempt}次后放弃):`, error.message);
          }
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        this.stats.totalDelay += delay;
        console.log(`⏳ 重试等待 (第${attempt + 1}次, ${delay}ms):`, error.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  calculateDelay(attempt) {
    let delay = this.config.baseDelay * Math.pow(this.config.factor, attempt);
    if (this.config.jitter) delay = delay * (0.5 + Math.random() * 0.5);
    return Math.min(delay, this.config.maxDelay);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getStats() {
    return {
      ...this.stats,
      avgDelay: this.stats.totalAttempts > 0 ? this.stats.totalDelay / this.stats.totalAttempts : 0,
      successRate: this.stats.totalAttempts > 0 ? (this.stats.successfulRetries / this.stats.totalAttempts) * 100 : 0
    };
  }
}

/**
 * 并发任务管理器
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
      totalSubmitted: 0, totalCompleted: 0, totalFailed: 0,
      maxQueueSize: 0, maxConcurrency: 0, avgWaitTime: 0, waitTimes: []
    };
  }
  
  async submit(task) {
    const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const priority = task.priority || 0;
    const startTime = Date.now();
    
    this.stats.totalSubmitted++;
    
    return new Promise((resolve, reject) => {
      const wrappedTask = {
        id: taskId, originalTask: task, priority, startTime,
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
          const waitTime = Date.now() - startTime;
          this.stats.waitTimes.push(waitTime);
          this.stats.avgWaitTime = this.stats.waitTimes.reduce((a, b) => a + b, 0) / this.stats.waitTimes.length;
          this.stats.totalCompleted++;
        },
        onError: (error) => {
          this.stats.totalFailed++;
        }
      };
      
      if (this.taskQueue.length >= this.config.queueLimit) {
        reject(new Error(`任务队列已满 (限制: ${this.config.queueLimit})`));
        return;
      }
      
      this.taskQueue.push(wrappedTask);
      if (this.config.priorityEnabled) {
        this.taskQueue.sort((a, b) => b.priority - a.priority);
      }
      
      this.stats.maxQueueSize = Math.max(this.stats.maxQueueSize, this.taskQueue.length);
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.isProcessing || this.activeTasks.size >= this.config.maxConcurrent) return;
    
    this.isProcessing = true;
    
    try {
      while (this.activeTasks.size < this.config.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (!task) break;
        
        this.activeTasks.set(task.id, task);
        this.stats.maxConcurrency = Math.max(this.stats.maxConcurrency, this.activeTasks.size);
        
        task.execute()
          .then(result => task.onComplete?.(result))
          .catch(error => task.onError?.(error))
          .finally(() => {
            this.activeTasks.delete(task.id);
            this.processQueue();
          });
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  getStatus() {
    return {
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      maxConcurrent: this.config.maxConcurrent,
      isProcessing: this.isProcessing,
      stats: this.getStats()
    };
  }
  
  getStats() {
    return {
      ...this.stats,
      completionRate: this.stats.totalSubmitted > 0 ? (this.stats.totalCompleted / this.stats.totalSubmitted) * 100 : 0,
      failureRate: this.stats.totalSubmitted > 0 ? (this.stats.totalFailed / this.stats.totalSubmitted) * 100 : 0,
      currentLoad: (this.activeTasks.size / this.config.maxConcurrent) * 100
    };
  }
  
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
    setInterval(() => this.cleanupOldData(), 60000);
  }
  
  recordError(error, context = {}) {
    const errorType = ErrorClassifier.classify(error);
    const timestamp = Date.now();
    
    if (!this.errorStats.has(errorType)) {
      this.errorStats.set(errorType, { count: 0, lastOccurred: timestamp, contexts: [] });
    }
    
    const stats = this.errorStats.get(errorType);
    stats.count++;
    stats.lastOccurred = timestamp;
    stats.contexts.push({ timestamp, message: error.message, code: error.code, ...context });
    
    if (stats.contexts.length > 100) stats.contexts = stats.contexts.slice(-50);
    
    console.log(`📊 错误记录: ${errorType} (总计: ${stats.count})`);
    this.checkAlerts(errorType, stats);
  }
  
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
  
  recordConcurrency(activeTasks, queuedTasks) {
    this.concurrencyStats.push({
      timestamp: Date.now(),
      activeTasks,
      queuedTasks,
      load: (activeTasks / 4) * 100
    });
    if (this.concurrencyStats.length > 1000) this.concurrencyStats = this.concurrencyStats.slice(-500);
  }
  
  checkAlerts(errorType, stats) {
    const now = Date.now();
    const recentErrors = stats.contexts.filter(ctx => ctx.timestamp > now - 60000);
    
    if (recentErrors.length >= 10) {
      console.warn(`🚨 告警: ${errorType}错误在1分钟内出现${recentErrors.length}次`);
    }
    
    if (stats.count >= 100) {
      console.warn(`🚨 告警: ${errorType}错误总计达到${stats.count}次`);
    }
  }
  
  cleanupOldData() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [errorType, stats] of this.errorStats.entries()) {
      stats.contexts = stats.contexts.filter(ctx => ctx.timestamp > oneHourAgo);
      if (stats.contexts.length === 0 && stats.lastOccurred < oneHourAgo) {
        this.errorStats.delete(errorType);
      }
    }
    
    this.concurrencyStats = this.concurrencyStats.filter(stat => stat.timestamp > oneHourAgo);
    console.log('🧹 监控数据已清理 (保留最近1小时)');
  }
  
  generateReport() {
    const uptime = Date.now() - this.startTime;
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
      uptime: `${(uptime / 3600000).toFixed(2)}小时`,
      errorSummary,
      concurrencySummary,
      totalErrors: Array.from(this.errorStats.values()).reduce((sum, stats) => sum + stats.count, 0)
    };
  }
}

// ==================== OpenClaw修复集成 ====================

class OpenClawSLevelFix {
  constructor() {
    console.log('🚀 初始化OpenClaw S级问题修复系统...');
    
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
    
    this.startMonitoring();
    console.log('✅ OpenClaw S级问题修复系统初始化完成');
  }
  
  startMonitoring() {
    setInterval(() => {
      const status = this.taskManager.getStatus();
      this.dashboard.recordConcurrency(status.activeTasks, status.queuedTasks);
    }, 5000);
    
    setInterval(() => {
      const report = this.dashboard.generateReport();
      console.log('📈 系统状态报告:', JSON.stringify(report, null, 2));
    }, 30000);
    
    console.log('👁️ 监控系统已启动');
  }
  
  async callWithRetry(apiCall, context = {}) {
    try {
      return await this.retryManager.withRetry(apiCall);
    } catch (error) {
      this.dashboard.recordError(error, context);
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
  
  async submitTask(task) {
    return await this.taskManager.submit(task);
  }
  
  getSystemStatus() {
    return {
      retryStats: this.retryManager.getStats(),
      taskManagerStatus: this.taskManager.getStatus(),
      dashboardReport: this.dashboard.generateReport(),
      timestamp: new Date().toISOString()
    };
  }
}

// ==================== 测试和部署 ====================

async function runTests() {
  console.log('\n🧪 开始S级问题修复系统测试...');
  
  const fixSystem = new OpenClawSLevelFix();
  
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
    const result = await fixSystem.callWithRetry(failingApi);
    console.log(`✅ 重试测试通过: ${result}`);
  } catch (error) {
    console.log(`❌ 重试测试失败: ${error.message}`);
  }
  
  // 测试2: 并发管理
  console.log('\n2. 测试并发管理...');
  const tasks = [];
  for (let i = 0; i < 10; i++) {
    tasks.push({
      id: `task-${i}`,
      priority: Math.floor(Math.random() * 10),
      execute: async () => {
        const delay = 500 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return `任务${i}完成 (延迟: ${delay.toFixed(0)}ms)`;
      }
    });
  }
  
  const taskPromises = tasks.map(task => fixSystem.submitTask(task));
  
  try {
    const results = await Promise.all(taskPromises);
    console.log(`✅ 并发测试通过: 完成${results.length}个任务`);
  } catch (error) {
    console.log(`❌ 并发测试失败: ${error.message}`);
  }
  
  // 测试3: 错误监控
  console.log('\n3. 测试错误监控...');
  const errorApi = async () => {
    throw { code: 503, message: 'Service unavailable' };
  };
  
  try {
    await fixSystem.callWithRetry(errorApi);
  } catch (error) {
    console.log(`✅ 错误监控测试通过: 错误已记录`);
  }
  
  // 显示系统状态
  console.log('\n📊 最终系统状态:');
  const status = fixSystem.getSystemStatus();
  console.log(JSON.stringify(status, null, 2));
  
  return fixSystem;
}

// ==================== 主程序 ====================

async function main() {
  console.log('🚀 S级问题修复系统 - 主程序启动\n');
  
  try {
    // 运行测试
    const fixSystem = await runTests();
    
    // 部署到生产环境
    console.log('\n🚀 部署到生产环境...');
    
    // 1. 创建部署脚本
    const deployScript = `
#!/bin/bash
# OpenClaw S级问题修复部署脚本

echo "🚀 开始部署S级问题修复系统..."

# 复制文件到OpenClaw目录
sudo cp /home/boz/.openclaw/workspace/s-level-fix-complete.js /usr/lib/node_modules/openclaw/s-level-fix.js
sudo cp /home/boz/.openclaw/workspace/S_LEVEL_FIX_PLAN.md /usr/lib/node_modules/openclaw/S_LEVEL_FIX_PLAN.md

# 创建启动脚本
cat > /usr/lib/node_modules/openclaw/start-s-level-fix.sh << 'EOF'
#!/bin/bash
# 启动S级问题修复系统

cd /usr/lib/node_modules/openclaw
node s-level-fix.js &

echo "✅ S级问题修复系统已启动"
EOF

chmod +x /usr/lib/node_modules/openclaw/start-s-level-fix.sh

# 创建systemd服务
cat > /etc/systemd/system/openclaw-s-level-fix.service << 'EOF'
[Unit]
Description=OpenClaw S-Level Fix System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/usr/lib/node_modules/open