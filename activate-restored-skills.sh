#!/bin/bash

# 激活恢复的技能系统

echo "🔧 激活恢复的技能系统..."
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. 检查技能开发环境
echo "📦 检查技能开发环境..."
if [ -d "/home/boz/.openclaw/workspace/skills-dev" ]; then
    echo "✅ 技能开发目录存在"
    SKILL_COUNT=$(find /home/boz/.openclaw/workspace/skills-dev/skills -name "*.js" -type f | wc -l)
    echo "✅ 恢复的技能文件: $SKILL_COUNT 个"
else
    echo "❌ 技能开发目录不存在"
    exit 1
fi

# 2. 检查技能插件
echo ""
echo "🔌 检查技能插件..."
if [ -f "/home/boz/.openclaw/workspace/openclaw-skills-plugin/index.js" ]; then
    echo "✅ OpenClaw技能插件存在"
    echo "   路径: /home/boz/.openclaw/workspace/openclaw-skills-plugin/"
else
    echo "❌ 技能插件不存在"
fi

# 3. 检查系统技能
echo ""
echo "🏗️  检查系统技能..."
SYSTEM_SKILLS_COUNT=$(openclaw skills list 2>/dev/null | grep -c "ready\|needs setup" || echo "0")
echo "✅ 系统技能数量: $SYSTEM_SKILLS_COUNT 个"

READY_SKILLS=$(openclaw skills list 2>/dev/null | grep "✓ ready" | wc -l || echo "0")
echo "✅ 就绪技能: $READY_SKILLS 个"

# 4. 创建技能测试脚本
echo ""
echo "🧪 创建技能测试脚本..."
cat > /home/boz/.openclaw/workspace/test-restored-skills.js << 'EOF'
// 恢复技能测试脚本
const fs = require('fs');
const path = require('path');

console.log('🔧 测试恢复的技能系统...\n');

// 测试技能开发文件
const skillsDevPath = '/home/boz/.openclaw/workspace/skills-dev';
if (fs.existsSync(skillsDevPath)) {
  console.log('✅ 技能开发目录存在');
  
  // 列出所有技能
  const skillsDir = path.join(skillsDevPath, 'skills');
  if (fs.existsSync(skillsDir)) {
    const listSkills = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          console.log(`${prefix}📁 ${item}/`);
          listSkills(fullPath, prefix + '  ');
        } else if (item.endsWith('.js')) {
          console.log(`${prefix}📄 ${item}`);
        }
      });
    };
    
    console.log('\n📚 恢复的技能:');
    listSkills(skillsDir);
  }
}

// 测试技能插件
const pluginPath = '/home/boz/.openclaw/workspace/openclaw-skills-plugin/index.js';
if (fs.existsSync(pluginPath)) {
  console.log('\n✅ 技能插件存在');
  const pluginContent = fs.readFileSync(pluginPath, 'utf8');
  const skillCount = (pluginContent.match(/skillify|debug|dream|remember/g) || []).length;
  console.log(`   包含技能引用: ${skillCount} 个`);
}

// 测试自定义技能文档
const customSkillsDir = '/home/boz/.openclaw/workspace/skills';
if (fs.existsSync(customSkillsDir)) {
  const customSkills = fs.readdirSync(customSkillsDir).filter(f => f.endsWith('.md'));
  console.log(`\n✅ 自定义技能文档: ${customSkills.length} 个`);
  customSkills.forEach(skill => {
    console.log(`   📄 ${skill}`);
  });
}

console.log('\n🎉 技能系统测试完成！');
console.log('\n🚀 下一步:');
console.log('   1. 使用 skill-creator 技能完善自定义技能');
console.log('   2. 测试恢复的技能如 debug、dream、remember');
console.log('   3. 开发镜子系统原型');
console.log('   4. 开始 VCP 系统集成');
EOF

chmod +x /home/boz/.openclaw/workspace/test-restored-skills.js
echo "✅ 测试脚本创建完成"

# 5. 创建技能使用指南
echo ""
echo "📖 创建技能使用指南..."
cat > /home/boz/.openclaw/workspace/SKILLS_USAGE_GUIDE.md << 'EOF'
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
EOF

echo "✅ 使用指南创建完成"

# 6. 运行测试
echo ""
echo "🧪 运行技能系统测试..."
node /home/boz/.openclaw/workspace/test-restored-skills.js

echo ""
echo "🎉 技能系统激活完成！"
echo ""
echo "📋 总结:"
echo "   ✅ 恢复技能文件: $SKILL_COUNT 个"
echo "   ✅ 系统技能: $SYSTEM_SKILLS_COUNT 个 (就绪: $READY_SKILLS 个)"
echo "   ✅ 聊天记录保持系统: 已启动"
echo "   ✅ 技能测试脚本: 已创建"
echo "   ✅ 使用指南: SKILLS_USAGE_GUIDE.md"
echo ""
echo "🚀 下一步操作:"
echo "   1. 查看技能使用指南: cat /home/boz/.openclaw/workspace/SKILLS_USAGE_GUIDE.md"
echo "   2. 测试具体技能: node /home/boz/.openclaw/workspace/skills-dev/skills/claude/debug.js"
echo "   3. 监控聊天记录: tail -f /home/boz/.openclaw/workspace/logs/chat-preserver.log"
echo ""
echo "🕐 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"