# 任务完成确认系统
# 确保每次任务完成后都有明确的完成报告

function Start-Task {
    param(
        [string]$TaskName,
        [string]$Description
    )
    
    $taskId = [guid]::NewGuid().ToString().Substring(0, 8)
    $startTime = Get-Date
    
    $taskInfo = @{
        Id = $taskId
        Name = $TaskName
        Description = $Description
        StartTime = $startTime
        Status = "进行中"
    }
    
    Write-Host "`n🎯 开始任务: $TaskName" -ForegroundColor Cyan
    Write-Host "📝 描述: $Description" -ForegroundColor Gray
    Write-Host "⏱️ 开始时间: $($startTime.ToString('HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "🔧 任务ID: $taskId" -ForegroundColor Gray
    Write-Host "─" * 50 -ForegroundColor DarkGray
    
    return $taskInfo
}

function Complete-Task {
    param(
        [hashtable]$TaskInfo,
        [array]$CompletedItems,
        [array]$CreatedFiles,
        [array]$NextSteps,
        [string]$Status = "成功",  # 成功、失败、部分成功
        [string]$ErrorMessage = $null,
        [array]$AttemptedSolutions = $null,
        [array]$FailedItems = $null,
        [bool]$CanRetry = $false
    )
    
    $endTime = Get-Date
    $duration = $endTime - $TaskInfo.StartTime
    
    Write-Host "`n" + ("─" * 50) -ForegroundColor DarkGray
    
    # 根据状态显示不同的图标和颜色
    switch ($Status) {
        "成功" {
            $statusIcon = "✅"
            $statusColor = "Green"
            $statusText = "任务成功完成"
        }
        "失败" {
            $statusIcon = "❌"
            $statusColor = "Red"
            $statusText = "任务失败"
        }
        "部分成功" {
            $statusIcon = "⚠️"
            $statusColor = "Yellow"
            $statusText = "任务部分完成"
        }
        default {
            $statusIcon = "❓"
            $statusColor = "Gray"
            $statusText = "任务状态未知"
        }
    }
    
    Write-Host "$statusIcon $statusText: $($TaskInfo.Name)" -ForegroundColor $statusColor
    Write-Host "📊 状态: $Status" -ForegroundColor Gray
    Write-Host "⏱️ 耗时: $($duration.TotalSeconds.ToString('F1')) 秒" -ForegroundColor Gray
    Write-Host "🆔 任务ID: $($TaskInfo.Id)" -ForegroundColor Gray
    
    # 显示完成的内容（成功和部分成功时显示）
    if ($Status -in @("成功", "部分成功") -and $CompletedItems -and $CompletedItems.Count -gt 0) {
        Write-Host "`n📋 完成内容：" -ForegroundColor Cyan
        foreach ($item in $CompletedItems) {
            Write-Host "  • $item" -ForegroundColor Gray
        }
    }
    
    # 显示失败的内容（部分成功和失败时显示）
    if ($Status -in @("部分成功", "失败") -and $FailedItems -and $FailedItems.Count -gt 0) {
        Write-Host "`n❌ 失败内容：" -ForegroundColor Red
        foreach ($item in $FailedItems) {
            Write-Host "  • $item" -ForegroundColor Gray
        }
    }
    
    # 显示错误信息（失败时显示）
    if ($Status -eq "失败" -and $ErrorMessage) {
        Write-Host "`n⚠️ 错误原因：" -ForegroundColor Red
        Write-Host "  $ErrorMessage" -ForegroundColor Gray
    }
    
    # 显示尝试的解决方案（失败时显示）
    if ($Status -eq "失败" -and $AttemptedSolutions -and $AttemptedSolutions.Count -gt 0) {
        Write-Host "`n🔧 尝试的解决方案：" -ForegroundColor Yellow
        foreach ($solution in $AttemptedSolutions) {
            Write-Host "  • $solution" -ForegroundColor Gray
        }
    }
    
    # 显示创建的文件（成功和部分成功时显示）
    if ($Status -in @("成功", "部分成功") -and $CreatedFiles -and $CreatedFiles.Count -gt 0) {
        Write-Host "`n📁 创建/修改的文件：" -ForegroundColor Cyan
        foreach ($file in $CreatedFiles) {
            Write-Host "  • $file" -ForegroundColor Gray
        }
    }
    
    # 显示下一步建议
    if ($NextSteps -and $NextSteps.Count -gt 0) {
        Write-Host "`n🚀 下一步建议：" -ForegroundColor Cyan
        foreach ($step in $NextSteps) {
            Write-Host "  • $step" -ForegroundColor Gray
        }
    }
    
    # 显示重试建议（失败且可重试时显示）
    if ($Status -eq "失败" -and $CanRetry) {
        Write-Host "`n🔄 建议：可以重试此任务" -ForegroundColor Green
    }
    
    # 保存任务记录
    $taskRecord = @{
        Task = $TaskInfo
        Completion = @{
            Time = $endTime
            Duration = $duration.TotalSeconds
            Status = $Status
            Items = $CompletedItems
            FailedItems = $FailedItems
            Files = $CreatedFiles
            ErrorMessage = $ErrorMessage
            CanRetry = $CanRetry
        }
    }
    
    # 添加到任务历史
    $historyFile = "$env:USERPROFILE\.openclaw\task_history.json"
    $history = @()
    
    if (Test-Path $historyFile) {
        $history = Get-Content $historyFile -Raw | ConvertFrom-Json
    }
    
    $history += $taskRecord
    
    # 只保留最近50个任务
    if ($history.Count -gt 50) {
        $history = $history | Select-Object -Last 50
    }
    
    $history | ConvertTo-Json -Depth 5 | Out-File $historyFile -Encoding UTF8
    
    Write-Host "`n📊 任务记录已保存" -ForegroundColor Gray
    Write-Host "=" * 50 -ForegroundColor DarkGray
}

function Show-TaskHistory {
    param(
        [int]$Limit = 10
    )
    
    $historyFile = "$env:USERPROFILE\.openclaw\task_history.json"
    
    if (-not (Test-Path $historyFile)) {
        Write-Host "📭 暂无任务历史记录" -ForegroundColor Gray
        return
    }
    
    $history = Get-Content $historyFile -Raw | ConvertFrom-Json
    
    Write-Host "`n📊 最近任务历史 ($Limit个)" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor DarkGray
    
    $recentTasks = $history | Select-Object -Last $Limit | Sort-Object -Property @{Expression={$_.Task.StartTime}; Descending=$true}
    
    foreach ($task in $recentTasks) {
        $statusIcon = if ($task.Completion.Success) { "✅" } else { "⚠️" }
        $duration = $task.Completion.Duration.ToString("F1")
        
        Write-Host "$statusIcon $($task.Task.Name)" -ForegroundColor $(if($task.Completion.Success){"Green"}else{"Yellow"})
        Write-Host "  时间: $($task.Task.StartTime.ToString('MM-dd HH:mm'))" -ForegroundColor Gray
        Write-Host "  耗时: ${duration}秒" -ForegroundColor Gray
        Write-Host "  ID: $($task.Task.Id)" -ForegroundColor Gray
        
        if ($task.Completion.Items -and $task.Completion.Items.Count -gt 0) {
            $firstItem = $task.Completion.Items[0]
            if ($task.Completion.Items.Count -gt 1) {
                Write-Host "  内容: $firstItem 等$($task.Completion.Items.Count)项" -ForegroundColor Gray
            } else {
                Write-Host "  内容: $firstItem" -ForegroundColor Gray
            }
        }
        
        Write-Host "  ─" -ForegroundColor DarkGray
    }
    
    Write-Host "`n📈 统计: 共$($history.Count)个任务记录" -ForegroundColor Cyan
}

# 导出函数供其他脚本使用
Export-ModuleMember -Function Start-Task, Complete-Task, Show-TaskHistory

# 如果直接运行，显示使用说明
if ($MyInvocation.InvocationName -ne '.') {
    Write-Host "🎯 任务完成确认系统" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor DarkGray
    Write-Host "使用方法：" -ForegroundColor Yellow
    Write-Host "1. 导入模块: . .\task_completion_system.ps1" -ForegroundColor Gray
    Write-Host "2. 开始任务: `$task = Start-Task -TaskName '任务名' -Description '描述'" -ForegroundColor Gray
    Write-Host "3. 执行任务代码..." -ForegroundColor Gray
    Write-Host "4. 完成任务: Complete-Task -TaskInfo `$task -CompletedItems @('项目1','项目2')" -ForegroundColor Gray
    Write-Host "5. 查看历史: Show-TaskHistory" -ForegroundColor Gray
}