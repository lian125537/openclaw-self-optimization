# 聊天优化进度报告
function Report-ChatProgress {
    param(
        [string]$TaskName,
        [int]$TotalSeconds,
        [string[]]$Stages
    )
    
    $startTime = Get-Date
    $stageTime = [math]::Round($TotalSeconds / $Stages.Count)
    
    Write-Output "`n📊 **任务进度监控**"
    Write-Output "**任务:** $TaskName"
    Write-Output "**总时长:** ${TotalSeconds}秒"
    Write-Output "**开始时间:** $($startTime.ToString('HH:mm:ss'))"
    Write-Output "**阶段:** $($Stages.Count)个阶段"
    Write-Output ""
    
    # 显示初始进度
    Write-Output "▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️ 0% (等待开始)"
    Write-Output ""
    
    # 执行每个阶段
    for ($i = 0; $i -lt $Stages.Count; $i++) {
        $stageName = $Stages[$i]
        $stagePercent = [math]::Round(($i + 1) / $Stages.Count * 100)
        
        Write-Output "▶️ **阶段 $($i+1)/$($Stages.Count):** $stageName"
        Write-Output "⏱️ 预计: ${stageTime}秒"
        
        # 模拟阶段执行
        Start-Sleep -Seconds $stageTime
        
        # 更新进度条
        $filled = [math]::Round($stagePercent / 10)
        $progressBar = ""
        for ($j = 1; $j -le 10; $j++) {
            if ($j -le $filled) {
                $progressBar += "🟩"
            } else {
                $progressBar += "⬜"
            }
        }
        
        $elapsed = (Get-Date - $startTime).TotalSeconds
        $remaining = $TotalSeconds - $elapsed
        
        Write-Output "$progressBar $stagePercent%"
        Write-Output "⏰ 已用: $([math]::Round($elapsed))秒 | 剩余: $([math]::Round($remaining))秒"
        Write-Output ""
    }
    
    $actualTime = (Get-Date - $startTime).TotalSeconds
    Write-Output "✅ **任务完成**"
    Write-Output "**实际耗时:** $([math]::Round($actualTime))秒"
    Write-Output "**状态:** 成功完成"
    
    if ($actualTime -gt $TotalSeconds) {
        Write-Output "⚠️ 超时: $([math]::Round($actualTime - $TotalSeconds))秒"
    } else {
        Write-Output "🎯 提前: $([math]::Round($TotalSeconds - $actualTime))秒"
    }
}

# 示例使用
# Report-ChatProgress -TaskName "系统优化" -TotalSeconds 30 -Stages @(
#     "清理临时文件",
#     "优化网络设置", 
#     "检查系统资源",
#     "更新配置信息"
# )