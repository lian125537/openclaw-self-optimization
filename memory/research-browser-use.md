# browser-use 项目研究报告

> 研究时间: 2026-03-28
> 项目地址: https://github.com/browser-use/browser-use
> GitHub Stars: 79k+

## 1. 功能 (Functionality)

### 核心能力
- **AI 浏览器自动化**: 让 AI agent 能够控制浏览器执行各种操作
- **多 LLM 支持**: 支持 OpenAI、Google (Gemini)、Anthropic (Claude)、ChatBrowserUse、以及本地模型 (Ollama)
- **自定义工具**: 开发者可以添加自定义工具扩展 agent 能力
- **CLI 工具**: 提供命令行工具进行快速浏览器操作
- **两种使用模式**:
  - **开源版**: 完全免费，需要自备 LLM API
  - **Cloud 版**: 托管服务，提供更好的 stealth 浏览器、代理轮换、CAPTCHA 解决

### 主要功能列表
| 功能 | 描述 |
|------|------|
| 页面导航 | 自动打开URL、点击链接 |
| 元素交互 | 点击、输入文本、下拉选择 |
| 截图 | 页面截图保存 |
| 认证管理 | 支持复用 Chrome 配置保存的登录态 |
| 表单填写 | 自动填写表单 |
| 等待/断言 | 等待元素出现、验证页面状态 |

## 2. 自动化能力 (Automation Capabilities)

### 可自动化的工作类型
- **信息采集**: 自动搜索、提取网页数据
- **表单提交**: 自动填写并提交各种表单
- **购物自动化**: 自动搜索商品、加购、下单
- **求职申请**: 自动搜索职位、填写申请表
- **内容发布**: 自动化社交媒体发布
- **测试自动化**: Web 应用测试

### 技术架构
```
User Task → LLM → Agent → Browser → Action Results
                    ↓
              Custom Tools (可扩展)
```

### 内置 Actions
- `click_element` - 点击元素
- `input_text` - 输入文本
- `go_to_url` - 导航到 URL
- `get_dropdown_options` - 获取下拉选项
- `select_dropdown_option` - 选择下拉选项
- `extract_content` - 提取页面内容
- `take_screenshot` - 截图
- `wait` - 等待
- `scroll` - 滚动页面

## 3. 安装使用 (Installation & Usage)

### 环境要求
- Python >= 3.11
- 推荐使用 [uv](https://docs.astral.sh/uv/) 包管理器

### 安装步骤

```bash
# 1. 初始化项目
uv init

# 2. 安装 browser-use
uv add browser-use

# 3. 安装 Chromium (如没有)
uvx browser-use install

# 4. 配置 .env (可选)
# BROWSER_USE_API_KEY=your-key
# GOOGLE_API_KEY=your-key
# ANTHROPIC_API_KEY=your-key
```

### 快速开始代码

```python
from browser_use import Agent, Browser
from browser_use import ChatBrowserUse  # 或 ChatGoogle, ChatAnthropic
import asyncio

async def main():
    browser = Browser()
    
    agent = Agent(
        task="Find the number of stars of the browser-use repo",
        llm=ChatBrowserUse(),  # 使用 browser-use 优化的模型
        browser=browser,
    )
    
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### CLI 用法

```bash
browser-use open https://example.com  # 打开 URL
browser-use state                      # 查看可点击元素
browser-use click 5                    # 点击元素 #5
browser-use type "Hello"               # 输入文本
browser-use screenshot page.png        # 截图
browser-use close                      # 关闭浏览器
```

## 4. 集成可能性分析

### 与 OpenClaw 集成的可行性: ⭐⭐⭐⭐⭐ (高)

#### 优势
1. **纯 Python 库**: 易于集成到 OpenClaw (本身是 Node.js + Python 混合架构)
2. **活跃社区**: 79k+ stars，持续维护更新
3. **Claude Code 已有 Skill**: 他们已经做了 Claude Code 的集成示例
4. **自定义工具接口**: 可以添加自定义 tools，与 OpenClaw 的工具系统对接
5. **MIT 许可证**: 开源免费，商业友好

#### 潜在挑战
1. **Python 环境**: 需要在 OpenClaw 中集成 Python 3.11+ 环境
2. **浏览器资源**: Chrome 内存占用较高，需要管理多浏览器实例
3. **异步处理**: 需要处理好 asyncio 与 Node.js 的事件循环
4. **LLM 集成**: 需要为 OpenClaw 的 LLM 配置做适配层

#### 集成方案设计

**方案 A: Python 子进程**
```
OpenClaw (Node.js) → spawn Python process → browser-use library
                                          → 控制 Chromium 浏览器
```

**方案 B: MCP 工具封装**
- 将 browser-use 封装为 MCP (Model Context Protocol) 工具
- 通过 stdio 或 HTTP 与 Python 进程通信
- 与现有的 browser tool 互补

**方案 C: 直接集成 (如已支持 Python)**
- 如运行环境已有 Python 3.11+，可尝试直接 import

### 推荐集成路径
1. **短期**: 作为外部工具调用，类似于现有的 browser-core skill
2. **中期**: 开发专门的 browser-use skill，支持自定义 tools
3. **长期**: 考虑深度集成，用 browser-use 替代或增强现有浏览器自动化能力

### 对比现有 browser-core

| 特性 | browser-core | browser-use |
|------|--------------|-------------|
| 控制方式 | Playwright CDP | Puppeteer/Playwright |
| AI 集成 | 无 | 内置 Agent 框架 |
| 自定义工具 | 有限 | 完整支持 |
| LLM 支持 | 无 | 多提供商 |
| 复杂度 | 中 | 中高 |

## 5. 结论与建议

**结论**: browser-use 是一个成熟的 AI 浏览器自动化库，功能强大，社区活跃，完全可以集成到 OpenClaw 中。

**建议**:
1. ✅ **强烈建议集成** - 它能显著提升 OpenClaw 的浏览器自动化能力
2. 📋 **下一步**: 
   - 测试安装 browser-use
   - 创建 browser-use skill
   - 对比与现有 browser-core 的能力差异
   - 设计 MCP 接口或直接调用方案
3. ⚠️ **注意**: 
   - 需要处理 Python 3.11+ 依赖
   - 考虑资源管理 (Chrome 内存)
   - 评估 LLM 成本 (使用自己的 API key)

---
*研究报告结束*