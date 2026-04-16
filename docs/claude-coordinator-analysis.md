# Claude Code Coordinator 架构分析

> 分析日期：2026-04-13
> 目标：理解为什么 Claude Code 能完成项目，而 GPT-5.4/Claude 4.6 都失败

---

## 核心发现

**Claude Code 的成功是架构的成功，不是模型的成功。**

### 架构对比

| 组件 | Claude Code | OpenClaw (当前) | 差距 |
|------|-------------|-----------------|------|
| **角色分离** | ✅ Coordinator + Workers | ❌ 单代理既是 coordinator 又是 worker | **关键差距** |
| **上下文管理** | ✅ Auto-compaction (智能压缩) | ✅ Compaction (基础压缩) | 算法差距 |
| **团队协作** | ✅ Team System (并行工作) | ✅ Multi-agent (基础隔离) | 协调差距 |
| **规划模式** | ✅ Plan Mode (先规划后执行) | ❌ 直接动手 | **关键差距** |
| **错误恢复** | ✅ Circuit breaker + Retry | ❌ 简单失败 | 鲁棒性差距 |

---

## Claude Code 架构详解

### 1. Coordinator Mode (协调器模式)

**核心思想：** 分离思考与执行

```
User → Coordinator (大脑) → Workers (手脚)
```

**Coordinator 职责：**
- 理解用户需求
- 分解任务
- 分配工作给 workers
- 合成结果
- 与用户沟通

**Workers 职责：**
- 执行具体任务
- 报告结果
- 不参与决策

**关键优势：**
- Coordinator 保持全局视野
- Workers 专注执行
- 避免上下文污染

### 2. Auto-compaction (智能上下文压缩)

**不是简单的 truncation，而是：**

1. **阈值管理** - 13K token buffer
2. **会话记忆优先** - 保留重要上下文
3. **电路断路器** - 连续失败3次后停止尝试
4. **渐进式压缩** - 逐步压缩，不是一次性清空

**OpenClaw 对比：**
- 有 compaction，但可能不够智能
- 没有 circuit breaker
- 没有渐进式策略

### 3. Team System (团队系统)

**并行工作流：**

```
Research (并行) → Synthesis (协调器) → Implementation (串行) → Verification (并行)
```

**关键原则：**
- 研究阶段：并行探索不同角度
- 实现阶段：串行避免冲突
- 验证阶段：独立验证，不 rubber-stamp

### 4. Plan Mode (规划模式)

**先规划后执行：**

```
理解需求 → 研究现状 → 制定计划 → 分配任务 → 执行验证
```

**避免的问题：**
- 直接动手导致方向错误
- 缺乏全局视野
- 重复劳动

---

## 为什么 GPT-5.4/Claude 4.6 都失败

### 根本原因：架构缺失

**模型强 ≠ 项目能完成**

1. **没有角色分离** - 单代理既是思考者又是执行者
2. **没有智能上下文管理** - 长任务上下文爆炸
3. **没有团队协作** - 单打独斗效率低
4. **没有规划模式** - 直接动手容易错方向

### 具体表现：

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| **上下文爆炸** | 没有 auto-compaction | 智能上下文压缩 |
| **方向错误** | 没有 plan mode | 先规划后执行 |
| **效率低下** | 没有 team system | 并行协作 |
| **质量不稳定** | 没有 verification layer | 独立验证 |

---

## OpenClaw 移植方案

### 阶段一：Coordinator 技能

**目标：** 实现 Claude Code 的 coordinator 模式

**组件：**
1. **Coordinator Agent** - 思考者，不执行
2. **Worker Agent** - 执行者，不思考
3. **Task Queue** - 任务分配系统
4. **Result Aggregator** - 结果合成器

### 阶段二：智能 Auto-compaction

**目标：** 改进 OpenClaw 的 compaction

**改进点：**
1. 添加 circuit breaker
2. 实现渐进式压缩
3. 添加会话记忆优先级

### 阶段三：Team System

**目标：** 实现并行协作

**工作流：**
```
Coordinator → [Worker1, Worker2, Worker3] → Result Aggregation
```

### 阶段四：Plan Mode

**目标：** 实现先规划后执行

**流程：**
```
需求分析 → 研究 → 计划制定 → 任务分配 → 执行 → 验证
```

---

## 立即行动建议

### 1. 创建 Coordinator 技能

```yaml
name: claude-coordinator
description: Claude Code 风格的协调器模式
components:
  - coordinator.py: 协调器逻辑
  - worker.py: 工作代理
  - task_queue.py: 任务队列
  - aggregator.py: 结果聚合
```

### 2. 测试用例

**测试场景：** 修复一个简单的 bug

**传统方式：**
- 单代理直接动手
- 可能方向错误
- 上下文爆炸

**Coordinator 方式：**
1. Coordinator 理解需求
2. 分配 research worker 调查
3. 分配 implementation worker 修复
4. 分配 verification worker 验证
5. Coordinator 合成结果

---

## 结论

**Claude Code 的金山不是模型，是架构。**

**移植优先级：**
1. ✅ **Coordinator 模式** (角色分离)
2. ✅ **Auto-compaction 改进** (智能上下文)
3. ✅ **Team System** (并行协作)
4. ✅ **Plan Mode** (先规划后执行)

**这才是"完成项目"的真正能力。**
