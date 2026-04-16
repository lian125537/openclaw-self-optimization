import { HOOK_EVENTS, HooksConfig, BashCommandHook, PromptHook, CustomHook } from './types.js';
import { HookEngine } from './HookEngine.js';

export class HooksManager {
  constructor(options = {}) {
    this.options = {
      autoLoadConfig: true,
      configPath: '.openclaw/hooks.json',
      ...options
    };
    
    this.config = new HooksConfig();
    this.engine = new HookEngine(options.engine);
    this.context = {}; // 全局上下文
    
    this._eventListeners = new Map();
    
    // 初始化默认Hooks
    this._initializeDefaultHooks();
    
    if (this.options.autoLoadConfig) {
      this.loadConfig().catch(err => {
        console.warn('[HooksManager] Failed to load config:', err.message);
      });
    }
  }
  
  // 初始化一些有用的默认Hooks
  _initializeDefaultHooks() {
    // Gateway启动时自动检查健康状态
    this.registerHook(
      HOOK_EVENTS.GATEWAY_START,
      '*',
      new BashCommandHook('openclaw gateway status', {
        statusMessage: 'Checking Gateway status after startup',
        timeout: 10
      })
    );
    
    // 代码生成后自动运行测试（示例）
    this.registerHook(
      HOOK_EVENTS.POST_GENERATION,
      'Write',
      new BashCommandHook('npm test -- --related ${file}', {
        statusMessage: 'Running tests for generated code',
        async: true // 异步执行，不阻塞
      })
    );
    
    // 文件变更时自动格式化（示例）
    this.registerHook(
      HOOK_EVENTS.FILE_CHANGED,
      'Write',
      new CustomHook(async (context) => {
        if (context.file && context.file.endsWith('.js')) {
          // 模拟格式化操作
          console.log(`[HooksManager] Formatting ${context.file}`);
          return { formatted: true, file: context.file };
        }
        return { skipped: 'Not a JavaScript file' };
      }, {
        statusMessage: 'Auto-formatting changed file'
      })
    );
    
    // 提交前代码质量检查（示例）
    this.registerHook(
      HOOK_EVENTS.PRE_COMMIT,
      '*',
      new BashCommandHook('npm run lint && npm run test', {
        statusMessage: 'Pre-commit quality checks',
        timeout: 120
      })
    );
  }
  
  // 注册Hook（简化接口）
  registerHook(event, pattern, hook) {
    return this.config.addHook(event, pattern, [hook]);
  }
  
  // 触发事件，执行匹配的Hooks
  async trigger(event, toolName = '', toolInput = {}, extraContext = {}) {
    const context = {
      ...this.context,
      ...extraContext,
      event,
      toolName,
      toolInput,
      timestamp: new Date().toISOString()
    };
    
    // 获取匹配的Hooks
    const hooks = this.config.getHooksForEvent(event, toolName, toolInput);
    
    if (hooks.length === 0) {
      return { triggered: false, event, matchedHooks: 0 };
    }
    
    console.log(`[HooksManager] Triggering ${event}, matched ${hooks.length} hook(s)`);
    
    // 调用事件监听器（pre-trigger）
    await this._callEventListeners('beforeTrigger', { event, hooks, context });
    
    // 执行Hooks
    const results = await this.engine.executeHooks(hooks, context);
    
    // 调用事件监听器（post-trigger）
    await this._callEventListeners('afterTrigger', { event, hooks, context, results });
    
    // 清理once标记的Hooks
    this._cleanupOnceHooks(event, hooks, results);
    
    return {
      triggered: true,
      event,
      matchedHooks: hooks.length,
      executed: results.length,
      results
    };
  }
  
  // 清理once标记的Hooks
  _cleanupOnceHooks(event, hooks, results) {
    const hooksToRemove = [];
    
    hooks.forEach((hook, index) => {
      if (hook.config.once && results[index] && results[index].success) {
        hooksToRemove.push({ hook, index });
      }
    });
    
    // 简化实现：在实际系统中需要从配置中移除
    if (hooksToRemove.length > 0) {
      console.log(`[HooksManager] Removing ${hooksToRemove.length} once hook(s) after execution`);
    }
  }
  
  // 添加事件监听器
  on(eventType, listener) {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, []);
    }
    this._eventListeners.get(eventType).push(listener);
    return this;
  }
  
  // 移除事件监听器
  off(eventType, listener) {
    if (!this._eventListeners.has(eventType)) return this;
    
    const listeners = this._eventListeners.get(eventType);
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    
    return this;
  }
  
  // 调用事件监听器
  async _callEventListeners(eventType, data) {
    if (!this._eventListeners.has(eventType)) return;
    
    const listeners = this._eventListeners.get(eventType);
    for (const listener of listeners) {
      try {
        await listener(data);
      } catch (error) {
        console.error(`[HooksManager] Event listener error (${eventType}):`, error);
      }
    }
  }
  
  // 设置全局上下文
  setContext(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.context, key);
    } else {
      this.context[key] = value;
    }
    return this;
  }
  
  // 获取全局上下文
  getContext(key) {
    return key ? this.context[key] : { ...this.context };
  }
  
  // 加载配置文件
  async loadConfig(filePath = this.options.configPath) {
    console.log(`[HooksManager] Loading config from ${filePath}`);
    
    // 简化实现：实际应该从文件系统读取
    // 这里返回模拟配置
    const mockConfig = {
      version: '1.0',
      hooks: {
        [HOOK_EVENTS.PRE_COMMIT]: [
          {
            pattern: '*',
            hooks: [
              {
                type: 'command',
                command: 'npm run lint',
                statusMessage: 'Running linter before commit'
              }
            ]
          }
        ]
      }
    };
    
    // 应用配置
    this._applyConfig(mockConfig);
    
    return mockConfig;
  }
  
  // 保存配置到文件
  async saveConfig(filePath = this.options.configPath) {
    console.log(`[HooksManager] Saving config to ${filePath}`);
    
    const config = this.toJSON();
    
    // 简化实现：实际应该写入文件系统
    // 这里只是记录日志
    console.log('[HooksManager] Config would be saved:', JSON.stringify(config, null, 2));
    
    return config;
  }
  
  // 应用配置
  _applyConfig(config) {
    // 这里应该实现从JSON配置恢复HooksConfig
    // 简化实现：只记录日志
    console.log('[HooksManager] Applying config:', config.version);
    return this;
  }
  
  // 导出为JSON
  toJSON() {
    // 简化实现：实际应该序列化配置
    return {
      version: '1.0',
      hooks: {},
      stats: this.engine.getStats()
    };
  }
  
  // 获取统计信息
  getStats() {
    return this.engine.getStats();
  }
  
  // 集成到VCPCoordinator的便捷方法
  static integrateWithCoordinator(coordinator, hooksManager) {
    // 监听Coordinator事件并触发Hooks
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
    
    console.log('[HooksManager] Integrated with Coordinator');
    return hooksManager;
  }
}