#!/usr/bin/env node

/**
 * Hooks系统与VCPCoordinator集成演示
 * 展示如何将Claude Code的Hooks系统移植到OpenClaw生态
 */

import { createHooksManager, HOOK_EVENTS, Hooks } from '../src/index.js';

console.log('=== Hooks系统 + VCPCoordinator 集成演示 ===\n');

// 模拟VCPCoordinator（简化版）
class MockVCPCoordinator {
  constructor() {
    this.name = 'VCPCoordinator';
    this.version = '1.0.0';
    this.listeners = new Map();
    this.tasks = new Map();
    this.hooksManager = null;
    
    console.log(`🚀 创建 ${this.name} v${this.version}`);
  }
  
  // 简单的事件系统
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }
  
  emit(event, ...args) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(...args));
    return this;
  }
  
  // 集成Hooks管理器
  integrateHooks(hooksManager) {
    this.hooksManager = hooksManager;
    
    // 监听Coordinator事件并触发Hooks
    this.on('taskStart', (task) => {
      this.hooksManager.trigger(HOOK_EVENTS.TASK_START, this.name, { task });
    });
    
    this.on('taskComplete', (task, result) => {
      this.hooksManager.trigger(HOOK_EVENTS.TASK_COMPLETE, this.name, { task, result });
    });
    
    this.on('taskFailed', (task, error) => {
      this.hooksManager.trigger(HOOK_EVENTS.TASK_FAILED, this.name, { task, error });
    });
    
    this.on('toolUse', (toolName, toolInput) => {
      this.hooksManager.trigger(HOOK_EVENTS.PRE_TOOL_USE, toolName, toolInput);
    });
    
    this.on('toolResult', (toolName, toolInput, result) => {
      this.hooksManager.trigger(HOOK_EVENTS.POST_TOOL_USE, toolName, { ...toolInput, result });
    });
    
    this.on('toolError', (toolName, toolInput, error) => {
      this.hooksManager.trigger(HOOK_EVENTS.POST_TOOL_USE_FAILURE, toolName, { ...toolInput, error });
    });
    
    this.on('memoryUpdated', (operation, data) => {
      this.hooksManager.trigger(HOOK_EVENTS.MEMORY_UPDATED, 'Memory', { operation, data });
    });
    
    console.log('🔗 Hooks系统集成完成');
    return this;
  }
  
  // 模拟任务处理
  async processTask(taskDescription) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const task = { id: taskId, description: taskDescription, startTime: new Date() };
    
    this.tasks.set(taskId, task);
    
    console.log(`\n📋 开始处理任务: ${taskDescription}`);
    console.log(`   ID: ${taskId}`);
    
    // 触发taskStart事件
    this.emit('taskStart', task);
    
    try {
      // 模拟工具使用
      console.log(`   🔧 使用工具: Write, Read, Bash`);
      
      this.emit('toolUse', 'Write', { file: 'src/api.js', content: '// API代码' });
      this.emit('toolResult', 'Write', { file: 'src/api.js' }, { success: true, bytes: 1024 });
      
      this.emit('toolUse', 'Read', { file: 'package.json' });
      this.emit('toolResult', 'Read', { file: 'package.json' }, { content: '{"name": "test"}' });
      
      this.emit('toolUse', 'Bash', { command: 'npm install' });
      this.emit('toolResult', 'Bash', { command: 'npm install' }, { exitCode: 0, stdout: '安装成功' });
      
      // 模拟记忆更新
      this.emit('memoryUpdated', 'insert', { type: 'task_execution', taskId });
      
      // 模拟任务完成
      const result = { 
        success: true, 
        duration: 1500, 
        artifacts: ['src/api.js', 'package.json'],
        timestamp: new Date().toISOString()
      };
      
      task.endTime = new Date();
      task.result = result;
      
      this.emit('taskComplete', task, result);
      
      console.log(`   ✅ 任务完成: ${JSON.stringify(result, null, 2)}`);
      
      return { task, result };
      
    } catch (error) {
      // 模拟任务失败
      this.emit('taskFailed', task, error.message);
      console.log(`   ❌ 任务失败: ${error.message}`);
      throw error;
    }
  }
  
  // 获取状态信息
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      tasks: this.tasks.size,
      hooksIntegrated: !!this.hooksManager,
      listeners: Array.from(this.listeners.keys())
    };
  }
}

// 主演示函数
async function runIntegrationDemo() {
  console.log('1. 🏗️ 创建组件:\n');
  
  // 创建VCPCoordinator
  const coordinator = new MockVCPCoordinator();
  
  // 创建Hooks管理器
  const hooksManager = createHooksManager({
    enableLogging: true
  });
  
  console.log('\n2. 📝 注册Hooks:\n');
  
  // 注册各种Hooks
  const hooks = [
    // 任务相关Hooks
    { event: HOOK_EVENTS.TASK_START, pattern: '*', hook: Hooks.custom.function((ctx) => {
      console.log(`   📊 [TaskStart Hook] 任务开始: ${ctx.task?.description}`);
      return { logged: true, timestamp: new Date().toISOString() };
    }, { statusMessage: '记录任务开始' })},
    
    { event: HOOK_EVENTS.TASK_COMPLETE, pattern: '*', hook: Hooks.custom.function((ctx) => {
      console.log(`   📊 [TaskComplete Hook] 任务完成: ${ctx.task?.description}, 耗时: ${ctx.result?.duration}ms`);
      return { analyzed: true, success: ctx.result?.success };
    }, { statusMessage: '分析任务结果' })},
    
    // 工具使用Hooks
    { event: HOOK_EVENTS.PRE_TOOL_USE, pattern: 'Write*', hook: Hooks.custom.function((ctx) => {
      console.log(`   📝 [PreToolUse Hook] 即将写入文件: ${ctx.toolInput?.file}`);
      // 可以在这里进行权限检查、输入验证等
      return { validated: true, file: ctx.toolInput?.file };
    }, { statusMessage: '验证写入操作' })},
    
    { event: HOOK_EVENTS.POST_TOOL_USE, pattern: 'Write*', hook: Hooks.custom.function((ctx) => {
      console.log(`   📝 [PostToolUse Hook] 文件写入完成: ${ctx.toolInput?.file}, 结果: ${ctx.toolInput?.result?.success}`);
      // 可以在这里进行结果验证、日志记录等
      return { verified: true, bytes: ctx.toolInput?.result?.bytes };
    }, { statusMessage: '验证写入结果' })},
    
    { event: HOOK_EVENTS.PRE_TOOL_USE, pattern: 'Bash', hook: Hooks.custom.function((ctx) => {
      console.log(`   💻 [PreToolUse Hook] 即将执行命令: ${ctx.toolInput?.command}`);
      // 安全检查：是否允许执行此命令
      const dangerousCommands = ['rm -rf', 'format c:', 'shutdown'];
      const cmd = ctx.toolInput?.command || '';
      const isDangerous = dangerousCommands.some(d => cmd.includes(d));
      return { isDangerous, allowed: !isDangerous };
    }, { statusMessage: '安全检查' })},
    
    // 记忆系统Hooks
    { event: HOOK_EVENTS.MEMORY_UPDATED, pattern: '*', hook: Hooks.custom.function((ctx) => {
      console.log(`   🧠 [MemoryUpdated Hook] 记忆更新: ${ctx.operation}, 数据: ${JSON.stringify(ctx.data).substring(0, 100)}...`);
      // 可以在这里触发重新索引、关联分析等
      return { processed: true, operation: ctx.operation };
    }, { statusMessage: '处理记忆更新' })},
    
    // 代码质量Hooks（示例）
    { event: HOOK_EVENTS.POST_GENERATION, pattern: 'Write', hook: Hooks.codeQuality.postGeneration('${file}')},
  ];
  
  hooks.forEach(({ event, pattern, hook }) => {
    hooksManager.registerHook(event, pattern, hook);
    console.log(`   ✅ 注册Hook: ${event} (模式: ${pattern})`);
  });
  
  console.log('\n3. 🔗 集成Hooks系统:\n');
  
  // 集成Hooks到Coordinator
  coordinator.integrateHooks(hooksManager);
  
  console.log('\n4. 🚀 运行任务演示:\n');
  
  // 演示1: 处理一个开发任务
  console.log('演示1: 开发API端点');
  await coordinator.processTask('开发用户认证API端点');
  
  // 演示2: 处理一个维护任务
  console.log('\n\n演示2: 修复Bug');
  await coordinator.processTask('修复登录页面CSS问题');
  
  // 演示3: 处理一个部署任务
  console.log('\n\n演示3: 部署应用');
  await coordinator.processTask('部署应用到生产环境');
  
  console.log('\n5. 📊 系统状态:\n');
  
  // 显示Coordinator状态
  const coordinatorStatus = coordinator.getStatus();
  console.log('Coordinator状态:');
  console.log(`   - 名称: ${coordinatorStatus.name}`);
  console.log(`   - 版本: ${coordinatorStatus.version}`);
  console.log(`   - 处理任务数: ${coordinatorStatus.tasks}`);
  console.log(`   - Hooks集成: ${coordinatorStatus.hooksIntegrated ? '✅ 已集成' : '❌ 未集成'}`);
  console.log(`   - 监听事件: ${coordinatorStatus.listeners.join(', ')}`);
  
  // 显示Hooks统计
  const hooksStats = hooksManager.getStats();
  console.log('\nHooks统计:');
  console.log(`   - 总执行数: ${hooksStats.totalExecuted}`);
  console.log(`   - 成功率: ${hooksStats.successRate}`);
  console.log(`   - 平均时间: ${hooksStats.avgTime.toFixed(2)}ms`);
  
  console.log('\n6. 🔍 Hook执行详情:\n');
  
  // 模拟一些特定事件以展示Hook执行
  console.log('手动触发额外事件:');
  
  // 触发PreCommit事件
  console.log('\na) 触发 PreCommit 事件:');
  const preCommitResult = await hooksManager.trigger(
    HOOK_EVENTS.PRE_COMMIT,
    'Git',
    { files: ['src/**/*.js', 'test/**/*.js'], branch: 'main' }
  );
  console.log(`   执行了 ${preCommitResult.executed} 个Hook`);
  
  // 触发GatewayStart事件
  console.log('\nb) 触发 GatewayStart 事件:');
  const gatewayResult = await hooksManager.trigger(
    HOOK_EVENTS.GATEWAY_START,
    'Gateway',
    { port: 20001, version: '4.12.0' }
  );
  console.log(`   执行了 ${gatewayResult.executed} 个Hook`);
  
  // 触发FileChanged事件
  console.log('\nc) 触发 FileChanged 事件:');
  const fileChangedResult = await hooksManager.trigger(
    HOOK_EVENTS.FILE_CHANGED,
    'Write',
    { file: 'src/components/Button.js', operation: 'update' }
  );
  console.log(`   执行了 ${fileChangedResult.executed} 个Hook`);
  
  console.log('\n=== 集成演示完成 ===\n');
  
  return {
    success: true,
    coordinator: coordinatorStatus,
    hooks: hooksStats,
    summary: {
      totalTasks: coordinatorStatus.tasks,
      totalHooksExecuted: hooksStats.totalExecuted,
      successRate: hooksStats.successRate
    }
  };
}

// 运行演示
runIntegrationDemo().then(result => {
  console.log('🎉 演示总结:');
  console.log(`   - 处理任务数: ${result.summary.totalTasks}`);
  console.log(`   - Hook执行数: ${result.summary.totalHooksExecuted}`);
  console.log(`   - 成功率: ${result.summary.successRate}`);
  console.log('\n✅ Hooks系统原型已成功集成到VCPCoordinator!');
  console.log('\n📋 下一步:');
  console.log('   1. 将Hooks系统集成到真实的VCPCoordinator中');
  console.log('   2. 添加配置文件支持');
  console.log('   3. 实现更多的Hook类型（HTTP, Agent等）');
  console.log('   4. 添加Web控制台可视化');
  
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 演示失败:', error);
  process.exit(1);
});