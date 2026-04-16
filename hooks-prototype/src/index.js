// Hooks系统原型主入口
// 基于Claude Code架构移植

export { HOOK_EVENTS } from './types.js';
export { HooksConfig, BashCommandHook, PromptHook, CustomHook } from './types.js';
export { HookEngine } from './HookEngine.js';
export { HooksManager } from './HooksManager.js';

// 默认导出HooksManager
export default class HooksManager {
  // 这里不实现，实际从HooksManager.js导入
  // 这个定义只是为了解决循环导入
  constructor() {
    throw new Error('请从HooksManager.js导入HooksManager类');
  }
}

// 便捷函数：创建预配置的Hooks管理器
export function createHooksManager(options = {}) {
  return new HooksManager(options);
}

// 便捷函数：创建与VCPCoordinator集成的Hooks管理器
export function createIntegratedHooksManager(coordinator, options = {}) {
  const hooksManager = new HooksManager(options);
  HooksManager.integrateWithCoordinator(coordinator, hooksManager);
  return hooksManager;
}

// 内置Hook工厂函数
export const Hooks = {
  // 代码质量Hooks
  codeQuality: {
    preCommit() {
      return new BashCommandHook('npm run lint && npm test', {
        statusMessage: 'Pre-commit code quality checks',
        timeout: 120
      });
    },
    
    postGeneration(filePattern = '${file}') {
      return new BashCommandHook(`npm test -- --related ${filePattern}`, {
        statusMessage: 'Running tests for generated code',
        async: true
      });
    },
    
    autoFormat() {
      return new CustomHook(async (context) => {
        if (context.file) {
          const ext = context.file.split('.').pop();
          const formatters = {
            js: 'npx prettier --write',
            ts: 'npx prettier --write',
            json: 'npx prettier --write',
            md: 'npx prettier --write'
          };
          
          if (formatters[ext]) {
            console.log(`[AutoFormat] Formatting ${context.file}`);
            // 实际应该执行格式化命令
            return { formatted: true, file: context.file, formatter: formatters[ext] };
          }
        }
        return { skipped: 'No formatter available for file type' };
      }, {
        statusMessage: 'Auto-formatting changed files'
      });
    }
  },
  
  // Gateway健康检查Hooks
  gateway: {
    healthCheck() {
      return new BashCommandHook('openclaw gateway status', {
        statusMessage: 'Gateway health check',
        timeout: 10
      });
    },
    
    autoRestart() {
      return new CustomHook(async (context) => {
        if (context.event === 'GatewayError') {
          console.log('[GatewayHook] Gateway error detected, attempting restart...');
          // 实际应该执行重启命令
          return { restartAttempted: true, timestamp: new Date().toISOString() };
        }
        return { skipped: 'Not a gateway error event' };
      }, {
        statusMessage: 'Gateway auto-restart monitor'
      });
    }
  },
  
  // 记忆系统Hooks
  memory: {
    autoIndex() {
      return new CustomHook(async (context) => {
        if (context.event === 'MemoryUpdated') {
          console.log('[MemoryHook] Memory updated, triggering re-indexing...');
          // 实际应该触发记忆索引
          return { indexed: true, timestamp: new Date().toISOString() };
        }
        return { skipped: 'Not a memory update event' };
      });
    },
    
    dreamingComplete() {
      return new PromptHook(
        '分析刚刚完成的记忆整合(Dreaming)结果，总结关键洞察和改进建议。上下文：${context}',
        {
          model: 'deepseek/deepseek-chat',
          statusMessage: 'Analyzing dreaming results'
        }
      );
    }
  },
  
  // 自定义Hooks
  custom: {
    command(cmd, options = {}) {
      return new BashCommandHook(cmd, options);
    },
    
    prompt(promptText, options = {}) {
      return new PromptHook(promptText, options);
    },
    
    function(fn, options = {}) {
      return new CustomHook(fn, options);
    }
  }
};

// 版本信息
export const VERSION = '1.0.0-prototype';
export const DESCRIPTION = 'OpenClaw Hooks System Prototype - Based on Claude Code Architecture';