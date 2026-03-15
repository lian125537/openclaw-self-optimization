# OpenClaw 成本审计报告 (过去72小时)
*生成时间: 2026-03-15 02:16:01*

## 1. 总体统计
- 活跃会话数: 15
- 总消息数: 0
- 总Token消耗: 8,378,201

## 2. 模型使用统计
- **deepseek-ai/DeepSeek-V3.2**: 6,344,608 tokens
- **gemini-2.5-flash-lite**: 1,617,538 tokens
- **gemini-3.1-flash-lite-preview**: 416,055 tokens
- **gateway-injected**: 0 tokens
- **gemini-2.5-pro-exp-03-25**: 0 tokens

## 3. 工具使用统计

## 4. 消耗最高的会话
### 第1名: 6609cc0c
- Token数: 6,031,757
- 消息数: 203
- 使用模型: gemini-2.5-pro-exp-03-25, gateway-injected, gemini-3.1-flash-lite-preview, gemini-2.5-flash-lite, deepseek-ai/DeepSeek-V3.2

### 第2名: 1011af02
- Token数: 524,486
- 消息数: 13
- 使用模型: deepseek-ai/DeepSeek-V3.2

### 第3名: f2d01ea9
- Token数: 361,562
- 消息数: 15
- 使用模型: deepseek-ai/DeepSeek-V3.2

### 第4名: 2d5b87aa
- Token数: 299,081
- 消息数: 16
- 使用模型: deepseek-ai/DeepSeek-V3.2

### 第5名: 91a6e590
- Token数: 282,436
- 消息数: 14
- 使用模型: deepseek-ai/DeepSeek-V3.2

## 5. Steve Jobs 成本洞察
### 🔍 审计关键发现:
1. **Token使用效率** - 检查是否有循环调用或不必要的工具使用
2. **模型选择优化** - DeepSeek-V3可能是主要成本来源
3. **会话生命周期** - 长时间的会话可能导致token累积

### 💡 乔布斯式建议:
1. **简化工作流程** - '简单是终极的复杂' - 减少不必要的工具调用
2. **批量处理** - 聚合任务以减少模型调用次数
3. **定期清理** - 关闭不再使用的会话
4. **成本意识** - '保持饥饿，保持节俭' - 监控高成本会话

## 6. 潜在问题检查
### ❗ 需要关注:
1. **心跳循环** - 检查是否有频繁的HEARTBEAT_CHECK或定期cron任务
2. **内存泄漏问题** - 检查是否有工具调用失败导致的重试循环
3. **长会话成本** - 识别运行时间超长的会话