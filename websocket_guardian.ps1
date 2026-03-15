# WebSocket连接守护进程
function Start-WebSocketGuardian {
    param(
        [int]$CheckInterval = 30,  # 检查间隔（秒）
        [int]$MaxRestarts = 5      # 最大重启次数
    )
    
    Write-Host "🛡️ 启动WebSocket连接守护进程..." -ForegroundColor Cyan
    Write-Host "检查间隔: ${CheckInterval}秒" -ForegroundColor Gray
    Write-Host "最大重启: ${MaxRestarts}次" -ForegroundColor Gray
    
    $restartCount = 0
    $logFile = "$env:USERPROFILE\.openclaw\logs\websocket_guardian.log"
    
    # 创建日志目录
    $logDir = Split-Path $logFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # 守护循环
    while ($true) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        # 检查网关状态
        $gatewayStatus = openclaw gateway status 2>$null
        
        if ($gatewayStatus -match "running") {
            # 检查WebSocket连接
            $wsCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 18789 -InformationLevel Quiet
            
            if (-not $wsCheck) {
                Write-Host "[$timestamp] ⚠️ WebSocket连接异常" -ForegroundColor Yellow
                "$timestamp - WebSocket连接异常" | Out-File $logFile -Append
                
                if ($restartCount -lt $MaxRestarts) {
                    $restartCount++
                    Write-Host "[$timestamp] 🔄 尝试重启网关 (第${restartCount}次)" -ForegroundColor Magenta
                    "$timestamp - 重启网关 (第${restartCount}次)" | Out-File $logFile -Append
                    
                    openclaw gateway restart --force
                    Start-Sleep -Seconds 10
                } else {
                    Write-Host "[$timestamp] 🚨 达到最大重启次数，停止守护" -ForegroundColor Red
                    "$timestamp - 达到最大重启次数，停止守护" | Out-File $logFile -Append
                    break
                }
            } else {
                # 连接正常，重置重启计数
                if ($restartCount -gt 0) {
                    Write-Host "[$timestamp] ✅ 连接恢复正常" -ForegroundColor Green
                    "$timestamp - 连接恢复正常" | Out-File $logFile -Append
                    $restartCount = 0
                }
            }
        } else {
            Write-Host "[$timestamp] ⚠️ 网关未运行" -ForegroundColor Yellow
            "$timestamp - 网关未运行" | Out-File $logFile -Append
            
            openclaw gateway start --force
            Start-Sleep -Seconds 5
        }
        
        # 等待下一次检查
        Start-Sleep -Seconds $CheckInterval
    }
}

# 启动守护进程（后台运行）
$guardianJob = Start-Job -ScriptBlock {
    . "$using:PWD\websocket_guardian.ps1"
    Start-WebSocketGuardian -CheckInterval 30 -MaxRestarts 5
} -Name "WebSocketGuardian"

Write-Host "✅ WebSocket守护进程已启动 (作业ID: $($guardianJob.Id))" -ForegroundColor Green
Write-Host "日志文件: $env:USERPROFILE\.openclaw\logs\websocket_guardian.log" -ForegroundColor Gray