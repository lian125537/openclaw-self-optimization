# 系统化1006触发测试计划

## 当前稳定基线
```
配置: DeepSeek模型 + 简单token + 无插件
状态: 已稳定运行17分钟 (PID: 23869)
```

## 测试原则
1. **一次只改一个变量**
2. **改前备份配置**
3. **监控5分钟**
4. **记录结果**
5. **触发1006立即回滚**

## 测试项目清单

### A. 认证相关测试
1. **A1: 无认证 → token认证**
   - 当前: `auth.mode: "none"`
   - 测试: `auth.mode: "token", token: "test-token"`
   - 风险: 低

2. **A2: token认证 → 复杂token**
   - 当前: 简单token
   - 测试: 长token、特殊字符token
   - 风险: 中

### B. 模型相关测试  
3. **B1: DeepSeek → MiniMax**
   - 当前: DeepSeek (稳定)
   - 测试: MiniMax M2.7 (有API key)
   - 风险: 高 (之前崩溃)

4. **B2: 模型ID格式**
   - 当前: `deepseek/deepseek-chat` (正确)
   - 测试: `openai/deepseek-chat` (错误格式)
   - 风险: 高

### C. 插件相关测试
5. **C1: 启用单个插件**
   - 当前: 无插件
   - 测试: 启用`active-memory`插件
   - 风险: 中

6. **C2: 启用多个插件**
   - 测试: 启用2-3个简单插件
   - 风险: 高

### D. 环境变量测试
7. **D1: 添加环境变量**
   - 当前: 无环境变量
   - 测试: 添加`OPENCLAW_MEMORY_EMBEDDING_API_KEY`
   - 风险: 极高 (之前立即崩溃)

8. **D2: 复杂环境变量**
   - 测试: 多个环境变量组合
   - 风险: 极高

### E. 配置复杂度测试
9. **E1: 添加次要配置**
   - 测试: 添加`logging`、`compaction`配置
   - 风险: 低

10. **E2: 完整生产配置**
    - 测试: 完整配置（所有字段）
    - 风险: 中

## 测试执行脚本

```bash
#!/bin/bash
# 1006-systematic-test.sh

# 1. 备份当前稳定配置
cp /home/boz/.openclaw/openclaw.json /home/boz/.openclaw/openclaw.json.baseline

# 2. 测试函数
test_config() {
    local test_name="$1"
    local config_file="$2"
    
    echo "🧪 测试: $test_name"
    
    # 应用配置
    cp "$config_file" /home/boz/.openclaw/openclaw.json
    
    # 重启Gateway
    pkill -f "openclaw.*gateway"
    sleep 2
    openclaw gateway start
    
    # 等待启动
    sleep 5
    
    # 监控5分钟
    echo "监控5分钟..."
    for i in {1..10}; do
        sleep 30
        if curl -s http://127.0.0.1:18789/health >/dev/null; then
            echo "✅ 第${i}次检查: 正常"
        else
            echo "❌ 第${i}次检查: 1006触发!"
            return 1
        fi
    done
    
    echo "✅ 测试通过: $test_name"
    return 0
}

# 3. 执行测试
# test_config "A1-token认证" /path/to/config-a1.json
# test_config "B1-MiniMax模型" /path/to/config-b1.json
# ... 以此类推
```

## 预期结果

### 可能触发1006的：
1. ❌ **环境变量污染** (极高概率)
2. ❌ **MiniMax无API key** (高概率)  
3. ❌ **错误模型ID格式** (高概率)
4. ❌ **复杂插件组合** (中概率)

### 可能安全的：
1. ✅ **token认证** (低风险)
2. ✅ **简单插件** (低风险)
3. ✅ **次要配置** (低风险)

## 紧急恢复方案

```bash
# 检测到1006立即执行
#!/bin/bash
# emergency-recovery.sh

echo "🚨 检测到1006，紧急恢复..."

# 1. 恢复基线配置
cp /home/boz/.openclaw/openclaw.json.baseline /home/boz/.openclaw/openclaw.json

# 2. 清理环境变量
unset OPENCLAW_MEMORY_EMBEDDING_* 2>/dev/null

# 3. 重启Gateway
pkill -f "openclaw.*gateway"
sleep 2
openclaw gateway start

# 4. 验证恢复
sleep 5
if curl -s http://127.0.0.1:18789/health; then
    echo "✅ 紧急恢复成功"
else
    echo "❌ 紧急恢复失败，需要人工干预"
fi
```

## 测试记录表

| 测试ID | 测试内容 | 结果 | 触发1006? | 备注 |
|--------|----------|------|-----------|------|
| A1 | token认证 | 待测试 | ? | |
| A2 | 复杂token | 待测试 | ? | |
| B1 | MiniMax模型 | 待测试 | ? | 高风险 |
| B2 | 错误模型ID | 待测试 | ? | 高风险 |
| C1 | 单个插件 | 待测试 | ? | |
| C2 | 多个插件 | 待测试 | ? | 高风险 |
| D1 | 环境变量 | 待测试 | ? | 极高风险 |
| D2 | 复杂环境 | 待测试 | ? | 极高风险 |
| E1 | 次要配置 | 待测试 | ? | |
| E2 | 完整配置 | 待测试 | ? | |

## 结论目标

通过系统化测试，找出：
1. **哪些配置100%触发1006** - 永久避免
2. **哪些配置可能触发** - 谨慎使用
3. **哪些配置安全** - 可以放心使用

最终建立**安全配置白名单**和**危险配置黑名单**。