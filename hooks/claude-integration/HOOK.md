---
name: claude-integration
description: "集成Claude核心组件到OpenClaw：错误分类、工具验证、上下文压缩"
metadata:
  { "openclaw": { "emoji": "🧠", "events": ["message:preprocessed", "gateway:startup"], "requires": { "bins": ["node"] } } }
---

# Claude集成钩子

将Claude 4.6的核心严谨性组件集成到OpenClaw：

## 功能

1. **工具调用验证** - 在消息预处理阶段检查工具调用的安全性
2. **错误分类处理** - 自动分类和处理运行时错误
3. **上下文智能压缩** - 优化长对话的上下文管理
4. **代码执行安全** - 提供安全的代码执行沙盒环境

## 要求

- Node.js 18+
- Claude核心组件移植库 (`claude-core-porting`)

## 配置

在OpenClaw配置中启用：

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "claude-integration": {
          "enabled": true,
          "env": {
            "CLAUDE_CORE_PATH": "./claude-core-porting"
          }
        }
      }
    }
  }
}
```

## 事件处理

- `message:preprocessed`: 检查消息中的工具调用，进行安全性验证
- `gateway:startup`: 初始化Claude核心组件

## 集成组件

1. **ErrorClassifier** - Claude错误分类引擎
2. **ContextCompressor** - 智能上下文压缩
3. **ToolCallValidator** - 工具调用安全验证
4. **CodeSandbox** - 安全代码执行沙盒