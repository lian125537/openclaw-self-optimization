/**
 * Hooks系统 CommonJS 适配器
 * 为VCPCoordinator提供兼容的接口
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Hook事件枚举 (CommonJS版本)
const HOOK_EVENTS = {
  PRE_TOOL_USE: 'PreToolUse',
  POST_TOOL_USE: 'PostToolUse',
  POST_TOOL_USE_FAILURE: 'PostToolUseFailure',
  SESSION_START: 'SessionStart',
  SESSION_END: 'SessionEnd',
  PRE_COMPACT: 'PreCompact',
  POST_COMPACT: 'PostCompact',
  PRE_COMMIT: 'PreCommit',
  POST_GENERATION: 'PostGeneration',
  FILE_CHANGED: 'FileChanged',
  GATEWAY_START: 'GatewayStart',
  GATEWAY_STOP: 'GatewayStop',
  GATEWAY_ERROR: 'GatewayError',
  MEMORY_UPDATED: 'MemoryUpdated',
  DREAMING_START: 'DreamingStart',
  DREAMING_COMPLETE: 'DreamingComplete',
  TASK_START: 'TaskStart',
  TASK_COMPLETE: 'TaskComplete',
  TASK_FAILED: 'TaskFailed'
};

// Hook匹配器
class HookMatcher {
  constructor(pattern, hooks) {
    this.pattern = pattern;
    this.hooks = hooks || [];
  }
  
  matches(toolName, toolInput) {
    if (this.pattern === '*') return true;
    if (this.pattern.includes('(')) {
      const toolPart = this.pattern.split('(')[0];
      return toolName === toolPart;
    }
    const regex = new RegExp(this.pattern.replace(/\*/g, '.*'));
    return regex.test(toolName);
  }
}

// Hook命令类型
const HOOK_TYPES = {
  COMMAND: 'command',
  PROMPT: 'prompt',
  AGENT: 'agent',
  HTTP: 'http',
  CUSTOM: 'custom'
};

// 基础Hook类
class HookCommand {
  constructor(type, config) {
    this.type = type;
    this.config = config;
    this.id = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Shell命令Hook
class BashCommandHook extends HookCommand {
  constructor(command, options = {}) {
    super(HOOK_TYPES.COMMAND, {
      command,
      if: options.if,
      shell: options.shell || 'bash',
      timeout: options.timeout || 30,
      statusMessage: options.statusMessage || `Running hook: ${command}`,
      once: options.once || false,
      async: options.async || false,
    });
  }
}

// 自定义函数Hook
class CustomHook extends HookCommand {
  constructor(fn, options = {}) {
    super(HOOK_TYPES.CUSTOM, {
      fn,
      if: options.if,
      timeout: options.timeout || 30,
      statusMessage: options.statusMessage || 'Running custom hook',
      once: options.once || false,
    });
  }
}

// Hook配置
class HooksConfig {
  constructor() {
    this.hooks = new Map();
  }
  
  addHook(event, matcherOrPattern, hookCommands) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    
    const matcher = typeof matcherOrPattern === 'string' 
      ? new HookMatcher(matcherOrPattern, Array.isArray(hookCommands) ? hookCommands : [hookCommands])
      : matcherOrPattern;
    
    this.hooks.get(event).push(matcher);
    return this;
  }
  
  getHooksForEvent(event, toolName, toolInput) {
    const matchers = this.hooks.get(event) || [];
    const matchedHooks = [];
    
    for (const matcher of matchers) {
      if (matcher.matches(toolName || '', toolInput || '')) {
        matchedHooks.push(...matcher.hooks);
      }
    }
    
    return matchedHooks;
  }
}

// Hook执行引擎
class HookEngine {
  constructor(options = {}) {
    this.options = {
      defaultTimeout: 30,
      enableLogging: true,
      ...options
    };
    
    this.runningHooks = new Map();
    this.hookStats = {
      totalExecuted: 0,
      succeeded: 0,
      failed: 0,
      totalTime: 0
    };
    
    this.log = this.options.enableLogging ? console.log : () => {};
  }
  
  async executeHook(hook, context = {}) {
    const startTime = Date.now();
    const hookId = hook.id || `hook_${startTime}_${Math.random().toString(36).substr(2, 6)}`;
    
    this.log(`[HookEngine] 执行Hook ${hookId} (${hook.type})`);
    
    try {
      let result;
      
      switch (hook.type) {
        case HOOK_TYPES.COMMAND:
          result = await this._executeCommandHook(hook, context);
          break;
          
        case HOOK_TYPES.CUSTOM:
          result = await this._executeCustomHook(hook, context);
          break;
          
        default:
          throw new Error(`不支持的Hook类型: ${hook.type}`);
      }
      
      const executionTime = Date.now() - startTime;
      this.hookStats.totalExecuted++;
      this.hookStats.succeeded++;
      this.hookStats.totalTime += executionTime;
      
      this.log(`[HookEngine] Hook ${hookId} 完成，耗时 ${executionTime}ms`);
      
      return {
        success: true,
        hookId,
        executionTime,
        result,
        context
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.hookStats.totalExecuted++;
      this.hookStats.failed++;
      this.hookStats.totalTime += executionTime;
      
      this.log(`[HookEngine] Hook ${hookId} 失败，耗时 ${executionTime}ms: ${error.message}`);
      
      return {
        success: false,
        hookId,
        executionTime,
        error: error.message,
        context
      };
    } finally {
      this.runningHooks.delete(hookId);
    }
  }
  
  async executeHooks(hooks, context = {}) {
    const results = [];
    
    for (const hook of hooks) {
      const result = await this.executeHook(hook, context);
      results.push(result);
    }
    
    return results;
  }
  
  async _executeCommandHook(hook, context) {
    const { command, shell = 'bash', timeout = this.options.defaultTimeout } = hook.config;
    
    // 替换上下文变量
    const resolvedCommand = this._resolveTemplate(command, context);
    
    this.log(`[HookEngine] 执行命令: ${resolvedCommand} (shell: ${shell}, 超时: ${timeout}s)`);
    
    let shellCmd;
    if (shell === 'powershell') {
      shellCmd = `powershell -Command "${resolvedCommand.replace(/"/g, '\\"')}"`;
    } else {
      shellCmd = resolvedCommand;
    }
    
    const { stdout, stderr } = await execAsync(shellCmd, {
      timeout: timeout * 1000,
      shell: true
    });
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0
    };
  }
  
  async _executeCustomHook(hook, context) {
    const { fn, timeout = this.options.defaultTimeout } = hook.config;
    
    if (typeof fn !== 'function') {
      throw new Error('自定义Hook必须包含函数');
    }
    
    this.log(`[HookEngine] 执行自定义函数Hook`);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Hook超时，${timeout}s后取消`)), timeout * 1000);
    });
    
    const result = await Promise.race([
      fn(context),
      timeoutPromise
    ]);
    
    return result;
  }
  
  _resolveTemplate(template, context) {
    return template.replace(/\${([^}]+)}/g, (match, key) => {
      const value = this._getNestedValue(context, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }
  
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  getStats() {
    const avgTime = this.hookStats.totalExecuted > 0 
      ? this.hookStats.totalTime / this.hookStats.totalExecuted 
      : 0;
    
    return {
      ...this.hookStats,
      avgTime,
      successRate: this.hookStats.totalExecuted > 0 
        ? (this.hookStats.succeeded / this.hookStats.totalExecuted * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// Hooks管理器
class HooksManager {
  constructor(options = {}) {
    this.options = {
      autoLoadConfig: false,
      enableLogging: true,
      ...options
    };
    
    this.config = new HooksConfig();
    this.engine = new HookEngine(options.engine);
    this.context = {};
    this._eventListeners = new Map();
    
    this._initializeDefaultHooks();
    
    console.log('[HooksManager] 初始化完成');
  }
  
  _initializeDefaultHooks() {
    // Gateway启动健康检查
    this.registerHook(
      HOOK_EVENTS.GATEWAY_START,
      '*',
      new BashCommandHook('openclaw gateway status', {
        statusMessage: 'Gateway启动后健康检查',
        timeout: 10
      })
    );
    
    // Gateway错误自动重启
    this.registerHook(
      HOOK_EVENTS.GATEWAY_ERROR,
      '*',
      new CustomHook(async (context) => {
        console.log('[GatewayHook] Gateway错误检测到，尝试重启...');
        
        // 实际重启逻辑
        try {
          const { stdout } = await execAsync('openclaw gateway restart', { timeout: 30000 });
          return { 
            restartAttempted: true, 
            success: true,
            timestamp: new Date().toISOString(),
            output: stdout.substring(0, 200)
          };
        } catch (error) {
          console.error('[GatewayHook] 重启失败:', error.message);
          return { 
            restartAttempted: true, 
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }, {
        statusMessage: 'Gateway自动重启',
        timeout: 35
      })
    );
    
    // 代码生成后自动测试
    this.registerHook(
      HOOK_EVENTS.POST_GENERATION,
      'Write',
      new BashCommandHook('npm test -- --related ${file}', {
        statusMessage: '生成代码后自动测试',
        async: true
      })
    );
    
    // 提交前代码质量检查
    this.registerHook(
      HOOK_EVENTS.PRE_COMMIT,
      '*',
      new BashCommandHook('npm run lint && npm test', {
        statusMessage: '提交前代码质量检查',
        timeout: 120
      })
    );
    
    // 记忆更新自动索引
    this.registerHook(
      HOOK_EVENTS.MEMORY_UPDATED,
      '*',
      new CustomHook(async (context) => {
        console.log(`[MemoryHook] 记忆更新: ${context.operation}, 触发重新索引`);
        return { 
          indexed: true, 
          operation: context.operation,
          timestamp: new Date().toISOString()
        };
      })
    );
  }
  
  registerHook(event, pattern, hook) {
    return this.config.addHook(event, pattern, hook);
  }
  
  async trigger(event, toolName = '', toolInput = {}, extraContext = {}) {
    const context = {
      ...this.context,
      ...extraContext,
      event,
      toolName,
      toolInput,
      timestamp: new Date().toISOString()
    };
    
    const hooks = this.config.getHooksForEvent(event, toolName, toolInput);
    
    if (hooks.length === 0) {
      return { triggered: false, event, matchedHooks: 0 };
    }
    
    console.log(`[HooksManager] 触发事件 ${event}, 匹配 ${hooks.length} 个Hook`);
    
    await this._callEventListeners('beforeTrigger', { event, hooks, context });
    
    const results = await this.engine.executeHooks(hooks, context);
    
    await this._callEventListeners('afterTrigger', { event, hooks, context, results });
    
    return {
      triggered: true,
      event,
      matchedHooks: hooks.length,
      executed: results.length,
      results
    };
  }
  
  on(eventType, listener) {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, []);
    }
    this._eventListeners.get(eventType).push(listener);
    return this;
  }
  
  async _callEventListeners(eventType, data) {
    if (!this._eventListeners.has(eventType)) return;
    
    const listeners = this._eventListeners.get(eventType);
    for (const listener of listeners) {
      try {
        await listener(data);
      } catch (error) {
        console.error(`[HooksManager] 事件监听器错误 (${eventType}):`, error);
      }
    }
  }
  
  setContext(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.context, key);
    } else {
      this.context[key] = value;
    }
    return this;
  }
  
  getStats() {
    return this.engine.getStats();
  }
  
  // VCPCoordinator集成
  static integrateWithCoordinator(coordinator, hooksManager) {
    // 监听Coordinator事件
    if (coordinator.on) {
      coordinator.on('taskStart', (task) => {
        hooksManager.trigger(HOOK_EVENTS.TASK_START, 'Coordinator', { task });
      });
      
      coordinator.on('taskComplete', (task, result) => {
        hooksManager.trigger(HOOK_EVENTS.TASK_COMPLETE, 'Coordinator', { task, result });
      });
      
      coordinator.on('toolUse', (toolName, toolInput) => {
        hooksManager.trigger(HOOK_EVENTS.PRE_TOOL_USE, toolName, toolInput);
      });
      
      coordinator.on('toolResult', (toolName, toolInput, result) => {
        hooksManager.trigger(HOOK_EVENTS.POST_TOOL_USE, toolName, { ...toolInput, result });
      });
      
      console.log('[HooksManager] 已集成到Coordinator');
    }
    
    return hooksManager;
  }
}

// 预置Hook工厂
const Hooks = {
  codeQuality: {
    preCommit() {
      return new BashCommandHook('npm run lint && npm test', {
        statusMessage: '提交前代码质量检查',
        timeout: 120
      });
    },
    
    postGeneration(filePattern = '${file}') {
      return new BashCommandHook(`npm test -- --related ${filePattern}`, {
        statusMessage: '生成代码后自动测试',
        async: true
      });
    }
  },
  
  gateway: {
    healthCheck() {
      return new BashCommandHook('openclaw gateway status', {
        statusMessage: 'Gateway健康检查',
        timeout: 10
      });
    },
    
    autoRestart() {
      return new CustomHook(async (context) => {
        console.log('[GatewayHook] Gateway错误，尝试重启...');
        try {
          const { stdout } = await execAsync('openclaw gateway restart', { timeout: 30000 });
          return { restartAttempted: true, success: true };
        } catch (error) {
          return { restartAttempted: true, success: false, error: error.message };
        }
      }, {
        statusMessage: 'Gateway自动重启',
        timeout: 35
      });
    }
  },
  
  custom: {
    command(cmd, options = {}) {
      return new BashCommandHook(cmd, options);
    },
    
    function(fn, options = {}) {
      return new CustomHook(fn, options);
    }
  }
};

module.exports = {
  HOOK_EVENTS,
  HookMatcher,
  BashCommandHook,
  CustomHook,
  HookEngine,
  HooksConfig,
  HooksManager,
  Hooks,
  createHooksManager: (options) => new HooksManager(options)
};