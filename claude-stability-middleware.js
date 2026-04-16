// Claude式稳定性中间件
// 基于Claude代码分析提取的稳定性模式

class ClaudeStabilityMiddleware {
  constructor() {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      resourceLimits: {
        memory: '80%',
        cpu: '70%',
        concurrentTasks: 5
      }
    };
    
    this.errorHandlers = [];
    this.fallbackStrategies = [];
    this.monitors = [];
    
    this.init();
  }

  init() {
    console.log('🚀 初始化Claude式稳定性中间件...');
    
    // 注册错误处理器
    this.registerErrorHandlers();
    
    // 注册降级策略
    this.registerFallbackStrategies();
    
    // 启动监控
    this.startMonitoring();
  }

  registerErrorHandlers() {
    // 1. 配置错误处理器
    this.errorHandlers.push({
      name: 'config-error-handler',
      match: error => error.message.includes('config') || error.message.includes('Config'),
      handle: async (error) => {
        console.warn('⚠️ 配置错误，使用安全默认值:', error.message);
        return { success: false, error: error.message, fallback: 'safe-defaults' };
      }
    });

    // 2. 网络错误处理器
    this.errorHandlers.push({
      name: 'network-error-handler',
      match: error => error.message.includes('network') || error.message.includes('fetch') || error.code === 'ECONNREFUSED',
      handle: async (error, context) => {
        console.warn('🌐 网络错误，重试中...', error.message);
        await this.delay(this.config.retryDelay);
        return await this.retry(context.operation, context.args, context.retryCount + 1);
      }
    });

    // 3. 资源错误处理器
    this.errorHandlers.push({
      name: 'resource-error-handler',
      match: error => error.message.includes('memory') || error.message.includes('ENOMEM') || error.message.includes('timeout'),
      handle: async (error) => {
        console.warn('💾 资源错误，清理缓存并重试:', error.message);
        await this.cleanupResources();
        return { success: false, error: '资源不足，已清理缓存', action: 'retry-later' };
      }
    });

    console.log(`✅ 注册了 ${this.errorHandlers.length} 个错误处理器`);
  }

  registerFallbackStrategies() {
    // 1. 模型降级策略
    this.fallbackStrategies.push({
      name: 'model-fallback',
      condition: () => !this.checkModelAvailability('primary'),
      action: async () => {
        console.log('🔄 主模型不可用，切换到备用模型...');
        return await this.switchToFallbackModel();
      }
    });

    // 2. API降级策略
    this.fallbackStrategies.push({
      name: 'api-fallback',
      condition: () => !this.checkAPIHealth(),
      action: async () => {
        console.log('🔄 API不可用，使用本地缓存...');
        return await this.useCachedResponses();
      }
    });

    // 3. 功能降级策略
    this.fallbackStrategies.push({
      name: 'feature-fallback',
      condition: (feature) => !this.checkFeatureHealth(feature),
      action: async (feature) => {
        console.log(`🔄 ${feature} 功能降级运行...`);
        return await this.runFeatureInDegradedMode(feature);
      }
    });

    console.log(`✅ 注册了 ${this.fallbackStrategies.length} 个降级策略`);
  }

  startMonitoring() {
    // 健康监控
    this.monitors.push(setInterval(() => {
      this.checkSystemHealth();
    }, 30000));

    // 资源监控
    this.monitors.push(setInterval(() => {
      this.monitorResources();
    }, 10000));

    // 错误率监控
    this.monitors.push(setInterval(() => {
      this.monitorErrorRate();
    }, 60000));

    console.log(`✅ 启动了 ${this.monitors.length} 个监控器`);
  }

  // 核心稳定性包装器
  async withStability(operation, args, options = {}) {
    const startTime = Date.now();
    const context = {
      operation,
      args,
      retryCount: 0,
      startTime
    };

    try {
      // 检查降级条件
      for (const strategy of this.fallbackStrategies) {
        if (strategy.condition(operation)) {
          console.log(`🎯 触发降级策略: ${strategy.name}`);
          return await strategy.action(operation);
        }
      }

      // 执行操作（带重试）
      const result = await this.executeWithRetry(operation, args, context);
      
      // 记录成功
      this.recordSuccess(operation, Date.now() - startTime);
      
      return result;

    } catch (error) {
      // 错误处理
      const handled = await this.handleError(error, context);
      
      if (handled) {
        return handled;
      }

      // 如果错误处理器没处理，应用通用降级
      console.error('🚨 未处理的错误，应用通用降级:', error.message);
      return await this.generalFallback(operation, error);
    }
  }

  async executeWithRetry(operation, args, context, attempt = 1) {
    try {
      return await operation(...args);
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      console.log(`🔄 重试 ${attempt}/${this.config.maxRetries}:`, error.message);
      await this.delay(this.config.retryDelay * attempt);
      
      return await this.executeWithRetry(operation, args, { ...context, retryCount: attempt }, attempt + 1);
    }
  }

  async handleError(error, context) {
    // 查找匹配的错误处理器
    for (const handler of this.errorHandlers) {
      if (handler.match(error)) {
        console.log(`🔧 使用错误处理器: ${handler.name}`);
        return await handler.handle(error, context);
      }
    }
    
    return null; // 没有处理器匹配
  }

  // 工具方法
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanupResources() {
    // 清理缓存、释放内存等
    if (global.gc) {
      global.gc();
    }
    // 可以添加更多资源清理逻辑
  }

  async generalFallback(operation, error) {
    // 通用降级：返回错误信息但不崩溃
    return {
      success: false,
      operation: operation.name || 'unknown',
      error: error.message,
      timestamp: new Date().toISOString(),
      fallback: 'graceful-degradation',
      suggestion: '系统遇到问题，但仍在降级模式下运行'
    };
  }

  // 监控方法
  checkSystemHealth() {
    // 检查系统健康状态
    const health = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    // 可以添加健康检查逻辑
    return health;
  }

  monitorResources() {
    const usage = process.memoryUsage();
    const memoryUsage = usage.heapUsed / usage.heapTotal;
    
    if (memoryUsage > 0.8) {
      console.warn('⚠️ 内存使用率高:', Math.round(memoryUsage * 100) + '%');
      this.cleanupResources();
    }
  }

  monitorErrorRate() {
    // 监控错误率，如果过高触发警报
    // 实现错误率统计逻辑
  }

  recordSuccess(operation, duration) {
    // 记录成功操作和耗时
    console.log(`✅ ${operation} 成功完成，耗时: ${duration}ms`);
  }

  // 降级策略的具体实现
  async switchToFallbackModel() {
    // 切换到备用模型的逻辑
    return { model: 'fallback', reason: 'primary-unavailable' };
  }

  async useCachedResponses() {
    // 使用缓存响应的逻辑
    return { source: 'cache', reason: 'api-unavailable' };
  }

  async runFeatureInDegradedMode(feature) {
    // 功能降级运行的逻辑
    return { feature, mode: 'degraded', capabilities: 'limited' };
  }

  checkModelAvailability(model) {
    // 检查模型可用性
    return true; // 简化实现
  }

  checkAPIHealth() {
    // 检查API健康状态
    return true; // 简化实现
  }

  checkFeatureHealth(feature) {
    // 检查功能健康状态
    return true; // 简化实现
  }
}

// 导出单例
const stabilityMiddleware = new ClaudeStabilityMiddleware();

// 包装OpenClaw的Gateway启动
function startOpenClawWithStability() {
  return stabilityMiddleware.withStability(
    async () => {
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const process = spawn('openclaw', ['gateway', 'start']);
        // 处理进程输出等
        resolve({ pid: process.pid });
      });
    },
    [],
    { operation: 'openclaw-gateway-start' }
  );
}

// 使用示例
async function exampleUsage() {
  console.log('🧪 测试Claude式稳定性中间件...');
  
  // 包装一个可能失败的操作
  const result = await stabilityMiddleware.withStability(
    async (url) => {
      // 模拟一个可能失败的操作
      if (Math.random() > 0.7) {
        throw new Error('模拟的网络错误');
      }
      return { data: '成功数据', url };
    },
    ['https://api.example.com/data'],
    { operation: 'fetch-data' }
  );
  
  console.log('结果:', result);
}

// 导出
module.exports = {
  ClaudeStabilityMiddleware,
  stabilityMiddleware,
  startOpenClawWithStability,
  exampleUsage
};

// 如果直接运行，执行示例
if (require.main === module) {
  exampleUsage().catch(console.error);
}