# Claude Code 研究报告

> 研究日期: 2026-03-29
> 研究目标: 深入分析 Anthropic Claude Code (GitHub 114k+ stars) 的核心功能、技术架构，以及与 OpenClaw 的集成可能性

---

## 一、项目概述

### 1.1 基本信息

| 项目 | 信息 |
|------|------|
| **名称** | Claude Code |
| **开发者** | Anthropic |
| **GitHub** | https://github.com/anthropics/claude-code |
| **Stars** | 114,000+ |
| **定位** | Agentic coding tool - 终端中的 AI 编程代理 |
| **支持平台** | macOS, Linux, Windows, WSL |
| **认证要求** | claude.ai 账户登录 (支持 Console/API Key 认证) |

### 1.2 一句话定位

> "Claude Code is an agentic coding tool that lives in your terminal, understands your codebase, and helps you code faster by executing routine tasks, explaining complex code, and handling git workflows -- all through natural language commands."

---

## 二、核心功能架构

### 2.1 核心能力矩阵

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code 架构                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   CLI/IDE   │  │ @claude GH  │  │  Channels   │              │
│  │   入口层    │  │  GitHub Bot │  │ 消息推送    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Agent Orchestrator                      │  │
│  │              (代理调度与任务分解系统)                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│         ┌────────────────┼────────────────┐                      │
│         ▼                ▼                ▼                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │   主代理   │  │  子代理    │  │  插件代理   │                 │
│  │ Main Agent │  │ Subagents  │  │   Plugins  │                 │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                 │
│        │               │               │                         │
│        └───────────────┼───────────────┘                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Tool Layer                             │  │
│  │  Read │ Write │ Edit │ Bash │ Glob │ Grep │ MCP Tools     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                        │                                         │
│                        ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Memory Layer                             │  │
│  │  CLAUDE.md │ .claude/rules/ │ Auto Memory │ Agent Memory   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 子代理系统 (Subagents)

Claude Code 的子代理系统是其核心创新之一：

| 内置代理 | 模型 | 工具权限 | 用途 |
|---------|------|---------|------|
| **Explore** | Haiku | 只读 | 代码库探索、搜索分析 |
| **Plan** | 继承主会话 | 只读 | 计划模式下的代码库研究 |
| **General-purpose** | 继承主会话 | 全部 | 复杂多步骤任务、代码修改 |
| **Bash** | 继承主会话 | 全部 | 终端命令执行隔离 |
| **Claude Code Guide** | Haiku | 只读 | Claude Code 功能问答 |

**子代理配置结构**:
```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
memory: user
---

You are a code reviewer. When invoked, analyze the code...
```

**子代理作用域**:
- `--agents` CLI flag (会话级，最高优先级)
- `.claude/agents/` (项目级)
- `~/.claude/agents/` (用户级)
- 插件 `agents/` 目录 (插件级)

### 2.3 插件系统 (Plugins)

Claude Code 的插件系统功能丰富：

**插件目录结构**:
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # 插件元数据
├── commands/                # 斜杠命令 (可选)
├── agents/                  # 专用代理 (可选)
├── skills/                  # 代理技能 (可选)
├── hooks/                   # 事件处理器 (可选)
├── .mcp.json               # MCP 服务器配置 (可选)
└── README.md
```

**官方插件示例**:

| 插件 | 功能 |
|------|------|
| `agent-sdk-dev` | Claude Agent SDK 开发工具包 |
| `code-review` | 自动 PR 代码审查 (5个并行 Sonnet 代理) |
| `commit-commands` | Git 工作流自动化 (/commit, /commit-push-pr) |
| `feature-dev` | 7阶段功能开发工作流 |
| `frontend-design` | 生产级前端界面设计指南 |
| `hookify` | 自定义 hook 创建工具 |
| `plugin-dev` | 插件开发工具包 (7个专家技能) |
| `pr-review-toolkit` | PR 审查代理套件 |
| `ralph-wiggum` | 自主迭代循环 |
| `security-guidance` | 安全提醒 hook |

### 2.4 MCP (Model Context Protocol) 集成

**MCP 是 Claude Code 的外部工具集成协议**:

**集成类型**:
1. **远程 HTTP 服务器** (推荐)
2. **远程 SSE 服务器** (已弃用)
3. **本地 stdio 服务器**

**MCP 作用域**:
- `local`: 仅当前项目可用 (默认)
- `project`: 通过 `.mcp.json` 共享给团队
- `user`: 跨所有项目可用

**MCP 能力**:
- 工具调用 (Tools)
- 资源访问 (Resources)
- 提示模板 (Prompts)
- **频道推送** (Channels) - 推送消息到会话

### 2.5 频道系统 (Channels)

**频道是 Claude Code 的消息推送机制**，允许外部服务将事件推送到运行中的会话：

**支持的频道**:
- **Telegram**: 通过 Bot 推送/回复
- **Discord**: 通过 Bot 推送/回复
- **iMessage**: 直接读取本地 Messages 数据库 (仅 macOS)

**技术实现**:
- 基于 MCP 服务器的 `claude/channel` 能力声明
- 需要 `--channels` 标志启动
- 支持权限转发 (远程审批权限请求)

### 2.6 记忆系统 (Memory)

**双层记忆架构**:

| 系统 | 谁写入 | 内容 | 作用域 |
|------|-------|------|--------|
| **CLAUDE.md** | 用户 | 指令、规则、架构 | 项目/用户/组织 |
| **Auto Memory** | Claude | 学习记录、偏好、调试洞察 | 每个工作树 |

**CLAUDE.md 加载顺序**:
1. 从当前目录向上遍历目录树
2. 发现子目录中的 CLAUDE.md (按需加载)
3. 加载 `.claude/rules/*.md` 规则文件

**Auto Memory**:
- 自动记录用户的纠正和偏好
- 每次会话加载前 200 行或 25KB
- 子代理可以有独立的记忆目录

---

## 三、与 OpenClaw 对比分析

### 3.1 功能对比表

| 特性 | Claude Code | OpenClaw |
|------|-------------|----------|
| **核心定位** | 终端编程代理 | 全能型 AI 助手框架 |
| **代理系统** | 子代理 (Subagents) | 子代理 (sessions_spawn) |
| **插件系统** | 插件 (Plugins) | 技能 (Skills) |
| **外部工具** | MCP 协议 | MCP 协议 + 内置工具 |
| **消息推送** | Channels (研究预览) | 原生支持 (message 工具) |
| **记忆系统** | CLAUDE.md + Auto Memory | MEMORY.md + memory/*.md |
| **定时任务** | 无内置 | cron 支持 |
| **设备集成** | 无 | nodes (iOS/Android/macOS 配对) |
| **浏览器自动化** | 无内置 | browser 工具 |
| **TTS** | 无内置 | tts 工具 |
| **子代理通信** | 单向 (返回结果) | 双向 (sessions_send/steer) |

### 3.2 架构相似点

1. **代理层次**: 都支持主代理 + 子代理架构
2. **记忆持久化**: 都使用文件系统持久化记忆
3. **工具扩展**: 都支持通过 MCP 扩展工具能力
4. **权限控制**: 都有工具权限控制机制
5. **工作目录**: 都基于项目工作目录运行

### 3.3 架构差异点

| 维度 | Claude Code | OpenClaw |
|------|-------------|----------|
| **设计哲学** | 专注编程场景 | 通用 AI 助手平台 |
| **消息模型** | 同步请求-响应 | 异步 + 事件驱动 |
| **部署模式** | 单机 CLI | Gateway + Session 架构 |
| **会话管理** | 单会话专注 | 多会话支持 + 会话间通信 |
| **社区生态** | 官方插件市场 (claude-plugins-official) | ClawHub 技能市场 |

### 3.4 Claude Code 的创新点

1. **Explore 代理**: 专门用于代码库探索的轻量级代理，使用 Haiku 模型降低成本
2. **条件规则**: `.claude/rules/` 支持按文件路径模式触发
3. **频道系统**: 允许外部服务主动推送事件到运行中的会话
4. **权限转发**: 通过频道远程审批权限请求
5. **Auto Memory**: 自动从用户纠正中学习

---

## 四、OpenClaw 集成可能性

### 4.1 ACP Harness 集成 (已支持)

OpenClaw 已支持通过 `sessions_spawn` 以 ACP 模式启动编码代理：

```typescript
sessions_spawn({
  runtime: "acp",
  agentId: "claude-code",  // 或配置 acp.defaultAgent
  task: "实现用户认证模块",
  thread: true,            // Discord 默认绑定线程
  mode: "session"          // 持久会话
})
```

**建议**:
- 配置 `acp.defaultAgent` 指向 Claude Code
- 在 Discord 绑定线程会话，实现连续编码上下文

### 4.2 可借鉴的设计模式

#### 4.2.1 条件规则加载

**Claude Code 方式**:
```markdown
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API 开发规则
- 所有 API 端点必须包含输入验证
```

**OpenClaw 可采纳**:
- 在 skills 中增加 `filePatterns` 字段
- 当用户操作匹配文件时自动激活相关技能

#### 4.2.2 Explore 代理模式

**Claude Code 的 Explore 代理**:
- 使用 Haiku 模型 (低成本)
- 只读工具权限
- 专门用于代码库探索

**OpenClaw 对应方案**:
```typescript
sessions_spawn({
  runtime: "subagent",
  task: "探索代码库，理解认证模块的实现",
  agentId: "explore",  // 新增专用探索代理
  model: "haiku",      // 低成本模型
  thinking: "off"
})
```

#### 4.2.3 Auto Memory 学习机制

**Claude Code 的 Auto Memory**:
- 自动记录用户的纠正
- 以 "don't do X" 或 "prefer Y" 形式存储
- 每次会话自动加载

**OpenClaw 可采纳**:
- 在 AGENTS.md 中增加 "用户偏好" 部分
- 当用户说 "记住这个" 或纠正时自动更新
- 区分 MEMORY.md (长期) 和 auto-memory (短期偏好)

#### 4.2.4 频道系统

**Claude Code 的 Channels**:
- 支持 Telegram/Discord/iMessage 推送到运行中的会话
- 基于 MCP 服务器的 `claude/channel` 能力

**OpenClaw 对应方案**:
- 当前 `message` 工具已支持发送
- 可增加 webhook 接收能力
- 配合 cron 实现定时推送

### 4.3 技术集成路径

#### 路径 1: 深度 ACP 集成

```
用户 → OpenClaw → sessions_spawn(acp) → Claude Code
                    ↑                      ↓
                    └── 结果返回 ──────────┘
```

**优势**: 无需额外开发，立即可用
**限制**: 交互受限于子代理模式

#### 路径 2: MCP 工具共享

```
OpenClaw ←→ MCP Server ←→ Claude Code
              ↑
         共享工具集
```

**实现**:
- OpenClaw 的核心工具发布为 MCP 服务器
- Claude Code 通过 MCP 调用 OpenClaw 能力
- 反向也可行

#### 路径 3: 记忆系统互操作

```
OpenClaw              Claude Code
├── MEMORY.md    ←→   CLAUDE.md
├── memory/      ←→   .claude/
└── skills/      ←→   plugins/
```

**实现**:
- 创建转换工具，将 CLAUDE.md 转换为 MEMORY.md 格式
- 共享项目上下文文件
- 双向同步用户偏好

---

## 五、建议与行动计划

### 5.1 短期 (1-2周)

1. **ACP Harness 测试**
   - 配置 `acp.defaultAgent` 指向 Claude Code
   - 测试 Discord 线程绑定会话
   - 评估编码任务效果

2. **Explore 代理实现**
   - 创建 `explore` 子代理配置
   - 使用低成本模型
   - 限制为只读工具

### 5.2 中期 (1-2月)

1. **条件规则系统**
   - 在 skills 元数据中增加 `filePatterns` 字段
   - 实现按文件类型自动激活技能
   - 类似 `.claude/rules/` 的条件加载

2. **Auto Memory 功能**
   - 监听用户纠正关键词 ("不要这样", "应该那样")
   - 自动写入记忆文件
   - 区分长期记忆和短期偏好

### 5.3 长期 (3-6月)

1. **Channel 机制**
   - 实现基于 MCP 的消息推送接收
   - 支持远程权限审批
   - 与 OpenClaw 的 message 工具集成

2. **MCP 工具共享**
   - OpenClaw 核心工具发布为 MCP 服务器
   - 创建 OpenClaw-Claude Code 桥接插件
   - 双向能力调用

---

## 六、结论

Claude Code 是 Anthropic 在 AI 编程代理领域的重要产品，其设计理念和技术实现值得 OpenClaw 借鉴：

**核心学习点**:
1. **代理分层**: Explore/Plan/General-purpose 的分层代理设计
2. **记忆架构**: CLAUDE.md (用户编写) + Auto Memory (AI 学习) 的双层记忆
3. **灵活规则**: 按文件路径条件加载规则，减少上下文污染
4. **频道推送**: 允许外部服务主动向会话推送事件

**集成建议**:
- 通过 ACP Harness 深度集成 Claude Code 作为编码代理
- 借鉴代理分层设计优化 OpenClaw 的 sessions_spawn 模型
- 实现条件规则加载和 Auto Memory 学习机制

Claude Code 与 OpenClaw 在定位上互补: Claude Code 专注编程场景，OpenClaw 作为通用平台可以整合 Claude Code 作为编码子系统，实现 1+1>2 的效果。

---

*报告生成: 2026-03-29 | 模型: GLM-5 | 研究: OpenClaw AI*
