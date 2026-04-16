// Hook事件类型 - 基于Claude Code的HOOK_EVENTS简化版
export const HOOK_EVENTS = {
  // 工具使用相关
  PRE_TOOL_USE: 'PreToolUse',          // 工具使用前
  POST_TOOL_USE: 'PostToolUse',        // 工具使用后
  POST_TOOL_USE_FAILURE: 'PostToolUseFailure', // 工具使用失败后
  
  // 会话相关
  SESSION_START: 'SessionStart',       // 会话开始
  SESSION_END: 'SessionEnd',           // 会话结束
  
  // 上下文压缩相关
  PRE_COMPACT: 'PreCompact',           // 压缩前
  POST_COMPACT: 'PostCompact',         // 压缩后
  
  // 文件操作相关（用户提到的pre-commit, post-generation, file-save）
  PRE_COMMIT: 'PreCommit',             // 提交前（如代码提交）
  POST_GENERATION: 'PostGeneration',   // 生成后（如AI生成代码）
  FILE_CHANGED: 'FileChanged',         // 文件变更
  
  // Gateway相关（OpenClaw特定）
  GATEWAY_START: 'GatewayStart',       // Gateway启动
  GATEWAY_STOP: 'GatewayStop',         // Gateway停止
  GATEWAY_ERROR: 'GatewayError',       // Gateway错误
  
  // 记忆系统相关
  MEMORY_UPDATED: 'MemoryUpdated',     // 记忆更新
  DREAMING_START: 'DreamingStart',     // Dreaming系统开始
  DREAMING_COMPLETE: 'DreamingComplete', // Dreaming系统完成
  
  // 任务相关
  TASK_START: 'TaskStart',             // 任务开始
  TASK_COMPLETE: 'TaskComplete',       // 任务完成
  TASK_FAILED: 'TaskFailed',           // 任务失败
};

// Hook事件类型
// @typedef {string} HookEvent
// Hook事件类型，取值为 HOOK_EVENTS 中的任意值

// Hook匹配器 - 基于工具名或模式匹配
export class HookMatcher {
  constructor(pattern, hooks) {
    this.pattern = pattern; // 通配符模式，如 "Write*", "Bash(git *)", "*"
    this.hooks = hooks || [];
  }
  
  matches(toolName, toolInput) {
    if (this.pattern === '*') return true;
    if (this.pattern.includes('(')) {
      // 权限规则语法，如 "Bash(git *)"
      // 简化实现：检查工具名是否匹配
      const toolPart = this.pattern.split('(')[0];
      return toolName === toolPart;
    }
    // 通配符匹配
    const regex = new RegExp(this.pattern.replace(/\*/g, '.*'));
    return regex.test(toolName);
  }
}

// Hook命令类型 - 支持多种Hook类型
export const HOOK_TYPES = {
  COMMAND: 'command',      // Shell命令
  PROMPT: 'prompt',        // LLM提示
  AGENT: 'agent',          // Agent代理
  HTTP: 'http',            // HTTP请求
  CUSTOM: 'custom',        // 自定义函数
};

// 基础Hook接口
export class HookCommand {
  constructor(type, config) {
    this.type = type;
    this.config = config;
    this.id = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Shell命令Hook
export class BashCommandHook extends HookCommand {
  constructor(command, options = {}) {
    super(HOOK_TYPES.COMMAND, {
      command,
      if: options.if,           // 条件匹配
      shell: options.shell || 'bash',
      timeout: options.timeout || 30,
      statusMessage: options.statusMessage || `Running hook: ${command}`,
      once: options.once || false,
      async: options.async || false,
    });
  }
}

// LLM提示Hook
export class PromptHook extends HookCommand {
  constructor(prompt, options = {}) {
    super(HOOK_TYPES.PROMPT, {
      prompt,
      if: options.if,
      model: options.model || 'deepseek/deepseek-chat',
      timeout: options.timeout || 60,
      statusMessage: options.statusMessage || 'Running LLM verification hook',
      once: options.once || false,
    });
  }
}

// 自定义函数Hook
export class CustomHook extends HookCommand {
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

// Hook配置 - 事件到匹配器的映射
export class HooksConfig {
  constructor() {
    this.hooks = new Map(); // HookEvent -> HookMatcher[]
  }
  
  addHook(event, matcherOrPattern, hookCommands) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    
    const matcher = typeof matcherOrPattern === 'string' 
      ? new HookMatcher(matcherOrPattern, hookCommands)
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
  
  clearEvent(event) {
    this.hooks.delete(event);
    return this;
  }
  
  clearAll() {
    this.hooks.clear();
    return this;
  }
}