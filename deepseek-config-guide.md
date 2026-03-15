# DeepSeek 备用模型配置指南

## 配置完成情况

✅ 已完成的配置：
1. ✅ 在 `openclaw.json` 中添加了 DeepSeek 提供商配置
2. ✅ 设置了 DeepSeek Chat 模型作为备用模型
3. ✅ 配置了模型故障转移（fallback）规则

## 需要完成的步骤

### 1. 获取 DeepSeek API 密钥

访问 [DeepSeek API 平台](https://platform.deepseek.com/) 注册并获取 API 密钥。

### 2. 更新配置文件

编辑 `C:\Users\yodat\.openclaw\openclaw.json` 文件，将 DeepSeek API 密钥占位符替换为实际密钥：

```json
"deepseek": {
  "baseUrl": "https://api.deepseek.com",
  "apiKey": "YOUR_DEEPSEEK_API_KEY",  // 替换为实际的 API 密钥
  "api": "openai",
  "models": [
    {
      "id": "deepseek-chat",
      "name": "DeepSeek Chat",
      "reasoning": false,
      "input": ["text"],
      "cost": {
        "input": 0,
        "output": 0,
        "cacheRead": 0,
        "cacheWrite": 0
      },
      "contextWindow": 128000,
      "maxTokens": 8192
    }
  ]
}
```

### 3. 重启 OpenClaw Gateway

配置完成后，需要重启 OpenClaw Gateway 使配置生效：

```bash
openclaw gateway restart
```

## 配置说明

### 故障转移机制

- **主模型**: `xiaomi/mimo-v2-flash`（小米 MiMo V2 Flash）
- **备用模型**: `deepseek/deepseek-chat`（DeepSeek Chat）
- **触发条件**: 当小米模型超时、认证失败、速率限制或配额不足时，会自动切换到 DeepSeek 模型

### 工作流程

1. 首先使用小米模型（`xiaomi/mimo-v2-flash`）
2. 如果遇到以下错误，会自动切换到 DeepSeek 模型：
   - 超时（timeout）
   - 认证失败（auth）
   - 速率限制（rate_limit）
   - 配额不足（quota）
3. 切换后，会使用 DeepSeek 模型继续处理请求

### 模型别名

- `Xiaomi` → `xiaomi/mimo-v2-flash`
- `DeepSeek` → `deepseek/deepseek-chat`

## 验证配置

配置完成后，可以通过以下方式验证：

1. 检查配置文件语法是否正确
2. 重启 OpenClaw Gateway
3. 发送测试消息，观察模型切换行为

## 注意事项

1. **API 密钥安全**: 请妥善保管 DeepSeek API 密钥，不要泄露
2. **费用控制**: DeepSeek 模型可能会产生费用，请注意使用量
3. **模型兼容性**: DeepSeek Chat 模型支持 OpenAI API 兼容接口
4. **故障转移日志**: 可以在 OpenClaw 日志中查看模型切换的详细信息

## 相关文档

- [OpenClaw 模型故障转移文档](https://docs.openclaw.ai/concepts/model-failover)
- [OpenClaw 配置文档](https://docs.openclaw.ai/gateway/configuration)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)