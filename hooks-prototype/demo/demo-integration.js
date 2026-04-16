#!/usr/bin/env node

/**
 * Hooks系统原型演示
 * 展示如何集成到OpenClaw/VCPCoordinator中
 */

import { createHooksManager, HOOK_EVENTS, Hooks } from '../src/index.js';

console.log('=== OpenClaw Hooks System Prototype Demo ===\n');

// 1. 创建Hooks管理器
const hooksManager = createHooksManager({
  autoLoadConfig: false,
  enableLogging: true
});

console.log('1. ✅ Hooks管理器已创建\n');

// 2. 注册一些示例Hooks
console.log('2. 📝 注册示例Hooks:');

// 2.1 代码质量Hooks
hooksManager.registerHook(
  HOOK_EVENTS.PRE_COMMIT,
  '*',
  Hooks.codeQuality.preCommit()
);
console.log('   - Pre-commit代码质量检查');

hooksManager.registerHook(
  HOOK_EVENTS.POST_GENERATION,
  'Write',
  Hooks.codeQuality.postGeneration()
);
console.log('   - 代码生成后自动测试');

// 2.2 Gateway监控Hooks
hooksManager.registerHook(
  HOOK_EVENTS.GATEWAY_START,
  '*',
  Hooks.gateway.healthCheck()
);
console.log('   - Gateway启动健康检查');

hooksManager.registerHook(
  HOOK_EVENTS.GATEWAY_ERROR,
  '*',
  Hooks.gateway.autoRestart()
);
console.log('   - Gateway错误自动重启');

// 2.3 记忆系统Hooks
hooksManager.registerHook(
  HOOK_EVENTS.MEMORY_UPDATED,
  '*',
  Hooks.memory.autoIndex()
);
console.log('   - 记忆更新自动索引');

console.log('\n3. 🚀 模拟事件触发:\n');

// 3. 模拟触发各种事件
async function runDemo() {
  // 3.1 模拟Gateway启动
  console.log('a) 模拟 Gateway 启动事件:');
  const gatewayResult = await hooksManager.trigger(
    HOOK_EVENTS.GATEWAY_START,
    'Gateway',
    { port: 20001, version: '4.12' }
  );
  console.log(`   结果: ${gatewayResult.executed} 个hook执行\n`);

  // 3.2 模拟代码生成
  console.log('b) 模拟代码生成事件 (Write工具):');
  const generationResult = await hooksManager.trigger(
    HOOK_EVENTS.POST_GENERATION,
    'Write',
    { 
      file: 'src/api/userService.js',
      content: '// 生成的API代码...' 
    }
  );
  console.log(`   结果: ${generationResult.executed} 个hook执行\n`);

  // 3.3 模拟Git提交前
  console.log('c) 模拟Git提交前事件:');
  const preCommitResult = await hooksManager.trigger(
    HOOK_EVENTS.PRE_COMMIT,
    'Git',
    { 
      files: ['src/**/*.js', 'test/**/*.js'],
      message: '修复用户认证BUG' 
    }
  );
  console.log(`   结果: ${preCommitResult.executed} 个hook执行\n`);

  // 3.4 模拟记忆更新
  console.log('d) 模拟记忆更新事件:');
  const memoryResult = await hooksManager.trigger(
    HOOK_EVENTS.MEMORY_UPDATED,
    'MemoryCore',
    { 
      operation: 'insert',
      count: 42,
      type: 'daily-log' 
    }
  );
  console.log(`   结果: ${memoryResult.executed} 个hook执行\n`);

  // 3.5 模拟Gateway错误
  console.log('e) 模拟Gateway错误事件:');
  const errorResult = await hooksManager.trigger(
    HOOK_EVENTS.GATEWAY_ERROR,
    'Gateway',
    { 
      error: 'WebSocket connection closed (1006)',
      timestamp: new Date().toISOString() 
    }
  );
  console.log(`   结果: ${errorResult.executed} 个hook执行\n`);

  // 4. 显示统计信息
  console.log('4. 📊 Hooks执行统计:');
  const stats = hooksManager.getStats();
  console.log(`   - 总执行数: ${stats.totalExecuted}`);
  console.log(`   - 成功: ${stats.succeeded}`);
  console.log(`   - 失败: ${stats.failed}`);
  console.log(`   - 成功率: ${stats.successRate}`);
  console.log(`   - 平均执行时间: ${stats.avgTime.toFixed(2)}ms\n`);

  // 5. 展示如何集成到VCPCoordinator
  console.log('5. 🔗 与VCPCoordinator集成示例:');
  
  // 模拟VCPCoordinator
  class MockCoordinator {
    constructor() {
      this.listeners = new Map();
    }
    
    on(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(handler);
    }
    
    emit(event, ...args) {
      const handlers = this.listeners.get(event) || [];
      handlers.forEach(handler => handler(...args));
    }
    
    // 模拟任务处理
    async processTask(task) {
      console.log(`   [Coordinator] 开始处理任务: ${task}`);
      
      // 触发taskStart事件
      this.emit('taskStart', task);
      
      // 模拟工具使用
      this.emit('toolUse', 'Write', { file: 'test.js', content: '// test' });
      this.emit('toolResult', 'Write', { file: 'test.js' }, { success: true });
      
      // 模拟任务完成
      this.emit('taskComplete', task, { success: true, time: 1500 });
      
      return { completed: true, task };
    }
  }
  
  // 创建模拟Coordinator并集成Hooks
  const mockCoordinator = new MockCoordinator();
  HooksManager.integrateWithCoordinator(mockCoordinator, hooksManager);
  
  console.log('   ✅ Hooks与Coordinator集成完成');
  console.log('   📋 监听的事件: taskStart, taskComplete, toolUse, toolResult\n');
  
  // 运行模拟任务
  console.log('6. 🎯 运行集成测试:');
  await mockCoordinator.processTask('实现用户登录API');
  
  console.log('\n=== 演示完成 ===\n');
  
  // 保存配置示例
  console.log('💾 保存配置示例:');
  const config = hooksManager.toJSON();
  console.log(JSON.stringify(config, null, 2));
  
  return {
    success: true,
    stats,
    config
  };
}

// 运行演示
runDemo().then(result => {
  console.log('\n✅ 演示成功完成!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 演示失败:', error);
  process.exit(1);
});