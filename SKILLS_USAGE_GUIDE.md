# 恢复技能使用指南

## 🎯 已恢复的核心技能

### 1. Claude Code 技能系统 (13个技能)
**位置**: `/home/boz/.openclaw/workspace/skills-dev/skills/claude/`

| 技能 | 文件 | 功能描述 |
|------|------|----------|
| skillify | skillify.js | 技能创建和模板生成 |
| debug | debug.js | 调试和问题诊断 |
| dream | dream.js | 记忆整合和梦境模拟 |
| remember | remember.js | 记忆检索和管理 |
| hunter | hunter.js | 信息搜索和收集 |
| batch | batch.js | 批量任务处理 |
| updateConfig | updateConfig.js | 配置更新和管理 |
| verify | verify.js | 验证和确认 |
| stuck | stuck.js | 卡顿问题解决 |
| keybindings | keybindings.js | 快捷键管理 |
| simplify | simplify.js | 内容简化和摘要 |
| loremIpsum | loremIpsum.js | 占位文本生成 |
| loop | loop.js | 循环任务处理 |

### 2. 技能插件系统
**位置**: `/home/boz/.openclaw/workspace/openclaw-skills-plugin/`

- `index.js` - 主插件文件，集成13个技能到OpenClaw
- `package.json` - 插件配置

### 3. 自定义技能文档
**位置**: `/home/boz/.openclaw/workspace/skills/`

1. `soul-tech-absorber.md` - Soul APP技术吸收
2. `thinking-mode.md` - 5级思维模式系统
3. `session-memory-bridge.md` - 会话记忆桥接
4. `token-guard.md` - LLM限流监控
5. `agent-evolution-workflow.md` - 智能体进化工作流
6. `vcp-system.md` - VCP系统
7. `INDEX.md` - 技能索引

## 🚀 如何使用恢复的技能

### 方法1: 通过技能插件
```javascript
// 在OpenClaw中调用技能
const skills = require('./openclaw-skills-plugin');
skills.execute('debug', { problem: '系统卡顿' });
```

### 方法2: 直接调用技能文件
```bash
# 测试单个技能
node /home/boz/.openclaw/workspace/skills-dev/skills/claude/debug.js
```

### 方法3: 使用OpenClaw技能命令
```bash
# 列出所有技能
openclaw skills list

# 查看技能详情
openclaw skills info healthcheck
```

## 🔧 技能开发工作流

### 1. 创建新技能
```bash
# 使用skillify技能创建模板
node /home/boz/.openclaw/workspace/skills-dev/skills/claude/skillify.js create "新技能名"
```

### 2. 测试技能
```bash
# 运行测试
node /home/boz/.openclaw/workspace/skills-dev/test-simple.js

# 批量测试
node /home/boz/.openclaw/workspace/skills-dev/test-batch.js
```

### 3. 集成到OpenClaw
1. 将技能文件复制到系统技能目录
2. 更新技能插件配置
3. 重启OpenClaw Gateway

## 📊 技能状态监控

### 实时监控
```bash
# 查看技能执行日志
tail -f /home/boz/.openclaw/workspace/logs/skills.log

# 监控会话记录
tail -f /home/boz/.openclaw/workspace/logs/chat-preserver.log
```

### 健康检查
```bash
# 运行技能健康检查
node /home/boz/.openclaw/workspace/test-restored-skills.js
```

## 🎯 下一步开发计划

### 短期目标 (1周)
1. ✅ 恢复所有技能代码和文档
2. 🔄 测试核心技能功能
3. ⏳ 集成技能插件到OpenClaw
4. ⏳ 开发镜子系统原型

### 中期目标 (1个月)
1. 实现VCP系统集成
2. 完善自主进化工作流
3. 建立技能测试框架
4. 贡献回馈OpenClaw社区

### 长期目标 (3个月)
1. 实现完全自主进化
2. 建立技能生态系统
3. 开发可视化技能管理界面

## 🆘 故障排除

### 常见问题
1. **技能不显示**: 检查技能目录权限和配置文件
2. **技能执行失败**: 查看技能日志和错误信息
3. **插件不工作**: 确认OpenClaw Gateway已重启

### 调试命令
```bash
# 检查技能目录
ls -la /home/boz/.openclaw/workspace/skills-dev/

# 检查插件状态
node /home/boz/.openclaw/workspace/openclaw-skills-plugin/index.js --test

# 查看系统日志
journalctl -u openclaw --since "1 hour ago"
```

## 📞 支持与反馈

- **文档**: `/home/boz/.openclaw/workspace/skills/INDEX.md`
- **日志**: `/home/boz/.openclaw/workspace/logs/`
- **测试**: `/home/boz/.openclaw/workspace/test-restored-skills.js`

---
*技能是智能体的翅膀，持续进化才能飞得更高。* 🍎
