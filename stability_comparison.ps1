# 稳定性对比测试
Write-Host "🔬 WebSocket vs HTTP 稳定性对比测试" -ForegroundColor Cyan
Write-Host "=" * 50

# 测试HTTP连接
$httpSuccess = 0
$httpTotal = 10

Write-Host "`n📡 HTTP连接测试 (10次请求):" -ForegroundColor Yellow
for ($i = 1; $i -le $httpTotal; $i++) {
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:8080/api/status" -TimeoutSec 1
        Write-Host "  HTTP测试 $i: ✅ 成功" -ForegroundColor Green
        $httpSuccess++
    } catch {
        Write-Host "  HTTP测试 $i: ❌ 失败" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

# 测试WebSocket连接（模拟）
$wsSuccess = 0
$wsTotal = 10

Write-Host "`n🔌 WebSocket连接测试 (10次模拟):" -ForegroundColor Yellow
for ($i = 1; $i -le $wsTotal; $i++) {
    # 模拟WebSocket连接测试
    $wsCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 18789 -InformationLevel Quiet
    
    if ($wsCheck) {
        Write-Host "  WS测试 $i: ✅ 端口开放" -ForegroundColor Green
        $wsSuccess++
    } else {
        Write-Host "  WS测试 $i: ❌ 端口关闭" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

# 计算结果
$httpRate = [math]::Round(($httpSuccess / $httpTotal) * 100, 1)
$wsRate = [math]::Round(($wsSuccess / $wsTotal) * 100, 1)

Write-Host "`n📊 测试结果对比:" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host "协议类型      成功次数/总次数   成功率" -ForegroundColor Gray
Write-Host "HTTP          $httpSuccess/$httpTotal         $httpRate%" -ForegroundColor Green
Write-Host "WebSocket     $wsSuccess/$wsTotal         $wsRate%" -ForegroundColor $(if ($wsRate -lt 100) { "Yellow" } else { "Green" })

Write-Host "`n🎯 稳定性分析:" -ForegroundColor Cyan
if ($httpRate -gt $wsRate) {
    Write-Host "✅ HTTP连接更稳定 (高 $([math]::Round($httpRate - $wsRate))%)" -ForegroundColor Green
} elseif ($wsRate -gt $httpRate) {
    Write-Host "✅ WebSocket连接更稳定 (高 $([math]::Round($wsRate - $httpRate))%)" -ForegroundColor Green
} else {
    Write-Host "⚖️ 两种连接稳定性相同" -ForegroundColor Yellow
}

Write-Host "`n💡 建议:" -ForegroundColor Magenta
if ($httpRate -ge 95) {
    Write-Host "  推荐使用HTTP API方案，稳定性极高" -ForegroundColor Green
} elseif ($wsRate -ge 95) {
    Write-Host "  当前WebSocket连接稳定，可继续使用" -ForegroundColor Green
} else {
    Write-Host "  建议启用自动恢复守护进程" -ForegroundColor Yellow
}