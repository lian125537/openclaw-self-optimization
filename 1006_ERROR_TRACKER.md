# 🔴 1006错误追踪日志

## 📋 目的
记录每次1006错误的根本原因、位置和解决方案，建立快速诊断机制。

## 🚨 错误模式
1006错误通常是WebSocket连接断开，可能原因：
1. Gateway服务停止/重启
2. 网络连接中断
3. 系统资源不足
4. 配置变更触发重启
5. 系统维护操作

## 📊 错误记录表

### 错误 #1: 2026-04-16 05:33:07
**发生时间**: 05:33:07 CST
**检测时间**: 05:36 (用户报告)

#### 🔍 错误详情
```
系统日志:
2026-04-16T05:33:06.710+08:00 [gateway] signal SIGTERM received
2026-04-16T05:33:06.715+08:00 [gateway] received SIGTERM; shutting down
2026-04-16T05:33:06.953+08:00 [ws] webchat disconnected code=1012 reason=service restart conn=a6adb746-1269-47a6-bf24-e9c2d9ccc023
2026-04-16T05:33:07 boz-VMware-Virtual-Platform systemd[2161]: Stopped openclaw-gateway.service - OpenClaw Gateway (v2026.4.14).
```

#### 🎯 根本原因
**直接原因**: Gateway服务收到SIGTERM信号被停止
**触发操作**: 执行了`apply-embedding-config.sh`脚本中的`systemctl --user stop openclaw-gateway.service`
**脚本位置**: `/home/boz/.openclaw/workspace/apply-embedding-config.sh`
**问题代码**: 
```bash
# 第24行
systemctl --user stop openclaw-gateway.service 2>/dev/null
```

#### ⚠️ 问题分析
1. **脚本设计缺陷**: 无条件停止服务，没有检查服务状态
2. **重启逻辑问题**: 停止后立即启动，但中间有2秒延迟
3. **用户影响**: WebSocket连接断开，Control UI显示1006错误
4. **恢复时间**: 约3-4分钟（从05:33到05:36用户发现）

#### ✅ 解决方案
**立即修复**:
```bash
# 启动Gateway服务
systemctl --user start openclaw-gateway.service

# 验证状态
systemctl --user status openclaw-gateway.service
curl http://127.0.0.1:18789/health
```

**长期修复**:
1. 修改脚本，先检查服务状态再决定是否停止
2. 添加服务状态监控
3. 建立优雅重启机制

#### 🔧 修复脚本
```bash
#!/bin/bash
# 安全重启Gateway服务

# 检查服务状态
if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "✅ Gateway服务运行中，执行优雅重启..."
    systemctl --user restart openclaw-gateway.service
else
    echo "⚠️ Gateway服务未运行，直接启动..."
    systemctl --user start openclaw-gateway.service
fi

# 等待并验证
sleep 3
if curl -s http://127.0.0.1:18789/health >/dev/null; then
    echo "✅ Gateway启动成功"
else
    echo "❌ Gateway启动失败，尝试备用方案..."
    openclaw gateway start
fi
```

#### 📍 相关文件
1. **错误脚本**: `/home/boz/.openclaw/workspace/apply-embedding-config.sh`
2. **服务配置**: `/home/boz/.config/systemd/user/openclaw-gateway.service`
3. **系统日志**: `journalctl --user -u openclaw-gateway.service`
4. **监控脚本**: `/home/boz/.openclaw/workspace/system-health-check.sh`

#### 🛡️ 预防措施
1. **脚本安全**: 所有服务操作脚本必须包含状态检查
2. **监控告警**: 建立Gateway服务状态监控
3. **用户通知**: 服务重启前通知用户
4. **回滚机制**: 快速恢复脚本

## 🚀 快速诊断流程

### 当出现1006错误时，立即执行：

#### 步骤1: 检查Gateway服务状态 (5秒)
```bash
systemctl --user status openclaw-gateway.service | head -10
```

#### 步骤2: 检查健康端点 (3秒)
```bash
curl -s http://127.0.0.1:18789/health || echo "Gateway不可访问"
```

#### 步骤3: 检查最近日志 (10秒)
```bash
journalctl --user -u openclaw-gateway.service --since "5 minutes ago" | tail -20
```

#### 步骤4: 快速恢复 (15秒)
```bash
# 如果服务停止
systemctl --user start openclaw-gateway.service
sleep 3
curl http://127.0.0.1:18789/health && echo "✅ 恢复成功"
```

### 常见恢复命令
```bash
# 1. 简单重启
openclaw gateway restart

# 2. 系统服务重启
systemctl --user restart openclaw-gateway.service

# 3. 直接启动
openclaw gateway start

# 4. 检查端口占用
ss -tlnp | grep :18789
```

## 📈 错误统计

| 日期 | 次数 | 平均恢复时间 | 主要原因 |
|------|------|--------------|----------|
| 2026-04-16 | 1 | 4分钟 | 脚本无条件停止服务 |

## 🔧 改进计划

### 短期改进 (今天)
1. [ ] 修复`apply-embedding-config.sh`脚本
2. [ ] 创建安全服务操作函数库
3. [ ] 添加服务状态监控到健康检查

### 中期改进 (1周)
1. [ ] 实现优雅重启机制
2. [ ] 建立自动故障转移
3. [ ] 创建用户通知系统

### 长期改进 (1月)
1. [ ] 实现高可用架构
2. [ ] 建立完整的监控告警系统
3. [ ] 创建自愈系统

## 📞 紧急联系人/脚本

### 快速恢复脚本
```bash
# 保存为: /home/boz/.openclaw/workspace/fix-1006.sh
#!/bin/bash
echo "🔧 修复1006错误..."
systemctl --user start openclaw-gateway.service
sleep 3
if curl -s http://127.0.0.1:18789/health; then
    echo "✅ Gateway恢复成功"
else
    echo "❌ 恢复失败，尝试备用方案..."
    openclaw gateway start
fi
```

### 监控脚本
```bash
# 保存为: /home/boz/.openclaw/workspace/monitor-gateway.sh
#!/bin/bash
if ! curl -s --max-time 5 http://127.0.0.1:18789/health >/dev/null; then
    echo "🚨 Gateway服务异常！" >> /tmp/gateway-alert.log
    systemctl --user restart openclaw-gateway.service
fi
```

## 🍎 经验教训
> **"1006错误不是技术问题，是运维问题。我们需要的是预防，不是修复。"**

**核心原则**:
1. **永远不要无条件停止服务**
2. **所有操作前检查状态**
3. **建立监控和告警**
4. **记录每次错误的根本原因**

**当前状态**: 错误已记录，根本原因明确，修复方案制定。

---
*最后更新: 2026-04-16 05:38*  
*状态: 错误分析完成，预防措施制定* 🔧