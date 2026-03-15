# 网络连接监控脚本
param([int]$CheckInterval = 30)

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # 检查本地网关连接
    $gatewayTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 18789 -WarningAction SilentlyContinue
    
    if (-not $gatewayTest.TcpTestSucceeded) {
        Write-Host "[$timestamp] ⚠️ 网关连接失败！尝试恢复..." -ForegroundColor Red
        
        # 尝试重启网关
        try {
            openclaw gateway restart --force
            Write-Host "[$timestamp] ✅ 网关已重启" -ForegroundColor Green
        } catch {
            Write-Host "[$timestamp] ❌ 网关重启失败: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "[$timestamp] ✅ 网络连接正常" -ForegroundColor Green
    }
    
    # 记录到日志
    $logEntry = "[$timestamp] 网关连接: $($gatewayTest.TcpTestSucceeded)"
    Add-Content -Path "C:\Users\yodat\.openclaw\logs\network_monitor.log" -Value $logEntry
    
    Start-Sleep -Seconds $CheckInterval
}