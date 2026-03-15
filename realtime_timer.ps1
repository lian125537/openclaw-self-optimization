# 实时倒计时显示系统
function Show-RealtimeTimer {
    param(
        [string]$TaskName,
        [int]$TotalSeconds,
        [string]$Status = "进行中"
    )
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($TotalSeconds)
    
    # 显示任务信息
    Write-Host "`n=== 实时任务进度 ===" -ForegroundColor Cyan
    Write-Host "任务: $TaskName" -ForegroundColor Yellow
    Write-Host "状态: $Status" -ForegroundColor Green
    Write-Host "总时长: ${TotalSeconds}秒" -ForegroundColor Gray
    Write-Host "`n进度条:" -ForegroundColor Gray
    
    # 实时进度循环
    $completed = $false
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
        $filled = [math]::Round($percent / 5)
        
        # 清除当前行并重新显示
        $cursorTop = [Console]::CursorTop
        [Console]::SetCursorPosition(0, $cursorTop - 1)
        
        Write-Host "[" -NoNewline
        for ($i = 1; $i -le 20; $i++) {
            if ($i -le $filled) {
                Write-Host "█" -NoNewline -ForegroundColor Green
            } else {
                Write-Host "░" -NoNewline -ForegroundColor DarkGray
            }
        }
        Write-Host "] " -NoNewline
        
        # 显示百分比和时间
        Write-Host "$percent% " -NoNewline -ForegroundColor Yellow
        Write-Host "已用: $([math]::Round($elapsed))秒 " -NoNewline -ForegroundColor Cyan
        Write-Host "剩余: $([math]::Round($remaining))秒" -NoNewline -ForegroundColor Magenta
        
        # 显示预计完成时间
        $timeLeft = ""
        if ($remaining -gt 0) {
            $timeLeft = "预计完成: $($endTime.ToString('HH:mm:ss'))"
        } else {
            $timeLeft = "已完成于: $(Get-Date -Format 'HH:mm:ss')"
        }
        
        # 在下一行显示时间信息
        Write-Host "`n$timeLeft" -ForegroundColor Gray
        
        if (-not $completed) {
            Start-Sleep -Milliseconds 500
            # 清除时间信息行
            [Console]::SetCursorPosition(0, $cursorTop)
            Write-Host (" " * 50) -NoNewline
            [Console]::SetCursorPosition(0, $cursorTop)
        }
    }
    
    Write-Host "`n`n=== 任务完成 ===" -ForegroundColor Green
    Write-Host "任务: $TaskName" -ForegroundColor Yellow
    Write-Host "实际耗时: $([math]::Round($elapsed))秒" -ForegroundColor Cyan
    Write-Host "状态: ✅ 完成" -ForegroundColor Green
    
    return @{
        StartTime = $startTime
        EndTime = $endTime
        ActualTime = $elapsed
        TaskName = $TaskName
    }
}

# 异步任务执行器
function Start-RealtimeTask {
    param(
        [string]$TaskName,
        [scriptblock]$ScriptBlock,
        [int]$EstimatedSeconds = 30,
        [string]$Description = ""
    )
    
    # 在新线程中执行任务
    $job = Start-Job -ScriptBlock $ScriptBlock -Name $TaskName
    
    # 显示实时进度
    $timer = Show-RealtimeTimer -TaskName $TaskName -TotalSeconds $EstimatedSeconds
    
    # 等待任务完成
    Wait-Job $job -Timeout $EstimatedSeconds | Out-Null
    
    # 获取结果
    if ($job.State -eq "Completed") {
        $result = Receive-Job $job
        Write-Host "`n结果: $result" -ForegroundColor Green
    } else {
        Write-Host "`n警告: 任务可能未完全完成" -ForegroundColor Yellow
        $result = Receive-Job $job -ErrorAction SilentlyContinue
    }
    
    Remove-Job $job -Force
    
    return $result
}