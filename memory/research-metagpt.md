# MetaGPT 研究报告

> 研究目标：https://github.com/FoundationAgents/MetaGPT  
> 日期：2026-03-28

---

## 1. 核心功能

### 1.1 一句话概述
MetaGPT 是**首个 AI 软件公司级多智能体框架**，将 SOP（标准操作流程）固化为多智能体协作系统。

### 1.2 主要功能

| 功能 | 描述 |
|------|------|
| **自然语言编程** | 输入一句话需求，输出完整软件项目（含PRD、代码、API设计、文档等） |
| **多角色协作** | 内置 PM（产品经理）、Architect（架构师）、Project Manager、Engineer、Tester、Reviewer 等角色 |
| **Software Company** | 模拟软件公司完整流程：需求分析 → 设计 → 编码 → 测试 → 评审 |
| **Data Interpreter** | 数据分析智能体，可执行代码并处理数据 |
| **Debate** | 多智能体辩论系统 |
| **Researcher** | 研究型智能体 |
| **可扩展性** | 用户可定义自定义 Action 和 Role |

### 1.3 核心哲学
```
Code = SOP(Team)
```
把 SOP（标准操作流程）抽象为多智能体团队协作。

---

## 2. 架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Team (团队)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │   PM    │→│Architect│→│ Engineer│→│ Tester  │→...│
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Environment                          │
│         (消息传递/角色间通信/状态管理)                    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Role (角色)                                            │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Memory  │  │  Actions │  │  Think  │  │  Act   │  │
│  └─────────┘  └──────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Action (动作)                                          │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │ LLM-based   │  │ Function    │                      │
│  │ (self._aask)│  │ (subprocess)│                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

#### Action（动作）
- 定义具体执行的任务
- 可基于 LLM（`self._aask()`）或普通函数
- 支持异步执行 `async def run()`

```python
class SimpleWriteCode(Action):
    PROMPT_TEMPLATE: str = "Write a python function that can {instruction}..."
    name: str = "SimpleWriteCode"
    
    async def run(self, instruction: str):
        prompt = self.PROMPT_TEMPLATE.format(instruction=instruction)
        rsp = await self._aask(prompt)  # 调用 LLM
        return rsp
```

#### Role（角色）
- 绑定一个或多个 Action
- 内置 Memory（记忆系统）
- 实现 `_observe`、`_think`、`_act` 循环

```python
class SimpleCoder(Role):
    name: str = "Alice"
    profile: str = "SimpleCoder"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.set_actions([SimpleWriteCode])
        self._watch([UserRequirement])  # 监听上游消息
```

#### Team（团队）
- 管理多个 Role
- 提供 `hire()`、`invest()`、`run_project()` 接口
- 协调消息传递和执行流程

### 2.3 消息驱动机制

```
UserRequirement → SimpleCoder → SimpleWriteCode (Action输出)
                                        ↓
                              发布 Message 到 Environment
                                        ↓
                              SimpleTester 观察(Watch)到消息
                                        ↓
                              开始执行 SimpleWriteTest
```

---

## 3. 多智能体实现方式

### 3.1 协作模式

MetaGPT 采用**消息驱动 + SOP 编排**的协作模式：

1. **角色定义**：每个 Role 有自己的 Actions
2. **消息订阅**：通过 `_watch()` 监听特定类型的消息（如其他 Agent 的 Action 输出）
3. **SOP 流程**：类似于软件公司的流水线，上游输出作为下游输入

### 3.2 定义多智能体示例

```python
# Step 1: 定义 Actions
class SimpleWriteCode(Action):
    name = "SimpleWriteCode"
    async def run(self, instruction): ...

class SimpleWriteTest(Action):
    name = "SimpleWriteTest"  
    async def run(self, context, k=3): ...

class SimpleWriteReview(Action):
    name = "SimpleWriteReview"
    async def run(self, context): ...

# Step 2: 定义 Roles（绑定Action + 监听上游）
class SimpleCoder(Role):
    def __init__(self):
        self._watch([UserRequirement])      # 监听用户需求
        self.set_actions([SimpleWriteCode]) # 绑定动作

class SimpleTester(Role):
    def __init__(self):
        self._watch([SimpleWriteCode])      # 监听编码输出
        self.set_actions([SimpleWriteTest])

class SimpleReviewer(Role):
    def __init__(self):
        self._watch([SimpleWriteTest])      # 监听测试输出
        self.set_actions([SimpleWriteReview])

# Step 3: 创建团队
team = Team()
team.hire([SimpleCoder(), SimpleTester(), SimpleReviewer()])
team.invest(investment=3.0)
team.run_project("write a function that calculates product of list")
await team.run(n_round=5)
```

### 3.3 内置角色示例

| 角色 | 职责 |
|------|------|
| ProductManager | 编写 PRD、用户故事 |
| Architect | 系统设计、数据结构、API |
| ProjectManager | 任务分解、进度管理 |
| Engineer | 编码实现 |
| Tester | 编写测试用例 |
| Reviewer | 代码评审 |

---

## 4. 集成可行性分析

### 4.1 集成优势

| 维度 | 评估 |
|------|------|
| **架构匹配度** | ✅ 高 - Message/Role/Action 抽象清晰，易于对接 |
| **Python 依赖** | ✅ 兼容 - OpenClaw 基于 Python，天然集成 |
| **异步支持** | ✅ 原生 - 基于 asyncio，可嵌入异步工作流 |
| **可扩展性** | ✅ 高 - 自定义 Action/Role 接口简洁 |
| **社区活跃度** | ✅ 活跃 - 10K+ stars，持续维护更新 |

### 4.2 集成方案

#### 方案 A：直接嵌入（推荐）
将 MetaGPT 作为 Python 库引入 OpenClaw：

```python
# 直接在 OpenClaw 中调用
from metagpt.software_company import generate_repo

# 一句话生成完整项目
repo = generate_repo("Create a 2048 game")
```

#### 方案 B：作为 MCP 工具
将 MetaGPT 封装为 MCP Server，供 OpenClaw 调用

#### 方案 C：改造集成
将 MetaGPT 的 Role/Action 抽象移植到 OpenClaw 技能系统

### 4.3 集成注意事项

| 问题 | 建议 |
|------|------|
| Python 版本限制 | 需要 Python 3.9-3.11（MetaGPT 不支持 3.12） |
| LLM API 配置 | 需要配置 LLM（OpenAI/Azure/Ollama/Groq） |
| 依赖冲突 | 需隔离虚拟环境，避免与 OpenClaw 冲突 |
| Token 成本 | 完整项目生成约 $2.0（GPT-4），需考虑成本 |

### 4.4 对比现有能力

| 能力 | MetaGPT | OpenClaw 当前 |
|------|---------|---------------|
| 多智能体协作 | ✅ 成熟 | ⚠️ 需要 skill-orchestrator |
| 角色扮演 | ✅ 内置多角色 | ⚠️ 需自己实现 |
| 软件工程流程 | ✅ 完整流程 | ❌ 无 |
| 代码生成执行 | ✅ Data Interpreter | ⚠️ 需要 code-executor |

---

## 5. 结论与建议

### 结论
MetaGPT 是一个**成熟、商业级**的多智能体框架，特别擅长软件工程场景。其「Code = SOP(Team)」理念与 OpenClaw 的技能编排思路高度契合。

### 集成建议

1. **可直接集成**：作为 Python 库引入，快速获得多智能体协作能力
2. **优先场景**：
   - 代码生成/数据分析（Data Interpreter）
   - 复杂任务的多角色协作
   - 软件流程自动化
3. **注意事项**：需配置独立的 Python 环境（3.9-3.11），做好成本控制

### 下一步
如需集成，可考虑：
1. 创建 MetaGPT skill，封装常用功能
2. 设计 MCP 工具暴露 MetaGPT 能力
3. 试点 Data Interpreter 集成（数据分析场景）

---

*报告生成时间：2026-03-28*