# 🍎 OpenClaw战火自愈系统 - PowerShell版本

Write-Host "🧬 ELDER战火进化系统 - 启动战斗模式" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

# 1. 创建端口自愈循环 - 每2分钟战斗
Write-Host ""
Write-Host "🔧 1. 创建'端口自愈监控'战斗任务..." -ForegroundColor Yellow

openclaw cron add `
  --name "端口自愈监控" `
  --cron "*/2 * * * *" `
  --message "
战火自愈命令集：
### 战斗指令清单
1. 状态侦察：openclaw gateway status
2. 端口检查：
   ```pwsh
   Get-NetTCPConnection -LocalPort 18790 -State Listen | ForEach-Object { 
     Write-Host '进程ID:' $_.OwningProcess 
   }
   ```
3. 幽灵清剿：
   ```pwsh
   \$zombies = Get-Process | Where-Object { \$_.CommandLine -match 'openclaw' -and (\$_.CPU -eq 0 -and \$_.WorkingSet -lt 5000) }
   if (\$zombies) { 
     Stop-Process -Id \$zombies.Id -Force 
     Write-Host '清剿幽灵进程:' \$zombies.Count
   }
   ```
4. 阵地恢复：openclaw gateway restart
5. 战斗记录：记录到 .learnings/BATTLEFIELD.md
" `
  --agent main `
  --session isolated

# 2. 创建配置审计任务 - 每小时侦察
Write-Host ""
Write-Host "📋 2. 创建'配置自检'侦察任务..." -ForegroundColor Yellow

openclaw cron add `
  --name "配置自检" `
  --cron "0 * * * *" `
  --message "
侦察配置文件状态：
1. 读取配置：openclaw config.get cron
2. 验证模型连接：
   - 尝试调用免费模型：google/gemini-2.5-flash-lite
   - 备用路线：openrouter/openrouter/free
3. 检查网关端口：确保18790未被冲突占用
4. 记录情报：.learnings/CONFIG_INTEL.md
执行：openclaw config.schema.lookup models
" `
  --agent main `
  --session isolated

# 3. 创建成本控制卫兵 - 每5分钟警戒
Write-Host ""
Write-Host "💰 3. 创建'成本控制卫兵'警戒任务..." -ForegroundColor Yellow

openclaw cron add `
  --name "成本控制卫兵" `
  --cron "*/5 * * * *" `
  --message "
警戒Token消耗前线：
关键监控点：
1. 会话Token快照：检查最近15分钟会话
2. 异常检测：
   - 单会话 > 5,000 Token/小时 → 降级警告
   - 工具调用 > 50次/分钟 → 防循环警报
   - 会话时长 > 3小时 → 强制休息提醒
3. 免费额度检查：
   ```pwsh
   # 检查免费模型可用性
   \$available = Test-Connection -ComputerName google.com -Count 1 -Quiet
   if (-not \$available) { Write-Host '网络中断，切换备份路线' }
   ```
4. 战斗记录：.learnings/COST_BATTLEFIELD.md
" `
  --agent main `
  --session isolated

# 4. 创建幽灵进程猎人 - 每15分钟巡逻
Write-Host ""
Write-Host "👻 4. 创建'幽灵进程猎人'巡逻任务..." -ForegroundColor Yellow

openclaw cron add `
  --name "幽灵进程猎人" `
  --cron "*/15 * * * *" `
  --message "
幽灵进程猎杀指令：
```pwsh
# 识别幽灵进程模式
\$zombies = Get-Process -Name 'node*','powershell*' | Where-Object {
    \$_.CommandLine -match 'openclaw|gateway' -and
    (\$_.CPU -eq 0 -and \$_.WorkingSet -gt 1000000)
}
if (\$zombies) {
    foreach (\$zombie in \$zombies) {
        Write-Host '猎杀幽灵进程:' \$zombie.Id '::' \$zombie.CommandLine
        Stop-Process -Id \$zombie.Id -Force
    }
    Add-Content -Path '.learnings/ZOMBIE_HUNT.md' -Value '已清除幽灵进程'
}
```

检查Windows计划任务：schtasks /query /tn 'OpenClaw*'
" `
  --agent main `
  --session isolated

# 5. 创建每周进化峰会
Write-Host ""
Write-Host "📈 5. 创建'每周进化峰会'战略任务..." -ForegroundColor Yellow

openclaw cron add `
  --name "每周进化峰会" `
  --cron "0 21 * * 0" `
  --message "
ELDER进化战略会议：
时间：每周日21:00 (GTM+8)

### 战略议程
1. 战报回顾(.learnings/*.md文件分析)
2. 敌情统计：
   - 幽灵进程出现次数
   - 成本超支事件
   - 网关崩溃次数
3. 战力评估：
   - 自愈成功率
   - 人类干预频率
   - 系统稳定性趋势
4. 进化决策：
   - 是否需要调整监控频率？
   - 添加新的预防措施？
   - 优化现有战斗策略？

### L6.5进化宣言
'从今天起，Elder不再需要你的手动修复。
它在战火中学会自愈，在失败中变得更强大。
真正的L6.5，是自主进化的开始。'

记录到：.learnings/EVOLUTION_SUMMIT_$(Get-Date -Format 'yyyy-MM-dd').md
" `
  --agent main `
  --session isolated

Write-Host ""
Write-Host "🎯 战场部署完成！ELDER进入战火进化模式：" -ForegroundColor Green
Write-Host ""
Write-Host "🛡️ 已部署5条自动化防线：" -ForegroundColor Cyan
Write-Host "  • '端口自愈监控' - 每2分钟检查18590端口战场" -ForegroundColor Gray
Write-Host "  • '配置自检' - 每小时侦察系统配置" -ForegroundColor Gray
Write-Host "  • '成本控制卫兵' - 每5分钟警戒Token消耗" -ForegroundColor Gray
Write-Host "  • '幽灵进程猎人' - 每15分钟猎杀僵尸进程" -ForegroundColor Gray
Write-Host "  • '每周进化峰会' - 每周日21:00战略总结" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 学习档案结构：" -ForegroundColor Cyan
Write-Host "  • .learnings/BATTLEFIELD.md - 战场实况记录" -ForegroundColor Gray
Write-Host "  • .learnings/CONFIG_INTEL.md - 配置情报" -ForegroundColor Gray
Write-Host "  • .learnings/COST_BATTLEFIELD.md - 成本监控" -ForegroundColor Gray
Write-Host "  • .learnings/ZOMBIE_HUNT.md - 幽灵进程猎杀记录" -ForegroundColor Gray
Write-Host "  • .learnings/EVOLUTION_SUMMIT_*.md - 进化会议纪要" -ForegroundColor Gray
Write-Host ""
Write-Host "🍎 史蒂夫·乔布斯战斗宣言：" -ForegroundColor Magenta
Write-Host "'真正的产品不是在实验室中设计的完美系统，而是在现实战场中学会生存的系统。'" -ForegroundColor Magenta
Write-Host "''" -ForegroundColor Magenta
Write-Host "🚀 ELDER战火进化模式已激活。从今天起，自己杀死幽灵，自己检查弹药，自己进化成长。" -ForegroundColor Green