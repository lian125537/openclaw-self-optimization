# OpenClaw 框架分析报告
_生成时间: 2026-04-01 10:30 GMT+8_
_状态: 进行中_

---

## 📊 源码规模

| 目录 | 文件数 | 说明 |
|------|--------|------|
| src/acp/ | 37 | 核心 ACP 协议层 |
| src/gateway/ | - | Gateway 主进程 |
| extensions/ | - | 模型扩展 (minimax, siliconflow) |
| packages/ | 8 | 子模块包 |

---

## 🔴 S级 (最难攻克 — 核心机制问题)

### S1: `translator.ts` — LLM 调用层，无 Retry 机制
**路径:** `src/acp/translator.ts` (37KB)
**问题:** 
- 直接调用 `gateway.request("chat.send")`，任何 API 错误都直接 throw
- MiniMax 返回 2064 (负载高) → 直接 reject，不重试
- 注释里写了 TODO: "when ChatEventSchema gains a structured errorKind field..."
- **没有实现**: `translator.session-rate-limit.test.ts` 存在 (36KB)，但对应实现文件不存在

**影响:** API 限流时 Gateway 卡死，因为 pending prompt 没有被 reject 后妥善处理

**修改位置:** `translator.ts` 内 `sendWithProvenanceFallback` 函数

---

### S2: `runtime-cache.ts` — 并发任务管理
**路径:** `src/acp/control-plane/runtime-cache.ts` (16KB)
**问题:**
- `maxConcurrent = 4` (主 agent)，`subagents.maxConcurrent = 8`
- 任务堆积时内存压力，可能堵住 event loop
- 子 agent 失控时的资源回收机制不明确

**影响:** 多任务并发时系统整体变慢甚至卡死

---

## 🟠 A级 (重要 — 需要理解机制)

### A1: `spawn.ts` — 子 Agent 生命周期
**路径:** `src/acp/control-plane/spawn.ts`
**问题:**
- 父 agent 崩溃时，子 agent 是否会被清理？—— 不确定
- 今天 Smart Canvas + Codex 卡死，可能和子进程未清理有关

**影响:** 独立任务执行时的稳定性和资源管理

---

### A2: `session.ts` — Session 生命周期
**路径:** `src/acp/session.ts` (5.7KB)
**问题:**
- Session reset 时 `startedAt` 会更新，但具体 reset 触发条件不明确
- 148+ 历史 session 文件堆积

**影响:** 对话连续性丢失风险

---

### A3: `server.ts` — Gateway 生命周期
**路径:** `src/acp/server.ts` (8.2KB)
**问题:**
- "Gateway is draining for restart; new tasks are not accepted" 消息来源
- Config 修改后 Gateway 会重启，重启期间拒绝请求

**影响:** 配置更新时短暂不可用

---

## 🟡 B级 (已知，有方案)

| 组件 | 状态 | 备注 |
|------|------|------|
| Memory (Cold) | ⚠️ | ChromaDB 连接问题，今天未生效 |
| Session 堆积 | ✅ | 已发现，148+ 文件 |
| Agent 配置 | ✅ | maxConcurrent=4, subagents=8 |
| 错误日志 | ✅ | `openclaw logs` 可用 |

---

## 🔍 今日关键发现

### 1. Rate Limit 处理 — 计划未实现
```
translator.session-rate-limit.test.ts (36KB) ← 测试文件存在
translator.session-rate-limit.ts ← 实现文件不存在！
```
说明 OpenClaw 开发者知道需要这个功能，但还没实现。

### 2. 2064 错误 — 已知但未处理
```typescript
// translator.ts 第 893 行
// "rate-limits" 注释明确承认这是 transient backend error
// TODO: retry — 但代码里没有 retry
```

### 3. 子 Agent 和父 Agent 的关系
- 父崩溃时子 agent 的生命周期未明确
- 这可能是 Codex 子任务把系统卡死的直接原因

---

## 🛠 修改策略

### 最小改动 (今天就能做):
1. 降低 `maxConcurrent` 和 `subagents.maxConcurrent` → 减少同时触发 2064 的概率
2. 在 `translator.ts` 的 `chat.send` 调用外层加 try-catch + setTimeout 重试

### 源码级改动 (需要编译):
1. 实现 `translator.session-rate-limit.ts` (参考 test 文件写实现)
2. 完善 `runtime-cache.ts` 的超载保护
3. 明确 `spawn.ts` 的子进程清理机制

---

## 📋 下一步

- [ ] 完整备份现有系统
- [ ] 理解 `translator.session-rate-limit.test.ts` 的测试用例
- [ ] 确定编译环境是否就绪
- [ ] 从 S1 开始逐个解决
