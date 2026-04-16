# CLI-Anything 研究报告

> 研究时间: 2026-03-29  
> 来源: 香港大学数据科学实验室 (HKUDS)  
> 仓库: https://github.com/HKUDS/CLI-Anything

---

## 一、项目概述

### 1.1 核心理念

**"Today's Software Serves Humans. Tomorrow's Users will be Agents."**

CLI-Anything 是香港大学数据科学实验室的开源项目，旨在将所有 GUI 应用转化为 AI Agent 可用的命令行接口。核心理念是：

- **软件代理化**：让现有软件为 AI 代理服务
- **CLI 作为通用接口**：命令行是人类和 AI 都能使用的通用界面
- **一键转换**：一条命令让任意软件变成 Agent-Ready

### 1.2 项目热度

- ⭐ **24.4k Stars** - GitHub 上极具影响力的开源项目
- 🍴 **2.2k Forks** - 社区活跃度高
- 📋 **31 Issues** / **40 PRs** - 持续迭代中
- 📅 最近更新：2026-03-27（2天前）

---

## 二、技术架构

### 2.1 核心原理：GUI 到 CLI 的映射

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GUI 应用      │ ──► │   Agent Harness │ ──► │   CLI 接口      │
│  (GIMP/Blender) │     │  (分析/转换层)   │     │  (Click框架)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   GUI操作/数据模型        API映射/状态管理        JSON输出/REPL模式
```

### 2.2 七阶段方法论 (7-Phase Methodology)

| 阶段 | 名称 | 核心任务 | 输出物 |
|------|------|----------|--------|
| Phase 1 | Codebase Analysis | 分析后端引擎、数据模型、现有CLI工具、GUI-to-API映射 | SOFTWARE.md SOP文档 |
| Phase 2 | CLI Architecture Design | 设计命令组、状态模型、输出格式、渲染管线 | 架构设计文档 |
| Phase 3 | Implementation | 构建核心模块、Click CLI、REPL模式、JSON输出 | 可工作的CLI代码 |
| Phase 4 | Test Planning | 单元测试计划、E2E测试计划、工作流场景 | TEST.md Part 1 |
| Phase 5 | Test Implementation | 编写测试用例、输出验证、CLI子进程测试 | 完整测试套件 |
| Phase 6 | Test Documentation | 执行测试、记录结果、覆盖率分析 | TEST.md Part 2 |
| Phase 6.5 | SKILL.md Generation | 生成AI可发现的技能定义 | SKILL.md |
| Phase 7 | PyPI Publishing | 打包、发布、PATH安装 | 可分发的包 |

### 2.3 输出目录结构

```
<software>/agent-harness/
├── <SOFTWARE>.md          # 软件特定SOP文档
├── setup.py                # PyPI配置 (find_namespace_packages)
└── cli_anything/           # 命名空间包 (PEP 420)
    └── <software>/         # 子包
        ├── __init__.py
        ├── __main__.py     # python -m cli_anything.<software>
        ├── <software>_cli.py  # 主CLI入口
        ├── core/           # 核心模块
        │   ├── project.py  # 项目管理
        │   ├── session.py  # Undo/Redo
        │   └── export.py   # 渲染/导出
        ├── utils/
        │   └── repl_skin.py # 统一REPL界面
        ├── skills/
        │   └── SKILL.md    # AI发现文件
        └── tests/
            ├── test_core.py
            └── test_full_e2e.py
```

---

## 三、关键特性

### 3.1 有状态会话管理

```python
# 核心能力
- Undo/Redo: 50级深拷贝快照栈
- 项目状态持久化
- 操作历史追踪
```

### 3.2 双输出模式

| 模式 | 用途 | 格式 |
|------|------|------|
| Human-Readable | 人类用户 | 表格、颜色、友好提示 |
| Machine-Readable | AI Agent | JSON 格式 (`--json` flag) |

### 3.3 REPL 模式

- **默认行为**：直接运行 CLI 进入 REPL
- **统一界面**：`ReplSkin` 提供品牌化 banner、彩色提示
- **命令历史**：通过 `prompt_toolkit` 持久化
- **消息助手**：success(), error(), warning(), info(), table(), progress()

### 3.4 SKILL.md 生成

AI Agent 可发现的技能定义文件：

```yaml
---
name: cli-anything-gimp
description: GIMP image editor CLI for AI agents
---

# Commands
- `gimp open <file>` - Open image file
- `gimp filter <name>` - Apply filter
- `gimp export <format>` - Export to format

# Agent Guidance
Use `--json` flag for machine-readable output.
```

---

## 四、支持的应用列表

### 4.1 图像/设计类

| 应用 | 测试数 | 技术方案 |
|------|--------|----------|
| GIMP | 103 | Pillow-based, GEGL映射 |
| Inkscape | 197 | SVG manipulation |
| Blender | 200 | bpy script generation |
| Krita | - | 图像处理 |
| Sketch | - | macOS设计工具 |

### 4.2 音视频类

| 应用 | 测试数 | 技术方案 |
|------|--------|----------|
| Audacity | 154 | WAV processing |
| OBS Studio | 153 | JSON scene collections |
| Kdenlive | 151 | MLT XML |
| Shotcut | 144 | MLT XML, ffmpeg |
| MuseScore | - | 音乐制谱 |

### 4.3 办公/文档类

| 应用 | 测试数 | 技术方案 |
|------|--------|----------|
| LibreOffice | 143 | ODF ZIP/XML |
| draw.io | - | 图表绘制 |
| NotebookLM | - | 笔记管理 |

### 4.4 开发/工具类

| 应用 | 技术方案 |
|------|----------|
| Ollama | 本地LLM API |
| Novita AI | OpenAI-compatible API |
| FreeCAD | CAD建模 |
| iTerm2 | 终端自动化 |

### 4.5 总计

- **总测试数**: 1,245+
- **所有测试通过率**: 100%
- **支持应用数量**: 30+

---

## 五、CLI-Hub 生态系统

### 5.1 功能

CLI-Hub (https://hkuds.github.io/CLI-Anything/) 是中央注册表：

- 🔍 浏览和搜索所有可用 CLI
- 📦 一键安装：`pip install cli-anything-<software>`
- 🤝 贡献者通过 PR 添加新 CLI
- ⚡ GitHub Actions 自动更新

### 5.2 安装方式

```bash
# 从 PyPI 安装
pip install cli-anything-gimp
cli-anything-gimp --help

# 本地开发安装
cd /root/cli-anything/gimp/agent-harness
pip install -e .
```

---

## 六、支持的 AI 平台

| 平台 | 支持方式 |
|------|----------|
| **Claude Code** | Plugin Marketplace |
| **OpenClaw** | 官方集成 skill |
| **OpenCode** | Commands + Skills |
| **Codex** | Skill 文件 |
| **Goose** | Desktop/CLI |
| **Qodercli** | Plugin |
| **GitHub Copilot CLI** | Plugin |

---

## 七、与 OpenClaw 的集成

### 7.1 已有 OpenClaw Skill

项目包含 `openclaw-skill/` 目录，提供：

- SKILL.md 定义文件
- 一键安装脚本
- 与 OpenClaw 的无缝集成

### 7.2 使用方式

```bash
# 在 OpenClaw 中使用
/cli-anything <software-path>

# 精细化改进
/cli-anything:refine <software-path> "focus area"

# 运行测试
/cli-anything:test <software-path>
```

---

## 八、技术亮点

### 8.1 PEP 420 命名空间包

使用命名空间包允许：

- 多个 CLI 包共存于同一环境
- 统一前缀 `cli_anything.*`
- 无 `__init__.py` 冲突

### 8.2 _resolve_cli() 辅助函数

```python
def _resolve_cli(cli_name: str) -> str:
    """解析已安装的CLI命令，支持回退到 python -m"""
    if shutil.which(cli_name):
        return cli_name
    return f"python -m {cli_name.replace('-', '_')}"
```

### 8.3 CLI_ANYTHING_FORCE_INSTALLED 环境变量

```bash
CLI_ANYTHING_FORCE_INSTALLED=1 pytest  # 验证已安装版本
```

---

## 九、最佳实践

### 9.1 适用场景

✅ **适合：**
- GUI 应用有清晰的数据模型
- 应用有现有 CLI 工具或 API
- 需要 Agent 可用接口
- 自动化和脚本工作流

❌ **不适合：**
- 纯二进制、未文档化格式
- 实时交互应用
- 需要GPU/显示访问

### 9.2 成功因素

1. **先分析后编码** - 理解架构再动手
2. **遵循阶段** - 不要跳过测试规划
3. **彻底测试** - 追求100%通过率
4. **完整文档** - 记录一切
5. **生成 SKILL.md** - 让 AI Agent 可发现
6. **发布到 PATH** - 安装到系统路径

---

## 十、对 OpenClaw/Bo 的启示

### 10.1 直接可用

- 已有 OpenClaw skill 集成
- 可直接使用 `/cli-anything` 命令
- 社区维护的 30+ CLI 可直接调用

### 10.2 扩展方向

1. **为 Soul APP 创建 CLI harness**
   - 分析 Soul APP 源码（已反编译 60K+ 文件）
   - 使用 CLI-Anything 方法论生成 CLI
   - 让 AI Agent 可以控制 Soul APP

2. **为 Port Guardian 创建 CLI**
   - 自动修复系统的 CLI 接口
   - 监控、诊断、修复命令

3. **贡献到 CLI-Hub**
   - 将自定义 CLI 发布到社区
   - 增加 Bo 项目的可见度

### 10.3 技术借鉴

1. **Agent Harness 模式** - 为 GUI 应用创建控制层
2. **SKILL.md 模式** - AI 可发现的技能定义
3. **REPL + JSON 双模式** - 人类和AI双友好
4. **七阶段方法论** - 系统化构建 AI 可用接口

---

## 十一、总结

CLI-Anything 是一个**革命性的开源项目**，解决了 AI Agent 与现有软件生态的连接问题。其核心价值：

1. **理念领先** - "软件代理化"是 AI 时代的必然趋势
2. **方法成熟** - 七阶段方法论经过 30+ 应用验证
3. **社区活跃** - 24.4k stars，持续迭代
4. **生态完善** - CLI-Hub 中央注册，一键安装
5. **集成友好** - 支持 OpenClaw 等多个 AI 平台

**建议**：深入研究其 Agent Harness 模式，为 Soul APP 和 Port Guardian 创建类似的 CLI 接口，实现 AI Agent 对这些应用的自主控制。

---

## 参考链接

- 主仓库: https://github.com/HKUDS/CLI-Anything
- CLI-Hub: https://hkuds.github.io/CLI-Anything/
- 中文文档: README_CN.md
- 贡献指南: CONTRIBUTING.md
