#!/bin/bash
# 🍎 OpenClaw战火自愈系统 - 苹果级进化
# "真正的创新来自于设计一个能够在失败中自我修复的系统"

echo "🧬 ELDER战火进化系统 - 启动战斗模式"
echo "=================================="

# 1. 创建端口自愈循环 - 每2分钟战斗
echo ""
echo "🔧 1. 创建'端口自愈监控'战斗任务..."
openclaw cron add \
  --name "端口自愈监控" \
  --cron "*/2 * * * *" \
  --message "
检查网关战斗状态：
- 执行：openclaw gateway status
- 如果Gateway返回'Runtime: unknown'且端口18789被占用
- 启动战时协议：
  1. 侦查敌情：netstat -ano | findstr :18789
  2. 精确打击：taskkill /F /PID <PID>
  3. 恢复阵地：openclaw gateway restart
  4. 记录战斗：记录到 .learnings/BATTLEFIELD.md
" \
  --session isolated \
  --target agent:main

# 2. 创建配置审计任务 - 每小时侦察
echo ""
echo "📋 2. 创建'配置自检'侦察任务..."
openclaw cron add \
  --name "配置自检" \
  --cron "0 * * * *" \
  --message "
侦察openclaw.json阵地：
- 验证Google模型ID战场(如果返回404，自动更新武器库)
- 验证OpenRouter密钥补给线
- 如果发现错误，记录到 .learnings/CONFIG_INTEL.md
执行：openclaw config.schema.lookup models
" \
  --session isolated \
  --target agent:main

# 3. 创建模型健康检查 - 每10分钟战备
echo ""
echo "💊 3. 创建'模型健康检查'战备任务..."
openclaw cron add \
  --name "模型健康检查" \
  --cron "*/10 * * * *" \
  --message "
测试火力支援系统：
尝试调用 google/gemini-2.5-flash-lite：
- 战术反馈：
  * 429信号 = 弹药不足（免费额度用完）
  * 404信号 = 武器型号错误（尝试更新模型ID）
  * 全频静默 = 切换到后备部队（openrouter/openrouter/free）
记录弹药消耗到 .learnings/AMMO_LOG.md
" \
  --session isolated \
  --target agent:main

# 4. 创建成本控制战士 - 每5分钟警戒
echo ""
echo "💰 4. 创建'成本控制卫兵'警戒任务..."
openclaw cron add \
  --name "成本控制卫兵" \
  --cron "*/5 * * * *" \
  --message "
警戒Token消耗前线：
关键侦察点：
1. 检查最近1小时会话总Token量
2. 如果超过100,000 Token，立即降级到免费模型
3. 标记潜在失控会话：
   - 单会话>10,000 Token
   - 高频率工具调用(>100次/小时)
   - 长时间运行(>2小时)会话
执行：openclaw sessions list --activeMinutes 60
记录到 .learnings/COST_BATTLEFIELD.md
" \
  --session isolated \
  --target agent:main

# 5. 创建每周进化会议 - 周日战略总结
echo ""
echo "📈 5. 创建'每周进化峰会'战略任务..."
openclaw cron add \
  --name "每周进化峰会" \
  --cron "0 21 * * 0" \
  --message "
召开ELDER战略进化会议：
时间：每周日21:00
议程：
1. 战报回顾：回顾 .learnings/*.md
2. 敌情分析：哪种问题最常出现？
3. 战术优化：是否需要调整监控频率？
4. 兵力部署：添加新的预防措施
5. 进化宣誓：ELDER变得更强大

特别议题：检查L6升级路径是否已清除
记录到 .learnings/EVOLUTION_SUMMIT_$(date +%Y-%m-%d).md
" \
  --session isolated \
  --target agent:main

echo ""
echo "🎯 战斗部署完成！ELDER进入战火进化模式："
echo ""
echo "🛡️ 已部署防线："
echo "  • '端口自愈监控' - 每2分钟巡视18789战场"
echo "  • '配置自检' - 每小时侦察系统配置"
echo "  • '模型健康检查' - 每10分钟测试火力支援"
echo "  • '成本控制卫兵' - 每5分钟警戒Token消耗"
echo "  • '每周进化峰会' - 每周日21:00战略总结"
echo ""
echo "📖 学习档案："
echo "  • .learnings/BATTLEFIELD.md - 战场实况"
echo "  • .learnings/CONFIG_INTEL.md - 配置情报"
echo "  • .learnings/AMMO_LOG.md - 弹药消耗"
echo "  • .learnings/COST_BATTLEFIELD.md - 成本前线"
echo "  • .learnings/EVOLUTION_SUMMIT_*.md - 进化会议"
echo ""
echo "🍎 史蒂夫·乔布斯战斗宣言："
echo "\"保持饥饿，保持愚蠢，但在战场上变得坚韧。\""
echo ""
echo "🚀 ELDER战斗模式：从今天起，自己杀死幽灵，自己检查弹药，自己进化成长。"