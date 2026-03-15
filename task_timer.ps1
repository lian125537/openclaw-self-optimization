# 任务倒计时显示系统
function Show-TaskTimer {
    param(
        [string]$TaskName,
        [int]$EstimatedSeconds,
        [string]$Status = "进行中"
    )
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($EstimatedSeconds)
    
    Write-Host "`n=== 任务进度时间表 ===" -ForegroundColor Cyan
    Write-Host "任务: $TaskName" -ForegroundColor Yellow
    Write-Host "状态: $Status" -ForegroundColor Green
    Write-Host "开始时间: $($startTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "预计完成: $($endTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "预计耗时: ${EstimatedSeconds}秒" -ForegroundColor Gray
    
    # 创建进度条
    Write-Host "`n进度: [" -NoNewline
    for ($i = 1; $i -le 20; $i++) {
        Write-Host "░" -NoNewline -ForegroundColor DarkGray
    }
    Write-Host "]" -NoNewline
    Write-Host " 0%" -ForegroundColor Gray
    
    return @{
        StartTime = $startTime
        EndTime = $endTime
        TaskName = $TaskName
    }
}

function Update-TaskProgress {
    param(
        [hashtable]$Timer,
        [int]$ProgressPercent
    )
    
    $elapsed = (Get-Date) - $Timer.StartTime
    $remaining = $Timer.EndTime - (Get-Date)
    
    if ($remaining.TotalSeconds -lt 0) { $remaining = [TimeSpan]::Zero }
    
    Write-Host "`r进度: [" -NoNewline
    $filled = [math]::Round($ProgressPercent / 5)
    for ($i = 1; $i -le 20; $i++) {
        if ($i -le $filled) {
            Write-Host "█" -NoNewline -ForegroundColor Green
        } else {
            Write-Host "░" -NoNewline -ForegroundColor DarkGray
        }
    }
    Write-Host "] " -NoNewline
    Write-Host "$ProgressPercent% " -NoNewline -ForegroundColor Yellow
    Write-Host "已用: $([math]::Round($elapsed.TotalSeconds))秒 " -NoNewline -ForegroundColor Gray
    Write-Host "剩余: $([math]::Round($remaining.TotalSeconds))秒" -NoNewline -ForegroundColor Gray
}

function Complete-TaskTimer {
    param(
        [hashtable]$Timer,
        [string]$Result = "完成"
    )
    
    $actualTime = (Get-Date) - $Timer.StartTime
    $estimatedTime = $Timer.EndTime - $Timer.StartTime
    
    Write-Host "`n`n=== 任务完成报告 ===" -ForegroundColor Cyan
    Write-Host "任务: $($Timer.TaskName)" -ForegroundColor Yellow
    Write-Host "结果: $Result" -ForegroundColor Green
    Write-Host "开始时间: $($Timer.StartTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "完成时间: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "实际耗时: $([math]::Round($actualTime.TotalSeconds))秒" -ForegroundColor Gray
    Write-Host "预计耗时: $([math]::Round($estimatedTime.TotalSeconds))秒" -ForegroundColor Gray
    
    if ($actualTime.TotalSeconds -gt $estimatedTime.TotalSeconds) {
        Write-Host "状态: ⚠️ 超时 $([math]::Round($actualTime.TotalSeconds - $estimatedTime.TotalSeconds))秒" -ForegroundColor Red
    } else {
        Write-Host "状态: ✅ 提前 $([math]::Round($estimatedTime.TotalSeconds - $actualTime.TotalSeconds))秒" -ForegroundColor Green
    }
}