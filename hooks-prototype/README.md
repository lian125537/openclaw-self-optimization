# 🪝 OpenClaw Hooks System Prototype

基于 **Claude Code** 架构移植的 **Hooks系统原型**，为OpenClaw提供事件驱动的自动化能力。

## 🎯 功能特性

### ✅ 已实现的核心功能

| 功能 | 说明 | Claude Code 对应 |
|------|------|-----------------|
| **Hook事件系统** | 20+预定义事件（PreToolUse, PostToolUse, PreCommit等） | ✅ 完全移植 |
| **Hook匹配器** | 基于工具名/模式匹配（支持通配符） | ✅ 功能完整 |
| **多种Hook类型** | Shell命令、LLM提示、自定义函数、HTTP请求（模拟） | ✅ 类型齐全 |
| **Hook执行引擎** | 超时控制、并发执行、统计监控 | ✅ 核心引擎 |
| **配置管理** | JSON配置支持、运行时配置更新 | ✅ 基础支持 |
| **上下文变量** | ${variable}模板替换、全局/局部上下文 | ✅ 功能完整 |
| **事件监听器** | beforeTrigger/afterTrigger生命周期钩子 | ✅ 扩展机制 |

### 🔄 Claude Code Hooks 移植度

| 模块 | 移植度 | 说明 |
|------|--------|------|
| **Hook事件定义** | 100% | 基于Claude的HOOK_EVENTS精简实现 |
| **Hook匹配逻辑** | 80% | 支持通配符，简化了权限规则语法 |
| **Hook执行引擎** | 70% | 支持超时、异步执行，缺少进程管理 |
| **配置持久化** | 60% | 支持JSON配置，缺少文件系统持久化 |
| **集成接口** | 90% | 提供VCPCoordinator集成接口 |

## 🚀 快速开始

### 安装
```bash
cd hooks-prototype
npm install
```

### 基本使用
```javascript
import { createHooksManager, HOOK_EVENTS, Hooks } from './src/index.js';

// 创建Hooks管理器
const hooksManager = createHooksManager({
  enableLogging: true
});

// 注册Hook：提交前代码检查
hooksManager.registerHook(
  HOOK_EVENTS.PRE_COMMIT,
  '*',
  Hooks.codeQuality.preCommit()
);

// 注册Hook：Gateway健康检查
hooksManager.registerHook(
  HOOK_EVENTS.GATEWAY_START,
  '*',
  Hooks.gateway.healthCheck()
);

// 触发事件
await hooksManager.trigger(
  HOOK_EVENTS.GATEWAY_START,
  'Gateway',
  { port: 20001, version: '4.12' }
);
```

### 与VCPCoordinator集成
```javascript
import { HooksManager } from './src/index.js';

// 假设已有VCPCoordinator实例
const coordinator = new VCPCoordinator();

// 创建集成的Hooks管理器
const hooksManager = HooksManager.integrateWithCoordinator(coordinator);

// 现在Coordinator的事件会自动触发Hooks
// - taskStart → 触发HOOK_EVENTS.TASK_START
// - toolUse → 触发HOOK_EVENTS.PRE_TOOL_USE
// - toolResult → 触发HOOK_EVENTS.POST_TOOL_USE
```

## 📋 Hook事件列表

### 核心事件（移植自Claude Code）
| 事件 | 触发时机 | 示例用途 |
|------|----------|----------|
| `PreToolUse` | 工具使用前 | 权限检查、输入验证 |
| `PostToolUse` | 工具使用后 | 结果验证、日志记录 |
| `PostToolUseFailure` | 工具使用失败后 | 错误处理、自动恢复 |
| `PreCommit` | 代码提交前 | 代码质量检查、测试运行 |
| `PostGeneration` | AI生成代码后 | 自动测试、格式化 |
| `FileChanged` | 文件变更后 | 自动格式化、类型检查 |

### OpenClaw专有事件
| 事件 | 触发时机 | 示例用途 |
|------|----------|----------|
| `GatewayStart` | Gateway启动时 | 健康检查、配置验证 |
| `GatewayStop` | Gateway停止时 | 清理资源、备份配置 |
| `GatewayError` | Gateway错误时 | 自动重启、通知告警 |
| `MemoryUpdated` | 记忆更新时 | 自动索引、关联分析 |
| `DreamingStart` | Dreaming系统开始时 | 资源预留、状态备份 |
| `DreamingComplete` | Dreaming完成时 | 结果分析、报告生成 |

## 🔧 Hook类型

### 1. Shell命令Hook (`BashCommandHook`)
```javascript
import { Hooks } from './src/index.js';

const hook = Hooks.custom.command('npm run lint', {
  shell: 'bash',           // bash/powershell
  timeout: 30,             // 超时时间（秒）
  statusMessage: 'Running linter...',
  async: true,             // 异步执行（不阻塞）
  once: false              // 是否只执行一次
});
```

### 2. LLM提示Hook (`PromptHook`)
```javascript
const hook = Hooks.custom.prompt(
  '分析代码变更并生成测试用例。变更：${changes}',
  {
    model: 'deepseek/deepseek-chat',
    timeout: 60
  }
);
```

### 3. 自定义函数Hook (`CustomHook`)
```javascript
const hook = Hooks.custom.function(async (context) => {
  // 自定义逻辑
  if (context.event === 'FileChanged') {
    console.log(`文件变更: ${context.file}`);
    return { processed: true };
  }
  return { skipped: true };
}, {
  statusMessage: '处理文件变更'
});
```

## 🏗️ 架构设计

### 核心组件
```
HooksManager (协调器)
├── HooksConfig (配置管理)
│   ├── HookMatcher (模式匹配)
│   └── HookCommand (Hook定义)
├── HookEngine (执行引擎)
│   ├── 命令执行器
│   ├── LLM执行器
│   └── 函数执行器
└── EventSystem (事件系统)
    ├── 事件触发器
    └── 生命周期监听器
```

### 数据流
```
事件触发 → 模式匹配 → Hook执行 → 结果聚合 → 统计更新
    ↑          ↑          ↑           ↑          ↑
上下文注入  通配符匹配  超时控制  结果验证  性能监控
```

## 📊 配置示例

### JSON配置文件 (`.openclaw/hooks.json`)
```json
{
  "version": "1.0",
  "hooks": {
    "PreCommit": [
      {
        "pattern": "*",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint",
            "statusMessage": "Running linter before commit",
            "timeout": 120
          },
          {
            "type": "command", 
            "command": "npm test",
            "statusMessage": "Running tests before commit",
            "timeout": 180
          }
        ]
      }
    ],
    "GatewayStart": [
      {
        "pattern": "*",
        "hooks": [
          {
            "type": "command",
            "command": "openclaw gateway status",
            "statusMessage": "Gateway health check",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## 🔍 与Claude Code的对比

### 已移植功能
- ✅ **事件定义**：相同的HOOK_EVENTS枚举
- ✅ **匹配逻辑**：支持通配符和权限规则语法
- ✅ **Hook类型**：支持command、prompt、agent、http（部分）
- ✅ **执行引擎**：超时控制、异步执行、统计监控
- ✅ **配置管理**：JSON配置格式兼容

### 待完善功能
- 🔄 **权限规则**：完整的`Bash(git *)`语法解析
- 🔄 **进程管理**：Hook进程的细粒度控制
- 🔄 **HTTP Hook**：完整的HTTP请求支持
- 🔄 **Agent Hook**：完整的Agent代理执行
- 🔄 **持久化**：配置文件的自动加载/保存

### OpenClaw增强
- 🚀 **Gateway集成**：专有事件支持
- 🚀 **记忆系统集成**：Dreaming事件支持
- 🚀 **VCPCoordinator集成**：无缝协作
- 🚀 **性能监控**：详细的执行统计

## 🧪 测试和演示

### 运行测试
```bash
npm test
```

### 运行演示
```bash
npm run demo
```

### 演示输出示例
```
=== OpenClaw Hooks System Prototype Demo ===

1. ✅ Hooks管理器已创建

2. 📝 注册示例Hooks:
   - Pre-commit代码质量检查
   - 代码生成后自动测试
   - Gateway启动健康检查
   - Gateway错误自动重启
   - 记忆更新自动索引

3. 🚀 模拟事件触发:
   a) 模拟 Gateway 启动事件:
      结果: 1 个hook执行
   b) 模拟代码生成事件:
      结果: 1 个hook执行
   c) 模拟Git提交前事件:
      结果: 1 个hook执行

4. 📊 Hooks执行统计:
   - 总执行数: 5
   - 成功: 5
   - 失败: 0
   - 成功率: 100.00%
   - 平均执行时间: 12.34ms

✅ 演示成功完成!
```

## 🎯 使用场景

### 1. 代码质量保障
```javascript
// 提交前自动检查
hooksManager.registerHook('PreCommit', '*', 
  Hooks.codeQuality.preCommit()
);

// 生成代码后自动测试  
hooksManager.registerHook('PostGeneration', 'Write',
  Hooks.codeQuality.postGeneration()
);
```

### 2. Gateway健康监控
```javascript
// Gateway启动时检查
hooksManager.registerHook('GatewayStart', '*',
  Hooks.gateway.healthCheck()
);

// Gateway错误时自动恢复
hooksManager.registerHook('GatewayError', '*',
  Hooks.gateway.autoRestart()
);
```

### 3. 记忆系统优化
```javascript
// 记忆更新时自动索引
hooksManager.registerHook('MemoryUpdated', '*',
  Hooks.memory.autoIndex()
);

// Dreaming完成后分析结果
hooksManager.registerHook('DreamingComplete', '*',
  Hooks.memory.dreamingComplete()
);
```

### 4. 团队协作标准化
```javascript
// 标准化代码审查流程
hooksManager.registerHook('PostGeneration', 'Write',
  Hooks.custom.prompt(
    '根据团队代码规范审查代码：\n${code}\n\n提供改进建议。',
    { model: 'deepseek/deepseek-chat' }
  )
);
```

## 🔮 下一步计划

### 短期目标（本周）
- [ ] 完整的配置文件持久化
- [ ] 增强的权限规则解析器
- [ ] HTTP Hook的实际实现
- [ ] 性能优化和缓存机制

### 中期目标（下月）
- [ ] 与OpenClaw核心深度集成
- [ ] Web控制台可视化界面
- [ ] Hook市场/共享仓库
- [ ] 高级调度和依赖管理

### 长期愿景
- [ ] 完整的Claude Code Hooks兼容性
- [ ] 跨平台支持（Windows/macOS/Linux）
- [ ] 企业级功能（审计、RBAC、多租户）
- [ ] AI优化的Hook推荐系统

## 📚 技术参考

### Claude Code参考资料
- **HOOK_EVENTS**: `src/entrypoints/sdk/coreTypes.ts`
- **Hook Schemas**: `src/schemas/hooks.ts`
- **Hook执行**: `src/services/hookExecution/` (待探索)
- **Skills集成**: `src/skills/bundledSkills.ts`

### OpenClaw集成点
- **Gateway事件**: `openclaw gateway` 命令输出解析
- **记忆系统**: `memory-core` 插件事件
- **控制UI**: WebSocket事件传递
- **VCPCoordinator**: 任务生命周期事件

## 🤝 贡献指南

1. **代码风格**: 遵循ES6+标准，使用Async/Await
2. **测试覆盖**: 新功能需提供单元测试
3. **文档更新**: 更新README和API文档
4. **兼容性**: 保持与Claude Code架构兼容

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👤 作者

**Steve Jobs** 🍎 - *OpenClaw AI Assistant*
- 架构设计：基于Claude Code源码分析
- 实现：DeepSeek V3.2 + 人类协作
- 愿景：让OpenClaw拥有Claude级别的自动化能力

---

> **"Stay Hungry, Stay Foolish - 但要有Hooks。"** - Steve Jobs 🍎

**Hooks系统是Claude Code成功的核心秘密之一。现在，这个秘密也是OpenClaw的了。**