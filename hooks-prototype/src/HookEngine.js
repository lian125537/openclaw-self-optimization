import { exec } from 'child_process';
import { promisify } from 'util';
import { HOOK_TYPES } from './types.js';

const execAsync = promisify(exec);

export class HookEngine {
  constructor(options = {}) {
    this.options = {
      defaultTimeout: 30, // 默认超时时间（秒）
      enableLogging: true,
      ...options
    };
    
    this.runningHooks = new Map(); // hookId -> { promise, startTime }
    this.hookStats = {
      totalExecuted: 0,
      succeeded: 0,
      failed: 0,
      totalTime: 0
    };
    
    this.log = this.options.enableLogging ? console.log : () => {};
  }
  
  // 执行单个Hook
  async executeHook(hook, context = {}) {
    const startTime = Date.now();
    const hookId = hook.id || `hook_${startTime}_${Math.random().toString(36).substr(2, 6)}`;
    
    this.log(`[HookEngine] Executing hook ${hookId} (${hook.type})`);
    
    try {
      let result;
      
      switch (hook.type) {
        case HOOK_TYPES.COMMAND:
          result = await this._executeCommandHook(hook, context);
          break;
          
        case HOOK_TYPES.PROMPT:
          result = await this._executePromptHook(hook, context);
          break;
          
        case HOOK_TYPES.CUSTOM:
          result = await this._executeCustomHook(hook, context);
          break;
          
        default:
          throw new Error(`Unsupported hook type: ${hook.type}`);
      }
      
      const executionTime = Date.now() - startTime;
      this.hookStats.totalExecuted++;
      this.hookStats.succeeded++;
      this.hookStats.totalTime += executionTime;
      
      this.log(`[HookEngine] Hook ${hookId} completed in ${executionTime}ms`);
      
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
      
      this.log(`[HookEngine] Hook ${hookId} failed after ${executionTime}ms: ${error.message}`);
      
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
  
  // 批量执行Hooks（按顺序）
  async executeHooks(hooks, context = {}) {
    const results = [];
    
    for (const hook of hooks) {
      const result = await this.executeHook(hook, context);
      results.push(result);
      
      // 如果hook配置了once，执行后应该被移除
      // 这里由调用方处理，我们只返回结果
    }
    
    return results;
  }
  
  // 执行Shell命令Hook
  async _executeCommandHook(hook, context) {
    const { command, shell = 'bash', timeout = this.options.defaultTimeout } = hook.config;
    
    // 替换上下文变量，如 ${file} -> context.file
    const resolvedCommand = this._resolveTemplate(command, context);
    
    this.log(`[HookEngine] Running command: ${resolvedCommand} (shell: ${shell}, timeout: ${timeout}s)`);
    
    let shellCmd;
    if (shell === 'powershell') {
      shellCmd = `powershell -Command "${resolvedCommand.replace(/"/g, '\\"')}"`;
    } else {
      // bash/sh
      shellCmd = resolvedCommand;
    }
    
    const { stdout, stderr } = await execAsync(shellCmd, {
      timeout: timeout * 1000,
      shell: true
    });
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0 // execAsync成功时exitCode为0
    };
  }
  
  // 执行LLM提示Hook（简化版，实际需要调用LLM API）
  async _executePromptHook(hook, context) {
    const { prompt, model = 'deepseek/deepseek-chat', timeout = 60 } = hook.config;
    
    // 替换上下文变量
    const resolvedPrompt = this._resolveTemplate(prompt, context);
    
    this.log(`[HookEngine] Running LLM hook with model ${model}`);
    this.log(`[HookEngine] Prompt: ${resolvedPrompt.substring(0, 200)}${resolvedPrompt.length > 200 ? '...' : ''}`);
    
    // 简化实现：在实际系统中，这里应该调用LLM API
    // 现在模拟一个简单的响应
    return {
      model,
      prompt: resolvedPrompt,
      response: `[模拟LLM响应] 已处理提示，上下文: ${JSON.stringify(context).substring(0, 100)}...`,
      tokensUsed: 42
    };
  }
  
  // 执行自定义函数Hook
  async _executeCustomHook(hook, context) {
    const { fn, timeout = this.options.defaultTimeout } = hook.config;
    
    if (typeof fn !== 'function') {
      throw new Error('Custom hook must have a function');
    }
    
    this.log(`[HookEngine] Running custom function hook`);
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Hook timeout after ${timeout}s`)), timeout * 1000);
    });
    
    const result = await Promise.race([
      fn(context),
      timeoutPromise
    ]);
    
    return result;
  }
  
  // 解析模板字符串，替换${variable}为上下文值
  _resolveTemplate(template, context) {
    return template.replace(/\${([^}]+)}/g, (match, key) => {
      const value = this._getNestedValue(context, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }
  
  // 获取嵌套对象值
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  // 获取统计信息
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
  
  // 取消正在运行的Hook
  cancelHook(hookId) {
    // 简化实现：在实际系统中应该终止进程
    if (this.runningHooks.has(hookId)) {
      this.log(`[HookEngine] Cancelling hook ${hookId}`);
      // 这里可以添加实际的取消逻辑
      return true;
    }
    return false;
  }
  
  // 清理
  cleanup() {
    this.runningHooks.clear();
    this.log('[HookEngine] Cleaned up');
  }
}