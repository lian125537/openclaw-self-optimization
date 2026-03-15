# 创建每月清理任务计划
Write-Host "=== 创建每月清理任务计划 ===" -ForegroundColor Cyan

# 任务名称
$taskName = "OpenClaw Monthly Downloads Cleanup"

# 脚本路径
$scriptPath = "C:\Users\yodat\.openclaw\workspace\monthly_cleanup.ps1"

# 检查脚本是否存在
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ 脚本文件不存在: $scriptPath" -ForegroundColor Red
    exit 1
}

# 检查是否已存在任务
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  任务已存在，正在更新..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# 创建任务计划
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -WeeksInterval 4 -At 2am  # 每月一次，周一凌晨2点
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "每月自动清理 Downloads 目录，保留 essential 文件"
    Write-Host "✅ 任务计划创建成功!" -ForegroundColor Green
    
    # 显示任务信息
    Write-Host "`n任务信息:" -ForegroundColor Cyan
    Write-Host "  名称: $taskName" -ForegroundColor White
    Write-Host "  触发器: 每月一次，周一凌晨2点" -ForegroundColor White
    Write-Host "  操作: 执行 $scriptPath" -ForegroundColor White
    Write-Host "  运行身份: SYSTEM" -ForegroundColor White
    
    # 测试任务
    Write-Host "`n测试任务..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 5
    
    $taskStatus = Get-ScheduledTask -TaskName $taskName
    if ($taskStatus.State -eq "Running") {
        Write-Host "✅ 任务测试成功，正在运行!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  任务状态: $($taskStatus.State)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ 创建任务失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 显示所有 OpenClaw 相关任务
Write-Host "`n所有 OpenClaw 相关任务:" -ForegroundColor Cyan
Get-ScheduledTask | Where-Object { $_.TaskName -like "*OpenClaw*" } | ForEach-Object {
    Write-Host "  - $($_.TaskName) ($($_.State))" -ForegroundColor White
}

Write-Host "`n✅ 任务计划设置完成!" -ForegroundColor Green