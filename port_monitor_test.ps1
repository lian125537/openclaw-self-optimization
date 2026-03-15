# 端口监控测试脚本
Write-Host "🎯 开始端口监控测试" -ForegroundColor Cyan
Write-Host "当前时间: $(Get-Date)" -ForegroundColor Green

# 要监控的关键端口
$criticalPorts = @(
    80,    # HTTP
    443,   # HTTPS
    3389,  # RDP
    22,    # SSH (如果在Windows上模拟)
    61000  # OpenClaw网关端口
)

Write-Host "`n🔍 检查关键端口状态:" -ForegroundColor Yellow
Write-Host "========================================"

$openPorts = @()
$closedPorts = @()

foreach ($port in $criticalPorts) {
    $result = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "✅ 端口 $port 开放" -ForegroundColor Green
        $openPorts += $port
    } else {
        Write-Host "❌ 端口 $port 关闭" -ForegroundColor Red
        $closedPorts += $port
    }
}

Write-Host "`n📊 监控报告汇总:" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host "开放的端口 ($($openPorts.Count)个): $($openPorts -join ', ')" -ForegroundColor Green
Write-Host "关闭的端口 ($($closedPorts.Count)个): $($closedPorts -join ', ')" -ForegroundColor Yellow

# 模拟异常检测
Write-Host "`n🚨 模拟异常检测:" -ForegroundColor Red
if ($openPorts.Count -eq 0) {
    Write-Host "⚠️  警告：所有关键端口都关闭！" -ForegroundColor Red -BackgroundColor DarkGray
} elseif ($closedPorts.Count -gt 2) {
    Write-Host "⚠️  警告：超过2个关键端口关闭！" -ForegroundColor Red -BackgroundColor DarkGray
} else {
    Write-Host "✅ 端口状态正常" -ForegroundColor Green
}

# 写入监控日志
$logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 端口监控: 开放$($openPorts.Count)个, 关闭$($closedPorts.Count)个"
Add-Content -Path "port_monitor.log" -Value $logEntry

Write-Host "`n📝 日志已写入: port_monitor.log" -ForegroundColor Cyan