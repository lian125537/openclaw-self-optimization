# 聊天界面文本进度条
function Show-ChatProgress {
    param(
        [string]$TaskName,
        [int]$TotalSeconds,
        [string]$Description = ""
    )
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($TotalSeconds)
    
    # 显示任务信息
    Write-Output "`n=== 任务进度监控 ==="
    Write-Output "任务: $TaskName"
    if ($Description) { Write-Output "描述: $Description" }
    Write-Output "总时长: ${TotalSeconds}秒"
    Write-Output "开始时间: $($startTime.ToString('HH:mm:ss'))"
    Write-Output "预计完成: $($endTime.ToString('HH:mm:ss'))"
    Write-Output ""
    
    # 初始进度条
    Write-Output "进度: [░░░░░░░░░░░░░░░░░░░░] 0%"
    Write-Output "已用: 0秒 | 剩余: ${TotalSeconds}秒"
    
    $completed = $false
    $lastUpdate = Get-Date
    
    while (-not $completed) {
        $now = Get-Date
        $elapsed = ($now - $startTime).TotalSeconds
        $remaining = ($endTime - $now).TotalSeconds
        
        if ($remaining -le 0) {
            $completed = $true
            $elapsed = $TotalSeconds
            $remaining = 0
        }
        
        $percent = [math]::Min(100, [math]::Round(($elapsed / $TotalSeconds) * 100))
        
        # 每2秒更新一次显示
        if (($now - $lastUpdate).TotalSeconds -ge 2 -or $completed) {
            $filled = [math]::Round($percent / 5)
            $progressBar = "["
            for ($i = 1; $i -le 20; $i++) {
                if ($i -le $filled) {
                    $progressBar += "█"
                } else {
                    $progressBar += "░"
                }
            }
            $progressBar += "]"
            
            # 输出更新（在聊天中会显示为新消息）
            Write-Output "`n进度: $progressBar $percent%"
            Write-Output "已用: $([math]::Round($elapsed))秒 | 剩余: $([math]::Round($remaining))秒"
            
            $lastUpdate = $now
        }
        
        if (-not $completed) {
            Start-Sleep -Milliseconds 500
        }
    }
    
    Write-Output "`n=== 任务完成 ==="
    Write-Output "任务: $TaskName"
    Write-Output "实际耗时: $([math]::Round($elapsed))秒"
    Write-Output "状态: ✅ 完成"
    
    return @{
        StartTime = $startTime
        EndTime = $endTime
        ActualTime = $elapsed
        TaskName = $TaskName
    }
}

# 示例：在聊天中显示进度
# Show-ChatProgress -TaskName "系统清理" -TotalSeconds 30 -Description "清理临时文件和缓存"